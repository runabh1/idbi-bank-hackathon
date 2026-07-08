"""
CreditPulse - Scoring Engine (Phase 2)
Deterministic weighted formula + ML-blended score + risk tier logic.
Pure functions - unit-testable.
"""

from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import joblib
import numpy as np

MODEL_PATH = Path(__file__).parent / "model_artifacts" / "xgb_model.ubj"
MODEL_PATH_PKL = Path(__file__).parent / "model_artifacts" / "xgb_model.pkl"  # legacy fallback

# Weight config (must sum to 1.0)
WEIGHTS = {
    "revenue_stability": 0.25,
    "cashflow_health": 0.25,
    "banking_discipline": 0.20,
    "compliance": 0.15,
    "employment_stability": 0.15,
}

BLEND_DETERMINISTIC = 0.70
BLEND_ML = 0.30

# Features the ML model was trained on (11 features — must match exactly)
ML_FEATURES = [
    "revenue_stability_score",
    "cashflow_health_score",
    "banking_discipline_score",
    "compliance_score",
    "employment_stability_score",
    "gst_avg_delay_days",
    "upi_inflow_volatility",
    "aa_avg_overdraft_days",
    "aa_total_emi_bounces",
    "epfo_on_time_pct",
    "upi_avg_inflow",
]


@dataclass
class ScoreResult:
    applicant_id: int
    revenue_stability_score: float
    cashflow_health_score: float
    banking_discipline_score: float
    compliance_score: float
    employment_stability_score: float
    deterministic_score: float
    ml_probability: Optional[float]
    blended_score: float
    risk_tier: str

    def to_dict(self):
        return {
            "applicant_id": self.applicant_id,
            "revenue_stability_score": round(self.revenue_stability_score, 2),
            "cashflow_health_score": round(self.cashflow_health_score, 2),
            "banking_discipline_score": round(self.banking_discipline_score, 2),
            "compliance_score": round(self.compliance_score, 2),
            "employment_stability_score": round(self.employment_stability_score, 2),
            "deterministic_score": round(self.deterministic_score, 2),
            "ml_probability": round(self.ml_probability, 4) if self.ml_probability is not None else None,
            "blended_score": round(self.blended_score, 2),
            "risk_tier": self.risk_tier,
        }


def compute_deterministic_score(
    revenue_stability: float,
    cashflow_health: float,
    banking_discipline: float,
    compliance: float,
    employment_stability: float,
) -> float:
    """
    Weighted deterministic score (0-100).
    All input sub-scores must be in [0, 100].
    """
    score = (
        WEIGHTS["revenue_stability"] * revenue_stability +
        WEIGHTS["cashflow_health"] * cashflow_health +
        WEIGHTS["banking_discipline"] * banking_discipline +
        WEIGHTS["compliance"] * compliance +
        WEIGHTS["employment_stability"] * employment_stability
    )
    return float(np.clip(score, 0, 100))


def assign_risk_tier(score: float) -> str:
    """Map blended score to risk tier."""
    if score >= 75:
        return "Prime"
    elif score >= 55:
        return "Near-Prime"
    elif score >= 35:
        return "Sub-Prime"
    else:
        return "Decline"


def _load_model():
    """
    Load XGBoost model. Tries native .ubj format first (no sklearn needed),
    falls back to joblib .pkl for backward compatibility.
    """
    if MODEL_PATH.exists():
        try:
            import xgboost as xgb
            booster = xgb.Booster()
            booster.load_model(str(MODEL_PATH))
            return booster
        except Exception:
            pass
    if MODEL_PATH_PKL.exists():
        try:
            return joblib.load(MODEL_PATH_PKL)
        except Exception:
            pass
    return None


_MODEL = None  # lazy-loaded singleton


def compute_score(
    applicant_id: int,
    revenue_stability: float,
    cashflow_health: float,
    banking_discipline: float,
    compliance: float,
    employment_stability: float,
    # Extra raw features for the 11-feature ML model (with sensible defaults)
    gst_avg_delay_days: float = 5.0,
    upi_inflow_volatility: float = 0.15,
    aa_avg_overdraft_days: float = 2.0,
    aa_total_emi_bounces: float = 0.0,
    epfo_on_time_pct: float = 90.0,
    upi_avg_inflow: float = 300000.0,
) -> ScoreResult:
    """
    Main scoring entry point.
    Returns a ScoreResult with deterministic, ML-blended scores and risk tier.
    """
    global _MODEL

    # Clamp inputs
    sub_scores = {
        "revenue_stability": float(np.clip(revenue_stability, 0, 100)),
        "cashflow_health": float(np.clip(cashflow_health, 0, 100)),
        "banking_discipline": float(np.clip(banking_discipline, 0, 100)),
        "compliance": float(np.clip(compliance, 0, 100)),
        "employment_stability": float(np.clip(employment_stability, 0, 100)),
    }

    det_score = compute_deterministic_score(**sub_scores)

    # ML component (lazy load)
    if _MODEL is None:
        _MODEL = _load_model()

    ml_prob = None
    if _MODEL is not None:
        try:
            # 11-feature vector matching the trained model
            feats = np.array([
                sub_scores["revenue_stability"],       # revenue_stability_score
                sub_scores["cashflow_health"],          # cashflow_health_score
                sub_scores["banking_discipline"],       # banking_discipline_score
                sub_scores["compliance"],               # compliance_score
                sub_scores["employment_stability"],     # employment_stability_score
                float(gst_avg_delay_days),              # gst_avg_delay_days
                float(upi_inflow_volatility),           # upi_inflow_volatility
                float(aa_avg_overdraft_days),           # aa_avg_overdraft_days
                float(aa_total_emi_bounces),            # aa_total_emi_bounces
                float(epfo_on_time_pct),                # epfo_on_time_pct
                float(upi_avg_inflow),                  # upi_avg_inflow
            ], dtype=np.float32).reshape(1, -1)

            import xgboost as xgb
            if isinstance(_MODEL, xgb.Booster):
                # Native booster — predict returns raw probability for binary:logistic
                dmat = xgb.DMatrix(feats)
                prob_default = float(_MODEL.predict(dmat)[0])
            else:
                # Legacy XGBClassifier (joblib pickle) — uses predict_proba
                prob_default = float(_MODEL.predict_proba(feats)[0][1])

            # Probability of NOT defaulting -> higher = better creditworthiness
            ml_prob = 1.0 - prob_default
        except Exception:
            ml_prob = None

    if ml_prob is not None:
        blended = float(np.clip(
            BLEND_DETERMINISTIC * det_score + BLEND_ML * (ml_prob * 100),
            0, 100
        ))
    else:
        blended = det_score

    return ScoreResult(
        applicant_id=applicant_id,
        revenue_stability_score=sub_scores["revenue_stability"],
        cashflow_health_score=sub_scores["cashflow_health"],
        banking_discipline_score=sub_scores["banking_discipline"],
        compliance_score=sub_scores["compliance"],
        employment_stability_score=sub_scores["employment_stability"],
        deterministic_score=det_score,
        ml_probability=ml_prob,
        blended_score=blended,
        risk_tier=assign_risk_tier(blended),
    )


if __name__ == "__main__":
    result = compute_score(
        applicant_id=1,
        revenue_stability=80,
        cashflow_health=70,
        banking_discipline=60,
        compliance=90,
        employment_stability=75,
    )
    print(result.to_dict())
