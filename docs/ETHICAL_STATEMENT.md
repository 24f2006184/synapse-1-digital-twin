# SYNAPSE-1 Ethical Statement

**Team:** SPAR26-HCBD-06 · SpAr Conclave 2026

---

## Position

SYNAPSE-1 monitors crew biometrics to support wellbeing. This creates the conditions for surveillance. We take a design position: every technical capability in this system must be legible, revocable, and accountable to the people it monitors. What follows is how we operationalise that position.

---

## Consent Architecture

Every crew member holds individual consent flags (`consent_share_bio`, `consent_share_affect`) that are enforced server-side — not as UI checks, but at the WebSocket transmission layer. Changing these flags logs an immutable entry to the ethics ledger. The **privacy pause** blocks all biometric sharing for two hours on demand; Ground sees "crew has paused sharing" with no reason given. This is not a UI feature. It is a constraint on the data pipeline.

## Data Asymmetry (Intentional)

Ground Control and Crew Members see categorically different representations of the same underlying data:

| Ground sees | Crew sees |
|---|---|
| Russell circumplex (arousal/valence) | Mood weather glyph only |
| Numerical circadian debt (hours) | Circadian schedule gradient bar |
| Feature attributions for ML outputs | "Your oscillator suggests..." |
| All biometrics (with consent) | Only their own biometrics |
| Cohesion heatmap (aggregate) | Never individual stress data of peers |

This asymmetry is not a design compromise. It is the design. Surveilling isolated crew with granular numerical stress scores replicates the pathological power dynamics identified in space habitat psychology literature. The glyph is not a dumbed-down version of the circumplex — it is a different representation with different ethical properties.

## ML Honesty

Both ML models are labelled "estimates" not "predictions" throughout the system. The affect MLP was trained on synthetic data with documented labeling rules (`/ml/affect/labeling.md`). The circadian oscillator implements published canonical equations (Kronauer 1999) without claiming novel neuroscience. Every feature attribution is shown to Ground; no output is a black box.

The Solfeggio acoustic layer is labelled *"speculative — Solfeggio claims are not strongly evidenced, included as a designed ritual element."* The Hippocampal Anchor test notes explicitly that 1/6g grid-cell transfer is a hypothesis, not a proven fact.

Epistemic honesty is not a liability in this submission. It is the ethical statement.

## The Ethics Ledger

Every consequential system action — scenario injection, consent change, privacy pause, environmental override — is written to a tamper-evident hash-chained append-only log. Crew can export their own slice at any time. The chain can be independently verified. This is accountability made structural.

## What We Do Not Build

- No automated interventions triggered solely by affect estimate
- No peer stress scores shared between crew members
- No journal content leaving the device (device-only localStorage)
- No "employee performance" framing of biometric data
- No single "stress score" that reduces a person to a number

---

*This statement is not separate from the system — it is a description of constraints already implemented in the code.*
