"""
CreditPulse - Feature Engineering (Phase 2)
Aggregates 12-month time series into 5 per-applicant scores (0-100).
"""

from pathlib import Path
import os
from sqlalchemy import create_engine
import numpy as np
import pandas as pd

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    try:
        from dotenv import load_dotenv
        load_dotenv(Path(__file__).parent.parent / ".env")
        DATABASE_URL = os.environ.get("DATABASE_URL")
    except ImportError:
        pass

def load_tables():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL must be set to run feature engineering")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        applicants = pd.read_sql("SELECT * FROM applicants", conn)
        gst = pd.read_sql("SELECT * FROM gst_records", conn)
        upi = pd.read_sql("SELECT * FROM upi_transactions", conn)
        aa = pd.read_sql("SELECT * FROM aa_bank_data", conn)
        epfo = pd.read_sql("SELECT * FROM epfo_records", conn)
        labels = pd.read_sql("SELECT * FROM labels", conn)
    return applicants, gst, upi, aa, epfo, labels


def _clamp(x, lo=0, hi=100):
    return float(np.clip(x, lo, hi))


# ─────────────────────────────────────────────────────────────
#  SCORE 1: Revenue Stability Score (0-100)
#  Sources: GST turnover trend + coefficient of variation
# ─────────────────────────────────────────────────────────────

def revenue_stability_score(gst_df: pd.DataFrame) -> pd.Series:
    scores = {}
    for aid, g in gst_df.groupby("applicant_id"):
        t = g.sort_values(["year", "month"])["turnover_declared"].values.astype(float)
        if len(t) < 2:
            scores[aid] = 50.0
            continue

        # Trend: linear regression slope normalised by mean
        xs = np.arange(len(t))
        slope = np.polyfit(xs, t, 1)[0]
        normalised_slope = slope / (t.mean() + 1)  # fractional monthly growth

        # CV (lower CV = more stable)
        cv = t.std() / (t.mean() + 1)

        # Score:
        # trend_component: map [-0.05, +0.05] to [0, 100]
        trend_score = _clamp(50 + normalised_slope * 1000, 0, 100)
        # stability_component: map cv [0, 1] -> [100, 0]
        stability_score = _clamp(100 - cv * 100, 0, 100)

        scores[aid] = _clamp(0.6 * trend_score + 0.4 * stability_score)

    return pd.Series(scores, name="revenue_stability_score")


# ─────────────────────────────────────────────────────────────
#  SCORE 2: Cashflow Health Score (0-100)
#  Sources: UPI inflow/outflow ratio + volatility
# ─────────────────────────────────────────────────────────────

def cashflow_health_score(upi_df: pd.DataFrame) -> pd.Series:
    scores = {}
    for aid, u in upi_df.groupby("applicant_id"):
        u = u.sort_values(["year", "month"])
        inflow = u["total_inflow"].values.astype(float)
        outflow = u["total_outflow"].values.astype(float)
        vol = u["inflow_volatility"].values.astype(float)

        # Avg net ratio (inflow - outflow) / inflow
        ratios = (inflow - outflow) / (inflow + 1)
        avg_ratio = ratios.mean()  # positive = net positive cashflow

        # Volatility penalty (lower volatility is better)
        avg_vol = vol.mean()

        # ratio component: map [-0.5, 0.5] -> [0, 100]
        ratio_score = _clamp(50 + avg_ratio * 100, 0, 100)
        # vol component: map [0, 0.8] -> [100, 0]
        vol_score = _clamp(100 - avg_vol * 125, 0, 100)

        scores[aid] = _clamp(0.6 * ratio_score + 0.4 * vol_score)

    return pd.Series(scores, name="cashflow_health_score")


# ─────────────────────────────────────────────────────────────
#  SCORE 3: Banking Discipline Score (0-100)
#  Sources: AA overdraft days, EMI bounces, avg balance trend
# ─────────────────────────────────────────────────────────────

def banking_discipline_score(aa_df: pd.DataFrame) -> pd.Series:
    scores = {}
    for aid, a in aa_df.groupby("applicant_id"):
        a = a.sort_values(["year", "month"])
        overdraft = a["overdraft_days"].values.astype(float)
        bounces = a["emi_bounces"].values.astype(float)
        balance = a["avg_balance"].values.astype(float)
        vendor_reg = a["vendor_credit_regularity"].values.astype(float)

        # Overdraft penalty: 0 days => 100, 30 days => 0
        overdraft_score = _clamp(100 - overdraft.mean() * 100 / 30)

        # Bounce penalty: 0 => 100, 5+ => 0
        bounce_score = _clamp(100 - bounces.sum() * 5)

        # Balance trend
        if len(balance) >= 2:
            bal_slope = np.polyfit(np.arange(len(balance)), balance, 1)[0]
            bal_norm = bal_slope / (balance.mean() + 1)
            bal_score = _clamp(50 + bal_norm * 500, 0, 100)
        else:
            bal_score = 50.0

        # Vendor regularity
        vendor_score = _clamp(vendor_reg.mean() * 100, 0, 100)

        scores[aid] = _clamp(
            0.30 * overdraft_score +
            0.30 * bounce_score +
            0.25 * bal_score +
            0.15 * vendor_score
        )

    return pd.Series(scores, name="banking_discipline_score")


# ─────────────────────────────────────────────────────────────
#  SCORE 4: Compliance Score (0-100)
#  Sources: GST filing punctuality
# ─────────────────────────────────────────────────────────────

