"""
CreditPulse - Synthetic Data Generator (Phase 1)
Generates 1000 MSME applicants with 12 months of history across 5 data sources.
Produces 6 CSVs and loads them into creditpulse.db (SQLite).
"""

import os
import random
import sqlite3
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.special import expit  # sigmoid

# ── Reproducibility ──────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# ── Paths ────────────────────────────────────────────────────────────────────
HERE = Path(__file__).parent
DB_PATH = HERE / "creditpulse.db"

# ── Config ───────────────────────────────────────────────────────────────────
N_APPLICANTS = 1000
MONTHS = 12  # months of history
START_MONTH = date(2024, 1, 1)

SECTORS = ["textiles", "retail", "food_processing", "services", "manufacturing"]
REGIONS = {
    "Tier1": ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad"],
    "Tier2": ["Pune", "Ahmedabad", "Jaipur", "Lucknow", "Surat"],
    "Tier3": ["Coimbatore", "Nagpur", "Agra", "Varanasi", "Rajkot"],
}
ENTITY_TYPES = ["NTC", "NTB", "existing_customer"]

BUSINESS_PREFIXES = [
    "Sri", "Shree", "Bharat", "Swadeshi", "National", "Modern", "Pioneer",
    "Galaxy", "Star", "Prime", "Royal", "Apex", "Eagle", "Sunrise", "Heritage",
]
BUSINESS_SUFFIXES = {
    "textiles": ["Fabrics", "Textiles", "Garments", "Weaves", "Mills"],
    "retail": ["Traders", "Mart", "Stores", "Enterprises", "Retail"],
    "food_processing": ["Foods", "Agro", "Processors", "Naturals", "Exports"],
    "services": ["Solutions", "Tech", "Consultancy", "Services", "Ventures"],
    "manufacturing": ["Industries", "Works", "Forge", "Components", "Mfg"],
}


# ═══════════════════════════════════════════════════════════════════════════
#  HELPER UTILITIES
# ═══════════════════════════════════════════════════════════════════════════

def _months_list():
    """Return list of (year, month) tuples for the 12-month window."""
    months = []
    m = START_MONTH
    for _ in range(MONTHS):
        months.append((m.year, m.month))
        # advance by one month
        if m.month == 12:
            m = date(m.year + 1, 1, 1)
        else:
            m = date(m.year, m.month + 1, 1)
    return months


MONTH_LIST = _months_list()


def _gstin(idx):
    state_codes = ["27", "07", "29", "33", "36", "06", "08", "09"]
    sc = random.choice(state_codes)
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
    return f"{sc}{''.join(random.choices(chars, k=10))}Z{''.join(random.choices('0123456789', k=1))}"


def _business_name(sector):
    prefix = random.choice(BUSINESS_PREFIXES)
    suffix = random.choice(BUSINESS_SUFFIXES[sector])
    extra = random.choice(["& Co.", "Pvt Ltd", "LLP", "Bros", "Group", ""])
    return f"{prefix} {suffix} {extra}".strip()


def _weighted_region():
    tier = random.choices(["Tier1", "Tier2", "Tier3"], weights=[0.35, 0.40, 0.25])[0]
    city = random.choice(REGIONS[tier])
    return city, tier


# ═══════════════════════════════════════════════════════════════════════════
#  PHASE FLAGS - assign latent risk profile to each applicant
# ═══════════════════════════════════════════════════════════════════════════

def _assign_profiles(n):
    """
    Returns a dict of per-applicant boolean/float flags:
    - chronic_late_filer: ~15%
    - declining_turnover: ~10%
    - volatile_cashflow: ~20%
    - overdraft_prone: ~15%
    - epfo_irregular: ~15%
    - base_risk_score: continuous 0-1 (combines flags + noise)
    """
    profiles = []
    for i in range(n):
        clf = random.random() < 0.15   # chronic late filer
        dt = random.random() < 0.10    # declining turnover
        vc = random.random() < 0.20    # volatile cashflow
        op = random.random() < 0.15    # overdraft prone
        ei = random.random() < 0.15    # epfo irregular

        # weighted risk score (higher = riskier)
        risk = (
            0.30 * clf +
            0.25 * dt +
            0.15 * vc +
            0.20 * op +
            0.10 * ei +
            0.15 * random.random()   # idiosyncratic noise
        )
        profiles.append({
            "chronic_late_filer": clf,
            "declining_turnover": dt,
            "volatile_cashflow": vc,
            "overdraft_prone": op,
            "epfo_irregular": ei,
            "base_risk": risk,
        })
    return profiles


