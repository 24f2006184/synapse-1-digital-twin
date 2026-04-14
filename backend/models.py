from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Crew(SQLModel, table=True):
    crew_id: str = Field(primary_key=True)
    display_name: str
    role: str  # e.g. Commander, Flight Surgeon, etc.
    avatar_seed: int = 0
    consent_share_bio: bool = True
    consent_share_affect: bool = True
    consent_paused_until: Optional[datetime] = None


class Zone(SQLModel, table=True):
    zone_id: str = Field(primary_key=True)
    level: str  # SOMA | AXON | DENDRITE | SPECIAL
    name: str
    description: str = ""
    occupancy_cap: int = 4
    current_lux: float = 400.0
    current_cct: float = 4000.0
    current_db_spl: float = 45.0
    current_co2_ppm: float = 800.0
    current_temp_c: float = 21.0
    current_humidity: float = 50.0
    chromotherapy_preset: str = "Neutral White"
    solfeggio_freq: float = 528.0
    occupants: str = "[]"  # JSON list of crew_ids


class EnvSample(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    zone_id: str = Field(foreign_key="zone.zone_id")
    ts: datetime = Field(default_factory=datetime.utcnow)
    lux: float
    cct: float
    db_spl: float
    co2_ppm: float
    temp_c: float
    humidity: float
    airflow_seed: float = 0.0


class BioSample(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    crew_id: str = Field(foreign_key="crew.crew_id")
    ts: datetime = Field(default_factory=datetime.utcnow)
    hrv_rmssd: float
    hr: float
    eda: float
    core_temp: float
    sleep_debt: float = 0.0


class CircadianState(SQLModel, table=True):
    crew_id: str = Field(primary_key=True)
    ts: datetime = Field(primary_key=True)
    phase_hours: float
    debt_hours: float
    alertness: float = 0.5
    predicted_melatonin_onset: float = 22.0  # hour of day


class AffectEstimate(SQLModel, table=True):
    crew_id: str = Field(primary_key=True)
    ts: datetime = Field(primary_key=True)
    arousal: float  # -1 to 1
    valence: float  # -1 to 1
    top_features: str = "{}"  # JSON


class EthicsLogEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ts: datetime = Field(default_factory=datetime.utcnow)
    actor_role: str
    actor_id: str
    event_type: str
    payload: str = "{}"  # JSON
    prev_hash: str = "genesis"
    hash: str = ""


class PrivacyPauseLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    crew_id: str
    ts: datetime = Field(default_factory=datetime.utcnow)
    paused_until: datetime
    reason: str = "crew_request"


class ScenarioEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ts: datetime = Field(default_factory=datetime.utcnow)
    name: str
    seed: int = 42
    injected_by: str = "ground"
    active: bool = True


class RegolithBrick(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    batch_id: str
    ts_started: datetime = Field(default_factory=datetime.utcnow)
    ts_complete: Optional[datetime] = None
    bacteria_strain: str = "Sporosarcina pasteurii"
    cure_pct: float = 0.0
    location_x: float = 0.0
    location_y: float = 0.0
    shield_contribution_kg: float = 0.0


class HippocampalTest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    crew_id: str
    ts: datetime = Field(default_factory=datetime.utcnow)
    score: float  # 0-100
    reaction_time_ms: float
    accuracy_pct: float
