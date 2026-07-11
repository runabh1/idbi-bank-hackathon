"""
CreditPulse - FastAPI Backend (Phase 4)
All endpoints return real data from SQLite via SQLAlchemy.
"""

import os
import sys
import json
import uuid
import random
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List

# Load .env file
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).parent.parent / ".env"
    load_dotenv(_env_path)
except ImportError:
    pass

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import sqlite3

# ── Path setup ───────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data_generation" / "creditpulse.db"
sys.path.insert(0, str(ROOT / "ml"))
sys.path.insert(0, str(ROOT / "backend"))

from scoring_engine import compute_score
from llm_service import (
    explain_for_loan_officer,
    improvement_tips_for_owner,
    whatif_explanation,
    grounded_chat,
)

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CreditPulse API",
    description="AI/ML-driven MSME Financial Health Card - IDBI Hackathon",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("creditpulse")


# ── DB helper ────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def _dict_from_row(row):
    return dict(row) if row else None


def _score_applicant(aid: int, conn) -> dict:
    """Compute score for an applicant and return full result dict."""
    row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (aid,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Applicant {aid} not found")

    app_data = dict(row)

    # Get features (from features table if available, else compute)
    try:
        feat = conn.execute(
            """SELECT revenue_stability_score, cashflow_health_score,
                      banking_discipline_score, compliance_score,
                      employment_stability_score,
                      gst_avg_delay_days, upi_inflow_volatility,
                      aa_avg_overdraft_days, epfo_on_time_pct,
                      upi_avg_inflow, upi_avg_outflow, aa_avg_balance,
                      aa_total_emi_bounces, gst_on_time_pct, gst_turnover_trend,
                      aa_vendor_regularity, epfo_emp_trend_pct
               FROM applicant_features WHERE applicant_id = ?""",
            (aid,)
        ).fetchone()
        if feat is None:
            raise Exception("No feature row")
        features = dict(feat)
    except Exception:
        # Fallback: use neutral defaults
        features = {
            "revenue_stability_score": 50,
            "cashflow_health_score": 50,
            "banking_discipline_score": 50,
            "compliance_score": 50,
            "employment_stability_score": 50,
            "gst_avg_delay_days": 5,
            "upi_inflow_volatility": 0.1,
            "aa_avg_overdraft_days": 2,
            "epfo_on_time_pct": 90,
        }

    result = compute_score(
        applicant_id=aid,
        revenue_stability=features["revenue_stability_score"],
        cashflow_health=features["cashflow_health_score"],
        banking_discipline=features["banking_discipline_score"],
        compliance=features["compliance_score"],
        employment_stability=features["employment_stability_score"],
    )

    return {**app_data, **features, **result.to_dict()}


# ── Pydantic models ──────────────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    feature_name: str
    new_value: float


class ChatRequest(BaseModel):
    applicant_id: int
    question: str


class ConsentResponse(BaseModel):
    consent_token: str
    timestamp: str
    status: str
    message: str


class LoanApplyResponse(BaseModel):
    application_reference_id: str
    timestamp: str
    status: str
    message: str


class LoginRequest(BaseModel):
    userid: str
    password: str

@app.post("/auth/login")
def login(req: LoginRequest):
    cred_file = ROOT / "data_generation" / "user_credentials.csv"
    if not cred_file.exists():
        raise HTTPException(status_code=500, detail="Credentials file not found")
    
    df = pd.read_csv(cred_file)
    # Using 'email' column as userid for matching
    df['email'] = df['email'].astype(str)
    df['password'] = df['password'].astype(str)
    
    user_matches = df[(df['email'] == req.userid) & (df['password'] == req.password)]
    if user_matches.empty:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    u = user_matches.iloc[0]
    return {
        "id": str(u['applicant_id']),
        "name": str(u['business_name']),
        "role": str(u['role'])
    }

# ═══════════════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"service": "CreditPulse API", "version": "1.0.0", "status": "healthy"}


@app.get("/applicants")
def list_applicants(conn=Depends(get_db)):
    """List all applicants with score, risk tier, sector, region."""
    rows = conn.execute(
        """SELECT a.applicant_id, a.business_name, a.sector, a.region, a.tier,
                  a.entity_type, a.years_in_business, a.defaulted_12m,
                  f.revenue_stability_score, f.cashflow_health_score,
                  f.banking_discipline_score, f.compliance_score,
                  f.employment_stability_score
           FROM applicants a
           LEFT JOIN applicant_features f ON a.applicant_id = f.applicant_id
           ORDER BY a.applicant_id"""
    ).fetchall()

    result = []
    for row in rows:
        d = dict(row)
        score_r = compute_score(
            applicant_id=d["applicant_id"],
            revenue_stability=d.get("revenue_stability_score") or 50,
            cashflow_health=d.get("cashflow_health_score") or 50,
            banking_discipline=d.get("banking_discipline_score") or 50,
            compliance=d.get("compliance_score") or 50,
            employment_stability=d.get("employment_stability_score") or 50,
        )
        d["blended_score"] = score_r.blended_score
        d["risk_tier"] = score_r.risk_tier
        result.append(d)

    return result


@app.get("/applicants/{applicant_id}")
def get_applicant(applicant_id: int, conn=Depends(get_db)):
    """Full profile + all sub-scores + raw features."""
    row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    app_data = dict(row)

    feat_row = conn.execute(
        "SELECT * FROM applicant_features WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()

    if feat_row:
        features = dict(feat_row)
    else:
        features = {col: 50 for col in [
            "revenue_stability_score", "cashflow_health_score",
            "banking_discipline_score", "compliance_score",
            "employment_stability_score", "gst_avg_delay_days",
            "upi_inflow_volatility", "aa_avg_overdraft_days", "epfo_on_time_pct",
            "upi_avg_inflow", "upi_avg_outflow", "aa_avg_balance",
            "aa_total_emi_bounces", "gst_on_time_pct", "gst_turnover_trend",
            "aa_vendor_regularity", "epfo_emp_trend_pct"
        ]}

    score_r = compute_score(
        applicant_id=applicant_id,
        revenue_stability=features.get("revenue_stability_score", 50),
        cashflow_health=features.get("cashflow_health_score", 50),
        banking_discipline=features.get("banking_discipline_score", 50),
        compliance=features.get("compliance_score", 50),
        employment_stability=features.get("employment_stability_score", 50),
    )

    return {**app_data, **features, **score_r.to_dict()}


@app.get("/score/{applicant_id}")
def get_score(applicant_id: int, conn=Depends(get_db)):
    """Recompute and return current score breakdown."""
    row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    feat_row = conn.execute(
        "SELECT * FROM applicant_features WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()

    features = dict(feat_row) if feat_row else {}

    score_r = compute_score(
        applicant_id=applicant_id,
        revenue_stability=features.get("revenue_stability_score", 50),
        cashflow_health=features.get("cashflow_health_score", 50),
        banking_discipline=features.get("banking_discipline_score", 50),
        compliance=features.get("compliance_score", 50),
        employment_stability=features.get("employment_stability_score", 50),
    )
    return score_r.to_dict()


@app.post("/simulate/{applicant_id}")
def simulate(applicant_id: int, req: SimulateRequest, conn=Depends(get_db)):
    """What-if: change one feature, return new score + delta."""
    feat_row = conn.execute(
        "SELECT * FROM applicant_features WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()

    if not feat_row:
        raise HTTPException(status_code=404, detail="Features not found. Run training first.")

    features = dict(feat_row)

    # Map API feature names to score dimensions
    FEATURE_MAP = {
        "gst_filing_punctuality": "compliance_score",
        "compliance_score": "compliance_score",
        "upi_inflow": "cashflow_health_score",
        "cashflow_health_score": "cashflow_health_score",
        "overdraft_days": "banking_discipline_score",
        "banking_discipline_score": "banking_discipline_score",
        "revenue_stability_score": "revenue_stability_score",
        "employment_stability_score": "employment_stability_score",
    }

    target_key = FEATURE_MAP.get(req.feature_name, req.feature_name)

    # Original score
    orig = compute_score(
        applicant_id=applicant_id,
        revenue_stability=features.get("revenue_stability_score", 50),
        cashflow_health=features.get("cashflow_health_score", 50),
        banking_discipline=features.get("banking_discipline_score", 50),
        compliance=features.get("compliance_score", 50),
        employment_stability=features.get("employment_stability_score", 50),
    )

    # Simulated features
    sim_features = {
        "revenue_stability": features.get("revenue_stability_score", 50),
        "cashflow_health": features.get("cashflow_health_score", 50),
        "banking_discipline": features.get("banking_discipline_score", 50),
        "compliance": features.get("compliance_score", 50),
        "employment_stability": features.get("employment_stability_score", 50),
    }

    # Map to kwarg name
    kwarg_map = {
        "revenue_stability_score": "revenue_stability",
        "cashflow_health_score": "cashflow_health",
        "banking_discipline_score": "banking_discipline",
        "compliance_score": "compliance",
        "employment_stability_score": "employment_stability",
    }
    if target_key in kwarg_map:
        sim_features[kwarg_map[target_key]] = req.new_value

    simulated = compute_score(applicant_id=applicant_id, **sim_features)
    delta = simulated.blended_score - orig.blended_score

    # LLM explanation
    explanation = whatif_explanation({
        "original_features": {k: features.get(v + "_score", features.get(v, 50))
                               for k, v in kwarg_map.items()},
        "changed_feature": req.feature_name,
        "new_value": req.new_value,
        "delta": round(delta, 2),
    })

    return {
        "applicant_id": applicant_id,
        "original_score": orig.blended_score,
        "simulated_score": simulated.blended_score,
        "delta": round(delta, 2),
        "original_tier": orig.risk_tier,
        "simulated_tier": simulated.risk_tier,
        "changed_feature": req.feature_name,
        "new_value": req.new_value,
        "explanation": explanation,
        "simulated_breakdown": simulated.to_dict(),
    }


@app.get("/explain/{applicant_id}")
def explain(applicant_id: int, conn=Depends(get_db)):
    """LLM narrative explanation for loan officer."""
    app_row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not app_row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    feat_row = conn.execute(
        "SELECT * FROM applicant_features WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()

    app_data = dict(app_row)
    features = dict(feat_row) if feat_row else {}

    score_r = compute_score(
        applicant_id=applicant_id,
        revenue_stability=features.get("revenue_stability_score", 50),
        cashflow_health=features.get("cashflow_health_score", 50),
        banking_discipline=features.get("banking_discipline_score", 50),
        compliance=features.get("compliance_score", 50),
        employment_stability=features.get("employment_stability_score", 50),
    )

    llm_data = {
        **app_data,
        **features,
        "final_score": round(score_r.blended_score, 2),
        "risk_tier": score_r.risk_tier,
    }

    narrative = explain_for_loan_officer(llm_data)
    return {
        "applicant_id": applicant_id,
        "business_name": app_data.get("business_name"),
        "narrative": narrative,
        "score": round(score_r.blended_score, 2),
        "risk_tier": score_r.risk_tier,
    }


@app.get("/explain-owner/{applicant_id}")
def explain_owner(applicant_id: int, conn=Depends(get_db)):
    """LLM narrative + improvement tips for MSME owner."""
    app_row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not app_row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    feat_row = conn.execute(
        "SELECT * FROM applicant_features WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()

    app_data = dict(app_row)
    features = dict(feat_row) if feat_row else {}

    score_r = compute_score(
        applicant_id=applicant_id,
        revenue_stability=features.get("revenue_stability_score", 50),
        cashflow_health=features.get("cashflow_health_score", 50),
        banking_discipline=features.get("banking_discipline_score", 50),
        compliance=features.get("compliance_score", 50),
        employment_stability=features.get("employment_stability_score", 50),
    )

    llm_data = {
        **app_data,
        **features,
        "final_score": round(score_r.blended_score, 2),
        "risk_tier": score_r.risk_tier,
    }

    tips = improvement_tips_for_owner(llm_data)
    return {
        "applicant_id": applicant_id,
        "business_name": app_data.get("business_name"),
        "tips": tips,
        "score": round(score_r.blended_score, 2),
        "risk_tier": score_r.risk_tier,
        "breakdown": score_r.to_dict(),
    }


@app.post("/chat")
def chat(req: ChatRequest, conn=Depends(get_db)):
    """Grounded LLM Q&A about a specific applicant."""
    app_row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (req.applicant_id,)
    ).fetchone()
    if not app_row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    feat_row = conn.execute(
        "SELECT * FROM applicant_features WHERE applicant_id = ?", (req.applicant_id,)
    ).fetchone()

    app_data = dict(app_row)
    features = dict(feat_row) if feat_row else {}

    score_r = compute_score(
        applicant_id=req.applicant_id,
        revenue_stability=features.get("revenue_stability_score", 50),
        cashflow_health=features.get("cashflow_health_score", 50),
        banking_discipline=features.get("banking_discipline_score", 50),
        compliance=features.get("compliance_score", 50),
        employment_stability=features.get("employment_stability_score", 50),
    )

    context = {
        **app_data,
        **features,
        "final_score": round(score_r.blended_score, 2),
        "risk_tier": score_r.risk_tier,
    }

    answer = grounded_chat(context, req.question)
    return {
        "applicant_id": req.applicant_id,
        "question": req.question,
        "answer": answer,
    }


@app.get("/portfolio")
def portfolio(conn=Depends(get_db)):
    """Aggregated stats: score distribution, risk tiers, sector/region breakdown."""
    rows = conn.execute(
        """SELECT a.applicant_id, a.sector, a.region, a.tier, a.entity_type,
                  f.revenue_stability_score, f.cashflow_health_score,
                  f.banking_discipline_score, f.compliance_score,
                  f.employment_stability_score
           FROM applicants a
           LEFT JOIN applicant_features f ON a.applicant_id = f.applicant_id"""
    ).fetchall()

    all_scores = []
    tier_counts = {"Prime": 0, "Near-Prime": 0, "Sub-Prime": 0, "Decline": 0}
    sector_scores = {}
    region_scores = {}

    for row in rows:
        d = dict(row)
        sr = compute_score(
            applicant_id=d["applicant_id"],
            revenue_stability=d.get("revenue_stability_score") or 50,
            cashflow_health=d.get("cashflow_health_score") or 50,
            banking_discipline=d.get("banking_discipline_score") or 50,
            compliance=d.get("compliance_score") or 50,
            employment_stability=d.get("employment_stability_score") or 50,
        )
        score = sr.blended_score
        tier = sr.risk_tier
        all_scores.append(score)
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

        sec = d.get("sector", "unknown")
        sector_scores.setdefault(sec, []).append(score)

        reg = d.get("tier", "unknown")
        region_scores.setdefault(reg, []).append(score)

    avg_by_sector = {k: round(sum(v) / len(v), 2) for k, v in sector_scores.items()}
    avg_by_region = {k: round(sum(v) / len(v), 2) for k, v in region_scores.items()}

    # Score distribution buckets (0-10, 10-20, ... 90-100)
    import numpy as np
    hist, bin_edges = np.histogram(all_scores, bins=10, range=(0, 100))
    distribution = [
        {"range": f"{int(bin_edges[i])}-{int(bin_edges[i+1])}", "count": int(hist[i])}
        for i in range(len(hist))
    ]

    # Load model metrics if available
    metrics_path = ROOT / "ml" / "model_artifacts" / "model_metrics.csv"
    model_metrics = None
    if metrics_path.exists():
        try:
            m = pd.read_csv(metrics_path)
            model_metrics = m.to_dict(orient="records")
        except Exception:
            pass

    return {
        "total_applicants": len(all_scores),
        "avg_score": round(sum(all_scores) / len(all_scores), 2) if all_scores else 0,
        "tier_distribution": tier_counts,
        "score_distribution": distribution,
        "avg_score_by_sector": avg_by_sector,
        "avg_score_by_region": avg_by_region,
        "model_metrics": model_metrics,
    }


@app.post("/consent/{applicant_id}")
def consent(applicant_id: int, conn=Depends(get_db)):
    """Mock AA consent flow."""
    row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    token = f"AA-{uuid.uuid4().hex[:16].upper()}"
    ts = datetime.utcnow().isoformat() + "Z"

    # Log to consent_log table
    conn.execute(
        """CREATE TABLE IF NOT EXISTS consent_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            applicant_id INTEGER,
            consent_token TEXT,
            timestamp TEXT,
            status TEXT
        )"""
    )
    conn.execute(
        "INSERT INTO consent_log (applicant_id, consent_token, timestamp, status) VALUES (?,?,?,?)",
        (applicant_id, token, ts, "GRANTED")
    )
    conn.commit()

    return ConsentResponse(
        consent_token=token,
        timestamp=ts,
        status="GRANTED",
        message=f"AA consent granted for applicant {applicant_id}. Data fetch authorised for 24 hours.",
    )


@app.post("/loan-apply/{applicant_id}")
def loan_apply(applicant_id: int, conn=Depends(get_db)):
    """Mock OCEN loan application submission."""
    row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    ref_id = f"OCEN-CP-{uuid.uuid4().hex[:10].upper()}"
    ts = datetime.utcnow().isoformat() + "Z"

    return LoanApplyResponse(
        application_reference_id=ref_id,
        timestamp=ts,
        status="SUBMITTED",
        message=f"Loan application submitted via OCEN protocol. Reference: {ref_id}",
    )


@app.get("/audit/{applicant_id}")
def audit(applicant_id: int, conn=Depends(get_db)):
    """Return feature weights + model version used for last score."""
    from scoring_engine import WEIGHTS, BLEND_DETERMINISTIC, BLEND_ML, MODEL_PATH
    return {
        "applicant_id": applicant_id,
        "weights": WEIGHTS,
        "blend": {
            "deterministic": BLEND_DETERMINISTIC,
            "ml": BLEND_ML,
        },
        "model_version": "xgb_v1.0",
        "model_path": str(MODEL_PATH),
        "model_trained": MODEL_PATH.exists(),
        "scoring_version": "1.0.0",
    }




@app.get("/trend/{applicant_id}")
def trend(applicant_id: int, conn=Depends(get_db)):
    """Return 12-month score trend computed from real monthly DB data."""
    row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    import numpy as np
    from feature_engineering import (
        revenue_stability_score, cashflow_health_score,
        banking_discipline_score, compliance_score, employment_stability_score,
    )
    from scoring_engine import compute_score as _compute_score

    # Load monthly raw data for this applicant
    gst = pd.read_sql(
        "SELECT * FROM gst_records WHERE applicant_id=? ORDER BY year,month",
        conn, params=(applicant_id,)
    )
    upi = pd.read_sql(
        "SELECT * FROM upi_transactions WHERE applicant_id=? ORDER BY year,month",
        conn, params=(applicant_id,)
    )
    aa = pd.read_sql(
        "SELECT * FROM aa_bank_data WHERE applicant_id=? ORDER BY year,month",
        conn, params=(applicant_id,)
    )
    epfo = pd.read_sql(
        "SELECT * FROM epfo_records WHERE applicant_id=? ORDER BY year,month",
        conn, params=(applicant_id,)
    )

    if gst.empty:
        raise HTTPException(status_code=404, detail="No monthly data found")

    months = sorted(gst[["year", "month"]].drop_duplicates().values.tolist())
    trend_data = []

    for i, (yr, mo) in enumerate(months):
        # Slice data up to and including this month (cumulative window)
        g_slice = gst[(gst["year"] < yr) | ((gst["year"] == yr) & (gst["month"] <= mo))]
        u_slice = upi[(upi["year"] < yr) | ((upi["year"] == yr) & (upi["month"] <= mo))]
        a_slice = aa[(aa["year"] < yr) | ((aa["year"] == yr) & (aa["month"] <= mo))]
        e_slice = epfo[(epfo["year"] < yr) | ((epfo["year"] == yr) & (epfo["month"] <= mo))]

        if len(g_slice) < 1:
            continue

        try:
            rev = float(revenue_stability_score(g_slice).get(applicant_id, 50))
            cash = float(cashflow_health_score(u_slice).get(applicant_id, 50))
            bank = float(banking_discipline_score(a_slice).get(applicant_id, 50))
            comp = float(compliance_score(g_slice).get(applicant_id, 50))
            emp = float(employment_stability_score(e_slice).get(applicant_id, 50))
        except Exception:
            rev = cash = bank = comp = emp = 50.0

        score_r = _compute_score(
            applicant_id=applicant_id,
            revenue_stability=rev, cashflow_health=cash,
            banking_discipline=bank, compliance=comp, employment_stability=emp,
        )

        month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        trend_data.append({
            "month": month_names[mo - 1],
            "year": yr,
            "month_idx": i,
            "score": round(score_r.blended_score, 1),
            "revenue_stability": round(rev, 1),
            "cashflow_health": round(cash, 1),
            "banking_discipline": round(bank, 1),
            "compliance": round(comp, 1),
            "employment_stability": round(emp, 1),
        })

    return trend_data


@app.get("/rewind/{applicant_id}")
def rewind(applicant_id: int, conn=Depends(get_db)):
    """
    CreditPulse Time Machine:
    Returns real monthly score history + early-warning detection.
    For defaulted applicants, finds the month where the model's
    risk probability first crossed 0.5, and reports months_early_warning.
    """
    import numpy as np
    import joblib as _joblib
    from feature_engineering import (
        revenue_stability_score, cashflow_health_score,
        banking_discipline_score, compliance_score, employment_stability_score,
    )

    app_row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not app_row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    app_data = dict(app_row)
    defaulted = int(app_data.get("defaulted_12m", 0))

    # Get the full trend (real monthly data)
    trend_response = trend(applicant_id, conn)
    if not trend_response:
        raise HTTPException(status_code=404, detail="No trend data")

    # Load ML model + threshold for risk probability
    MODEL_PATH = ROOT / "ml" / "model_artifacts" / "xgb_model.pkl"
    THRESH_PATH = ROOT / "ml" / "model_artifacts" / "threshold.json"

    model = None
    threshold = 0.35  # sensible default for imbalanced credit data
    if MODEL_PATH.exists():
        try:
            import joblib
            model = joblib.load(MODEL_PATH)
        except Exception:
            pass
    if THRESH_PATH.exists():
        try:
            import json as _json
            with open(THRESH_PATH) as f:
                threshold = _json.load(f).get("threshold", 0.35)
        except Exception:
            pass

    FEATURES = [
        "revenue_stability_score", "cashflow_health_score",
        "banking_discipline_score", "compliance_score",
        "employment_stability_score",
        "gst_avg_delay_days", "upi_inflow_volatility",
        "aa_avg_overdraft_days", "aa_total_emi_bounces",
        "epfo_on_time_pct", "upi_avg_inflow",
    ]

    # Load raw features for this applicant (for non-score dimensions)
    feat_row = conn.execute(
        "SELECT * FROM applicant_features WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    base_features = dict(feat_row) if feat_row else {}

    # Compute risk_prob at each month from the score trajectory
    risk_crossing_month = None
    months_early_warning = 0
    history = []

    for i, pt in enumerate(trend_response):
        score = pt["score"]
        # Approx risk prob from score: invert the score (higher score = lower risk)
        # If model available, build feature vector
        risk_prob = None
        if model is not None:
            try:
                feat_vec = np.array([[
                    pt.get("revenue_stability", 50),
                    pt.get("cashflow_health", 50),
                    pt.get("banking_discipline", 50),
                    pt.get("compliance", 50),
                    pt.get("employment_stability", 50),
                    float(base_features.get("gst_avg_delay_days", 5)),
                    float(base_features.get("upi_inflow_volatility", 0.1)),
                    float(base_features.get("aa_avg_overdraft_days", 2)),
                    float(base_features.get("aa_total_emi_bounces", 0)),
                    float(base_features.get("epfo_on_time_pct", 90)),
                    float(base_features.get("upi_avg_inflow", 300000)),
                ]])
                risk_prob = float(model.predict_proba(feat_vec)[0, 1])
            except Exception:
                risk_prob = round((100 - score) / 100, 3)
        else:
            risk_prob = round((100 - score) / 100, 3)

        crossed = risk_prob >= threshold
        if defaulted and crossed and risk_crossing_month is None:
            risk_crossing_month = i
            months_early_warning = len(trend_response) - 1 - i

        history.append({
            **pt,
            "risk_prob": round(risk_prob, 3),
            "risk_crossed": crossed,
        })

    return {
        "applicant_id": applicant_id,
        "business_name": app_data.get("business_name"),
        "defaulted_12m": defaulted,
        "threshold_used": round(threshold, 2),
        "history": history,
        "risk_crossing_month_idx": risk_crossing_month,
        "months_early_warning": months_early_warning,
        "total_months": len(history),
    }


@app.get("/montecarlo/{applicant_id}")
def montecarlo(applicant_id: int, n_sims: int = 500, horizon: int = 12, conn=Depends(get_db)):
    """
    Monte Carlo forward projection.
    Fits a geometric random walk (drift + volatility) from the historical
    score trajectory, then runs n_sims simulations for `horizon` months.
    Returns median, P10, P25, P75, P90 per future month.
    """
    import numpy as np

    row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    # Get historical trend (real monthly data)
    trend_response = trend(applicant_id, conn)
    if not trend_response:
        raise HTTPException(status_code=404, detail="No trend data")

    scores = np.array([pt["score"] for pt in trend_response])
    last_score = scores[-1]

    # Fit drift and volatility from historical monthly changes
    if len(scores) >= 3:
        monthly_changes = np.diff(scores)
        drift = float(np.mean(monthly_changes))
        vol = float(np.std(monthly_changes))
    else:
        drift = 0.0
        vol = 3.0

    # Clamp vol to reasonable range
    vol = max(1.5, min(vol, 8.0))

    # Run Monte Carlo simulations
    np.random.seed(applicant_id * 7)
    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    all_paths = np.zeros((n_sims, horizon))

    for sim in range(n_sims):
        s = last_score
        for t in range(horizon):
            shock = np.random.normal(drift, vol)
            s = float(np.clip(s + shock, 0, 100))
            all_paths[sim, t] = s

    # Compute summary statistics per month
    future_months = []
    last_hist_month_idx = trend_response[-1]["month_idx"]
    last_month_name = trend_response[-1]["month"]
    last_year = trend_response[-1]["year"]

    # Figure out next months after the data ends
    month_names_list = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    last_mo_idx_in_year = month_names_list.index(last_month_name)

    for t in range(horizon):
        mo_idx = (last_mo_idx_in_year + t + 1) % 12
        yr_offset = (last_mo_idx_in_year + t + 1) // 12
        col = all_paths[:, t]
        future_months.append({
            "month": month_names_list[mo_idx],
            "year": last_year + yr_offset,
            "month_idx": last_hist_month_idx + t + 1,
            "p10": round(float(np.percentile(col, 10)), 1),
            "p25": round(float(np.percentile(col, 25)), 1),
            "median": round(float(np.median(col)), 1),
            "p75": round(float(np.percentile(col, 75)), 1),
            "p90": round(float(np.percentile(col, 90)), 1),
        })

    return {
        "applicant_id": applicant_id,
        "last_known_score": round(float(last_score), 1),
        "drift_per_month": round(drift, 2),
        "volatility_per_month": round(vol, 2),
        "n_simulations": n_sims,
        "horizon_months": horizon,
        "history": [{"month": pt["month"], "year": pt["year"],
                     "month_idx": pt["month_idx"], "score": pt["score"]}
                    for pt in trend_response],
        "projections": future_months,
    }


@app.get("/committee/{applicant_id}")
def committee(applicant_id: int, refresh: bool = False, conn=Depends(get_db)):
    """AI Credit Committee — 4 agents debate the applicant, chair gives final verdict.
    
    Results are cached per applicant in committee_cache table.
    Pass ?refresh=true to force regeneration (uses API quota).
    """
    import time
    from llm_service import credit_committee

    app_row = conn.execute(
        "SELECT * FROM applicants WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()
    if not app_row:
        raise HTTPException(status_code=404, detail="Applicant not found")

    # ── Ensure cache table exists ───────────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS committee_cache (
            applicant_id INTEGER PRIMARY KEY,
            risk_officer TEXT,
            growth_officer TEXT,
            compliance_officer TEXT,
            chair_decision TEXT,
            generated_at TEXT,
            duration_seconds REAL
        )
    """)
    conn.commit()

    # ── Return cached result if available and not forcing refresh ──────────
    if not refresh:
        cached = conn.execute(
            "SELECT * FROM committee_cache WHERE applicant_id = ?", (applicant_id,)
        ).fetchone()
        if cached:
            cached_d = dict(cached)
            logger.info(f"Committee cache HIT for applicant {applicant_id} (generated {cached_d.get('generated_at')})")
            return {
                "applicant_id": applicant_id,
                "business_name": dict(app_row).get("business_name"),
                "risk_tier": dict(app_row).get("risk_tier", "Unknown"),
                "final_score": None,
                "risk_officer": cached_d["risk_officer"],
                "growth_officer": cached_d["growth_officer"],
                "compliance_officer": cached_d["compliance_officer"],
                "chair_decision": cached_d["chair_decision"],
                "cached": True,
                "generated_at": cached_d.get("generated_at"),
                "duration_seconds": cached_d.get("duration_seconds"),
            }

    feat_row = conn.execute(
        "SELECT * FROM applicant_features WHERE applicant_id = ?", (applicant_id,)
    ).fetchone()

    app_data = dict(app_row)
    features = dict(feat_row) if feat_row else {}

    score_r = compute_score(
        applicant_id=applicant_id,
        revenue_stability=features.get("revenue_stability_score", 50),
        cashflow_health=features.get("cashflow_health_score", 50),
        banking_discipline=features.get("banking_discipline_score", 50),
        compliance=features.get("compliance_score", 50),
        employment_stability=features.get("employment_stability_score", 50),
    )

    full_data = {
        **app_data,
        **features,
        "final_score": round(score_r.blended_score, 2),
        "risk_tier": score_r.risk_tier,
    }

    # ── Call LLM committee (3 specialists concurrent + chair) ────────────
    t0 = time.time()
    result = credit_committee(full_data)
    duration = round(time.time() - t0, 2)
    generated_at = datetime.utcnow().isoformat() + "Z"

    logger.info(f"Committee generated for applicant {applicant_id} in {duration}s")

    # ── Cache the result ─────────────────────────────────────────────────
    conn.execute("""
        INSERT OR REPLACE INTO committee_cache
            (applicant_id, risk_officer, growth_officer, compliance_officer,
             chair_decision, generated_at, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        applicant_id,
        result["risk_officer"],
        result["growth_officer"],
        result["compliance_officer"],
        result["chair_decision"],
        generated_at,
        duration,
    ))
    conn.commit()

    return {
        "applicant_id": applicant_id,
        "business_name": app_data.get("business_name"),
        "risk_tier": score_r.risk_tier,
        "final_score": round(score_r.blended_score, 2),
        **result,
        "cached": False,
        "generated_at": generated_at,
        "duration_seconds": duration,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


