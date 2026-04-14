# SYNAPSE-1 Digital Twin — Design Narrative

**Team:** SPAR26-HCBD-06
**Conclave:** SpAr Conclave 2026 · Theme 3: Human-Centred & Behavioural Design
**Word count:** ~1200

---

## The Thesis

SYNAPSE-1 proposes that architecture is not a passive container for human activity — it is an active participant in human cognition, affect, and resilience. The habitat is named after the synapse because the synapse is where signal becomes meaning: a threshold, a decision, a change of state. SYNAPSE-1 is an architecture that listens, estimates, and responds.

The digital twin operationalises this thesis. It is not a visualisation tool. It is the proof.

---

## The Neural Ontology

The habitat's three-tier structure — Soma, Axon, Dendrites — is not metaphor dressed up as architecture. It is a functional hierarchy that maps directly to the neuroscience of habitation. The Soma (Level 1) is where energy is received and distributed: communal galley, Holographic Hearth, social commons. The Axon (Level 2) is where work is propagated: laboratories, aeroponic garden, transitional gallery. The Dendrites (Level 3) are the private terminals: twelve sleep pods, each shielded by a water-tank radiation screen that doubles as the storm shelter.

The Hippocampal Anchor Atrium runs the full vertical axis. This is SYNAPSE-1's most deliberate design choice: a 12-metre cylindrical atrium that provides the spatial reference every occupant orients themselves to from the moment they wake. Grid-cell function (Moser et al.) is understood in rodents and 1g humans; whether the same mechanisms operate in sustained 1/6g habitation is a hypothesis. SYNAPSE-1 treats it as a design commitment rather than a proven fact — and the twin labels it precisely so in every tooltip. The Anchor exists because even an unproven hypothesis about spatial cognition is worth building for when the alternative is spatial disorientation at 384,000 km from home.

---

## The Twin's Five Core Systems

### 1. Live Environmental Streaming
Every zone streams temperature, CO₂, lux, CCT, dB SPL, and Perlin-noise airflow variability at 2 Hz. The Perlin noise is not decoration — it is the mathematical operationalisation of "somatosensory variability to prevent habituation." Constant airflow is habituated within minutes; variable airflow is not. The twin measures this with the **Sensory Monotony Index (SMI)**: a rolling scalar combining variance across lux, CCT, dB, and airflow. When SMI drops below 0.3, the Neuro-Core OS alarms. Architecture failing its own thesis is not a silent failure in SYNAPSE-1.

### 2. Kronauer Circadian Oscillator
The twin implements a simplified van der Pol limit-cycle oscillator (Kronauer 1999, St Hilaire 2007) per crew member. This is computational neuroscience made interactive: the state variables (x, xc) evolve continuously, driven by each occupant's light exposure history. The **Circadian Ring** visualises biological phase (inner ring) against habitat-imposed schedule (outer ring); the shaded gap between them is "circadian debt" — the headline welfare metric on the Ground dashboard.

When a crew member's pod CCT shifts from Grecian White (6500K) to Vedic Ochre (2000K), the oscillator's phototransduction input decreases, and the phase drifts measurably in the next simulated hours. The building literally adjusts itself to the mind — the **Closed-Loop Chromotherapy Autopilot** implements this without human intervention, with a crew override that always wins. This is "architecture as proactive behavioural support system" made literal.

### 3. Russell Circumplex Affect Estimator
A small MLP estimates crew affective state on two axes — arousal and valence (Russell 1980). The choice of the circumplex over a single "stress score" is deliberate and ethical: it maps to affective neuroscience (amygdala-prefrontal decomposition), it is harder to weaponise than a single number, and it is more honest about what biometric proxies can actually measure. The model outputs top-3 feature attributions via gradient × input (a fast SHAP approximation), so Ground never sees a black box. They see: *HRV RMSSD: −0.42, sleep debt: −0.38, EDA: +0.21*.

Crew never see the circumplex directly. They see a **mood weather glyph** — ☀️ Bright & Energised, 🌥️ Balanced, ⛈️ Stressed — rendered as a gentle reading, never a score. The epistemic honesty is built into the rendering layer.

### 4. The Ethics Accountability Ledger
Every consequential action in the twin is written to a hash-chained append-only log: scenario injections, consent changes, privacy pauses, chromotherapy overrides, alarm dismissals. Each entry's hash is SHA-256(prev_hash + timestamp + actor + event + payload). The chain can be independently verified by any party. Crew can export their own slice.

This is the answer to Theme 3's requirement for an "Ethical & Accountability Statement" — not as 500 words of prose, but as a running system. The ledger is the statement.

### 5. The Privacy Architecture
Crew members have genuine agency. The **privacy pause toggle** blocks biometric streaming at the API boundary for two hours — not in the UI, not in a flag checked before display, but in the WebSocket send loop itself. Ground sees "crew has paused sharing" with no reason, no downstream data. The toggle's use is logged to the ethics ledger — the crew member's choice creates their own record. This is surveillance designed against itself.

---

## The Four Additional Features

**Sensory Monotony Index** operationalises SYNAPSE-1's core design constraint: sensory monotony must be measured and alarmed, not just avoided in principle.

**Comms Latency Theatre** shows the same Earth communications data through two phenomenological lenses: crew see "next letter window in 3h 42m" (ritual, human-scaled), Ground see latency and operational constraints (functional, mission-scaled). Same data, two phenomenologies. This is human-centred design.

**Regolith Brick Build Queue** ties the behavioural twin to the structural thesis: each brick cured by *Sporosarcina pasteurii* rovers outside contributes to the radiation shield integrity dial. Water consumed for drinking and aeroponics reduces shielding. The trade-off is live and dramatic.

**Hippocampal Anchor Drift Test** gives the atrium a weekly function: a 60-second spatial memory game whose declining scores flag a need for increased biophilic and anchor interventions. We do not claim to have solved the 1/6g grid-cell question. We claim to have built a system that would notice if something were going wrong.

---

## What This Twin Is

The SYNAPSE-1 digital twin is not a visualisation layer added to a habitat proposal. It is the habitat proposal made computable — an argument that architecture should be measurable against the welfare outcomes it claims to produce. Every feature in the twin is a test: does this space support the psychological resilience, circadian health, sensory balance, or social cohesion of twelve people in prolonged lunar isolation?

The jury criteria for Theme 3 ask for evidence that the team understands human-centred design as more than aesthetics. The ethics ledger, the consent architecture, the privacy pause, the honest epistemic labels on unproven claims, the circumplex instead of the stress score — these are the evidence.

Architecture is a proactive behavioural support system. The twin proves it.
