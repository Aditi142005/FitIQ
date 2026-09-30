import sys

filename = "frontend/src/pages/Dashboard.jsx"
with open(filename, "r", encoding="utf-8") as f:
    content = f.read()

analytics_target = """  {activePage === "analytics" && (
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
  )}"""

analytics_replacement = """  {activePage === "analytics" && (
    <>
      {!dailyTrackingRecorded ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] bg-orange-50 rounded-2xl border border-orange-100 text-center p-8 mx-auto max-w-4xl mt-12">
          <p className="text-4xl mb-4">📊</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Today's check-in is pending.</h2>
          <p className="text-gray-600 mb-8">Complete your Daily Check-in to see today's analytics.</p>
          <button 
            onClick={() => setActivePage("tracking")} 
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition"
          >
            Take Daily Check-in
          </button>
        </div>
      ) : (
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
    </>
  )}"""

if analytics_target in content:
    content = content.replace(analytics_target, analytics_replacement)
    print("Replaced analytics target")
else:
    print("Could not find analytics target")

insights_target = """      {/* No data yet */}
      {!interpretationResult && !interpretationLoading && !interpretationError && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center">
          <p className="text-2xl mb-2">🧠</p>
          <p className="font-semibold text-textPrimary">Insights will appear after your analytics data loads.</p>
          <p className="text-sm text-textSecondary mt-1">Navigate to the Dashboard first to trigger your analytics engines.</p>
        </div>
      )}"""

insights_replacement = """      {/* No data yet */}
      {!interpretationResult && !interpretationLoading && !interpretationError && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center">
          <p className="text-2xl mb-2">🧠</p>
          {dailyTrackingRecorded ? (
            <>
              <p className="font-semibold text-textPrimary">Insights will appear after your analytics data loads.</p>
              <p className="text-sm text-textSecondary mt-1">Please wait while your data is being processed.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-textPrimary text-lg">Complete your Daily Check-in to receive personalized insights.</p>
              <button 
                onClick={() => setActivePage("tracking")} 
                className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition"
              >
                Take Daily Check-in
              </button>
            </>
          )}
        </div>
      )}"""

if insights_target in content:
    content = content.replace(insights_target, insights_replacement)
    print("Replaced insights target")
else:
    print("Could not find insights target")


with open(filename, "w", encoding="utf-8") as f:
    f.write(content)
