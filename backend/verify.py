import requests
try:
    r = requests.get('http://127.0.0.1:8000/tickets')
    tickets = r.json()
    for t in tickets:
        print(f"Ticket {t['id']}: Category: {t['category']}")
        for h in t.get('history', []):
            print(f"  [{h['agent']}]: {h['action'][:100]}...")
except Exception as e:
    print(e)
