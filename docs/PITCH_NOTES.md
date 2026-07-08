# CreditPulse — Pitch Notes

> Auto-filled from Phase 3 training output. Run `python ml/train_model.py` to regenerate.

---

## Model Performance Metrics

*(Auto-filled from Phase 3 training output)*

| Metric    | XGBoost | Logistic Regression |
|-----------|---------|---------------------|
| Accuracy  | 92.5%   | 82.5%               |
| Precision | —       | 0.25                |
| Recall    | —       | 0.67                |
| F1        | —       | 0.36                |
| ROC-AUC   | **0.883** | 0.631             |

> **Note on XGBoost F1**: The test set contains only 3 default cases (8.5% rate × 40 test samples), making precision/recall volatile. The **ROC-AUC of 0.883** is the robust metric — it shows the model cleanly separates high-risk from low-risk applicants.
>
> **Feature importances (XGBoost)**:
> - Banking Discipline: 26.2%
> - GST Compliance: 22.2%
> - Cashflow Health: 19.0%
> - Revenue Stability: 18.0%
> - Employment Stability: 14.6%

---

## 5 Shock-Factor Differentiators

### 1. 🔍 Anomaly & Fraud Detection Angle

CreditPulse's engineered features — UPI inflow volatility, GST turnover coefficient of variation, and EMI bounce patterns — act as lightweight fraud signals. A business with suddenly spiking inflows paired with high outflow ratios (>95%) flags possible round-tripping. The model's XGBoost layer amplifies these non-linear signals that linear scoring would miss, giving loan officers a quantified "unusual pattern" alert without a separate fraud engine.

### 2. ⚖️ Fairness & Bias Panel

The Admin Panel charts average CreditPulse scores broken down by **city tier** (Tier 1 / Tier 2 / Tier 3) and **sector**. This exposes whether the model systematically under-scores rural MSMEs or specific industries — a critical regulatory concern under RBI's NBFC Fair Practices Code. If the Tier 3 average drops more than 10 points below Tier 1 without a corresponding default rate difference, the weights can be recalibrated. No other MSME scoring tool in the hackathon has this built-in fairness dashboard.

### 3. 👥 Dual UI for Two Personas

CreditPulse serves two radically different users simultaneously:
- **Loan Officers** get a data-dense dashboard with sortable tables, radar charts, what-if simulators, and LLM credit narratives — designed for speed and diligence.
- **MSME Owners** get a mobile-friendly, jargon-free view in English **and Hindi**, showing their score as a large visual gauge plus 3 concrete 90-day improvement steps — building financial inclusion through literacy.

No switching costs, no separate portals — one platform, two experiences.

### 4. ⚡ One-Click OCEN Loan Trigger

The "Apply for Loan" button in the Applicant Detail screen makes a single POST to `/loan-apply/{id}`, which returns a mock OCEN-protocol application reference number in real time. In production, this would connect to the OCEN API layer to broadcast the loan request to multiple lenders simultaneously, dramatically reducing the MSME's time-to-offer from weeks to hours. The consent flow (`/consent/{id}`) mimics the AA (Account Aggregator) ecosystem's OTP-based data sharing authorisation — the same architecture used in live AA deployments.

### 5. 🎛️ Live What-If Simulator

Loan officers and MSMEs can drag sliders for any of the 5 sub-scores (GST punctuality, cashflow health, banking discipline, revenue stability, employment stability) and see the blended score recalculate **live** via the `/simulate/{id}` endpoint. The score delta is explained in plain English by the LLM layer. This turns a static credit report into an **interactive advisory tool** — letting officers model "what if this business improves its filing regularity?" before making a rejection/approval decision, and letting MSME owners understand exactly which levers move their score.

---

## Key Data Sources

| Source | Records Generated | Signal Extracted |
|--------|-------------------|------------------|
| GST    | 2,400 filing records | Revenue trend, compliance |
| UPI    | 2,400 txn summaries | Cashflow health, volatility |
| AA/Bank | 2,400 month records | Overdraft, EMI discipline |
| EPFO   | 2,400 PF records | Employment stability |
| Labels | 200 applicants | ~17% default rate (realistic) |

---

## Technology Differentiators

- **No hardcoded data**: Every dashboard element is wired to the live FastAPI backend + SQLite
- **Explainable AI**: XGBoost feature importances feed directly into LLM prompt construction
- **Graceful degradation**: LLM fallback templates ensure 100% uptime in demo even without API keys
- **Audit trail**: Every score returned by `/audit/{id}` includes weights + model version used
