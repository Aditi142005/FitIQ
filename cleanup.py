import sys
import re

filename = r"c:\Users\maras\OneDrive\文档\c program\Desktop\major\FitIQ\frontend\src\pages\Dashboard.jsx"

with open(filename, "r", encoding="utf-8") as f:
    content = f.read()

# Remove unused imports and functions
content = re.sub(r'updateTodayCompletion,\s*', '', content)

# Remove unused state variables
content = re.sub(r'^\s*const \[bestStreak, setBestStreak\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*const \[todayCompleted, setTodayCompleted\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*const \[predictionLoading, setPredictionLoading\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*const \[predictionError, setPredictionError\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*const \[consistencyPrediction, setConsistencyPrediction\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*const \[, setConsistencyPredictionError\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*const \[cohortLoading, setCohortLoading\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*const \[cohortError, setCohortError\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*const \[anomalyLoading, setAnomalyLoading\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*const \[anomalyError, setAnomalyError\] = useState\([^)]*\);\s*\n', '', content, flags=re.MULTILINE)

# Remove the unused helper functions calculateGoalStreak and calculateBestStreak
content = re.sub(r'const calculateGoalStreak = \(history = \{\}\) => \{[\s\S]*?\n\s*return currentStreak;\n\};\n', '', content)
content = re.sub(r'const calculateBestStreak = \(history = \{\}\) => \{[\s\S]*?\n\s*return bestStreak;\n\};\n', '', content)

with open(filename, "w", encoding="utf-8") as f:
    f.write(content)
print("Cleaned up unused variables in Dashboard.jsx")
