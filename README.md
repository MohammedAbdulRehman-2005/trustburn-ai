# TrustBurn AI

### Uncertainty-Aware Early Warning & Risk Intelligence for Component Burn-In

> **"Every burn-in trajectory becomes an evidence opportunity — TrustBurn determines what can be trusted, what remains uncertain, and what should be verified next."**

**Target Context:** Smart India Hackathon 2026 — **SIH26170: AI-Driven Anomaly Detection in Component Burn-In & Screening (ISRO)**

---

## ⚠️ Scientific Honesty & Regulatory Notice

This software is an **academic research and demonstration prototype using strictly synthetic demonstration data**. 

* **A prediction is not an observed physical failure.**
* **HIGH RISK and REVIEW are engineering screening recommendations, not proof of component defect.**
* **Synthetic data is generated demonstration data, NOT proprietary ISRO flight-qualification data.**
* **Conformal prediction intervals rely on finite-sample exchangeability assumptions; coverage may degrade under cross-lot distribution shift.**
* **Cross-lot distribution shift warnings indicate reduced predictive trust, not model failure.**
* **Thresholds in this prototype are demonstration engineering policies, NOT certified aerospace specifications.**
* **This system does NOT replace physical screening or qualification chambers and carries no official ISRO endorsement.**

---

## 1. Project Overview & Mission

During semiconductor burn-in (typically performed at 125°C under accelerated electrical stress across 0h, 24h, 96h, and 168h stages), conventional screening verifies only whether electrical measurements satisfy static specification bounds ($x \le \text{SpecLimit}$).

Conventional absolute limit screening misses two critical failure modes:
1. **Intra-Lot Latent Anomalies:** A component exhibiting $45.1\ \mu\text{A}$ leakage current passes a $50.0\ \mu\text{A}$ absolute specification, even if its manufacturing lot exhibits a baseline center of $\approx 10.1\ \mu\text{A}$. Relative to its peers, this component is an extreme outlier ($19.7\times$ MAD sigmas).
2. **Accelerating Drift Failure:** A component starting at $14.5\ \mu\text{A}$ at 0h and rising to $24.8\ \mu\text{A}$ at 24h is well within spec at 24h, but its drift velocity ($+0.429\ \mu\text{A/h}$) forecasts an absolute specification breach before the 168h qualification target.

**TrustBurn AI** resolves both failure modes using an uncertainty-aware, auditable, multi-evidence screening pipeline.

---

## 2. Core Architecture: `REPRESENT → DETECT → PREDICT → TRUST → EXPLAIN`

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                 BurnIn-Bench 6-Layer Physics Generator                 │
  │     (Physics Prior, Mfg Variation, Latent State, Measurement Noise,    │
  │            Distribution Shift, Ground Truth Mechanism Store)           │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │  Staged Measurements (0h, 24h, 96h*, 168h*)
                                      ▼  [*Hidden during inference]
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. FEATURE EXTRACTION: build_early_features (Strict ≤24h Isolation)   │
  │    Inputs: val_0h, val_24h, early_slope, lot_context, quality_score   │
  └───────┬───────────────────────────┬────────────────────────────┬───────┘
          │                           │                            │
          ▼                           ▼                            ▼
  ┌───────────────┐           ┌───────────────┐           ┌────────────────┐
  │    DETECT     │           │    PREDICT    │           │     TRUST      │
  │ • Static Spec │           │ • HistGrad    │           │ • Split        │
  │ • Robust MAD  │           │   Boosting    │           │   Conformal    │
  │   Lot-Relative│           │ • Linear      │           │   90% Interval │
  │ • Isolation   │           │   Extrapol.   │           │ • Cross-Lot    │
  │   Forest      │           │   Baseline    │           │   Shift Diag   │
  └───────┬───────┘           └───────┬───────┘           └────────┬───────┘
          │                           │                            │
          └───────────────────────────┼────────────────────────────┘
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                      DETERMINISTIC DECISION ENGINE                     │
  │          Evaluates: Spec Violations, MAD Anomalies, Drift Forecast,    │
  │                 Conformal Bounds, Data Quality, Shift                  │
  │         Dispositions: PASS  |  REVIEW  |  HIGH RISK (+Reason Codes)    │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                      EXPLAIN & AUDIT PERSISTENCE                       │
  │   • Persistent SQLite Run & Decision Storage (data/trustburn_audit.db) │
  │   • Verification Action Recommender & QA Human Reviewer Notes          │
  │   • Exportable Engineering QA Audit Reports & Retrospective Sandbox   │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Strict No-Future-Leakage Policy