# ═══════════════════════════════════════════════════════════════════════════
#  TABLE 1 - applicants.csv
# ═══════════════════════════════════════════════════════════════════════════

def generate_applicants(n, profiles):
    rows = []
    for i in range(n):
        sector = random.choice(SECTORS)
        city, tier = _weighted_region()
        entity = random.choices(
            ENTITY_TYPES, weights=[0.25, 0.20, 0.55]
        )[0]
        years = round(random.uniform(0.5, 18), 1)
        emp = random.randint(2, 250)
        rows.append({
            "applicant_id": i + 1,
            "business_name": _business_name(sector),
            "sector": sector,
            "region": city,
            "tier": tier,
            "years_in_business": years,
            "employee_count": emp,
            "gstin": _gstin(i),
            "entity_type": entity,
        })
    return pd.DataFrame(rows)


# ═══════════════════════════════════════════════════════════════════════════
#  TABLE 2 - gst_records.csv
# ═══════════════════════════════════════════════════════════════════════════

def generate_gst(applicants_df, profiles):
    rows = []
    for _, app in applicants_df.iterrows():
        aid = int(app["applicant_id"])
        p = profiles[aid - 1]
        sector = app["sector"]

        # Base monthly turnover (sector-dependent)
        base_turnover = {
            "textiles": 800_000,
            "retail": 600_000,
            "food_processing": 700_000,
            "services": 400_000,
            "manufacturing": 1_000_000,
        }[sector] * random.uniform(0.5, 2.0)

        # Trend multiplier for declining_turnover applicants
        trend = np.linspace(1.0, 0.60, MONTHS) if p["declining_turnover"] else \
                np.linspace(1.0, 1.20, MONTHS) + np.random.normal(0, 0.03, MONTHS)

        for idx, (yr, mo) in enumerate(MONTH_LIST):
            # Seasonality spike for retail in Oct-Dec
            seasonal = 1.0
            if sector == "retail" and mo in [10, 11, 12]:
                seasonal = random.uniform(1.3, 1.7)

            turnover = max(50_000, base_turnover * trend[idx] * seasonal
                           * random.uniform(0.85, 1.15))

            tax_rate = random.uniform(0.05, 0.18)
            tax_paid = round(turnover * tax_rate, 2)

            due_day = 20  # GST due on 20th of next month
            due_date = date(yr, mo, 1) + timedelta(days=50)  # approx

            if p["chronic_late_filer"]:
                delay = int(np.abs(np.random.normal(25, 15)))
            else:
                delay = int(np.abs(np.random.normal(3, 5)))

            filing_date = due_date + timedelta(days=delay)

            rows.append({
                "applicant_id": aid,
                "year": yr,
                "month": mo,
                "turnover_declared": round(turnover, 2),
                "filing_date": filing_date.isoformat(),
                "due_date": due_date.isoformat(),
                "filing_delay_days": delay,
                "tax_paid": tax_paid,
            })
    return pd.DataFrame(rows)


# ═══════════════════════════════════════════════════════════════════════════
#  TABLE 3 - upi_transactions.csv
# ═══════════════════════════════════════════════════════════════════════════

