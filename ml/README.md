# SYNAPSE-1 ML Models

## Overview

Two ML models power the SYNAPSE-1 digital twin's behavioural intelligence layer.
Both are **demonstrators** built on published equations and synthetic data —
they are honest about their limits, which is a strength, not a weakness.

---

## Model 1: Circadian Phase Estimator

**File:** `/backend/ml/circadian/oscillator.py`

### Model type
Simplified Kronauer-style limit-cycle oscillator (van der Pol type).
Implemented in PyTorch for differentiability; state-space equations are
deterministic ODEs, not learned weights.

### Equations
State variables: (x, xc) — oscillator position and velocity analog.

```
dx/dt = π/12 × (xc + μ × (x/3 + 4/3 × x³ - 256/105 × x⁷) + B(t))
dxc/dt = π/12 × (-x/(τ_c/(2π)) + μ × β × xc × (0.5 - x²) + B(t))
```

Where B(t) is the phototransduction input from light exposure,
parameterised by lux and CCT (higher CCT = stronger blue-light drive).

### Parameters
- τ_c = 24.2h (intrinsic period), μ = 0.23, K = 0.55
- From Kronauer 1999 canonical parameterisation

### References
- Kronauer RE, Forger DB, Jewett ME. (1999). Quantifying Human Circadian Pacemaker Response.
  J Biol Rhythms 14(6):501-516.
- St Hilaire MA, Klerman EB, Khalsa SB, et al. (2007). Addition of a non-photic component
  to a light-based mathematical model. J Theor Biol 247(4):583-599.

### Limitations
- Integration is Euler (sufficient for 10s update intervals, not for precision timing).
- Parameters from Kronauer 1999 are population averages; individual variation not modelled.
- Light input is estimated from zone CCT/lux, not from a calibrated personal photometer.
- Output: circadian phase estimate with ±30min typical error, not validated clinically.

---

## Model 2: Affect & Stress Estimator

**File:** `/backend/ml/affect/regressor.py`

### Model type
Small MLP (7 → 32 → 16 → 2) with GELU activations and tanh output.
Output: two-dimensional Russell's circumplex coordinates (arousal, valence).

### Why Russell's circumplex?
Single "stress score" systems are both reductive and surveillance-like.
The circumplex maps to affective neuroscience (amygdala-prefrontal valence/arousal
decomposition, Barrett & Russell 1998) and allows nuanced interpretation.

### Inputs
| Feature | Source | Normalisation |
|---|---|---|
| HRV RMSSD | Bio stream | /80ms |
| LF/HF ratio proxy | Derived from HR + HRV | Rule-based |
| EDA | Bio stream | /8µS |
| Sleep debt | Accumulated simulation | /8h |
| Core temp deviation | Circadian model | /0.5°C |
| Heart rate | Bio stream | (HR-45)/75 |
| Circadian phase sin | Mission clock | sin(2π×t/24) |

### Training data
Synthetic data generated with labeling rules documented in `/ml/affect/labeling.md`.
10,000 synthetic samples per class.

**ETHICAL STATEMENT:** This model is a demonstrator. It has not been validated against
real crew biometric data. Outputs are labelled "estimates" not "predictions" throughout
the UI. Crew never see numerical affect scores — only a mood weather glyph.
Ground sees the circumplex with top-3 feature attributions for transparency.
No automated interventions are triggered by affect state alone.

### References
- Russell JA. (1980). A circumplex model of affect. J Personality Social Psychology 39(6):1161-1178.
- Barrett LF, Russell JA. (1998). Independence and bipolarity in the structure of current affect.
  J Personality Social Psychology 74(4):967-984.
