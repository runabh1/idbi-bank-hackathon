"""
CreditPulse - Save engineered features to SQLite (run after train_model.py)
"""
import os
import psycopg2
from sqlalchemy import create_engine
import pandas as pd
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from feature_engineering import build_feature_table

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    try:
        from dotenv import load_dotenv
        load_dotenv(Path(__file__).parent.parent / ".env")
        DATABASE_URL = os.environ.get("DATABASE_URL")
    except ImportError:
        pass

def save_features_to_db():
    if not DATABASE_URL:
        print("[!] DATABASE_URL not set. Cannot save features to DB.")
        return
        
    print("Building feature table ...")
    df = build_feature_table(save=True)
    
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        df.rename(columns={}, inplace=True)  # keep all columns
        df.to_sql("applicant_features", conn, if_exists="replace", index=False)
        print(f"[OK] applicant_features table saved: {len(df)} rows, {len(df.columns)} columns")
        
        # Verify
        count = pd.read_sql("SELECT COUNT(*) FROM applicant_features", conn).iloc[0, 0]
        print(f"  DB row count: {count}")


if __name__ == "__main__":
    save_features_to_db()
