# CreditPulse — MSME Financial Health Card

> AI/ML-driven alternate data credit scoring for banks and MSME borrowers.
> Built for the IDBI Bank Hackathon.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CreditPulse Stack                        │
├────────────────┬──────────────────────┬────────────────────┤
│   Data Layer   │    ML Pipeline       │   Presentation     │
│                │                      │                     │
│  SQLite DB     │  Feature Eng.        │  React + Tailwind  │
│  (creditpulse  │  (5 sub-scores)      │  4 screens:        │
│  .db)          │                      │  - Dashboard       │
│                │  XGBoost Classifier  │  - Detail          │
│  5 data        │  (trained on 200     │  - Owner View      │
│  sources:      │  applicants)         │  - Admin Panel     │
│  - GST         │                      │                     │
│  - UPI         │  Blended Score:      │  FastAPI Backend   │
│  - AA Bank     │  70% deterministic   │  12 REST endpoints │
│  - EPFO        │  30% ML prob.        │                     │
│  - Applicants  │                      │  LLM Service       │
│                │  Risk Tiers:         │  (OpenAI/Anthropic │
│  200 MSMEs ×   │  Prime/Near-Prime    │  with fallback)    │
│  12 months     │  Sub-Prime/Decline   │                     │
└────────────────┴──────────────────────┴────────────────────┘
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) OpenAI or Anthropic API key for LLM features

### 1. Clone & Install Python deps

```bash
cd creditpulse
pip install -r requirements.txt
```

### 2. Generate synthetic data (Phase 1)

```bash
python data_generation/generate.py
```

Produces:
- `data_generation/applicants.csv`
- `data_generation/gst_records.csv`
- `data_generation/upi_transactions.csv`
- `data_generation/aa_bank_data.csv`
- `data_generation/epfo_records.csv`
- `data_generation/labels.csv`
- `data_generation/creditpulse.db`

### 3. Train ML model (Phase 3)

```bash
python ml/train_model.py
```

Produces:
- `ml/model_artifacts/xgb_model.pkl`
- `ml/model_artifacts/feature_importances.csv`
- `ml/model_artifacts/feature_importances.png`
- `ml/model_artifacts/model_metrics.csv`

### 4. Save features to DB

```bash
python ml/save_features.py
```

Adds `applicant_features` table to `creditpulse.db`.

### 5. Run backend

```bash
# Optional: set LLM keys
export OPENAI_API_KEY=sk-...
export LLM_PROVIDER=openai  # or "anthropic"

uvicorn backend.main:app --reload
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 6. Run frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## How to Regenerate Data

```bash
python data_generation/generate.py
python ml/train_model.py
python ml/save_features.py
```

---

## Scoring Formula

```
final_score = 0.25 × revenue_stability
            + 0.25 × cashflow_health
            + 0.20 × banking_discipline
            + 0.15 × compliance
            + 0.15 × employment_stability

blended_score = 0.70 × final_score + 0.30 × (ml_probability × 100)
```

| Score Range | Risk Tier   |
|-------------|-------------|
| ≥ 75        | Prime       |
| 55–74       | Near-Prime  |
| 35–54       | Sub-Prime   |
| < 35        | Decline     |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/applicants` | List all with scores |
| GET | `/applicants/{id}` | Full profile |
| GET | `/score/{id}` | Recompute score |
| POST | `/simulate/{id}` | What-if analysis |
| GET | `/explain/{id}` | LLM narrative |
| GET | `/explain-owner/{id}` | Owner improvement tips |
| POST | `/chat` | Grounded Q&A |
| GET | `/portfolio` | Aggregate stats |
| POST | `/consent/{id}` | Mock AA consent |
| POST | `/loan-apply/{id}` | Mock OCEN submission |
| GET | `/audit/{id}` | Scoring audit trail |

---

## Running Tests

```bash
pytest tests/test_scoring.py -v
```
