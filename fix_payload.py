import sys
filename = r"c:\Users\maras\OneDrive\文档\c program\Desktop\major\FitIQ\frontend\src\pages\Dashboard.jsx"

with open(filename, "r", encoding="utf-8") as f:
    content = f.read()

target = """  const interpretData = await getComprehensiveInterpretation({
    profile: data,
    fisResult: fisData,
    behaviorResult: behaviorData,
    predictionResult: _predictionData,
    consistencyPrediction: _consistencyData,
    cohortResult: _cohortData,
    anomalyResult: _anomalyData,
    nutritionData: nutritionSnap,
  });

  console.log("E7 INTERPRETATION RESULT:", interpretData);
  setInterpretationResult(interpretData);
} catch (e7err) {"""

replacement = """  if (trackingData) {
    const interpretData = await getComprehensiveInterpretation({
      profile: data,
      fisResult: fisData,
      behaviorResult: behaviorData,
      predictionResult: _predictionData,
      consistencyPrediction: _consistencyData,
      cohortResult: _cohortData,
      anomalyResult: _anomalyData,
      nutritionData: nutritionSnap,
      today_checkin: trackingData,
      recent_history: trackingRecords,
    });
    console.log("E7 INTERPRETATION RESULT:", interpretData);
    setInterpretationResult(interpretData);
  } else {
    setInterpretationResult(null);
  }
} catch (e7err) {"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced interpretation payload")
else:
    print("Interpretation payload target not found")

target2 = """  {activePage === "analytics" && (
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

replacement2 = """  {activePage === "analytics" && (
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

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced analytics conditional rendering")
else:
    print("Analytics conditional target not found")

with open(filename, "w", encoding="utf-8") as f:
    f.write(content)
