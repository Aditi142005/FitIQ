import { useEffect, useState } from "react";
import DailyTracking from "./DailyTracking";
import Recommendation from "./recommendation";
import { auth } from "../firebase/firebase";
import { prepareFisInput, calculateFis } from "../services/fisService";
import {
 getUserProfile,
updateDailyGoals,
updateTodayCompletion,
getDailyTracking,
getWeeklyTracking,
getLast7DaysTracking
} from "../services/firestoreService";
import { useNavigate} from "react-router-dom";
import { logout } from "../services/authService";
import Sidebar from "../components/Sidebar";
import { analyzeBehavior } from "../services/behaviorService";
import { getPrediction } from "../services/predictionService";
import { getConsistencyPrediction } from "../services/consistencyPredictionService";
import { getCohortAnalysis } from "../services/cohortService";
const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [dailyTrackingRecorded, setDailyTrackingRecorded] = useState(false);
  const [trackingDays, setTrackingDays] = useState(0);
const [trackingConsistency, setTrackingConsistency] = useState(0);
const [last7DaysTracking, setLast7DaysTracking] = useState([]);
  const [goals, setGoals] = useState({
  water: false,
  workout: false,
  steps: false,
  sleep: false
});
const [fisResult, setFisResult] = useState(null);
const [behaviorResult, setBehaviorResult] = useState(null);
const [predictionResult, setPredictionResult] = useState(null);
const [predictionLoading, setPredictionLoading] = useState(false);
const [predictionError, setPredictionError] = useState(null);
const [consistencyPrediction, setConsistencyPrediction] = useState(null);
const [, setConsistencyPredictionError] = useState(null);
const [cohortResult, setCohortResult] = useState(null);
const [cohortLoading, setCohortLoading] = useState(false);
const [cohortError, setCohortError] = useState(null);
const toggleGoal = async (goal) => {

  const updatedGoals = {
    ...goals,
    [goal]: !goals[goal]
  };

  setGoals(updatedGoals);

  const user = auth.currentUser;

  if (user) {

    await updateDailyGoals(
      user.uid,
      updatedGoals
    );


    const completed = Object.values(updatedGoals)
      .every(value => value === true);


    if(completed){

  setTodayCompleted(true);

  const userRef = auth.currentUser;

  if(userRef){

    await updateTodayCompletion(
      userRef.uid,
      true
    );

  }

}
else{

  setTodayCompleted(false);

  const userRef = auth.currentUser;

  if(userRef){

    await updateTodayCompletion(
      userRef.uid,
      false
    );

  }

}

  }

};
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("dashboard");
  const [profile, setProfile] = useState(null);