TrustBurn AI enforces non-negotiable structural leakage protection:
* The early feature extractor (`build_early_features`) accepts **strictly 0h and 24h measurements and legitimate historical lot context**.
* Any attempt to pass 96h, 168h, or synthetic defect ground truth labels triggers a structural `ValueError` (tested and enforced in automated test suite `backend/tests/test_leakage.py`).
* 96h and 168h measurements are completely hidden during live inference and are revealed only inside the Early Warning Lab for retrospective accuracy auditing.
* Dataset splitting is performed strictly at the **manufacturing lot level** (Train Lots, Calibration Lots, Test Lots, Shifted Test Lots). No component can exist across multiple partitions.

---

## 4. Repository Structure

```text
trustburn-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py             # FastAPI REST endpoints
│   │   ├── audit/
│   │   │   ├── __init__.py
│   │   │   └── storage.py            # SQLite persistent audit store
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   ├── generator.py          # BurnIn-Bench 6-layer physics generator
│   │   │   ├── validator.py          # CSV schema & quality parser (wide/long)
│   │   │   └── splits.py             # Strict lot-level isolation verifier
│   │   ├── decision/
│   │   │   ├── __init__.py
│   │   │   └── engine.py             # Deterministic PASS / REVIEW / HIGH RISK
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   ├── feature_pipeline.py   # Strict ≤24h early feature extraction
│   │   │   ├── anomaly_detector.py   # Static check & Robust MAD lot-relative
│   │   │   ├── forecaster.py         # HistGradientBoosting 168h drift regressor
│   │   │   ├── conformal.py          # Split conformal 90% uncertainty intervals
│   │   │   └── shift_detector.py     # Non-parametric cross-lot shift diagnostic
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── burnin.py             # Measurement & trajectory schemas
│   │   │   ├── screening.py          # Anomaly evidence, forecast, decisions
│   │   │   ├── audit.py              # Audit run & decision record schemas
│   │   │   └── api_responses.py      # Typed response DTOs
│   │   ├── main.py                   # FastAPI server entrypoint
│   │   └── state.py                  # Singleton system coordinator
│   ├── tests/
│   │   ├── test_generator.py         # Deterministic generation & CSV validation
│   │   ├── test_leakage.py           # Structural no-future-leakage tests
│   │   ├── test_anomaly.py           # 45 µA / 10 µA within-spec anomaly fixture
│   │   ├── test_forecaster.py        # Supervised 168h drift regression
│   │   ├── test_conformal.py         # Split conformal calibration & coverage
│   │   ├── test_shift.py             # Cross-lot distribution shift diagnostic
│   │   ├── test_decision.py          # Deterministic decision rules
│   │   └── test_api.py               # Live FastAPI endpoint integration tests
│   └── requirements.txt              # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts             # Typed REST API client
│   │   ├── components/
│   │   │   ├── DisclaimerBanner.tsx  # Persistent scientific honesty banner
│   │   │   ├── Header.tsx            # Navigation, scenario picker, status
│   │   │   ├── GuidedDemoModal.tsx   # 5-step interactive walkthrough tour
│   │   │   ├── UploadModal.tsx       # Drag-and-drop CSV validation & ingestion
│   │   │   ├── RegenerateModal.tsx   # Configurable seed & component count
│   │   │   └── ReportModal.tsx       # Exportable engineering QA audit report
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx      # Mission Control high-level telemetry
│   │   │   ├── ExplorerPage.tsx      # Searchable component table & filters
│   │   │   ├── ComponentIntelligencePage.tsx # Trajectory chart & evidence
│   │   │   ├── EarlyWarningLabPage.tsx # Retrospective sandbox & timeline
│   │   │   ├── QADecisionPage.tsx    # Disposition queue & reviewer notes
│   │   │   ├── ValidationPage.tsx    # Real held-out metrics & shift study
│   │   │   └── AuditTrailPage.tsx    # Historical run logs from SQLite
│   │   ├── types/
│   │   │   └── burnin.ts             # TypeScript interface definitions
│   │   ├── App.tsx                   # Main application layout & state
│   │   └── index.css                 # Aerospace console theme styling
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.app.json
│
├── data/                             # SQLite audit database & sample files
├── models/                           # Persisted model parameters
├── reports/                          # Exported QA reports
└── README.md
```

