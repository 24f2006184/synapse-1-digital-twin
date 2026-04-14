# Demo Script — SYNAPSE-1 Digital Twin

**Target length:** 4 minutes (no cuts)
**Setup:** Two browser windows — Ground dashboard and Crew-04 companion view

---

## Pre-Demo Checklist

- [ ] `docker compose up` running, both services healthy
- [ ] Ground window: `http://localhost:3000/login?role=ground` → login as `ground/ground`
- [ ] Crew window: `http://localhost:3000/login?role=crew` → login as `crew04/crew`
- [ ] Both dashboards loading live data
- [ ] Ethics ledger initially empty (fresh database) or minimal

---

## 0:00 — Launch & Overview

**Action:** Show terminal with `docker compose up` completing. Open Ground dashboard at `/ground`.

**Narrate:**
> "SYNAPSE-1 is live. This is the Neuro-Core OS — the command surface a mission psychologist would actually use."

Point to:
- **Top band:** O₂, CO₂, pressure, power, water reserve, shield integrity
- **Crew roster (left):** 12 cards, each showing HRV, circadian debt, mood glyph
- **SMI grid (centre):** Sensory Monotony Index across all zones
- **Shield dial (right):** Water-as-shield trade-off, live

**Key line:** "That shield integrity dial shows water consumed for drinking and aeroponics directly reducing radiation protection. The trade-off is live, not theoretical."

---

## 0:45 — Solar Proton Event

**Action:** Navigate to `/ground/scenarios`. Set seed = 42. Click **Solar Proton Event**.

**Narrate:**
> "Seed 42 makes this reproducible — same seed, same cascade, every time."

Switch back to `/ground`. Wait ~15 seconds.

Point to:
- HRV values dropping in crew cards
- Alert banner: "Circadian debt critical" (if pre-existing)
- Navigate to `/ground/ethics` — show new `SCENARIO_INJECT` entry with hash

**Navigate to `/ground/habitat`.** Show the 3D viewer. Click a Dendrite pod.

**Narrate:**
> "Each pod is wrapped in water-tank shielding. Click into one — you see its live CCT, lux, airflow variability, the chromotherapy preset. During an SPE, shelter routing would direct crew to the Dendrite ring."

---

## 1:30 — Crew Companion View

**Action:** Switch to Crew-04 browser window at `/crew/crew04`.

**Narrate:**
> "Same habitat, different phenomenology. Crew-04 sees their mood weather — not a stress score, not a number. Just a glyph."

Point to:
- Mood weather glyph (e.g. 🌥️ Balanced)
- Circadian schedule gradient bar + alertness forecast chart
- Pod lighting presets: "The chromotherapy autopilot already adjusted their pod CCT based on circadian phase. Their override always wins."
- **Suggested action:** "The oscillator says a 20-minute walk in the Axon gallery. One suggestion, never more."

**Navigate to `/crew/crew04/journal`.**

**Narrate:**
> "This journal never leaves the device. Ground cannot see it. The spec's ethical framework requires a genuinely private space — this is it."

---

## 2:15 — Privacy Pause

**Action:** On Crew-04 page, click **"Hide from Ground for 2 hours"**.

**Switch immediately to Ground browser.**

**Narrate:**
> "Watch Crew-04's tile."

Point to Crew-04 card now showing 🔒 and "Sharing paused by crew".

**Navigate to `/ground/ethics`.** Show new `PRIVACY_PAUSE` entry.

**Narrate:**
> "The data is blocked at the API boundary — not in the UI, not in a flag, but in the WebSocket send loop. Ground sees the pause was activated. They don't know why. The crew member's choice creates their own ethics record."

---

## 2:45 — Scenario Replay & Circadian Dashboard

**Action:** Navigate to `/ground/circadian`.

Point to the 12 circadian rings:
- Outer ring = habitat schedule, inner ring = biological phase
- Shaded gap = circadian debt
- Any crew with debt > 2h highlighted in red

**Narrate:**
> "These are Kronauer-style van der Pol oscillators running live per crew member. Change a pod's lighting to Vedic Ochre — 2000K, warm amber — and you can watch the phase shift over the next simulated hours."

**Navigate to `/ground/scenarios`.** Scroll to **Scenario Replay** section.

**Narrate:**
> "This is the replay. Scrub through the SPE we just injected. HRV cascade, alertness curve, circadian response — all evolving together, fully reproducible with seed 42."

---

## 3:30 — Ethics Ledger Export

**Action:** Navigate to `/ground/ethics`.

**Narrate:**
> "Every action since demo start is here. Scenario injection, consent change, privacy pause — all hash-chained."

Click **Export JSON**.

**Narrate:**
> "This JSON file contains the full log with prev_hash and hash fields. The 'hash_chain_valid: true' at the top means the chain is intact — no entry was retroactively modified. Crew can export their own slice. Anyone can verify it."

Point to `SCENARIO_INJECT`, `PRIVACY_PAUSE`, `CHROMOTHERAPY_CHANGE` entries.

**Final line:**
> "SYNAPSE-1 makes architecture measurable against the welfare outcomes it claims to produce. The twin is the proof."

---

## Backup Demos (if time permits)

- `/crew/crew04/anchor-test` — Hippocampal Anchor spatial memory test
- `/crew/crew04/garden` — Aeroponic bonsai, ART explanation
- `/ground/comms` — Comms latency theatre + Regolith brick queue
- Chromotherapy autopilot: change pod CCT on `/ground/habitat`, show circadian forecast updating on `/ground/circadian`