def compliance_score(gst_df: pd.DataFrame) -> pd.Series:
    scores = {}
    for aid, g in gst_df.groupby("applicant_id"):
        delays = g["filing_delay_days"].values.astype(float)
        # On-time = delay <= 5 days (grace)
        on_time_pct = (delays <= 5).mean()
        avg_delay = delays.mean()

        # on-time component
        ot_score = _clamp(on_time_pct * 100)
        # avg delay component: 0 days => 100, 30+ days => 0
        delay_score = _clamp(100 - avg_delay * 100 / 30)

        scores[aid] = _clamp(0.6 * ot_score + 0.4 * delay_score)

    return pd.Series(scores, name="compliance_score")


# ─────────────────────────────────────────────────────────────
#  SCORE 5: Employment Stability Score (0-100)
#  Sources: EPFO employee count trend + contribution regularity
# ─────────────────────────────────────────────────────────────

def employment_stability_score(epfo_df: pd.DataFrame) -> pd.Series:
    scores = {}
    for aid, e in epfo_df.groupby("applicant_id"):
        e = e.sort_values(["year", "month"])
        emp = e["employee_count"].values.astype(float)
        on_time = e["contribution_on_time_flag"].values.astype(float)

        # Trend
        if len(emp) >= 2:
            slope = np.polyfit(np.arange(len(emp)), emp, 1)[0]
            norm_slope = slope / (emp.mean() + 1)
            trend_score = _clamp(50 + norm_slope * 500, 0, 100)
        else:
            trend_score = 50.0

        regularity_score = _clamp(on_time.mean() * 100)

        scores[aid] = _clamp(0.5 * trend_score + 0.5 * regularity_score)

    return pd.Series(scores, name="employment_stability_score")


# ─────────────────────────────────────────────────────────────
#  RAW FEATURE EXTRACTION (for LLM explainability)
# ─────────────────────────────────────────────────────────────

def extract_raw_features(gst_df, upi_df, aa_df, epfo_df) -> pd.DataFrame:
    raws = []
    aids = sorted(gst_df["applicant_id"].unique())
    for aid in aids:
        g = gst_df[gst_df["applicant_id"] == aid]
        u = upi_df[upi_df["applicant_id"] == aid]
        a = aa_df[aa_df["applicant_id"] == aid]
        e = epfo_df[epfo_df["applicant_id"] == aid]

        raws.append({
            "applicant_id": aid,
            "gst_avg_delay_days": round(g["filing_delay_days"].mean(), 1),
            "gst_on_time_pct": round((g["filing_delay_days"] <= 5).mean() * 100, 1),
            "gst_turnover_trend": round(
                (g.sort_values(["year", "month"])["turnover_declared"].iloc[-1] -
                 g.sort_values(["year", "month"])["turnover_declared"].iloc[0]) /
                (g["turnover_declared"].iloc[0] + 1) * 100, 1
            ),
            "upi_avg_inflow": round(u["total_inflow"].mean(), 2),
            "upi_avg_outflow": round(u["total_outflow"].mean(), 2),
            "upi_inflow_volatility": round(u["inflow_volatility"].mean(), 4),
            "aa_avg_balance": round(a["avg_balance"].mean(), 2),
            "aa_avg_overdraft_days": round(a["overdraft_days"].mean(), 1),
            "aa_total_emi_bounces": int(a["emi_bounces"].sum()),
            "aa_vendor_regularity": round(a["vendor_credit_regularity"].mean(), 3),
            "epfo_on_time_pct": round(e["contribution_on_time_flag"].mean() * 100, 1),
            "epfo_emp_trend_pct": round(
                (e.sort_values(["year", "month"])["employee_count"].iloc[-1] -
                 e.sort_values(["year", "month"])["employee_count"].iloc[0]) /
                (e.sort_values(["year", "month"])["employee_count"].iloc[0] + 1) * 100, 1
            ),
        })
    return pd.DataFrame(raws)


# ─────────────────────────────────────────────────────────────
#  MASTER FEATURE TABLE
# ─────────────────────────────────────────────────────────────

def build_feature_table(save=True) -> pd.DataFrame:
    print("Loading tables from SQLite ...")
    applicants, gst, upi, aa, epfo, labels = load_tables()

    print("Computing sub-scores ...")
    rev = revenue_stability_score(gst)
    cash = cashflow_health_score(upi)
    bank = banking_discipline_score(aa)
    comp = compliance_score(gst)
    emp = employment_stability_score(epfo)
    raw = extract_raw_features(gst, upi, aa, epfo)

    features = (
        applicants[["applicant_id", "business_name", "sector", "region", "tier",
                    "years_in_business", "entity_type"]]
        .merge(rev.reset_index().rename(columns={"index": "applicant_id"}), on="applicant_id")
        .merge(cash.reset_index().rename(columns={"index": "applicant_id"}), on="applicant_id")
        .merge(bank.reset_index().rename(columns={"index": "applicant_id"}), on="applicant_id")
        .merge(comp.reset_index().rename(columns={"index": "applicant_id"}), on="applicant_id")
        .merge(emp.reset_index().rename(columns={"index": "applicant_id"}), on="applicant_id")
        .merge(raw, on="applicant_id")
        .merge(labels[["applicant_id", "defaulted_12m", "default_probability"]], on="applicant_id")
    )

    if save:
        out = Path(__file__).parent / "features.csv"
        features.to_csv(out, index=False)
        print(f"[OK] features.csv saved ({len(features)} rows, {len(features.columns)} columns)")

    return features


if __name__ == "__main__":
    df = build_feature_table()
    print(df.head())
