import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = r"c:\Users\maras\OneDrive\文档\c program\Desktop\major\FitIQ\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from llm_service import generate_comprehensive_interpretation, generate_deterministic_interpretation

print("=== VERIFYING LLM_SERVICE SCENARIOS ===")

# TEST 1: First check-in: Steps = 4,000, Sleep = 6, Water = 1.5 L
t1 = {
    "profile": {"goal": "Weight Loss"},
    "latest_checkin": {"steps": 4000, "sleepHours": 6.0, "waterIntake": 1.5},
    "previous_checkin": None,
    "checkin_count": 1,
    "is_first_checkin": True
}
res1 = generate_comprehensive_interpretation(t1)
um1 = res1["user_mode"]
print("\n--- TEST 1 RESULT (First Check-in Baseline) ---")
print("Summary:", um1["overall_summary"])
assert "Your Personalized Starting Point" in um1["overall_summary"], "T1 Summary failed"
for a in um1["priority_actions"]:
    print(f"P{a['priority']}: {a['title']} | Since: {a.get('since_last_checkin')}")
    assert a["since_last_checkin"] == "First check-in — baseline established.", f"T1 action failed: {a}"
assert not any("0/100" in a.get("why_it_matters", "") for a in um1["priority_actions"])
print("✓ TEST 1 PASSED: Baseline established, no fake trend, no 0/100 consistency.")

# TEST 2: Second check-in: Steps = 7,000, Sleep = 7.5, Water = 2.5 L (Improvements)
t2 = {
    "profile": {"goal": "Weight Loss"},
    "latest_checkin": {"steps": 7000, "sleepHours": 7.5, "waterIntake": 2.5},
    "previous_checkin": {"steps": 4000, "sleepHours": 6.0, "waterIntake": 1.5},
    "checkin_count": 2,
    "is_first_checkin": False
}
res2 = generate_comprehensive_interpretation(t2)
um2 = res2["user_mode"]
print("\n--- TEST 2 RESULT (Improvements) ---")
print("Summary:", um2["overall_summary"])
titles2 = [a["title"] for a in um2["priority_actions"]]
for a in um2["priority_actions"]:
    print(f"P{a['priority']}: {a['title']} | Since: {a.get('since_last_checkin')}")
assert not any("Hydration is your biggest issue" in a["what_is_happening"] for a in um2["priority_actions"])
assert not any("Increase your activity" in a["title"] for a in um2["priority_actions"])
print("✓ TEST 2 PASSED: Successfully acknowledged improvements, no stale bottleneck warnings.")

# TEST 3: Third check-in: Steps = 2,500, Sleep = 4, Water = 1.0 L (Declines)
t3 = {
    "profile": {"goal": "Weight Loss"},
    "latest_checkin": {"steps": 2500, "sleepHours": 4.0, "waterIntake": 1.0},
    "previous_checkin": {"steps": 7000, "sleepHours": 7.5, "waterIntake": 2.5},
    "checkin_count": 3,
    "is_first_checkin": False
}
res3 = generate_comprehensive_interpretation(t3)
um3 = res3["user_mode"]
print("\n--- TEST 3 RESULT (Declines) ---")
print("Summary:", um3["overall_summary"])
titles3 = [a["title"] for a in um3["priority_actions"]]
for a in um3["priority_actions"]:
    print(f"P{a['priority']}: {a['title']} | Since: {a.get('since_last_checkin')}")
assert "Restore Sleep & Recovery" in titles3 or any("Sleep" in t for t in titles3), "Should prioritize sleep decline"
assert any("Steps" in t or "Movement" in t for t in titles3), "Should prioritize steps decline"
assert any("Water" in t or "Fluid" in t for t in titles3), "Should prioritize water decline"
print("✓ TEST 3 PASSED: Priorities dynamically pivoted to address declines.")

# TEST 4: Unchanged answers
t4 = {
    "profile": {"goal": "Weight Loss"},
    "latest_checkin": {"steps": 6000, "sleepHours": 7.0, "waterIntake": 2.2},
    "previous_checkin": {"steps": 6000, "sleepHours": 7.0, "waterIntake": 2.2},
    "checkin_count": 4,
    "is_first_checkin": False
}
res4 = generate_comprehensive_interpretation(t4)
um4 = res4["user_mode"]
print("\n--- TEST 4 RESULT (Unchanged Answers) ---")
print("Summary:", um4["overall_summary"])
assert "remained steady" in um4["overall_summary"], "Unchanged summary failed"
print("✓ TEST 4 PASSED: Steady habits accurately summarized without false trends.")

# TEST 5: Single check-in consistency check
t5 = {
    "profile": {"goal": "Weight Loss"},
    "latest_checkin": {"steps": 5000, "sleepHours": 7.0, "waterIntake": 2.0},
    "previous_checkin": None,
    "checkin_count": 1,
    "is_first_checkin": True,
    "fisResult": {
        "fis": 65,
        "fitnessActivity": {"score": 70},
        "recovery": {"score": 75},
        "bodyComposition": {"score": 68},
        "nutrition": {"score": 60},
        "consistency": {"score": 0}
    }
}
res5 = generate_comprehensive_interpretation(t5)
um5 = res5["user_mode"]
print("\n--- TEST 5 RESULT (Consistency Baseline) ---")
e3_finding = next((f for f in um5["key_findings"] if "Engine 3" in f["engine"]), None)
print("Engine 3 finding:", e3_finding)
assert e3_finding["finding"] == "Consistency baseline is still being established.", "E3 finding failed"
for a in um5["priority_actions"]:
    assert "0/100" not in a.get("why_it_matters", ""), "Found 0/100 in priority actions!"
    assert "Consistency" not in a.get("title", ""), "Consistency falsely made priority action with 1 check-in!"
print("✓ TEST 5 PASSED: Insufficient history correctly marked as baseline establishing without 0/100 penalty.")

print("\nALL 5 BACKEND VERIFICATION SCENARIOS PASSED 100%!")
