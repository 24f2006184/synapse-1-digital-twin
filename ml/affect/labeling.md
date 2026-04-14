# Affect Model Labeling Rules

## Purpose
Documents the rules used to generate synthetic training data for the SYNAPSE-1 affect estimator.
Transparency here is ethically required — a model's label rules are its implicit values.

## Methodology

Training data: 10,000 synthetic crew biometric samples with programmatically assigned labels.

## Label Rules

### High Arousal / Negative Valence (Stressed)
- HRV RMSSD < 25ms AND
- EDA > 5µS AND
- HR > 90 bpm

### Low Arousal / Positive Valence (Calm/Rested)
- HRV RMSSD > 60ms AND
- Sleep debt < 1h AND
- EDA < 2µS

### High Arousal / Positive Valence (Alert/Engaged)
- HRV RMSSD > 50ms AND
- HR 75-90 bpm AND
- Time-of-day: 09:00-11:00 or 14:00-16:00

### Low Arousal / Negative Valence (Exhausted)
- Sleep debt > 5h AND
- HRV RMSSD < 35ms AND
- Core temp below baseline by >0.3°C

## Known limitations
1. Labels are derived from physiological proxies, not validated psychological assessments.
2. Individual baseline variation is not modelled.
3. Cultural and personality factors affecting physiological stress expression are absent.
4. The model should NOT be used to make clinical or occupational decisions.

## Ethical statement
This labeling approach is a demonstrator implementation. Real deployment would require
validated psychometric instruments, individual baseline calibration, and independent ethics review.
