# TrustBurn AI — 3-Minute Demonstration Screen Recording Script

**Problem Statement:** Smart India Hackathon 2026 — SIH26170 (ISRO)  
**Project:** TrustBurn AI — Uncertainty-Aware Early Warning & Risk Intelligence for Component Burn-In  
**Target Duration:** Exactly 3 Minutes (180 Seconds)  
**Pacing:** Steady, clear, professional engineering tone.

---

## Timeline & Narration Script

### [0:00 – 0:30] MISSION CONTROL OVERVIEW
- **Visual Action:** Open browser at `http://localhost:5173`. Show Mission Control Overview dashboard, metric summary cards, and the Conventional vs. TrustBurn Comparison table.
- **Spoken Narration:**
  > *"Welcome to TrustBurn AI, an uncertainty-aware screening system for component burn-in qualification under SIH26170.*
  >
  > *In conventional screening, components are checked against static absolute limits at 168 hours. Latent defects that pass initial checks can escape into mission hardware.*
  >
  > *TrustBurn changes this paradigm: at the 24-hour mark, it combines robust lot-relative anomaly detection, early drift forecasting, and split-conformal uncertainty intervals to make early, evidence-based triage decisions.*
  >
  > *On this controlled BurnIn-Bench dataset of 800 components across 4 lots, static screening escaped 28 defects. TrustBurn reduces this escape rate by over 90% on this controlled split while routing ambiguous cases for review."*

---

### [0:30 – 1:15] SCENARIO A: HIDDEN WITHIN-SPEC ANOMALY
- **Visual Action:** Click "Component Intelligence" tab (or click "Inspect Within-Spec Anomaly" button). Select component `CMP-DEMO-WITHIN-SPEC` from Lot C.
- **Spoken Narration:**
  > *"Here is a classic latent defect escape. At 24 hours, this component draws 45.1 microamps against an upper spec limit of 50 microamps.*
  >
  > *Conventional screening marks this PASS — it is within spec. But look at the lot context: the median leakage for Lot C is approximately 10.1 microamps with a MAD of 1.2 microamps.*
  >
  > *TrustBurn calculates an extreme lot-relative Robust Z-score. This component is not normal for its manufacturing lot. Even though it is within absolute limits, the decision engine routes it for engineering review with reason code `REASON_LOT_RELATIVE_OUTLIER_MAD_HIGH`.*
  >
  > *This is a defect escape that conventional static screening would never catch."*

---

### [1:15 – 2:05] SCENARIO B: EARLY DRIFT WARNING & HELD-OUT OUTCOME
- **Visual Action:** Navigate to "Early Warning Lab". Select component `CMP-DEMO-EARLY-DRIFT`. Point out the observed 0h and 24h readings, the projected 168h forecast, and the 90% conformal band. Click **"Reveal Held-Out Outcome"**.
- **Spoken Narration:**
  > *"Now let’s examine early drift forecasting. This component starts at 14.5 microamps at 0 hours and drifts to 24.8 microamps at 24 hours.*
  >
  > *Using strictly less than or equal to 24-hour measurements, our supervised gradient boosted regressor projects the 168-hour endpoint at approximately 58.5 microamps — well beyond the 50 microamp specification limit.*
  >
  > *TrustBurn does not just give a point forecast; it provides a 90% split-conformal prediction interval. The lower bound confirms the trajectory is crossing the limit with high confidence.*
  >
  > *Now let us reveal the held-out benchmark outcome: the actual 168-hour measurement reached 62.1 microamps. On this controlled scenario, it confirms the direction of the early warning, demonstrating an opportunity to identify risk at 24 hours instead of waiting 168 hours."*

---

### [2:05 – 2:30] SCENARIO C: DISTRIBUTION SHIFT & PREDICTIVE TRUST
- **Visual Action:** Navigate to "Burn-In Explorer" or "Component Intelligence". Select component `CMP-DEMO-SHIFT` from Lot D (`LOT-2026-D-SHIFT`). Show the Trust Status badge: `REDUCED` and the warning banner.
- **Spoken Narration:**
  > *"What happens when manufacturing conditions drift? Lot D represents an uncalibrated process run with an elevated baseline.*
  >
  > *TrustBurn does not blindly trust its models. The non-parametric distribution shift detector flags this lot, reducing model trust status from NORMAL to REDUCED.*
  >
  > *The decision engine immediately flags the shift, routing the component for review because conformal guarantees cannot be assured under distribution shift. This illustrates scientific honesty in automated screening."*

---

### [2:30 – 3:00] QA DECISION CENTER & CRYPTOGRAPHIC AUDIT TRAIL
- **Visual Action:** Navigate to "QA Decision Center", then click "Audit Trail". Point out the SHA-256 chain log. Click **[ VERIFY HASH INTEGRITY ]**. Observe the green `CHAIN VERIFIED INTACT` badge.
- **Spoken Narration:**
  > *"Every screening decision is deterministic and auditable. Here in the QA Decision Center, the reliability engineer sees the full evidence breakdown: spec check, lot-relative score, forecast, conformal interval, and distribution stability.*
  >
  > *Clicking Verify Hash Integrity validates the sequential SHA-256 tamper-evident hash chain stored in SQLite.*
  >
  > *The status confirms: CHAIN VERIFIED INTACT. Every evaluation run is cryptographically bound to its model version, data seed, and decision policy.*
  >
  > *TrustBurn AI provides early warning, quantifies uncertainty, detects its own blind spots, and leaves an auditable evidence chain. Thank you."*

---

## Demonstration Checklist

- [x] Backend running on `http://127.0.0.1:8000`
- [x] Frontend running on `http://localhost:5173`
- [x] Demo fixtures pre-loaded (`CMP-DEMO-WITHIN-SPEC`, `CMP-DEMO-EARLY-DRIFT`, `CMP-DEMO-SHIFT`, `CMP-DEMO-NORMAL`, `CMP-DEMO-HIGHRISK`)
- [x] SQLite database verified (`GET /api/audit/verify-chain` returns `valid: true`)
- [x] Guided Demo modal available via top navigation bar (`[ Guided Demo ]` button)
