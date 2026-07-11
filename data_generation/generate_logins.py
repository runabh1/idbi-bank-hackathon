import pandas as pd
import json
import random
import string
import os

def generate_random_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def generate_logins():
    # Read applicants.csv
    csv_path = 'applicants.csv'
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    df = pd.read_csv(csv_path)
    
    logins = {}
    
    # Add Admin
    logins["admin@creditpulse.com"] = {
        "password": "admin",
        "role": "admin",
        "name": "CreditPulse Admin",
        "id": "admin"
    }
    
    # Add Applicants
    for _, row in df.iterrows():
        applicant_id = int(row['applicant_id'])
        # Simple email pattern based on business name
        domain = "".join(e for e in str(row['business_name']).split()[0].lower() if e.isalnum())
        if not domain:
            domain = f"business{applicant_id}"
        email = f"owner_{applicant_id}@{domain}.com"
        password = generate_random_password()
        
        logins[email] = {
            "password": password,
            "role": "applicant",
            "name": row['business_name'],
            "id": applicant_id
        }
        
    # We will use this password for testing 
    if "owner_1@heritage.com" in logins:
        logins["owner_1@heritage.com"]["password"] = "owner"
        
    # Write to frontend data folder
    output_dir = '../frontend/src/data'
    os.makedirs(output_dir, exist_ok=True)
    
    with open(os.path.join(output_dir, 'logins.json'), 'w') as f:
        json.dump(logins, f, indent=4)
        
    print(f"Generated logins for 1 admin and {len(df)} applicants in {output_dir}/logins.json")

if __name__ == '__main__':
    generate_logins()