def generate_upi(applicants_df, profiles):
    rows = []
    for _, app in applicants_df.iterrows():
        aid = int(app["applicant_id"])
        p = profiles[aid - 1]
        sector = app["sector"]

        base_inflow = {
            "textiles": 600_000,
            "retail": 500_000,
            "food_processing": 550_000,
            "services": 350_000,
            "manufacturing": 750_000,
        }[sector] * random.uniform(0.5, 2.0)

        for idx, (yr, mo) in enumerate(MONTH_LIST):
            seasonal = 1.0
            if sector == "retail" and mo in [10, 11, 12]:
                seasonal = random.uniform(1.4, 2.0)
            if sector == "food_processing" and mo in [1, 2]:
                seasonal = random.uniform(1.1, 1.3)

            vol_factor = random.uniform(0.5, 1.8) if p["volatile_cashflow"] else \
                         random.uniform(0.85, 1.15)

            inflow = max(10_000, base_inflow * seasonal * vol_factor)
            outflow_ratio = random.uniform(0.60, 0.95)
            outflow = inflow * outflow_ratio * random.uniform(0.95, 1.05)

            txn_count = int(random.uniform(20, 200) * vol_factor)
            counterparties = int(random.uniform(5, 50) * random.uniform(0.8, 1.2))
            inflow_vol = round(abs(random.gauss(0.1, 0.15)) if not p["volatile_cashflow"]
                               else abs(random.gauss(0.3, 0.2)), 4)

            rows.append({
                "applicant_id": aid,
                "year": yr,
                "month": mo,
                "total_inflow": round(inflow, 2),
                "total_outflow": round(outflow, 2),
                "txn_count": txn_count,
                "unique_counterparties": counterparties,
                "inflow_volatility": inflow_vol,
            })
    return pd.DataFrame(rows)


# ═══════════════════════════════════════════════════════════════════════════
#  TABLE 4 - aa_bank_data.csv
# ═══════════════════════════════════════════════════════════════════════════

def generate_aa(applicants_df, profiles):
    rows = []
    for _, app in applicants_df.iterrows():
        aid = int(app["applicant_id"])
        p = profiles[aid - 1]

        base_balance = random.uniform(50_000, 2_000_000)

        for idx, (yr, mo) in enumerate(MONTH_LIST):
            if p["overdraft_prone"]:
                overdraft_days = int(np.abs(np.random.normal(8, 6)))
                emi_bounces = int(np.abs(np.random.normal(1.5, 1.0)))
                avg_bal = base_balance * random.uniform(0.3, 0.7)
                min_bal = avg_bal * random.uniform(-0.2, 0.3)  # can go negative
            else:
                overdraft_days = int(np.abs(np.random.normal(1, 2)))
                emi_bounces = 0 if random.random() > 0.1 else 1
                avg_bal = base_balance * random.uniform(0.8, 1.3)
                min_bal = avg_bal * random.uniform(0.4, 0.8)

            vendor_reg = round(random.uniform(0.6, 1.0) if not p["overdraft_prone"]
                               else random.uniform(0.2, 0.7), 2)

            rows.append({
                "applicant_id": aid,
                "year": yr,
                "month": mo,
                "avg_balance": round(max(0, avg_bal), 2),
                "min_balance": round(min_bal, 2),
                "overdraft_days": min(overdraft_days, 30),
                "emi_bounces": min(emi_bounces, 5),
                "salary_credit_flag": int(random.random() > 0.2),
                "vendor_credit_regularity": vendor_reg,
            })
    return pd.DataFrame(rows)


# ═══════════════════════════════════════════════════════════════════════════
#  TABLE 5 - epfo_records.csv
# ═══════════════════════════════════════════════════════════════════════════

def generate_epfo(applicants_df, profiles):
    rows = []
    for _, app in applicants_df.iterrows():
        aid = int(app["applicant_id"])
        p = profiles[aid - 1]
        base_emp = int(app["employee_count"])
        base_emp = max(2, base_emp)

        for idx, (yr, mo) in enumerate(MONTH_LIST):
            if p["declining_turnover"]:
                trend_emp = max(1, int(base_emp * (1 - 0.05 * idx / MONTHS)))
            else:
                trend_emp = max(1, int(base_emp * random.uniform(0.95, 1.05)))

            # EPFO contribution = ~12% of basic wages, approx ₹6000/employee/month
            contrib = trend_emp * 6000 * random.uniform(0.9, 1.1)

            on_time = 1
            if p["epfo_irregular"] and random.random() < 0.40:
                on_time = 0

            rows.append({
                "applicant_id": aid,
                "year": yr,
                "month": mo,
                "employee_count": trend_emp,
                "contribution_amount": round(contrib, 2),
                "contribution_on_time_flag": on_time,
            })
    return pd.DataFrame(rows)