---

## 5. Local Setup & Execution (Windows PowerShell)

### Prerequisites
* Python 3.11+ (tested on Python 3.14)
* Node.js 18+ & npm (tested on Node v26)

### Step 1: Backend Setup
```powershell
# In project root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### Step 2: Start Backend Server
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Backend will start at: `http://127.0.0.1:8000`  
Swagger API Documentation: `http://127.0.0.1:8000/docs`

### Step 3: Start Frontend Dev Server
Open a second PowerShell window:
```powershell
cd frontend
npm install
npm run dev
```
Frontend will be available at: `http://localhost:5173`

---

## 6. Automated Test Suite

Run the complete test suite verifying zero data leakage, deterministic decisions, conformal coverage, and API contracts:

```powershell
python -m pytest backend/tests/ -v
```

Expected result:
```text
======================== 29 passed, 1 warning in 5.10s ========================
```

---

## 7. The Five Guaranteed Demonstration Scenarios

TrustBurn AI ships with guaranteed demonstration fixtures processed through the **same backend pipeline** as stochastic trajectories:

| Scenario | Component ID | Key Characteristics | Conventional Screening | TrustBurn Disposition | Demonstration Lesson |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Hidden Within-Spec Anomaly** | `CMP-DEMO-WITHIN-SPEC` | $45.1\ \mu\text{A}$ at 24h against $10.1\ \mu\text{A}$ lot center | **PASS** ($45.1 \le 50$) | **REVIEW** (19.7 MAD $\sigma$) | Proves absolute limits miss latent outliers. |
| **B. Early Drift Warning** | `CMP-DEMO-EARLY-DRIFT` | $14.5\ \mu\text{A} \to 24.8\ \mu\text{A}$ at 24h ($+0.429\ \mu\text{A/h}$) | **PASS** ($24.8 \le 50$) | **HIGH RISK** (Pred: $58.5\ \mu\text{A}$) | 24h forecast detects failure before 168h. |
| **C. Distribution Shift** | `CMP-DEMO-SHIFT` | Lot median shifts from $10.1\ \mu\text{A} \to 24.5\ \mu\text{A}$ | **PASS** ($25.2 \le 50$) | **REVIEW** (`SHIFT_DETECTED`) | Non-parametric shift diagnostic alerts reduced trust. |
| **D. Unreliable Measurement** | `CMP-DEMO-UNRELIABLE` | 24h measurement missing or noisy DAQ flag | Indeterminate | **REVIEW** (`POOR_QUALITY`) | System refuses to guess; requests re-test. |
| **E. Nominal Component** | `CMP-DEMO-NORMAL` | Stable $9.8\ \mu\text{A} \to 10.2\ \mu\text{A}$ within lot bounds | **PASS** | **PASS** (`NOMINAL_STABLE`) | Clean component cleared for flight screening. |

---

## 8. Guided Demo Walkthrough (3–5 Minute Sequence)

1. **Step 1 — Mission Control Overview:**
   * Open `http://localhost:5173`.
   * Observe high-level KPIs: 805 components, dynamic anomalies, and risk breakdown.
   * Review the comparison card contrasting Conventional Screening with TrustBurn Multi-Evidence Screening.

2. **Step 2 — Hidden Within-Spec Anomaly (Scenario A):**
   * Select **"Scenario: A. Hidden Within-Spec Anomaly"** from the top header or click **"Guided Demo"**.
   * Observe component `CMP-DEMO-WITHIN-SPEC`: 24h value is $45.1\ \mu\text{A}$, satisfying the $50.0\ \mu\text{A}$ spec limit.
   * Observe that TrustBurn's robust MAD engine flags it as **SEVERE OUTLIER** ($19.7\times$ MAD sigmas from the $10.1\ \mu\text{A}$ lot median).
   * Note the deterministic reason code: `REASON_LOT_RELATIVE_OUTLIER_MAD_HIGH`.