const healthScore = profile?.bodyAnalysis?.healthScore || 0;

  useEffect(() => {

  async function fetchProfile() {

    const user = auth.currentUser;

    if (!user) return;

    const data = await getUserProfile(user.uid);
console.log("PROFILE DATA FROM FIRESTORE:", data);
    if (!data) return;

    console.log(data);

    setProfile(data);
    const trackingData = await getDailyTracking(user.uid);

setDailyTrackingRecorded(!!trackingData);

// Get tracking records
const trackingRecords = await getWeeklyTracking(user.uid);
console.log("FIS TRACKING RECORDS:", trackingRecords);
const behaviorData = await analyzeBehavior(trackingRecords);

console.log("BEHAVIOR RESULT:", behaviorData);

setBehaviorResult(behaviorData);
// ================= E3 PREDICTIVE ANALYTICS =================

try {
  setPredictionLoading(true);
  setPredictionError(null);

 /* const validTracking = trackingRecords.filter(
    record =>
      record.steps != null ||
      record.dailySteps != null
  );*/

  const average = (values) => {
    const validValues = values.filter(
      value => value != null && !isNaN(Number(value))
    );

    if (validValues.length === 0) return 0;

    return (
      validValues.reduce(
        (sum, value) => sum + Number(value),
        0
      ) / validValues.length
    );
  };

  const dailySteps = average(
    trackingRecords.map(record =>
      record.steps ?? record.dailySteps
    )
  );

  const durationMinutes = average(
    trackingRecords.map(record =>
      record.exerciseMinutes ?? record.duration_minutes
    )
  );

  const hoursSleep = average(
    trackingRecords.map(record =>
      record.sleep ?? record.sleepHours ?? record.hours_sleep
    )
  );

  const hydrationLevel = average(
    trackingRecords.map(record =>
      record.water ?? record.waterIntake ?? record.hydration_level
    )
  );

  const stressLevel = average(
    trackingRecords.map(record =>
      record.stress ?? record.stressLevel ?? record.stress_level
    )
  );

  const predictionInput = {
    age: Number(data.age),
    height_cm: Number(data.height),
    weight_kg: Number(data.weight),
    fitiq_bmi: Number(data.bodyAnalysis?.bmi),

    daily_steps: dailySteps,
    duration_minutes: durationMinutes,
    hours_sleep: hoursSleep,
    hydration_level: hydrationLevel,
    stress_level: stressLevel
  };

  console.log("E3 PREDICTION INPUT:", predictionInput);

  const predictionData = await getPrediction(
    predictionInput
  );

  console.log("E3 PREDICTION RESULT:", predictionData);

  setPredictionResult(predictionData);
  const consistencyData = await getConsistencyPrediction(
  trackingRecords
);

console.log(
  "E3 CONSISTENCY FORECAST:",
  consistencyData
);

setConsistencyPrediction(consistencyData);

const cohortInput = {
  age: Number(data.age),
  gender: data.gender,
  bmi: Number(data.bodyAnalysis?.bmi),
  activity_level: data.activityLevel,
  exercise_days: Number(data.exerciseFrequency),
  fitness_goal: data.goal,

  daily_steps: dailySteps,
  sleep: hoursSleep,
  water: hydrationLevel,

  consistency:
    consistencyData?.current_score ?? null
};

console.log(
  "E4 COHORT INPUT:",
  cohortInput
);

setCohortLoading(true);

const cohortData = await getCohortAnalysis(
  cohortInput
);

console.log(
  "E4 COHORT RESULT:",
  cohortData
);

setCohortResult(cohortData);
setCohortLoading(false);
setCohortError(null);
} catch (error) {
  console.error("Analytics prediction failed:", error);

  setPredictionError(
    error.message || "Unable to generate prediction"
  );

  setConsistencyPredictionError(
    error.message || "Unable to generate consistency forecast"
  );

  setCohortError(
    error.message || "Unable to generate cohort analysis"
  );

  setCohortLoading(false);
}finally {

  setPredictionLoading(false);

}
const fisInput = prepareFisInput(data, trackingRecords);
console.log("FIS INPUT:", fisInput);
const fisData = await calculateFis(fisInput);

console.log("FIS RESULT:", fisData);

setFisResult(fisData);
const last7Days = await getLast7DaysTracking(user.uid);

setLast7DaysTracking(last7Days);
// Calculate last 7 days
const currentDate = new Date();

const lastSevenDays = [];

for (let i = 0; i < 7; i++) {

  const date = new Date(currentDate);

  date.setDate(currentDate.getDate() - i);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  lastSevenDays.push(`${year}-${month}-${day}`);
}

const recordedDays = trackingRecords.filter(record =>
  lastSevenDays.includes(record.date)
).length;

setTrackingDays(recordedDays);

setTrackingConsistency(
  Math.round((recordedDays / 7) * 100)
);

const today = getTodayDate();

    const defaultGoals = {
      water: false,
      workout: false,
      steps: false,
      sleep: false
    };

    if (data.goalDate === today) {

      // Same day → keep today's goals
      setGoals(data.dailyGoals || defaultGoals);
      setTodayCompleted(data.todayCompleted || false);

    } else {

      // New day → reset goals
      setGoals(defaultGoals);
      setTodayCompleted(false);

      await updateDailyGoals(
        user.uid,
        defaultGoals
      );

      await updateTodayCompletion(
        user.uid,
        false
      );
    }

    setStreak(data.streak || 0);
  }

  fetchProfile();
const handleTrackingUpdate = () => {
  fetchProfile();
};

window.addEventListener(
  "dailyTrackingUpdated",
  handleTrackingUpdate
);

return () => {
  window.removeEventListener(
    "dailyTrackingUpdated",
    handleTrackingUpdate
  );
};
}, []);
 
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };


  return (
  <div className="min-h-screen bg-background flex">

    <Sidebar setActivePage={setActivePage} />

    <div className="flex-1 p-8">
<button
  onClick={handleLogout}
  className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-orange-700 transition"
>
  Logout
</button>
  <div className="mt-20 text-center">

  {activePage === "dashboard" && (
    <>
      <h1 className="text-5xl font-heading font-bold text-textPrimary">
        Welcome back, {profile?.name || "there"} 👋
      </h1>

      <p className="text-xl text-textSecondary mt-4">
        Your personalized fitness journey starts here.
      </p>

     {profile && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-3xl mx-auto">
   {/* Daily Check-in */}

<div className="bg-white p-6 rounded-2xl shadow-card">

  <h2 className="text-xl font-bold">
    📅 Daily Check-in
  </h2>

  {dailyTrackingRecorded ? (

    <>
      <p className="text-green-600 font-semibold mt-4">
        🟢 Recorded today
      </p>

      <p className="text-textSecondary mt-2">
        Your daily health data has been recorded.
      </p>
    </>

  ) : (

    <>
      <p className="text-orange-600 font-semibold mt-4">
        ⚪ Not recorded today
      </p>

      <p className="text-textSecondary mt-2">
        Complete today's tracking to keep your data up to date.
      </p>

      <button
        onClick={() => setActivePage("tracking")}
        className="bg-primary text-white px-5 py-3 rounded-xl mt-4"
      >
        Complete Today's Tracking
      </button>
    </>

  )}

  {/* Last 7 Days */}

  <div className="mt-6 pt-4 border-t">

    <h3 className="font-bold mb-4">
      📊 Last 7 Days
    </h3>

    <div className="grid grid-cols-7 gap-2">

      {last7DaysTracking.map((day) => {

        const date = new Date(`${day.date}T00:00:00`);

        const dayName = date.toLocaleDateString("en-US", {
          weekday: "short"
        });

        return (
          <div
            key={day.date}
            className="text-center"
          >

            <p className="text-sm font-semibold">
              {dayName}
            </p>

            <p className="text-xl mt-1">
              {day.recorded ? "🟢" : "⚪"}
            </p>

          </div>
        );

      })}

    </div>

    <p className="text-2xl text-primary font-bold mt-5">
      {trackingDays} / 7 days
    </p>

    <p className="text-textSecondary mt-1">
      Tracking consistency: {trackingConsistency}%
    </p>

  </div>

</div>
    {/* Health Score */}
    <div className="bg-white p-6 rounded-2xl shadow-card">
      <h2 className="text-xl font-bold">
        ❤️ Health Score
      </h2>

      <p className="text-4xl font-bold text-primary mt-4">
  {healthScore}/100
</p>
<p className="mt-2 font-semibold">
  {healthScore >= 85
    ? "Excellent"
    : healthScore >= 70
    ? "Good"
    : healthScore >= 50
    ? "Needs Improvement"
    : "Poor"}
</p>
 <button
    onClick={() => navigate("/health-assessment?update=true")}
    className="bg-green-500 text-white px-5 py-3 rounded-xl mt-4"
  >
    Update Health Assessment
  </button>
      <p className="text-textSecondary mt-2">
        Based on your lifestyle and fitness habits
      </p>
    </div>


    {/* BMI */}
    <div className="bg-white p-6 rounded-2xl shadow-card">
      <h2 className="text-xl font-bold">
        📊 BMI
      </h2>

      <p className="text-3xl text-primary mt-4">
        {profile.bodyAnalysis?.bmi || "N/A"}
      </p>

      <p>
        {profile.bodyAnalysis?.category}
      </p>
    </div>


    {/* Weight */}
    <div className="bg-white p-6 rounded-2xl shadow-card">
      <h2 className="text-xl font-bold">
        ⚖️ Weight
      </h2>

      <p className="text-3xl text-primary mt-4">
        {profile.weight} kg
      </p>
    </div>


    {/* Activity */}
    <div className="bg-white p-6 rounded-2xl shadow-card">
      <h2 className="text-xl font-bold">
        🏃 Activity
      </h2>

      <p className="text-xl mt-4">
        {profile.activityLevel}
      </p>
    </div>


    {/* Streak */}
<div className="bg-white p-6 rounded-2xl shadow-card">

  <h2 className="text-xl font-bold">
    🔥 Fitness Streak
  </h2>

 <p className="text-3xl text-primary mt-4">
  {todayCompleted ? streak + 1 : streak} Days
</p>

  <p className="mt-2">
    Today's completion:
  </p>

  <p className="text-xl font-semibold">
    {
      Math.round(
        (Object.values(goals).filter(Boolean).length / 4) * 100
      )
    }%
  </p>

</div>

<div className="bg-white p-6 rounded-2xl shadow-card">

<h2 className="text-xl font-bold">
✅ Today's Goals
</h2>

<div className="mt-4 space-y-4 text-left">

  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={goals.water}
      onChange={() => toggleGoal("water")}
    />
    <span>Drink enough water</span>
  </label>


  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={goals.workout}
      onChange={() => toggleGoal("workout")}
    />
    <span>Complete workout</span>
  </label>


  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={goals.steps}
      onChange={() => toggleGoal("steps")}
    />
    <span>Walk daily steps</span>
  </label>


  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={goals.sleep}
      onChange={() => toggleGoal("sleep")}
    />
    <span>Maintain sleep target</span>
  </label>

</div>

</div>
{/* Daily Progress */}
<div className="bg-white p-6 rounded-2xl shadow-card">

  <h2 className="text-xl font-bold">
    📈 Today's Progress
  </h2>

  <p className="text-3xl text-primary mt-4">
    {
      Object.values(goals).filter(Boolean).length
    } / 4
  </p>

  <p className="mt-2">
    Goals Completed
  </p>

</div>
  
  </div>
)}

    </>
  )}

  {activePage === "analytics" && (
  <>
    <h1 className="text-4xl font-bold mb-8">
      📊 Analytics
    </h1>

    <div className="max-w-4xl mx-auto space-y-6">

      {/* ================= FIS ================= */}
      {fisResult && (
        <>
          {/* Fitness Score */}
          <div className="bg-white p-8 rounded-2xl shadow-card">

            <h2 className="text-2xl font-bold">
              ❤️ Your Fitness Score
            </h2>

            <p className="text-6xl font-bold text-primary mt-5">
              {fisResult.fis}/100
            </p>

            <p className="text-textSecondary mt-3">
              Your score reflects your activity, recovery, body
              composition, nutrition, and consistency.
            </p>

            <p className="mt-4 font-medium">
              {fisResult.fis >= 80
                ? "You're doing well! Keep maintaining your healthy habits."
                : fisResult.fis >= 60
                ? "You're on a good path. A little more consistency can help you improve."
                : "There is room to improve. Focus on small, consistent healthy habits."
              }
            </p>

          </div>


          {/* What is influencing your score */}
          <div className="bg-white p-6 rounded-2xl shadow-card">

            <h2 className="text-2xl font-bold mb-4">
              📌 What’s influencing your score?
            </h2>

            <div className="space-y-3 text-textSecondary">

              {fisResult.fitnessActivity?.score < 60 && (
                <p>
                  🏃 <strong>Activity:</strong> Increasing your daily
                  movement and exercise consistency can help.
                </p>
              )}

              {fisResult.recovery?.score < 60 && (
                <p>
                  😴 <strong>Recovery:</strong> Improving your sleep
                  and recovery habits can support your fitness.
                </p>
              )}

              {fisResult.nutrition?.score < 60 && (
                <p>
                  🥗 <strong>Nutrition:</strong> Staying consistent
                  with hydration and meals can help.
                </p>
              )}

              {fisResult.consistency?.score < 60 && (
                <p>
                  🔥 <strong>Consistency:</strong> Keeping up your
                  healthy habits regularly can improve your score.
                </p>
              )}

              {fisResult.bodyComposition?.score < 60 && (
                <p>
                  ⚖️ <strong>Body composition:</strong> Your current
                  body metrics suggest that gradual, healthy progress
                  may be beneficial.
                </p>
              )}

              {fisResult.fitnessActivity?.score >= 60 &&
                fisResult.recovery?.score >= 60 &&
                fisResult.nutrition?.score >= 60 &&
                fisResult.consistency?.score >= 60 &&
                fisResult.bodyComposition?.score >= 60 && (
                  <p>
                    ✨ Your main fitness areas are currently in a good
                    range. Keep maintaining your habits.
                  </p>
                )}

            </div>

          </div>
        </>
      )}


      {/* ================= E2 ================= */}
      {behaviorResult && (
        <div className="bg-white p-6 rounded-2xl shadow-card">

          <h2 className="text-2xl font-bold">
            🧠 Behavioral Insights
          </h2>

          {behaviorResult.mode === "population" ? (
            <>
              <p className="text-textSecondary mt-3">
                Your recent tracking is still limited, so FitIQ is
                currently using patterns from general fitness data
                to provide useful insights.
              </p>

              <div className="mt-5 space-y-3">

                <p>
                  😴 <strong>Sleep & Activity:</strong> General fitness
                  data currently shows no clear relationship between
                  sleep duration and daily activity.
                </p>

                <p>
                  💧 <strong>Hydration & Exercise:</strong> General
                  fitness data currently shows no clear relationship
                  between hydration and exercise duration.
                </p>

              </div>

              <div className="mt-5 p-4 rounded-xl bg-gray-50">
                <p className="font-semibold">
                  💡 Keep improving
                </p>

                <p className="text-textSecondary mt-1">
                  Try to maintain a consistent sleep routine, stay
                  hydrated, and keep your activity regular.
                </p>
              </div>

              <p className="text-sm text-textSecondary mt-5">
                🔒 These insights are not personalized yet. Keep
                tracking your daily habits. Once FitIQ has enough of
                your records, it will start identifying patterns
                specifically from your own behavior.
              </p>
            </>
          ) : (
            <>
              <p className="text-textSecondary mt-3">
                Based on your recent tracking, FitIQ is identifying
                patterns in your daily habits.
              </p>

              <div className="mt-5 space-y-3">

                {behaviorResult.patterns
                  ?.filter(
                    (pattern) =>
                      pattern.strength !== "Weak or no relationship" &&
                      pattern.correlation !== null
                  )
                  .slice(0, 2)
                  .map((pattern, index) => {

                    const relationshipNames = {
                      sleep_steps: "Sleep & Activity",
                      sleep_exercise: "Sleep & Exercise",
                      hydration_steps: "Hydration & Activity",
                      hydration_exercise: "Hydration & Exercise"
                    };

                    const relationship =
                      relationshipNames[pattern.relationship] ||
                      pattern.relationship;

                    const positive = pattern.correlation > 0;

                    return (
                      <p key={index}>
                        {pattern.relationship.includes("sleep")
                          ? "😴"
                          : "💧"}{" "}
                        <strong>{relationship}:</strong>{" "}
                        Your recent tracking shows a{" "}
                        {positive ? "positive" : "negative"} pattern
                        between these habits.
                      </p>
                    );
                  })}

                {behaviorResult.patterns?.every(
                  (pattern) =>
                    pattern.strength === "Weak or no relationship" ||
                    pattern.correlation === null
                ) && (
                  <p>
                    📈 Your recent tracking does not show any strong
                    behavioral patterns yet. Keep tracking to help
                    FitIQ understand your habits better.
                  </p>
                )}

              </div>

              <div className="mt-5 p-4 rounded-xl bg-gray-50">
                <p className="font-semibold">
                  💡 Keep improving
                </p>

                <p className="text-textSecondary mt-1">
                  Keep your sleep, hydration, exercise, and daily
                  activity as consistent as possible. The more you
                  track, the better FitIQ can understand your patterns.
                </p>
              </div>

              <p className="text-sm text-textSecondary mt-5">
                ✨ These insights are based on your own recent
                tracking and become more meaningful as you continue
                using FitIQ.
              </p>
            </>
          )}

        </div>
      )}
{/* ================= E3 PREDICTIVE ANALYTICS ================= */}

<div className="bg-white p-8 rounded-2xl shadow-card">

  {/* Header */}
  <div className="flex items-start justify-between gap-6">

    <div>

      <div className="inline-flex items-center gap-2 bg-orange-50 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3">
        <span>🔮</span>
        <span>E3 • Predictive Analytics</span>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold">
        Predictive Analytics
      </h2>

      <p className="text-textSecondary mt-2 max-w-2xl">
        FitIQ analyzes your current body measurements and recent
        activity patterns to estimate your short-term BMI trend.
      </p>

    </div>

    <div className="hidden md:flex w-14 h-14 rounded-2xl bg-orange-50 items-center justify-center text-3xl">
      📈
    </div>

  </div>


  {/* Loading State */}
  {predictionLoading && (

    <div className="mt-10 py-12 flex flex-col items-center justify-center">

      <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-3xl animate-pulse">
        🔮
      </div>

      <p className="font-semibold mt-4">
        Analyzing your fitness data...
      </p>

      <p className="text-sm text-textSecondary mt-1">
        FitIQ is generating your prediction.
      </p>

    </div>

  )}


  {/* Error State */}
  {predictionError && !predictionLoading && (

    <div className="mt-8 bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl">

      <p className="font-semibold">
        Unable to generate your prediction
      </p>

      <p className="text-sm mt-1">
        Please try again after your fitness data is available.
      </p>

    </div>

  )}


  {/* Prediction Result */}
  {predictionResult && !predictionLoading && (

    <div className="mt-10">

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Current BMI */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition duration-300">

          <div className="flex items-center justify-between">

            <p className="text-sm text-textSecondary">
              Current BMI
            </p>

            <span className="text-xl">
              📍
            </span>

          </div>

          <p className="text-3xl font-bold text-primary mt-3">
            {predictionResult.current_bmi.toFixed(2)}
          </p>

          <p className="text-xs text-textSecondary mt-2">
            Based on your latest profile data
          </p>

        </div>


        {/* Predicted Change */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition duration-300">

          <div className="flex items-center justify-between">

            <p className="text-sm text-textSecondary">
              Expected Change
            </p>

            <span className="text-xl">
              ↗️
            </span>

          </div>

          <p className="text-3xl font-bold text-primary mt-3">

            {predictionResult.predicted_bmi_change >= 0
              ? "+"
              : ""}

            {predictionResult.predicted_bmi_change.toFixed(2)}

          </p>

          <p className="text-xs text-textSecondary mt-2">
            Estimated over the next 7 days
          </p>

        </div>


        {/* Future BMI */}
        <div className="bg-primary text-white rounded-2xl p-6 shadow-md">

          <div className="flex items-center justify-between">

            <p className="text-sm opacity-80">
              Estimated BMI
            </p>

            <span className="text-xl">
              🎯
            </span>

          </div>

          <p className="text-3xl font-bold mt-3">

            {predictionResult.predicted_future_bmi.toFixed(2)}

          </p>

          <p className="text-xs opacity-80 mt-2">
            Model-based 7-day estimate
          </p>

        </div>

      </div>


      {/* Predicted Trend */}
      <div className="mt-10">

        <div className="flex items-center justify-between">

          <div>

            <h3 className="text-lg font-bold">
              Your Predicted BMI Trend
            </h3>

            <p className="text-sm text-textSecondary mt-1">
              Estimated change from today to the next 7 days
            </p>

          </div>

          <span className="hidden sm:block text-sm font-semibold text-primary">
            7-day forecast
          </span>

        </div>


        {/* Trend Visualization */}
        <div className="mt-8 relative px-2">

          {/* Connecting Line */}

          <div className="absolute left-6 right-6 top-1/2 h-1 bg-gray-100 rounded-full" />

          <div className="relative flex items-center justify-between">

            {/* Current Point */}

            <div className="flex flex-col items-center">

              <div className="w-12 h-12 rounded-full bg-orange-50 border-4 border-primary flex items-center justify-center z-10">

                <span className="w-3 h-3 bg-primary rounded-full" />

              </div>

              <p className="text-sm font-semibold mt-3">
                Now
              </p>

              <p className="text-xl font-bold text-primary mt-1">
                {predictionResult.current_bmi.toFixed(2)}
              </p>

            </div>


            {/* Arrow / Change */}

            <div className="flex flex-col items-center z-10">

              <div className="bg-white px-4 py-2 rounded-full border border-orange-100 shadow-sm">

                <span className="text-primary font-bold">

                  {predictionResult.predicted_bmi_change >= 0
                    ? "+"
                    : ""}

                  {predictionResult.predicted_bmi_change.toFixed(2)}

                </span>

              </div>

              <span className="text-xs text-textSecondary mt-2">
                estimated change
              </span>

            </div>


            {/* Future Point */}

            <div className="flex flex-col items-center">

              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center z-10 shadow-md">

                <span className="w-3 h-3 bg-white rounded-full" />

              </div>

              <p className="text-sm font-semibold mt-3">
                7 Days
              </p>

              <p className="text-xl font-bold text-primary mt-1">
                {predictionResult.predicted_future_bmi.toFixed(2)}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* Model Influence */}

<div className="mt-10">

  <div>
    <h3 className="text-lg font-bold">
      📊 Factors Contributing to Your Prediction
    </h3>

    <p className="text-sm text-textSecondary mt-1">
      These factors had the strongest influence on this model prediction.
    </p>
  </div>


  <div className="mt-6 space-y-5">

    {predictionResult.shap_factors?.map((factor, index) => {

      const featureNames = {
        height_cm: "Height",
        weight_kg: "Weight",
        daily_steps: "Daily Steps",
        fitiq_bmi: "Current BMI",
        duration_minutes: "Exercise Duration",
        age: "Age",
        hours_sleep: "Sleep",
        hydration_level: "Hydration",
        stress_level: "Stress Level"
      };

      const label =
        featureNames[factor.feature] || factor.feature;

      const maxImpact = Math.max(
        ...predictionResult.shap_factors.map(
          item => Math.abs(item.impact)
        )
      );

      const barWidth =
        maxImpact > 0
          ? (Math.abs(factor.impact) / maxImpact) * 100
          : 0;

      const positive = factor.impact >= 0;

      return (

        <div key={factor.feature}>

          {/* Feature Header */}

          <div className="flex items-center justify-between mb-2">

            <div className="flex items-center gap-2">

              <span className="font-medium">
                {label}
              </span>

              <span
                className={`text-xs font-bold ${
                  positive
                    ? "text-primary"
                    : "text-blue-600"
                }`}
              >
                {positive ? "↑" : "↓"}
              </span>

            </div>


            <span className="text-xs text-textSecondary">
              {factor.impact >= 0 ? "+" : ""}
              {factor.impact.toFixed(3)}
            </span>

          </div>


          {/* Influence Bar */}

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                positive
                  ? "bg-primary"
                  : "bg-blue-400"
              }`}
              style={{
                width: `${barWidth}%`,
                transitionDelay: `${index * 100}ms`
              }}
            />

          </div>

        </div>

      );

    })}

  </div>


  <div className="mt-5 bg-gray-50 rounded-xl p-4">

    <p className="text-xs text-textSecondary">
      ↑ indicates a positive contribution to the predicted BMI change,
      while ↓ indicates a negative contribution. These represent model
      influence, not direct cause-and-effect relationships.
    </p>

  </div>

</div>
      {/* ================= CONSISTENCY FORECAST ================= */}

      {consistencyPrediction && consistencyPrediction.status === "success" && (

        <div className="mt-10 border border-gray-100 rounded-2xl p-6 bg-white">

          {/* Section Header */}

          <div className="flex items-start justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <span className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  📈
                </span>

                <div>
                  <h3 className="text-lg font-bold">
                    Consistency Forecast
                  </h3>

                  <p className="text-sm text-textSecondary mt-1">
                    Your recent routine and projected consistency
                  </p>
                </div>

              </div>

            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                consistencyPrediction.trend === "improving"
                  ? "bg-green-50 text-green-600"
                  : consistencyPrediction.trend === "declining"
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {consistencyPrediction.trend === "improving"
                ? "↑ Improving"
                : consistencyPrediction.trend === "declining"
                ? "↓ Declining"
                : "→ Stable"}
            </span>

          </div>


          {/* Score Cards */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

            {/* Current */}

            <div className="bg-gray-50 rounded-xl p-5">

              <p className="text-sm text-textSecondary">
                Current Consistency
              </p>

              <p className="text-3xl font-bold text-primary mt-2">
                {consistencyPrediction.current_score.toFixed(1)}%
              </p>

            </div>


            {/* Projected */}

            <div className="bg-orange-50 rounded-xl p-5">

              <p className="text-sm text-textSecondary">
                7-Day Projected Consistency
              </p>

              <p className="text-3xl font-bold text-primary mt-2">
                {consistencyPrediction.projected_score.toFixed(1)}%
              </p>

            </div>


            {/* Change */}

            <div className="bg-gray-50 rounded-xl p-5">

              <p className="text-sm text-textSecondary">
                Trend Change
              </p>

              <p
                className={`text-3xl font-bold mt-2 ${
                  consistencyPrediction.change >= 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {consistencyPrediction.change >= 0 ? "+" : ""}
                {consistencyPrediction.change.toFixed(1)}
              </p>

              <p className="text-xs text-textSecondary mt-1">
                percentage points
              </p>

            </div>

          </div>


          {/* Daily Trend */}

          <div className="mt-8">

            <div className="flex items-center justify-between mb-4">

              <div>

                <h4 className="font-semibold">
                  Recent Consistency
                </h4>

                <p className="text-xs text-textSecondary mt-1">
                  Based on your latest tracked days
                </p>

              </div>

              <span className="text-xs text-textSecondary">
                {consistencyPrediction.daily_scores.length} days
              </span>

            </div>


            {/* Bars */}

            <div className="flex items-end gap-3 h-32">

              {consistencyPrediction.daily_scores.map(
                (score, index) => {

                  const height = Math.max(
                    score,
                    8
                  );

                  return (

                    <div
                      key={index}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-2"
                    >

                      <span className="text-xs font-semibold text-textSecondary">
                        {score.toFixed(0)}%
                      </span>

                      <div className="w-full max-w-12 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-end">

                        <div
                          className="w-full bg-primary rounded-lg transition-all duration-1000"
                          style={{
                            height: `${height}%`,
                            transitionDelay: `${index * 100}ms`
                          }}
                        />

                      </div>

                      <span className="text-[10px] text-textSecondary">
                        Day {index + 1}
                      </span>

                    </div>

                  );

                }
              )}

            </div>

          </div>


          {/* Forecast Insight */}

          <div className="mt-7 bg-gray-50 rounded-xl p-4">

            <div className="flex items-start gap-3">

              <span className="text-lg">
                💡
              </span>

              <p className="text-sm text-textSecondary leading-relaxed">
                {consistencyPrediction.message}
              </p>

            </div>

          </div>


          {/* Explanation */}

          <div className="mt-4 flex items-start gap-2 text-xs text-textSecondary">

            <span>ⓘ</span>

            <p>
              This forecast is based on your recent tracking
              consistency and identifies short-term behavioral
              trends. It is not a medical prediction.
            </p>

          </div>

        </div>

      )}
      {/* Interpretation */}
      <div className="mt-10 bg-orange-50 border border-orange-100 rounded-2xl p-6">

        <div className="flex items-start gap-4">

          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shrink-0">
            💡
          </div>

          <div>

            <h3 className="font-bold text-lg">
              FitIQ Insight
            </h3>

            <p className="text-textSecondary mt-2 leading-relaxed">

              Based on your current measurements and recent
              activity patterns, FitIQ estimates your BMI to
              change by{" "}

              <strong className="text-gray-900">

                {predictionResult.predicted_bmi_change >= 0
                  ? "+"
                  : ""}

                {predictionResult.predicted_bmi_change.toFixed(2)}

              </strong>

              {" "}in the short term.

            </p>

          </div>

        </div>

      </div>


      {/* Model Note */}
      <div className="mt-5 flex items-start gap-2 text-xs text-textSecondary">

        <span>ⓘ</span>

        <p>
          This prediction is generated by FitIQ's trained
          machine-learning model using fitness and activity data.
          It is an estimate for analytical purposes and is not
          a medical prediction.
        </p>

      </div>

    </div>

  )}

</div>
{/* ==================== E4 COHORT INTELLIGENCE ==================== */}

<section className="mt-8">

  <div className="mb-6">
    <p className="text-sm font-medium text-[#C65D3B]">
      E4 • Cohort Intelligence
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-1">
      Your Fitness Cohort
    </h2>

    <p className="text-sm text-gray-500 mt-1">
      See how your current fitness profile compares with similar participants.
    </p>
  </div>

  {cohortLoading && (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#C65D3B] border-t-transparent rounded-full animate-spin" />

        <p className="text-sm text-gray-500">
          Finding your closest fitness cohort...
        </p>
      </div>
    </div>
  )}

  {cohortError && !cohortLoading && (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
      <p className="text-sm font-medium text-red-700">
        Unable to generate cohort analysis
      </p>

      <p className="text-sm text-red-600 mt-1">
        {cohortError}
      </p>
    </div>
  )}

  {cohortResult?.status === "success" && !cohortLoading && (
    <>
      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">
            Similar participants
          </p>

          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-bold text-gray-900">
              {cohortResult.cohort_size}
            </span>

            <span className="text-sm text-gray-500 mb-1">
              people
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Selected from the real-world FitIQ survey dataset
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">
            Cohort similarity
          </p>

          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-bold text-[#C65D3B]">
              {cohortResult.average_similarity?.toFixed(1)}%
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Average similarity across your selected cohort
          </p>
        </div>

      </div>

      {/* Cohort insight */}
      <div className="mt-4 bg-[#FFF7F3] border border-[#F3D8CC] rounded-2xl p-5">

        <div className="flex items-start gap-3">

          <div className="w-10 h-10 rounded-xl bg-[#C65D3B] text-white flex items-center justify-center shrink-0">
            ✦
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              Cohort Insight
            </p>

            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {cohortResult.message}
            </p>
          </div>

        </div>

      </div>

      
{/* ==================== E4 COHORT COMPARISON ==================== */}

<div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-900">
      Your Profile vs Similar Participants
    </h3>

    <p className="text-sm text-gray-500 mt-1">
      Compare your current habits with the average profile of your closest cohort.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {/* BMI */}
    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          BMI
        </span>

        <span className="text-xs text-gray-400">
          Body composition
        </span>
      </div>

      <div className="flex items-end gap-8 mt-5">

        <div>
          <p className="text-xs text-gray-400 mb-1">You</p>
          <p className="text-2xl font-bold text-[#C65D3B]">
            {cohortResult.comparisons.bmi.user}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Cohort</p>
          <p className="text-2xl font-bold text-gray-800">
            {cohortResult.comparisons.bmi.cohort}
          </p>
        </div>

      </div>

      <div className="relative mt-5 h-2 bg-gray-200 rounded-full">

        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300" />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#C65D3B] border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.bmi.user /
                Math.max(
                  cohortResult.comparisons.bmi.user,
                  cohortResult.comparisons.bmi.cohort
                )) * 100,
              100
            )}%`
          }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-700 border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.bmi.cohort /
                Math.max(
                  cohortResult.comparisons.bmi.user,
                  cohortResult.comparisons.bmi.cohort
                )) * 100,
              100
            )}%`
          }}
        />

      </div>

      <div className="flex justify-between mt-3 text-xs text-gray-400">
        <span>You</span>
        <span>Cohort</span>
      </div>
    </div>


    {/* DAILY STEPS */}
    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Daily Steps
        </span>

        <span className="text-xs text-gray-400">
          Daily activity
        </span>
      </div>

      <div className="flex items-end gap-8 mt-5">

        <div>
          <p className="text-xs text-gray-400 mb-1">You</p>
          <p className="text-2xl font-bold text-[#C65D3B]">
            {Math.round(cohortResult.comparisons.daily_steps.user).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Cohort</p>
          <p className="text-2xl font-bold text-gray-800">
            {Math.round(cohortResult.comparisons.daily_steps.cohort).toLocaleString()}
          </p>
        </div>

      </div>

      <div className="relative mt-5 h-2 bg-gray-200 rounded-full">

        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300" />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#C65D3B] border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.daily_steps.user /
                Math.max(
                  cohortResult.comparisons.daily_steps.user,
                  cohortResult.comparisons.daily_steps.cohort
                )) * 100,
              100
            )}%`
          }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-700 border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.daily_steps.cohort /
                Math.max(
                  cohortResult.comparisons.daily_steps.user,
                  cohortResult.comparisons.daily_steps.cohort
                )) * 100,
              100
            )}%`
          }}
        />

      </div>

      <div className="flex justify-between mt-3 text-xs text-gray-400">
        <span>You</span>
        <span>Cohort</span>
      </div>

    </div>


    {/* EXERCISE */}
    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Exercise Days
        </span>

        <span className="text-xs text-gray-400">
          Weekly routine
        </span>
      </div>

      <div className="flex items-end gap-8 mt-5">

        <div>
          <p className="text-xs text-gray-400 mb-1">You</p>
          <p className="text-2xl font-bold text-[#C65D3B]">
            {cohortResult.comparisons.exercise_days.user}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Cohort</p>
          <p className="text-2xl font-bold text-gray-800">
            {cohortResult.comparisons.exercise_days.cohort}
          </p>
        </div>

      </div>

      <div className="relative mt-5 h-2 bg-gray-200 rounded-full">

        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300" />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#C65D3B] border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.exercise_days.user /
                Math.max(
                  cohortResult.comparisons.exercise_days.user,
                  cohortResult.comparisons.exercise_days.cohort
                )) * 100,
              100
            )}%`
          }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-700 border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.exercise_days.cohort /
                Math.max(
                  cohortResult.comparisons.exercise_days.user,
                  cohortResult.comparisons.exercise_days.cohort
                )) * 100,
              100
            )}%`
          }}
        />

      </div>

      <div className="flex justify-between mt-3 text-xs text-gray-400">
        <span>You</span>
        <span>Cohort</span>
      </div>

    </div>


    {/* SLEEP */}
    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Sleep
        </span>

        <span className="text-xs text-gray-400">
          Recovery
        </span>
      </div>

      <div className="flex items-end gap-8 mt-5">

        <div>
          <p className="text-xs text-gray-400 mb-1">You</p>
          <p className="text-2xl font-bold text-[#C65D3B]">
            {cohortResult.comparisons.sleep.user}h
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Cohort</p>
          <p className="text-2xl font-bold text-gray-800">
            {cohortResult.comparisons.sleep.cohort}h
          </p>
        </div>

      </div>

      <div className="relative mt-5 h-2 bg-gray-200 rounded-full">

        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300" />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#C65D3B] border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.sleep.user /
                Math.max(
                  cohortResult.comparisons.sleep.user,
                  cohortResult.comparisons.sleep.cohort
                )) * 100,
              100
            )}%`
          }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-700 border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.sleep.cohort /
                Math.max(
                  cohortResult.comparisons.sleep.user,
                  cohortResult.comparisons.sleep.cohort
                )) * 100,
              100
            )}%`
          }}
        />

      </div>

      <div className="flex justify-between mt-3 text-xs text-gray-400">
        <span>You</span>
        <span>Cohort</span>
      </div>

    </div>


    {/* WATER */}
    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Water Intake
        </span>

        <span className="text-xs text-gray-400">
          Hydration
        </span>
      </div>

      <div className="flex items-end gap-8 mt-5">

        <div>
          <p className="text-xs text-gray-400 mb-1">You</p>
          <p className="text-2xl font-bold text-[#C65D3B]">
            {cohortResult.comparisons.water.user}L
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Cohort</p>
          <p className="text-2xl font-bold text-gray-800">
            {cohortResult.comparisons.water.cohort}L
          </p>
        </div>

      </div>

      <div className="relative mt-5 h-2 bg-gray-200 rounded-full">

        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300" />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#C65D3B] border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.water.user /
                Math.max(
                  cohortResult.comparisons.water.user,
                  cohortResult.comparisons.water.cohort
                )) * 100,
              100
            )}%`
          }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-700 border-2 border-white shadow"
          style={{
            left: `${Math.min(
              (cohortResult.comparisons.water.cohort /
                Math.max(
                  cohortResult.comparisons.water.user,
                  cohortResult.comparisons.water.cohort
                )) * 100,
              100
            )}%`
          }}
        />

      </div>

      <div className="flex justify-between mt-3 text-xs text-gray-400">
        <span>You</span>
        <span>Cohort</span>
      </div>

    </div>


    {/* CONSISTENCY */}
    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Consistency
        </span>

        <span className="text-xs text-gray-400">
          Routine
        </span>
      </div>

      <div className="flex items-end gap-8 mt-5">

        <div>
          <p className="text-xs text-gray-400 mb-1">You</p>
          <p className="text-2xl font-bold text-[#C65D3B]">
            {cohortResult.comparisons.consistency.user}%
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Cohort</p>
          <p className="text-2xl font-bold text-gray-800">
            {cohortResult.comparisons.consistency.cohort}%
          </p>
        </div>

      </div>

      <div className="relative mt-5 h-2 bg-gray-200 rounded-full">

        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300" />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#C65D3B] border-2 border-white shadow"
          style={{
            left: `${Math.min(
              cohortResult.comparisons.consistency.user,
              100
            )}%`
          }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-700 border-2 border-white shadow"
          style={{
            left: `${Math.min(
              cohortResult.comparisons.consistency.cohort,
              100
            )}%`
          }}
        />

      </div>

      <div className="flex justify-between mt-3 text-xs text-gray-400">
        <span>You</span>
        <span>Cohort</span>
      </div>

    </div>

  </div>

  {/* Legend */}
  <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500">

    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-[#C65D3B]" />
      You
    </div>

    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
      Similar cohort
    </div>

  </div>

</div>
   </>
  )}
</section>

      {/* ================= BODY ANALYSIS ================= */}
      {profile?.bodyAnalysis && (
        <div className="bg-white p-6 rounded-2xl shadow-card">

          <h2 className="text-2xl font-bold mb-4">
            ⚖️ Body Analysis
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div>
              <p className="text-sm text-textSecondary">BMI</p>
              <p className="font-bold">
                {profile.bodyAnalysis.bmi}
              </p>
            </div>

            <div>
              <p className="text-sm text-textSecondary">Category</p>
              <p className="font-bold">
                {profile.bodyAnalysis.category}
              </p>
            </div>

            <div>
              <p className="text-sm text-textSecondary">BMR</p>
              <p className="font-bold">
                {profile.bodyAnalysis.bmr} kcal
              </p>
            </div>

            <div>
              <p className="text-sm text-textSecondary">TDEE</p>
              <p className="font-bold">
                {profile.bodyAnalysis.tdee} kcal
              </p>
            </div>

          </div>

          <p className="text-sm text-textSecondary mt-4">
            Ideal weight range:{" "}
            {profile.bodyAnalysis.idealWeight.min} kg –{" "}
            {profile.bodyAnalysis.idealWeight.max} kg
          </p>

        </div>
      )}

    </div>
  </>
)}

  {activePage === "profile" && (
  <>
    <h1 className="text-4xl font-bold mb-8">
      👤 Profile
    </h1>

    {profile && (
      <div className="bg-white p-6 rounded-2xl shadow-card max-w-md mx-auto">

        <h2 className="text-2xl font-bold mb-4">
          Your Details
        </h2>

        <p>Age: {profile.age}</p>
        <p>Height: {profile.height} cm</p>
        <p>Weight: {profile.weight} kg</p>
        <p>Goal: {profile.goal}</p>
        <p>Activity Level: {profile.activityLevel}</p>
        <p>Diet: {profile.dietPreference}</p>

        <button
          onClick={() => navigate("/profile-setup?edit=true")}
          className="mt-6 bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-orange-700 transition"
        >
          Edit Profile
        </button>

      </div>
    )}

  </>
)}

  {activePage === "nutrition" && (
  <>
    <h1 className="text-4xl font-bold mb-8">
      🥗 Nutrition
    </h1>

    {profile && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">

        <div className="bg-white p-6 rounded-2xl shadow-card">
          <h2 className="text-xl font-bold">
            🔥 Daily Calories
          </h2>

          <p className="text-3xl text-primary mt-4">
            {profile.bodyAnalysis?.tdee || "N/A"} kcal
          </p>
        </div>


        <div className="bg-white p-6 rounded-2xl shadow-card">
          <h2 className="text-xl font-bold">
            💧 Water Intake
          </h2>

          <p className="text-3xl text-primary mt-4">
            {profile.waterIntake || 0} L
          </p>
        </div>


        <div className="bg-white p-6 rounded-2xl shadow-card">
          <h2 className="text-xl font-bold">
            🍽 Meals Per Day
          </h2>

          <p className="text-3xl text-primary mt-4">
            {profile.mealsPerDay || "N/A"}
          </p>
        </div>


        <div className="bg-white p-6 rounded-2xl shadow-card">
          <h2 className="text-xl font-bold">
            🥦 Diet Preference
          </h2>

          <p className="text-xl mt-4">
            {profile.dietPreference}
          </p>
        </div>

      </div>
    )}
  </>
)}

  {activePage === "workout" && (
    <h1 className="text-4xl font-bold">
      Workout
    </h1>
  )}
  {activePage === "tracking" && (
  <DailyTracking />
)}

{activePage === "recommendations" && (
   <Recommendation />
)}

</div>

  </div>

</div>

  );
}

export default Dashboard;