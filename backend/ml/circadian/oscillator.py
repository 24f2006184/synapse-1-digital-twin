"""
Kronauer-Style Circadian Oscillator (Limit-Cycle Model)
========================================================
Implements a simplified van der Pol oscillator for circadian phase estimation.

References:
  - Kronauer RE et al. (1999). Quantifying Human Circadian Pacemaker Response.
    J Biol Rhythms 14(6):501-516.
  - St Hilaire MA et al. (2007). Addition of a non-photic component to a
    light-based mathematical model of the human circadian pacemaker.
    J Theor Biol 247(4):583-599.

Note: This is a demonstrator implementing the published canonical equations.
It is NOT a validated clinical tool. Phase estimates should be treated as
indicative, not diagnostic.
"""
from __future__ import annotations
import math
import time
from typing import Dict, Optional

# ─── Kronauer Parameters ─────────────────────────────────────────────────────
TAU_C = 24.2          # Intrinsic circadian period (hours)
MU = 0.23             # Stiffness parameter
K = 0.55              # Light sensitivity constant
ALPHA_0 = 0.16        # Phototransduction parameter
BETA = 0.013          # Phototransduction parameter
P = 0.6               # Phototransduction parameter
G = 33.75             # Amplitude of driving force
F_24 = 2 * math.pi / 24.0  # Angular freq of 24h cycle


# ─── Per-Crew Oscillator State ────────────────────────────────────────────────
class CircadianOscillator:
    """
    Van der Pol oscillator tracking circadian phase per crew member.
    State variables: (x, xc) — oscillator position and velocity analog.
    """
    def __init__(self, crew_id: str, phase_offset_h: float = 0.0):
        self.crew_id = crew_id
        # Initial conditions on the limit cycle
        self.x = 0.8 * math.cos(F_24 * phase_offset_h)
        self.xc = 0.8 * math.sin(F_24 * phase_offset_h)
        self.last_t = time.time()
        self.phase_offset_h = phase_offset_h
        self.schedule_phase_h: float = 0.0  # imposed schedule offset

    def light_input(self, lux: float, cct_kelvin: float) -> float:
        """
        Phototransduction: converts light exposure to circadian drive B(t).
        Higher CCT (blue-enriched, morning light) has stronger phase advance.
        """
        # Normalise lux to 0-1
        i_s = min(1.0, lux / 9500.0)
        # CCT weight: 6500K full weight, 2000K reduced weight (blue component)
        cct_weight = 0.3 + 0.7 * min(1.0, max(0, (cct_kelvin - 1800) / (6500 - 1800)))
        alpha = ALPHA_0 * (i_s ** P) * cct_weight
        b = G * (1 - 0.4 * self.x) * (1 - 0.4 * self.xc) * alpha
        return b

    def step(self, dt_h: float, lux: float = 400.0, cct_kelvin: float = 4000.0) -> dict:
        """
        Advance the oscillator by dt_h hours.
        Uses Euler integration (sufficient for this demo resolution).
        """
        if dt_h <= 0 or dt_h > 1.0:
            dt_h = min(abs(dt_h), 1.0)

        b = self.light_input(lux, cct_kelvin)
        omega = 2 * math.pi / TAU_C

        # Van der Pol equations (Kronauer 1999, Eq. 1-2)
        dxdt = (
            math.pi / 12.0 * (
                self.xc + MU * (self.x / 3 + (4/3) * self.x**3 - (256/105) * self.x**7)
                + b
            )
        )
        dxcdt = (
            math.pi / 12.0 * (
                -self.x / (0.99669 * 24 / (2 * math.pi)) + MU * BETA * self.xc * (0.5 - self.x**2) + b
            )
        )

        self.x += dxdt * dt_h
        self.xc += dxcdt * dt_h

        # Clamp to prevent runaway
        self.x = max(-2.0, min(2.0, self.x))
        self.xc = max(-2.0, min(2.0, self.xc))

        return self._state()

    def _state(self) -> dict:
        """Compute derived quantities from oscillator state."""
        # Phase in hours (0-24) — add 24 before modulo to handle tiny negative floats
        phase_rad = math.atan2(self.xc, self.x)
        phase_hours = (phase_rad / (2 * math.pi) * 24 + 24) % 24

        # Predicted melatonin onset: ~2h before minimum core temp (~4h)
        melatonin_onset_h = (phase_hours + 22) % 24

        # Alertness proxy from oscillator position
        alertness = 0.5 + 0.4 * math.cos(phase_rad + math.pi / 2)

        # Debt = divergence from imposed 24h schedule
        schedule_phase = (time.time() / 3600.0) % 24.0
        debt_h = abs(phase_hours - schedule_phase)
        if debt_h > 12:
            debt_h = 24 - debt_h

        return {
            "phase_hours": round(phase_hours, 2),
            "debt_hours": round(debt_h, 2),
            "alertness": round(max(0, min(1, alertness)), 3),
            "predicted_melatonin_onset": round(melatonin_onset_h, 1),
            "x": round(self.x, 4),
            "xc": round(self.xc, 4),
        }


