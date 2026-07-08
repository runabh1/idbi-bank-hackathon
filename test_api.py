import urllib.request, json

def get(url):
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read())

# Test /applicants
apps = get('http://localhost:8000/applicants')
print('GET /applicants ->', len(apps), 'applicants')
a = apps[0]
print('  First:', a['business_name'], '| Score:', round(a['blended_score'], 1), '| Tier:', a['risk_tier'])

# Test /applicants/1
app1 = get('http://localhost:8000/applicants/1')
print('GET /applicants/1 ->', app1['business_name'])
print('  revenue_stability_score:', app1.get('revenue_stability_score', 'N/A'))

# Test /score/1
score1 = get('http://localhost:8000/score/1')
print('GET /score/1 -> blended =', round(score1['blended_score'], 2), ', tier =', score1['risk_tier'])

# Test /portfolio
port = get('http://localhost:8000/portfolio')
print('GET /portfolio -> avg =', port['avg_score'], ', tiers =', port['tier_distribution'])

# Test /audit/1
audit = get('http://localhost:8000/audit/1')
print('GET /audit/1 -> model_trained =', audit['model_trained'])

print('\n[OK] All endpoint tests passed!')
