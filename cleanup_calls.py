import sys
import re

filename = r"c:\Users\maras\OneDrive\文档\c program\Desktop\major\FitIQ\frontend\src\pages\Dashboard.jsx"

with open(filename, "r", encoding="utf-8") as f:
    content = f.read()

funcs_to_remove = [
    "setTodayCompleted",
    "setBestStreak",
    "setPredictionLoading",
    "setPredictionError",
    "setConsistencyPrediction",
    "setConsistencyPredictionError",
    "setCohortLoading",
    "setCohortError",
    "setAnomalyLoading",
    "setAnomalyError",
]

for func in funcs_to_remove:
    # Match lines that contain the function call and comment them out
    content = re.sub(rf'^(.*?\b{func}\b.*)$', r'// \1', content, flags=re.MULTILINE)

with open(filename, "w", encoding="utf-8") as f:
    f.write(content)
print("Commented out undefined function calls")
