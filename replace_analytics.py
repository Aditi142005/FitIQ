import sys

filename = "frontend/src/pages/Dashboard.jsx"
with open(filename, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_content = """  {activePage === "analytics" && (
    <AnalyticsSection
      profile={profile}
      fisResult={fisResult}
      behaviorResult={behaviorResult}
      predictionResult={predictionResult}
      cohortResult={cohortResult}
      anomalyResult={anomalyResult}
      nutritionData={nutritionData}
      interpretationResult={interpretationResult}
      streakDays={streak}
    />
  )}
"""

with open(filename, "w", encoding="utf-8") as f:
    for i, line in enumerate(lines):
        if i + 1 == 1132:
            f.write(new_content)
        elif 1132 <= i + 1 <= 2926:
            pass # skip these lines
        else:
            f.write(line)