3. **Step 3 — Early Warning Lab (Scenario B):**
   * Switch to the **Early Warning Lab** tab and select `CMP-DEMO-EARLY-DRIFT`.
   * Click **"Analyze Early Signal (≤24h Only)"**.
   * Observe the timeline: 0h ($14.5\ \mu\text{A}$) and 24h ($24.8\ \mu\text{A}$) generate a projected 168h value of $\approx 58.5\ \mu\text{A}$, crossing the $50.0\ \mu\text{A}$ limit.
   * Click **"Reveal Held-Out Outcome"**. The frozen prediction is compared with the actual retrospective outcome ($62.1\ \mu\text{A}$), confirming the physical failure without any future feature leakage.

4. **Step 4 — Conformal Uncertainty & Cross-Lot Distribution Shift (Scenario C):**
   * Navigate to the **BurnIn-Bench & Validation** tab.
   * Observe the 90% Split Conformal prediction intervals ($85\%-95\%$ empirical coverage on in-distribution test lots).
   * Review the **Cross-Lot Distribution Shift Impact Experiment**: notice that when evaluating the shifted lot `LOT-2026-D-SHIFT`, empirical coverage drops. TrustBurn detects this shift via standardized median delta and scale ratios, automatically routing shifted components to **REVIEW**.

5. **Step 5 — QA Decision Center & Audit Trail:**
   * Navigate to the **QA Decision Center** tab.
   * View flagged components with their deterministic reason codes and rule-based verification recommendations.
   * Enter a reviewer note (e.g., *"Inspected probe station calibration; held for precision parameter re-test"*). Click **"Save Notes"**.
   * Click **"View Official Report"** to view and export the printable QA Audit Report with complete provenance.

---

## 9. Screen-Recording Narration Script (90–120 Seconds)

*(Speaking at a steady, professional engineering pace)*

> "Welcome to TrustBurn AI: Uncertainty-Aware Early Warning and Risk Intelligence for Component Burn-In, developed for Smart India Hackathon 2026 Problem Statement SIH26170.
>
> In aerospace qualification, electrical burn-in measurements are collected at 0h, 24h, 96h, and 168h. Conventional screening only checks if a measurement is below a fixed limit. But consider this real component in our console: Component DEMO-WITHIN-SPEC measures 45.1 microamps at 24 hours against a 50 microamp specification. Conventional screening gives it a pass. 
>
> However, its manufacturing lot has a median of 10.1 microamps and a MAD of 1.2 microamps. Relative to its lot, this part is an extreme nineteen-sigma outlier. TrustBurn’s robust peer-relative engine detects this latent defect and flags it for engineering review.
>
> Next, let’s enter the Early Warning Lab. By analyzing only the measurements available at zero and twenty-four hours, our supervised gradient boosting regressor projects the 168-hour measurement without using any post-24-hour information. For Component DEMO-EARLY-DRIFT, the early slope forecasts a breach at 58.5 microamps. When we reveal the held-out outcome, the physical measurement actually reached 62.1 microamps—confirming that early intervention could save 144 hours of test chamber time.
>
> Crucially, machine learning requires honest uncertainty. TrustBurn pairs point predictions with ninety-percent split conformal prediction intervals. Furthermore, when an incoming production lot exhibits baseline shift, our distribution shift diagnostic detects the altered statistics and issues an automated trust warning.
>
> Finally, in the QA Decision Center, every screening recommendation is one hundred percent deterministic, justified by transparent reason codes, actionable verification recommendations, and an immutable SQLite audit trail.
>
> Every burn-in trajectory becomes an evidence opportunity — TrustBurn determines what can be trusted, what remains uncertain, and what should be verified next."

---

## 10. Known Engineering Limitations

1. **Synthetic Demonstration Prior:** The current default dataset is generated by the BurnIn-Bench 6-layer physics simulator. While constrained by Arrhenius rate equations and power-law drift models, parameters do not represent certified ISRO component specifications.
2. **Conformal Exchangeability:** Conformal interval guarantees assume exchangeable calibration and test sets. Under severe cross-lot process shift, nominal coverage naturally degrades, which is why TrustBurn pairs conformal intervals with an explicit distribution-shift trust diagnostic.
3. **Discrete Stage Grid:** The current prototype evaluates standardized 0h, 24h, 96h, and 168h checkpoints. Continuous time-series streaming DAQs would require online changepoint detection.
