import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

url = "http://127.0.0.1:5000/comprehensive-interpretation"

payload = {
    "profile": {"goal": "Weight Loss", "age": 25, "gender": "Female", "height": 165, "weight": 60},
    "latest_checkin": {
        "steps": 7500,
        "sleepHours": 7.5,
        "waterIntake": 2.5,
        "exerciseMinutes": 45
    },
    "previous_checkin": {
        "steps": 4000,
        "sleepHours": 6.0,
        "waterIntake": 1.2,
        "exerciseMinutes": 20
    },
    "checkin_count": 2,
    "is_first_checkin": False
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        print("Status code:", resp.status)
        data = json.loads(resp.read().decode("utf-8"))
        print("\nSummary:", data.get("user_mode", {}).get("overall_summary"))
        print("\nPriority Actions:")
        for a in data.get("user_mode", {}).get("priority_actions", []):
            print(f"P{a.get('priority')}: {a.get('title')}")
            print(f"  What's happening: {a.get('what_is_happening')}")
            print(f"  Since last check-in: {a.get('since_last_checkin')}")
            print(f"  What to do next: {a.get('what_to_do_next')}")
except Exception as e:
    print("Error calling endpoint:", e)
