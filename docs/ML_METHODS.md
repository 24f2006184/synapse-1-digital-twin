# ML Methods — SYNAPSE-1 Digital Twin

## Overview

Two ML components provide the behavioural intelligence layer of SYNAPSE-1.
Both are **demonstrators** built on published science and synthetic data.
Neither is a validated clinical tool. Both are honest about this.

---

## 1. Circadian Phase Estimator

### Summary
A limit-cycle oscillator (van der Pol type) estimating circadian phase per crew member.
Implemented as a deterministic state-space model driven by light exposure history.

### Mathematical Model

Kronauer-style two-process model (simplified), state variables (x, xc):

```
dx/dt  = π/12 × [xc + μ·(x/3 + 4x³/3 − 256x⁷/105) + B(t)]
dxc/dt = π/12 × [−x/q + μ·β·xc·(½ − x²) + B(t)]
```

where `q = τ_c/(2π)` and `B(t)` is the phototransduction input:

```
B(t) = G × (1 − 0.4x)(1 − 0.4xc) × α(t)
α(t) = α₀ × I(t)ᵖ × CCT_weight(t)
```

CCT_weight maps colour temperature to blue-light drive (range 0.3–1.0).

### Parameters
| Parameter | Value | Source |
|---|---|---|
| τ_c | 24.2h | Kronauer 1999 |
| μ | 0.23 | Kronauer 1999 |
| G | 33.75 | Kronauer 1999 |
| α₀ | 0.16 | St Hilaire 2007 |
| β | 0.013 | Kronauer 1999 |
| p | 0.6 | St Hilaire 2007 |

### Outputs
- `phase_hours`: estimated circadian phase (0–24h)
- `debt_hours`: divergence from habitat-imposed schedule
- `alertness`: proxy from oscillator position (0–1)
- `predicted_melatonin_onset`: predicted DLMO (~2h before temp minimum)

### Integration
Euler integration at 10-second update intervals. Sufficient for demo resolution.
For clinical use, RK4 with adaptive step size would be required.

### Validation status
The canonical Kronauer equations are validated in controlled laboratory conditions.
This implementation has **not** been validated against measured crew phase data.
Phase estimate accuracy: ±30–60min typical (literature values for the canonical model).

### References
1. Kronauer RE, Forger DB, Jewett ME. (1999). Quantifying Human Circadian Pacemaker Response to Brief Illumination. *J Biol Rhythms* 14(6):501-516.
2. St Hilaire MA, Klerman EB, Khalsa SB, et al. (2007). Addition of a non-photic component to a light-based mathematical model of the human circadian pacemaker. *J Theor Biol* 247(4):583-599.
3. Jewett ME, Kronauer RE. (1998). Refinement of a limit cycle oscillator model of the effects of light on the human circadian pacemaker. *J Theor Biol* 192(4):455-465.

---

## 2. Affect & Stress Estimator

### Summary
Small MLP estimating affective state on Russell's circumplex of affect.
Two-dimensional output: arousal and valence in [−1, 1].

### Architecture
```
Input (7) → Linear(32) → LayerNorm → GELU → Dropout(0.1)
         → Linear(16) → GELU → Linear(2) → Tanh
```

Total parameters: ~700 (intentionally minimal for CPU inference).

### Input Features
| Feature | Range | Derivation |
|---|---|---|
| HRV RMSSD normalised | 0–1 | RMSSD/80ms |
| LF/HF ratio proxy | 0–3 | Rule from HRV/HR |
| EDA normalised | 0–1 | EDA/8µS |
| Sleep debt normalised | 0–1 | debt/8h |
| Core temp deviation | ±2 | (T−37)/0.5 |
| Heart rate normalised | 0–1 | (HR−45)/75 |
| Circadian phase sin | −1 to 1 | sin(2πt/24) |

### Training data
10,000 synthetic samples generated from documented labeling rules (`/ml/affect/labeling.md`).
Labels are programmatic, not from validated psychometric instruments.

### Interpretability
Every prediction includes **top-3 feature attributions** via gradient × input (approximates SHAP values).
Ground Control always sees the attribution alongside the estimate.
No prediction is displayed without explanation.

### Output mapping (UI)
- **Ground:** Full circumplex plot + feature attributions
- **Crew:** Mood weather glyph only (☀️/🌤️/🌥️/⛈️/🌦️)
- **Never:** Numerical stress scores to crew or peer comparisons

### Limitations
1. Trained on synthetic data — not validated against real biometrics.
2. Individual physiological baselines not modelled.
3. Cultural expression of affect not accounted for.
4. EDA from simulation, not real electrodermal sensor.
5. "Estimates" throughout — the word "predicts" does not appear in the UI.

### References
1. Russell JA. (1980). A circumplex model of affect. *J Personality Social Psychology* 39(6):1161-1178.
2. Barrett LF, Russell JA. (1998). Independence and bipolarity in the structure of current affect. *J Personality Social Psychology* 74(4):967-984.
3. Thayer JF, Lane RD. (2000). A model of neurovisceral integration in emotion regulation. *J Affect Disord* 61(3):201-216.

---

## 3. Sensory Monotony Index (SMI)

### Formula
```
SMI = 0.30 × NormVar(lux, σ=150)
    + 0.30 × NormVar(CCT, σ=1500)
    + 0.20 × NormVar(dB, σ=8)
    + 0.20 × NormVar(airflow_seed, σ=0.2)

NormVar(x, σ) = min(1, Var(x) / σ²)
```

Computed over a rolling 6-hour window (720 samples at 2 Hz).
Alarm threshold: SMI < 0.3.

### Rationale
Habituation to constant environmental stimuli reduces arousal and impairs attention.
SMI measures the crew's exposure to environmental variability — directly testing
SYNAPSE-1's design claim that sensory monotony is actively countered by the habitat.

---

*All models run on CPU. Inference time < 5ms per crew member.*
