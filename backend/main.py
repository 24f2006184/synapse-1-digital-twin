"""
SYNAPSE-1 Digital Twin — Backend API
FastAPI + SQLModel + WebSockets
"""
from __future__ import annotations
import asyncio
import hashlib
import json
import time
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from database import create_db_and_tables, get_session, engine
from models import (
    Crew, Zone, EnvSample, BioSample, CircadianState,
    AffectEstimate, EthicsLogEntry, PrivacyPauseLog,
    ScenarioEvent, RegolithBrick, HippocampalTest
)
from auth import (
    authenticate_user, create_access_token,
    get_current_user, require_ground,
    get_token_from_query
)
from seed import seed_database
from sim.simulator import (
    generate_env_sample, generate_bio_sample, scenario_state,
    compute_sensory_monotony_index, get_shield_integrity,
    mission_clock_h, set_zone_chromotherapy,
    CHROMOTHERAPY_PRESETS
)

app = FastAPI(title="SYNAPSE-1 Digital Twin", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup ────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    with Session(engine) as session:
        seed_database(session)
    print("[OK] SYNAPSE-1 backend ready")


# ─── In-memory env cache (updated by sim loop) ─────────────────────────────
_env_cache: dict = {}  # zone_id -> latest sample
_bio_cache: dict = {}  # crew_id -> latest sample
_env_history: dict = {}  # zone_id -> list of last 720 samples (6h @ 2Hz)
_water_consumed_kg: float = 120.0  # mission simulation


# ─── Ethics Ledger Helper ───────────────────────────────────────────────────
def append_ethics_entry(
    session: Session,
    actor_role: str,
    actor_id: str,
    event_type: str,
    payload: dict,
) -> EthicsLogEntry:
    # Get last hash
    last = session.exec(
        select(EthicsLogEntry).order_by(EthicsLogEntry.id.desc())
    ).first()
    prev_hash = last.hash if last else "genesis"

    ts = datetime.utcnow()
    payload_str = json.dumps(payload, default=str)
    raw = f"{prev_hash}{ts.isoformat()}{actor_id}{event_type}{payload_str}"
    entry_hash = hashlib.sha256(raw.encode()).hexdigest()

    entry = EthicsLogEntry(
        ts=ts,
        actor_role=actor_role,
        actor_id=actor_id,
        event_type=event_type,
        payload=payload_str,
        prev_hash=prev_hash,
        hash=entry_hash,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


# ─── Health ──────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "nominal", "mission_time_h": round(mission_clock_h(), 2)}


# ─── Auth ────────────────────────────────────────────────────────────────────
@app.post("/auth/login")
def login(body: dict):
    username = body.get("username", "")
    password = body.get("password", "")
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": username, "role": user["role"], "crew_id": user["crew_id"]})
    return {"access_token": token, "token_type": "bearer", "role": user["role"], "crew_id": user["crew_id"]}


@app.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user


# ─── Habitat ─────────────────────────────────────────────────────────────────
@app.get("/habitat/zones")
def get_zones(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    zones = session.exec(select(Zone)).all()
    t = time.time()
    result = []
    for zone in zones:
        env = _env_cache.get(zone.zone_id) or generate_env_sample(zone.zone_id, t)
        result.append({**zone.model_dump(), **env})
    return result


@app.get("/habitat/zones/{zone_id}")
def get_zone(zone_id: str, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(404, "Zone not found")
    t = time.time()
    env = _env_cache.get(zone_id) or generate_env_sample(zone_id, t)
    return {**zone.model_dump(), **env}


@app.get("/habitat/shield-integrity")
def shield_integrity(user: dict = Depends(get_current_user)):
    return get_shield_integrity(water_mass_kg=8000.0, consumed_kg=_water_consumed_kg)


@app.get("/habitat/smi/{zone_id}")
def zone_smi(zone_id: str, user: dict = Depends(get_current_user)):
    history = _env_history.get(zone_id, [])
    smi = compute_sensory_monotony_index(history[-72:])  # last ~36s worth @ 2Hz
    return {"zone_id": zone_id, "smi": smi, "alarm": smi < 0.3}


@app.get("/habitat/smis")
def all_smis(user: dict = Depends(get_current_user)):
    result = {}
    for zone_id, history in _env_history.items():
        smi = compute_sensory_monotony_index(history[-72:])
        result[zone_id] = {"smi": smi, "alarm": smi < 0.3}
    return result


@app.post("/habitat/zones/{zone_id}/chromotherapy")
def set_chromotherapy(
    zone_id: str,
    body: dict,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    preset = body.get("preset", "Neutral White")
    if preset not in CHROMOTHERAPY_PRESETS:
        raise HTTPException(400, f"Unknown preset: {preset}")

    # Crew can only set their own pod
    if user["role"] == "CREW":
        expected_pod = f"zone_dendrite_pod_{user['crew_id'][-2:]}"
        if zone_id != expected_pod:
            raise HTTPException(403, "Crew can only adjust their own pod")

    set_zone_chromotherapy(zone_id, preset)

    zone = session.get(Zone, zone_id)
    if zone:
        zone.chromotherapy_preset = preset
        session.add(zone)
        session.commit()

    append_ethics_entry(session, user["role"], user.get("sub", "unknown"),
                        "CHROMOTHERAPY_CHANGE",
                        {"zone_id": zone_id, "preset": preset})
    return {"zone_id": zone_id, "preset": preset, "applied": True}


# ─── Crew ────────────────────────────────────────────────────────────────────
@app.get("/crew")
def get_all_crew(session: Session = Depends(get_session), user: dict = Depends(require_ground)):
    crew = session.exec(select(Crew)).all()
    t = time.time()
    result = []
    for c in crew:
        bio = _bio_cache.get(c.crew_id)
        circ = session.exec(
            select(CircadianState).where(CircadianState.crew_id == c.crew_id)
            .order_by(CircadianState.ts.desc())
        ).first()
        affect = None
        if c.consent_share_affect and (not c.consent_paused_until or datetime.utcnow() > c.consent_paused_until):
            affect = session.exec(
                select(AffectEstimate).where(AffectEstimate.crew_id == c.crew_id)
                .order_by(AffectEstimate.ts.desc())
            ).first()
        result.append({
            **c.model_dump(),
            "bio": bio,
            "circadian": circ.model_dump() if circ else None,
            "affect": affect.model_dump() if affect else None,
            "privacy_paused": c.consent_paused_until is not None and datetime.utcnow() < c.consent_paused_until,
        })
    return result


@app.get("/crew/{crew_id}/circadian")
def get_circadian(crew_id: str, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    if user["role"] == "CREW" and user["crew_id"] != crew_id:
        raise HTTPException(403, "Access denied")
    state = session.exec(
        select(CircadianState).where(CircadianState.crew_id == crew_id)
        .order_by(CircadianState.ts.desc())
    ).first()
    return state.model_dump() if state else {"crew_id": crew_id, "phase_hours": 0, "debt_hours": 0}


@app.get("/crew/{crew_id}/circadian-forecast")
def get_circadian_forecast(crew_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == "CREW" and user["crew_id"] != crew_id:
        raise HTTPException(403, "Access denied")
    from sim.simulator import alertness_curve, mission_clock_h
    t_now = mission_clock_h()
    forecast = []
    for i in range(16):
        t = (t_now + i) % 24
        forecast.append({"hour_offset": i, "t_hours": t, "alertness": round(alertness_curve(t), 3)})
    return {"crew_id": crew_id, "forecast": forecast}


@app.get("/crew/{crew_id}/affect")
def get_affect(crew_id: str, session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    if user["role"] == "CREW" and user["crew_id"] != crew_id:
        raise HTTPException(403, "Access denied")
    crew = session.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")

    # Respect consent
    if user["role"] == "GROUND":
        if not crew.consent_share_affect:
            return {"crew_id": crew_id, "blocked": True, "reason": "consent_not_given"}
        if crew.consent_paused_until and datetime.utcnow() < crew.consent_paused_until:
            return {"crew_id": crew_id, "blocked": True, "reason": "sharing_paused"}

    state = session.exec(
        select(AffectEstimate).where(AffectEstimate.crew_id == crew_id)
        .order_by(AffectEstimate.ts.desc())
    ).first()
    return state.model_dump() if state else {"crew_id": crew_id, "arousal": 0, "valence": 0}


@app.post("/crew/{crew_id}/consent")
def update_consent(
    crew_id: str,
    body: dict,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    if user["crew_id"] != crew_id:
        raise HTTPException(403, "Crew can only update their own consent")
    crew = session.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    if "share_bio" in body:
        crew.consent_share_bio = bool(body["share_bio"])
    if "share_affect" in body:
        crew.consent_share_affect = bool(body["share_affect"])
    session.add(crew)
    session.commit()
    append_ethics_entry(session, "CREW", crew_id, "CONSENT_CHANGE", body)
    return {"crew_id": crew_id, "consent_share_bio": crew.consent_share_bio, "consent_share_affect": crew.consent_share_affect}


@app.post("/crew/{crew_id}/privacy-pause")
def privacy_pause(
    crew_id: str,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    if user["crew_id"] != crew_id:
        raise HTTPException(403, "Crew can only pause their own sharing")
    crew = session.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")

    paused_until = datetime.utcnow() + timedelta(hours=2)
    crew.consent_paused_until = paused_until
    session.add(crew)

    log = PrivacyPauseLog(crew_id=crew_id, paused_until=paused_until)
    session.add(log)
    session.commit()

    append_ethics_entry(session, "CREW", crew_id, "PRIVACY_PAUSE",
                        {"paused_until": paused_until.isoformat(), "duration_hours": 2})
    return {"crew_id": crew_id, "paused_until": paused_until.isoformat()}


@app.get("/crew/cohesion-heatmap")
def cohesion_heatmap(session: Session = Depends(get_session), user: dict = Depends(require_ground)):
    from sim.simulator import alertness_curve, mission_clock_h
    zones = session.exec(select(Zone)).all()
    result = {}
    for zone in zones:
        # Derive cohesion from affect estimates of crew in this zone
        affects = session.exec(
            select(AffectEstimate).order_by(AffectEstimate.ts.desc())
        ).all()
        if affects:
            avg_valence = sum(a.valence for a in affects[:12]) / len(affects[:12])
            result[zone.zone_id] = {"cohesion": round((avg_valence + 1) / 2, 3)}
        else:
            result[zone.zone_id] = {"cohesion": 0.5}
    return result


# ─── Scenarios ───────────────────────────────────────────────────────────────
VALID_SCENARIOS = ["SolarProtonEvent", "CommsBlackout", "InterpersonalConflict", "EquipmentFailure"]


@app.post("/scenario/inject")
def inject_scenario(
    body: dict,
    session: Session = Depends(get_session),
    user: dict = Depends(require_ground),
):
    name = body.get("name", "CommsBlackout")
    seed = int(body.get("seed", 42))
    if name not in VALID_SCENARIOS:
        raise HTTPException(400, f"Unknown scenario: {name}")

    ts = time.time()
    scenario_state.inject(name, seed, ts)

    evt = ScenarioEvent(name=name, seed=seed, injected_by=user.get("sub", "ground"))
    session.add(evt)
    session.commit()

    append_ethics_entry(session, "GROUND", user.get("sub", "ground"),
                        "SCENARIO_INJECT", {"name": name, "seed": seed})
    return {"injected": name, "seed": seed, "ts": datetime.utcnow().isoformat()}


@app.get("/scenario/list")
def list_scenarios(user: dict = Depends(get_current_user)):
    return {"scenarios": VALID_SCENARIOS}


# ─── Ethics Ledger ───────────────────────────────────────────────────────────
@app.get("/ethics/log")
def ethics_log(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    entries = session.exec(select(EthicsLogEntry).order_by(EthicsLogEntry.id.desc())).all()
    return [e.model_dump() for e in entries]


@app.get("/ethics/log/export")
def ethics_export(
    crew_id: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    # Crew can only export their own slice
    if user["role"] == "CREW" and crew_id != user["crew_id"]:
        raise HTTPException(403, "Crew can only export their own ethics log")

    query = select(EthicsLogEntry).order_by(EthicsLogEntry.id)
    if crew_id:
        query = query.where(EthicsLogEntry.actor_id == crew_id)
    entries = session.exec(query).all()

    # Verify hash chain
    prev = "genesis"
    valid = True
    for e in entries:
        if e.prev_hash != prev:
            valid = False
            break
        prev = e.hash

    return {"entries": [e.model_dump() for e in entries], "hash_chain_valid": valid, "count": len(entries)}


# ─── Regolith Brick Queue ─────────────────────────────────────────────────────
@app.get("/habitat/regolith-queue")
def regolith_queue(session: Session = Depends(get_session), user: dict = Depends(get_current_user)):
    bricks = session.exec(select(RegolithBrick)).all()
    if not bricks:
        # Generate sample queue
        import math
        t = time.time()
        queue = []
        for i in range(8):
            cure_pct = min(100, max(0, (t - (1700000000 + i * 3600)) / 7200 * 100))
            queue.append({
                "batch_id": f"BATCH-{i+1:03d}",
                "bacteria_strain": "Sporosarcina pasteurii",
                "cure_pct": round(cure_pct, 1),
                "status": "COMPLETE" if cure_pct >= 100 else "CURING",
                "shield_contribution_kg": round(cure_pct / 100 * 45, 1),
            })
        return {"queue": queue, "total_shield_kg": sum(q["shield_contribution_kg"] for q in queue)}
    return {"queue": [b.model_dump() for b in bricks]}


# ─── Comms Latency ───────────────────────────────────────────────────────────
@app.get("/comms/status")
def comms_status(user: dict = Depends(get_current_user)):
    # Simulated: latency grows from 1.3s to 2.6s over mission
    mission_day = (time.time() - 1700000000) / 86400
    latency_s = 1.3 + min(1.3, mission_day * 0.01)
    next_window_s = (3600 - (time.time() % 3600))  # rolls every hour
    return {
        "one_way_latency_s": round(latency_s, 2),
        "round_trip_s": round(latency_s * 2, 2),
        "next_window_s": round(next_window_s, 0),
        "status": "NOMINAL" if latency_s < 2.0 else "EXTENDED",
        "mission_day": round(mission_day, 1),
    }


# ─── Hippocampal Anchor Test ──────────────────────────────────────────────────
@app.post("/crew/{crew_id}/hippocampal-test")
def submit_hippocampal_test(
    crew_id: str,
    body: dict,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    if user["crew_id"] != crew_id:
        raise HTTPException(403, "Crew can only submit their own test")
    test = HippocampalTest(
        crew_id=crew_id,
        score=float(body.get("score", 0)),
        reaction_time_ms=float(body.get("reaction_time_ms", 500)),
        accuracy_pct=float(body.get("accuracy_pct", 0)),
    )
    session.add(test)
    session.commit()
    return {"recorded": True, "score": test.score}


@app.get("/crew/{crew_id}/hippocampal-history")
def hippocampal_history(
    crew_id: str,
    session: Session = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    if user["role"] == "CREW" and user["crew_id"] != crew_id:
        raise HTTPException(403)
    tests = session.exec(
        select(HippocampalTest).where(HippocampalTest.crew_id == crew_id)
        .order_by(HippocampalTest.ts.desc())
    ).all()
    return {"crew_id": crew_id, "history": [t.model_dump() for t in tests]}


# ─── WebSocket: Environmental Stream ─────────────────────────────────────────
@app.websocket("/ws/env")
async def ws_env(websocket: WebSocket, token: str = Query(...)):
    try:
        get_token_from_query(token)
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    try:
        while True:
            t = time.time()
            # Stream all zones at 2 Hz
            data = {}
            for zone_id in list(_env_cache.keys()) or ["zone_atrium", "zone_soma_galley"]:
                sample = generate_env_sample(zone_id, t)
                _env_cache[zone_id] = sample
                if zone_id not in _env_history:
                    _env_history[zone_id] = []
                _env_history[zone_id].append(sample)
                if len(_env_history[zone_id]) > 720:
                    _env_history[zone_id] = _env_history[zone_id][-720:]
                data[zone_id] = sample
            await websocket.send_json({"type": "env_update", "data": data, "ts": t})
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass


# ─── WebSocket: Biometric Stream ──────────────────────────────────────────────
@app.websocket("/ws/bio/{crew_id}")
async def ws_bio(websocket: WebSocket, crew_id: str, token: str = Query(...)):
    try:
        user = get_token_from_query(token)
    except Exception:
        await websocket.close(code=1008)
        return

    # Enforce: crew can only see self
    if user["role"] == "CREW" and user["crew_id"] != crew_id:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    try:
        while True:
            t = time.time()
            sample = generate_bio_sample(crew_id, t)
            _bio_cache[crew_id] = sample

            # Check consent pause (enforce server-side)
            from sqlmodel import Session as DBSession
            with DBSession(engine) as session:
                crew_obj = session.get(Crew, crew_id)
                if crew_obj and user["role"] == "GROUND":
                    if not crew_obj.consent_share_bio:
                        await websocket.send_json({"type": "blocked", "reason": "consent_not_given"})
                        await asyncio.sleep(1.0)
                        continue
                    if crew_obj.consent_paused_until and datetime.utcnow() < crew_obj.consent_paused_until:
                        await websocket.send_json({"type": "blocked", "reason": "sharing_paused",
                                                   "paused_until": crew_obj.consent_paused_until.isoformat()})
                        await asyncio.sleep(1.0)
                        continue

            await websocket.send_json({"type": "bio_update", "crew_id": crew_id, "data": sample})
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass


# ─── Background: Update circadian + affect states ────────────────────────────
@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(update_ml_states())
    asyncio.create_task(populate_env_cache())


async def populate_env_cache():
    """Pre-populate env cache with all zones."""
    from sqlmodel import Session as DBSession
    await asyncio.sleep(2)
    with DBSession(engine) as session:
        zones = session.exec(select(Zone)).all()
        t = time.time()
        for zone in zones:
            _env_cache[zone.zone_id] = generate_env_sample(zone.zone_id, t)
            _env_history[zone.zone_id] = []


async def update_ml_states():
    """Background task: update circadian + affect states every 10s."""
    from ml.circadian.oscillator import update_circadian_state
    from ml.affect.regressor import estimate_affect
    await asyncio.sleep(5)

    while True:
        try:
            t = time.time()
            with Session(engine) as session:
                crews = session.exec(select(Crew)).all()
                for crew in crews:
                    bio = _bio_cache.get(crew.crew_id)
                    if not bio:
                        bio = generate_bio_sample(crew.crew_id, t)
                        _bio_cache[crew.crew_id] = bio

                    # Circadian state
                    circ = update_circadian_state(crew.crew_id, bio, t)
                    cs = CircadianState(
                        crew_id=crew.crew_id,
                        ts=datetime.utcnow(),
                        phase_hours=circ["phase_hours"],
                        debt_hours=circ["debt_hours"],
                        alertness=circ["alertness"],
                        predicted_melatonin_onset=circ["predicted_melatonin_onset"],
                    )
                    session.add(cs)

                    # Affect estimate
                    affect = estimate_affect(bio)
                    ae = AffectEstimate(
                        crew_id=crew.crew_id,
                        ts=datetime.utcnow(),
                        arousal=affect["arousal"],
                        valence=affect["valence"],
                        top_features=json.dumps(affect["top_features"]),
                    )
                    session.add(ae)

                session.commit()
        except Exception as e:
            print(f"ML state update error: {e}")
        await asyncio.sleep(10)
