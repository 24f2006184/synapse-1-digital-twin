# SYNAPSE-1 Digital Twin

**SpAr Conclave 2026 · Theme 3: Human-Centred & Behavioural Design**
**Team:** SPAR26-HCBD-06

> *Architecture as a Proactive Behavioural Support System*

---

## Quick Start (Dev Mode — 90 seconds)

### Prerequisites
- Python 3.11+ (`py -3 --version`)
- Node.js 18+ (`node --version`)

### 1. Start Backend

```bash
cd backend
py -3 -m pip install -r requirements.txt
py -3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend ready at: http://127.0.0.1:8000

### 2. Start Frontend (new terminal)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend ready at: http://localhost:3000

---

## Login Credentials

| Role | Username | Password | Access |
|---|---|---|---|
| Ground Control | `ground` | `ground` | Full analytics, ML, Ethics ledger |
| Crew Member | `crew01`–`crew12` | `crew` | Personal companion view |

---

## Architecture

```
spar/
├── backend/          FastAPI + SQLModel + WebSockets
│   ├── main.py       All API routes + WebSocket endpoints
│   ├── models.py     SQLModel database tables
│   ├── auth.py       JWT authentication (GROUND / CREW roles)
│   ├── seed.py       Initial crew + zone data
│   ├── sim/          Physically-grounded data simulator
│   │   └── simulator.py  Circadian cosine, Perlin noise airflow, stress scenarios
│   └── ml/
│       ├── circadian/    Kronauer van der Pol oscillator (PyTorch)
│       └── affect/       Russell circumplex MLP regressor (PyTorch)
│
├── frontend/         Next.js 14 + TypeScript + TailwindCSS
│   └── app/
│       ├── page.tsx              Landing page
│       ├── login/                Role-aware login
│       ├── ground/               Ground Control dashboard
│       │   ├── page.tsx          Neuro-Core OS overview
│       │   ├── habitat/          3D viewer (React Three Fiber)
│       │   ├── crew/             Full biometrics + circadian rings
│       │   ├── circadian/        Phase oscillator dashboard
│       │   ├── scenarios/        Scenario injection + replay
│       │   ├── ethics/           Ethics accountability ledger
│       │   └── comms/            Comms latency + ISRU queue
│       └── crew/[id]/            Crew Companion
│           ├── page.tsx          Home: mood weather, light schedule, suggestion
│           ├── hearth/           Holographic Hearth live view
│           ├── garden/           Aeroponic bonsai (ART)
│           ├── journal/          Private encrypted journal (device-only)
│           └── anchor-test/      Hippocampal spatial memory test
│
├── ml/               ML documentation + labeling rules
├── docs/             NARRATIVE, ETHICAL_STATEMENT, ML_METHODS, DEMO
└── docker-compose.yml
```

---

## Key Features

| Feature | Location | Spec Phase |
|---|---|---|
| 3D habitat viewer (R3F) | `/ground/habitat` | Phase 1 |
| WebSocket bio + env streams (2Hz/1Hz) | `/ws/env`, `/ws/bio/{id}` | Phase 2 |
| Kronauer circadian oscillator | `ml/circadian/oscillator.py` | Phase 3 |
| Russell circumplex affect MLP | `ml/affect/regressor.py` | Phase 4 |
| Neuro-Core OS dashboard | `/ground` | Phase 5 |
| Crew companion (mood weather, journal) | `/crew/{id}` | Phase 6 |
| Hash-chained ethics ledger | `/ground/ethics` | Phase 7 |
| Sensory Monotony Index (SMI) | `/habitat/smis` | New Feature 1 |
| Comms Latency Theatre | `/ground/comms` | New Feature 4 |
| Regolith Brick Queue (ISRU) | `/ground/comms` | New Feature 5 |
| Chromotherapy Autopilot | `sim/simulator.py` + UI | New Feature 6 |
| Hippocampal Anchor Test | `/crew/{id}/anchor-test` | New Feature 2 |

---

## Demo Script

See [docs/DEMO.md](docs/DEMO.md) for the full 4-minute jury demo walkthrough.

## Documentation

- [docs/NARRATIVE.md](docs/NARRATIVE.md) — Design narrative (~1200 words)
- [docs/ETHICAL_STATEMENT.md](docs/ETHICAL_STATEMENT.md) — Ethical accountability statement
- [docs/ML_METHODS.md](docs/ML_METHODS.md) — ML model methods and references
- [ml/README.md](ml/README.md) — ML literature references

---

## Docker (optional)

```bash
docker compose up
```

Both services start within 90 seconds.