# ═══════════════════════════════════════════════════════════════════════════
#  GROUND-TRUTH LABELS (defaulted_12m)
# ═══════════════════════════════════════════════════════════════════════════

def generate_labels(applicants_df, profiles, gst_df, upi_df, aa_df, epfo_df):
    """
    Compute a logistic-regression-style default probability from real signals.
    Target ~15-20% default rate.

    Signal improvements (v2):
    - Increased weights on core risk features relative to noise.
    - Reduced noise std from 0.40 → 0.25 for a cleaner signal.
    - Added 2 interaction terms:
        (a) overdraft_days × late_gst_pct  — banking stress + compliance failure
        (b) avg_inflow_vol × declining_turnover — cashflow chaos + revenue drop
    """
    aids = applicants_df["applicant_id"].values
    rows = []

    for aid in aids:
        p = profiles[aid - 1]

        # --- GST signals ---
        g = gst_df[gst_df["applicant_id"] == aid]
        avg_delay = g["filing_delay_days"].mean()
        late_pct = (g["filing_delay_days"] > 10).mean()
        turnover_cv = g["turnover_declared"].std() / (g["turnover_declared"].mean() + 1)

        # --- UPI signals ---
        u = upi_df[upi_df["applicant_id"] == aid]
        avg_inflow_vol = u["inflow_volatility"].mean()
        avg_ratio = (u["total_outflow"] / (u["total_inflow"] + 1)).mean()

        # --- AA signals ---
        a = aa_df[aa_df["applicant_id"] == aid]
        avg_overdraft = a["overdraft_days"].mean()
        total_bounces = a["emi_bounces"].sum()

        # --- EPFO signals ---
        e = epfo_df[epfo_df["applicant_id"] == aid]
        epfo_on_time_pct = e["contribution_on_time_flag"].mean()
        emp_trend = (e["employee_count"].iloc[-1] - e["employee_count"].iloc[0]) \
                    / (e["employee_count"].iloc[0] + 1)

        # ── Interaction effects ──────────────────────────────────────────
        # (a) High overdraft days AND chronic GST lateness → compounding risk
        #     Both scaled to [0,1] range before multiplying so the interaction
        #     only fires meaningfully when BOTH signals are elevated.
        overdraft_norm = min(avg_overdraft / 10.0, 1.0)   # 0-1 (10+ days = max)
        interaction_bank_gst = overdraft_norm * late_pct   # max=1 when both extreme

        # (b) High cashflow volatility AND declining turnover → stress compounds
        inflow_vol_norm = min(avg_inflow_vol / 0.4, 1.0)  # 0-1 (0.4+ = max)
        declining_flag = float(p["declining_turnover"])   # 0 or 1
        interaction_cashflow_rev = inflow_vol_norm * declining_flag

        # ── Logit (higher = riskier) — tuned for ~15-20% default rate ───
        logit = (
            -2.0                               # intercept (keeps base rate ~17%)
            + 0.07 * avg_delay                 # late filing
            + 2.20 * late_pct                  # chronic GST lateness
            + 1.60 * avg_inflow_vol            # cashflow volatility
            + 2.50 * max(0, avg_ratio - 0.80)  # high outflow ratio
            + 0.28 * avg_overdraft             # overdraft days
            + 0.80 * (total_bounces / 12)      # EMI bounce rate
            + (-2.00) * epfo_on_time_pct       # good EPFO → protective
            + (-1.40) * max(0, -emp_trend)     # declining headcount
            + 1.00 * turnover_cv              # revenue instability
            + 2.50 * interaction_bank_gst      # INTERACTION: overdraft × GST late
            + 2.00 * interaction_cashflow_rev  # INTERACTION: vol cashflow × rev decline
            + np.random.normal(0, 0.25)        # reduced noise for cleaner signal
        )

        prob = float(expit(logit))
        defaulted = int(random.random() < prob)
        rows.append({
            "applicant_id": aid,
            "default_probability": round(prob, 4),
            "defaulted_12m": defaulted,
        })

    labels_df = pd.DataFrame(rows)
    # Print default rate
    dr = labels_df["defaulted_12m"].mean()
    print(f"  Default rate: {dr:.1%} ({labels_df['defaulted_12m'].sum()} / {len(labels_df)})")
    return labels_df


