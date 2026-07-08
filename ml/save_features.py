"""
CreditPulse - Save engineered features to SQLite (run after train_model.py)
"""
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from feature_engineering import build_feature_table

DB_PATH = Path(__file__).parent.parent / "data_generation" / "creditpulse.db"

def save_features_to_db():
    print("Building feature table ...")
    df = build_feature_table(save=True)
    
    conn = sqlite3.connect(DB_PATH)
    df.rename(columns={}, inplace=True)  # keep all columns
    df.to_sql("applicant_features", conn, if_exists="replace", index=False)
    print(f"[OK] applicant_features table saved: {len(df)} rows, {len(df.columns)} columns")
    
    # Verify
    count = conn.execute("SELECT COUNT(*) FROM applicant_features").fetchone()[0]
    print(f"  DB row count: {count}")
    conn.close()


if __name__ == "__main__":
    save_features_to_db()