# ─── Global Registry ──────────────────────────────────────────────────────────
_oscillators: Dict[str, CircadianOscillator] = {}


def _get_oscillator(crew_id: str) -> CircadianOscillator:
    if crew_id not in _oscillators:
        idx = int(crew_id.replace("crew", "")) if crew_id.startswith("crew") else 1
        _oscillators[crew_id] = CircadianOscillator(crew_id, phase_offset_h=(idx - 1) * 0.4)
    return _oscillators[crew_id]


def update_circadian_state(crew_id: str, bio: dict, t: float) -> dict:
    """
    Update the crew member's circadian oscillator with current light exposure.
    Called from the background ML update loop.
    """
    osc = _get_oscillator(crew_id)

    # Time since last update
    dt_s = t - osc.last_t
    dt_h = dt_s / 3600.0
    osc.last_t = t

    # Light input from their pod (estimate from mission time)
    from sim.simulator import mission_clock_h, alertness_curve, _zone_chromotherapy, CHROMOTHERAPY_PRESETS
    pod_id = f"zone_dendrite_pod_{crew_id[-2:]}"
    chroma = _zone_chromotherapy.get(pod_id, None)
    if chroma:
        lux = chroma.get("lux", 400)
        cct = chroma.get("cct", 4000)
    else:
        t_h = mission_clock_h()
        lux = max(50, 600 * alertness_curve(t_h))
        cct = 2700 + 3800 * max(0, math.cos(2 * math.pi * (t_h - 14) / 24))

    state = osc.step(dt_h, lux=lux, cct_kelvin=cct)
    return state


def force_schedule_shift(crew_id: str, shift_hours: float):
    """Force a schedule shift on a crew member (for demo/testing)."""
    osc = _get_oscillator(crew_id)
    osc.schedule_phase_h += shift_hours
    osc.x = 0.8 * math.cos(2 * math.pi * osc.schedule_phase_h / 24)
    osc.xc = 0.8 * math.sin(2 * math.pi * osc.schedule_phase_h / 24)


def get_circadian_forecast(crew_id: str, hours: int = 16) -> list:
    """Generate alertness forecast for the next N hours."""
    osc = _get_oscillator(crew_id)
    x_sim, xc_sim = osc.x, osc.xc
    forecast = []
    for i in range(hours):
        phase_rad = math.atan2(xc_sim, x_sim)
        alertness = 0.5 + 0.4 * math.cos(phase_rad + math.pi / 2)
        phase_h = (phase_rad / (2 * math.pi) * 24) % 24
        forecast.append({
            "hour_offset": i,
            "phase_hours": round(phase_h, 2),
            "alertness": round(max(0, min(1, alertness)), 3),
        })
        # Advance simulation
        b = osc.light_input(400, 4000)
        dxdt = math.pi / 12.0 * (xc_sim + MU * (x_sim / 3 + (4/3) * x_sim**3) + b)
        dxcdt = math.pi / 12.0 * (-x_sim / (0.99669 * 24 / (2 * math.pi)) + MU * BETA * xc_sim * (0.5 - x_sim**2) + b)
        x_sim += dxdt * 1.0
        xc_sim += dxcdt * 1.0
    return forecast