# ═══════════════════════════════════════════════════════════════════════════
#  SQLITE LOADER
# ═══════════════════════════════════════════════════════════════════════════

def load_to_sqlite(db_path, tables: dict):
    conn = sqlite3.connect(db_path)
    for name, df in tables.items():
        df.to_sql(name, conn, if_exists="replace", index=False)
        print(f"  [OK] {name}: {len(df):,} rows loaded")
    conn.close()


# ═══════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    out_dir = HERE
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("CreditPulse - Synthetic Data Generation (Phase 1)")
    print("=" * 60)

    # 1. Risk profiles
    print("\n[1/6] Assigning applicant risk profiles ...")
    profiles = _assign_profiles(N_APPLICANTS)

    # 2. Applicants
    print("[2/6] Generating applicants ...")
    applicants_df = generate_applicants(N_APPLICANTS, profiles)
    applicants_df.to_csv(out_dir / "applicants.csv", index=False)
    print(f"  [OK] applicants.csv - {len(applicants_df)} rows")

    # 3. GST
    print("[3/6] Generating GST records ...")
    gst_df = generate_gst(applicants_df, profiles)
    gst_df.to_csv(out_dir / "gst_records.csv", index=False)
    print(f"  [OK] gst_records.csv - {len(gst_df):,} rows")

    # 4. UPI
    print("[4/6] Generating UPI transactions ...")
    upi_df = generate_upi(applicants_df, profiles)
    upi_df.to_csv(out_dir / "upi_transactions.csv", index=False)
    print(f"  [OK] upi_transactions.csv - {len(upi_df):,} rows")

    # 5. AA Bank
    print("[5/6] Generating AA bank data ...")
    aa_df = generate_aa(applicants_df, profiles)
    aa_df.to_csv(out_dir / "aa_bank_data.csv", index=False)
    print(f"  [OK] aa_bank_data.csv - {len(aa_df):,} rows")

    # 6. EPFO
    print("[6/6] Generating EPFO records ...")
    epfo_df = generate_epfo(applicants_df, profiles)
    epfo_df.to_csv(out_dir / "epfo_records.csv", index=False)
    print(f"  [OK] epfo_records.csv - {len(epfo_df):,} rows")

    # 7. Ground-truth labels
    print("\n[7] Computing ground-truth labels (defaulted_12m) ...")
    labels_df = generate_labels(applicants_df, profiles, gst_df, upi_df, aa_df, epfo_df)
    labels_df.to_csv(out_dir / "labels.csv", index=False)
    print(f"  [OK] labels.csv - {len(labels_df)} rows")

    # 8. Load into SQLite
    print(f"\n[8] Loading all tables into SQLite -> {DB_PATH} ...")
    # Merge labels into applicants for convenience
    applicants_with_labels = applicants_df.merge(labels_df, on="applicant_id")
    load_to_sqlite(DB_PATH, {
        "applicants": applicants_with_labels,
        "gst_records": gst_df,
        "upi_transactions": upi_df,
        "aa_bank_data": aa_df,
        "epfo_records": epfo_df,
        "labels": labels_df,
    })

    # 9. Sanity check - sample rows
    print("\n[9] Sample data verification:")
    conn = sqlite3.connect(DB_PATH)
    for table in ["applicants", "gst_records", "upi_transactions", "aa_bank_data", "epfo_records"]:
        df = pd.read_sql(f"SELECT * FROM {table} LIMIT 2", conn)
        print(f"\n  {table}:\n{df.to_string(index=False)}")
    conn.close()

    print("\n" + "="*60)
    print("[OK] Phase 1 complete. All CSVs and SQLite DB generated.")
    print("="*60)


if __name__ == "__main__":
    main()
