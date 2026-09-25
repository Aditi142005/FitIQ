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
  getLast7DaysTracking,
  getStreakData
} from "../services/firestoreService";
import { useNavigate} from "react-router-dom";
import { logout } from "../services/authService";
import Sidebar from "../components/Sidebar";
import { analyzeBehavior } from "../services/behaviorService";
import { getPrediction } from "../services/predictionService";
import { getConsistencyPrediction } from "../services/consistencyPredictionService";
import { getCohortAnalysis } from "../services/cohortService";
import { getAnomalyAnalysis } from "../services/anomalyService";
import { getComprehensiveInterpretation } from "../services/interpretationService";

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPastDateKey = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getDateKey(date);
};

const calculateGoalStreak = (history = {}) => {
  let streak = 0;
  let offset = history[getPastDateKey(0)]?.completed ? 0 : 1;

  while (history[getPastDateKey(offset)]?.completed) {
    streak += 1;
    offset += 1;
  }

  return streak;
};

const calculateBestStreak = (history = {}) => {
  const completedDates = Object.keys(history)
    .filter((date) => history[date]?.completed)
    .sort();

  if (!completedDates.length) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < completedDates.length; i += 1) {
    const previous = new Date(`${completedDates[i - 1]}T00:00:00`);
    const currentDate = new Date(`${completedDates[i]}T00:00:00`);
    const diff = Math.round((currentDate - previous) / 86400000);

    if (diff === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
};

const getActivityScore = (record) => {
  if (!record) return 0;

  const steps = Math.min(Number(record.steps) || 0, 10000) / 10000;
  const exercise = Math.min(Number(record.exerciseMinutes) || 0, 60) / 60;
  const sleep = Math.min(Number(record.sleepHours) || 0, 8) / 8;
  const water = Math.min(Number(record.waterIntake) || 0, 3) / 3;
  const workout = record.workoutCompleted ? 1 : 0;

  return Math.round(
    steps * 35 + exercise * 25 + sleep * 15 + water * 15 + workout * 10
  );
};

function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
const [trackingRecords, setTrackingRecords] = useState([]);
   // E6 Nutrition Intelligence
  const [nutritionData, setNutritionData] = useState(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState("");

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
const [anomalyResult, setAnomalyResult] = useState(null);
const [anomalyLoading, setAnomalyLoading] = useState(false);
const [anomalyError, setAnomalyError] = useState(null);
// Engine 7 — Comprehensive Interpretation
const [interpretationResult, setInterpretationResult] = useState(null);
const [interpretationLoading, setInterpretationLoading] = useState(false);
const [interpretationError, setInterpretationError] = useState(null);
const [techModeEnabled, setTechModeEnabled] = useState(false);
const toggleGoal = async (goal) => {
  const user = auth.currentUser;
  if (!user) return;

  const previousGoals = goals;

  const updatedGoals = {
    ...goals,
    [goal]: !goals[goal],
  };

  setGoals(updatedGoals);

  try {
    await updateDailyGoals(user.uid, updatedGoals);

    const completed = Object.values(updatedGoals).every(Boolean);
    setTodayCompleted(completed);

    // Recalculate streak from Firestore
    const streakData = await getStreakData(user.uid);

    setStreak(streakData.currentStreak);
    setBestStreak(streakData.bestStreak);

  } catch (error) {
    console.error("Unable to save daily goal:", error);

    setGoals(previousGoals);

    alert("Unable to save this goal. Please try again.");
  }
};

const loadNutritionData = async () => {
  if (!profile) return;

  try {
    setNutritionLoading(true);
    setNutritionError("");

    const response = await fetch(
      "http://127.0.0.1:5000/nutrition",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: Number(profile.age),
          gender: profile.gender,
          height_cm: Number(profile.height),
          weight_kg: Number(profile.weight),
          activity_level: profile.activityLevel || "moderate",
          goal: profile.goal || "maintenance",
          diet_type: profile.dietPreference || "mixed",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      throw new Error(
        data.message || "Unable to generate nutrition recommendations."
      );
    }

    console.log("E6 NUTRITION RESULT:", data);

    setNutritionData(data);

  } catch (error) {

    console.error("E6 Nutrition Error:", error);

    setNutritionError(
      error.message || "Unable to generate nutrition recommendations."
    );

  } finally {
    setNutritionLoading(false);
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

// E6 Nutrition Intelligence
try {
  setNutritionLoading(true);

  const nutritionInput = {
    age: Number(data.age),
    gender: data.gender,
    height_cm: Number(data.height),
    weight_kg: Number(data.weight),
    activity_level: data.activityLevel || "moderate",
    goal: data.goal || "maintenance",
    diet_type: data.dietPreference || "mixed",
  };

  console.log("E6 NUTRITION INPUT:", nutritionInput);

  const nutritionResponse = await fetch(
    "http://127.0.0.1:5000/nutrition",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nutritionInput),
    }
  );

  const nutritionResult = await nutritionResponse.json();

  if (!nutritionResponse.ok || nutritionResult.status !== "success") {
    throw new Error(
      nutritionResult.message ||
      "Unable to generate nutrition recommendations."
    );
  }

  console.log(
    "E6 NUTRITION RESULT:",
    nutritionResult
  );

  setNutritionData(nutritionResult);

} catch (error) {

  console.error(
    "E6 Nutrition analysis failed:",
    error
  );

  setNutritionError(
    error.message ||
    "Unable to generate nutrition recommendations."
  );

} finally {

  setNutritionLoading(false);

}

const trackingData = await getDailyTracking(user.uid);

setDailyTrackingRecorded(!!trackingData);

// Get tracking records
const trackingRecords = await getWeeklyTracking(user.uid);
setTrackingRecords(trackingRecords);
console.log("FIS TRACKING RECORDS:", trackingRecords);
const behaviorData = await analyzeBehavior(trackingRecords);

console.log("BEHAVIOR RESULT:", behaviorData);

setBehaviorResult(behaviorData);
// Local refs to capture engine results for E7 interpretation
// (React setState is async and won't reflect in the same execution frame)
let _predictionData = null;
let _consistencyData = null;
let _cohortData = null;
let _anomalyData = null;

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

  _predictionData = predictionData;
  setPredictionResult(predictionData);
  const consistencyData = await getConsistencyPrediction(
  trackingRecords
);

console.log(
  "E3 CONSISTENCY FORECAST:",
  consistencyData
);

_consistencyData = consistencyData;
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

_cohortData = cohortData;
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

// ================= E5 ANOMALY & ACTIVITY PATTERNS =================

try {
  setAnomalyLoading(true);
  setAnomalyError(null);

  const anomalyData = await getAnomalyAnalysis(
  trackingRecords
);

  console.log("E5 ANOMALY RESULT:", anomalyData);

  _anomalyData = anomalyData;
  setAnomalyResult(anomalyData);
} catch (error) {
  console.error("E5 anomaly analysis failed:", error);

  setAnomalyError(
    error.message || "Unable to generate anomaly analysis"
  );
} finally {
  setAnomalyLoading(false);
}

const fisInput = prepareFisInput(data, trackingRecords);
console.log("FIS INPUT:", fisInput);
const fisData = await calculateFis(fisInput);

console.log("FIS RESULT:", fisData);

setFisResult(fisData);

// ================= E7 COMPREHENSIVE INTERPRETATION =================
try {
  setInterpretationLoading(true);
  setInterpretationError(null);

  const nutritionSnapshot = await fetch("http://127.0.0.1:5000/nutrition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      age: Number(data.age),
      gender: data.gender,
      height_cm: Number(data.height),
      weight_kg: Number(data.weight),
      activity_level: data.activityLevel || "moderate",
      goal: data.goal || "maintenance",
      diet_type: data.dietPreference || "mixed",
    }),
  });
  const nutritionSnap = nutritionSnapshot.ok ? await nutritionSnapshot.json() : null;

  const interpretData = await getComprehensiveInterpretation({
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
} catch (e7err) {
  console.error("E7 Interpretation failed:", e7err);
  setInterpretationError(
    e7err.message || "Personalized explanation is temporarily unavailable."
  );
} finally {
  setInterpretationLoading(false);
}
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
      setGoals(data.dailyGoals || defaultGoals);
      setTodayCompleted(Boolean(data.todayCompleted));
    } else {
      setGoals(defaultGoals);
      setTodayCompleted(false);
      await updateDailyGoals(user.uid, defaultGoals);
      const streakData = await getStreakData(user.uid);

setStreak(streakData.currentStreak);
setBestStreak(streakData.bestStreak);
    }

    const streakData = await getStreakData(user.uid);

setStreak(streakData.currentStreak);
setBestStreak(streakData.bestStreak);
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

    <Sidebar setActivePage={setActivePage} activePage={activePage} />

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
      <div className="max-w-7xl mx-auto text-left">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">
              E7 • Fitness Intelligence Dashboard
            </p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-textPrimary mt-2">
              Welcome back, {profile?.name || "there"} 👋
            </h1>
            <p className="text-base md:text-lg text-textSecondary mt-2">
              See your progress, understand your trends, and know what to focus on today.
            </p>
          </div>

          <button
            onClick={() => setActivePage("tracking")}
            className="self-start lg:self-auto bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:bg-orange-700 transition shadow-sm"
          >
            + Daily Check-in
          </button>
        </div>

        {profile && (
          <>
            {/* Snapshot */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="bg-white rounded-2xl shadow-card p-5 border border-orange-50">
                <p className="text-sm text-textSecondary">Fitness Score</p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {fisResult?.fis ?? "—"}<span className="text-base text-gray-400">/100</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">E1 FIS</p>
              </div>

              <div className="bg-white rounded-2xl shadow-card p-5">
                <p className="text-sm text-textSecondary">Weekly Tracking</p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {trackingDays}<span className="text-base text-gray-400">/7</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{trackingConsistency}% recorded</p>
              </div>

              <div className="bg-white rounded-2xl shadow-card p-5">
                <p className="text-sm text-textSecondary">BMI</p>
                <p className="text-3xl font-bold text-primary mt-2">{profile.bodyAnalysis?.bmi ?? "—"}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {profile.bodyAnalysis?.category || "Body composition"}
                </p>
              </div>

              <div className="bg-primary text-white rounded-2xl shadow-card p-5">
                <p className="text-sm opacity-80">Current Streak</p>
                <p className="text-4xl font-bold mt-2">{streak}</p>
                <p className="text-xs opacity-80 mt-1">days</p>
              </div>
            </div>

            {/* Health + profile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-2xl shadow-card p-5 border border-green-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-textSecondary">Health Assessment</p>
                  <span className="text-xl">❤️</span>
                </div>
                <p className="text-3xl font-bold text-green-600 mt-2">{healthScore}/100</p>
                <p className="text-xs text-gray-400 mt-1">
                  {healthScore >= 85 ? "Excellent" : healthScore >= 70 ? "Good" : healthScore >= 50 ? "Needs improvement" : "Complete your assessment"}
                </p>
                <button
                  onClick={() => navigate("/health-assessment?update=true")}
                  className="mt-4 w-full bg-green-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-green-600 transition"
                >
                  Update Health Assessment
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-card p-5">
                <p className="text-sm text-textSecondary">Weight</p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {profile.weight ?? "—"}<span className="text-base text-gray-400"> kg</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Current profile weight</p>
              </div>

              <div className="bg-white rounded-2xl shadow-card p-5">
                <p className="text-sm text-textSecondary">Activity Level</p>
                <p className="text-xl font-bold text-primary mt-3 capitalize">
                  {profile.activityLevel || "Not set"}
                </p>
                <p className="text-xs text-gray-400 mt-1">From your profile</p>
              </div>
            </div>

            {/* 7-day activity */}
            <div className="bg-white rounded-2xl shadow-card p-6 mt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">📈 7-Day Activity</h2>
                  <p className="text-sm text-textSecondary mt-1">
                    Daily steps from your latest tracking records.
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">{trackingDays}/7 tracked</span>
              </div>

              <div className="mt-7 h-48 flex items-end gap-2 sm:gap-3">
                {(last7DaysTracking.length
                  ? last7DaysTracking
                  : Array.from({ length: 7 }, (_, i) => ({
                      date: getPastDateKey(6 - i),
                      recorded: false
                    }))
                ).map((day) => {
                  const record = trackingRecords.find((item) => item.date === day.date);
                  const steps = Number(record?.steps || 0);
                  const weekRecords = last7DaysTracking.map((d) =>
                    Number(trackingRecords.find((r) => r.date === d.date)?.steps || 0)
                  );
                  const maxSteps = Math.max(10000, ...weekRecords);
                  const height = record ? Math.max(8, Math.min(100, (steps / maxSteps) * 100)) : 6;
                  const date = new Date(`${day.date}T00:00:00`);

                  return (
                    <div key={day.date} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                      <span className="text-[10px] font-semibold text-gray-500">
                        {record ? steps.toLocaleString() : "—"}
                      </span>
                      <div className="w-full max-w-14 h-32 bg-orange-50 rounded-xl overflow-hidden flex items-end">
                        <div
                          className={`w-full rounded-xl transition-all duration-700 ${
                            record ? "bg-primary" : "bg-orange-100"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-textSecondary">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Actual steps are shown here; missing tracking days remain empty.
              </p>
            </div>

            {/* FIS breakdown */}
            <div className="bg-white rounded-2xl shadow-card p-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">❤️ Fitness Score Breakdown</h2>
                  <p className="text-sm text-textSecondary mt-1">
                    The five E1 dimensions behind your score.
                  </p>
                </div>
                <button
                  onClick={() => setActivePage("analytics")}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View analytics →
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  ["🏃", "Fitness & Activity", fisResult?.fitnessActivity?.score],
                  ["😴", "Recovery", fisResult?.recovery?.score],
                  ["⚖️", "Body Composition", fisResult?.bodyComposition?.score],
                  ["🥗", "Nutrition", fisResult?.nutrition?.score],
                  ["🔥", "Consistency", fisResult?.consistency?.score]
                ].map(([icon, label, score]) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{icon} {label}</span>
                      <span className="font-bold text-primary">
                        {score == null ? "—" : Math.round(score)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(0, Math.min(100, Number(score) || 0))}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 365-day Fitness Pulse */}
            <div className="bg-white rounded-2xl shadow-card p-6 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">🟠 Fitness Pulse</h2>
                  <p className="text-sm text-textSecondary mt-1">
                    365-day activity calendar. Darker cells mean stronger daily activity.
                  </p>
                </div>
                <div className="text-sm text-gray-500">365-day history</div>
              </div>

              <div className="mt-6 overflow-x-auto pb-2">
                <div className="min-w-[760px] grid grid-cols-12 gap-2">
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const now = new Date();
                    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + monthIndex, 1);
                    const year = monthDate.getFullYear();
                    const month = monthDate.getMonth();
                    const monthName = monthDate.toLocaleDateString("en-US", { month: "short" });
                    const daysInMonth = new Date(year, month + 1, 0).getDate();

                    return (
                      <div key={`${year}-${month}`} className="min-w-0">
                        <p className="text-[11px] font-semibold text-gray-500 text-center mb-2">
                          {monthName}
                        </p>
                        <div className="grid grid-cols-4 gap-1">
                          {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayIndex + 1).padStart(2, "0")}`;
                            const record = trackingRecords.find((item) => item.date === dateKey);
                            const score = getActivityScore(record);
                            const level = !record
                              ? 0
                              : score < 25
                              ? 1
                              : score < 55
                              ? 2
                              : score < 80
                              ? 3
                              : 4;

                            const cellClasses = [
                              "bg-gray-100",
                              "bg-orange-100",
                              "bg-orange-200",
                              "bg-orange-300",
                              "bg-primary"
                            ];

                            const date = new Date(`${dateKey}T00:00:00`);

                            return (
                              <div
                                key={dateKey}
                                title={`${date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })} • ${record ? `${score}% activity` : "No tracking"}`}
                                className={`h-3.5 rounded-sm ${cellClasses[level]} hover:ring-2 hover:ring-orange-200 transition`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>Less</span>
                {[
                  "bg-gray-100",
                  "bg-orange-100",
                  "bg-orange-200",
                  "bg-orange-300",
                  "bg-primary"
                ].map((color) => (
                  <span key={color} className={`w-3.5 h-3.5 rounded-sm ${color}`} />
                ))}
                <span>More</span>
              </div>
            </div>

            {/* Goals + weekly overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-card p-6 border border-orange-100">
                <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                  Today’s Goals
                </p>
                <h2 className="text-2xl font-bold mt-2">Choose what you complete today.</h2>
                <p className="text-sm text-textSecondary mt-2">
                  Your selections are saved and restored after refresh.
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    ["water", "💧", "Reach your water target"],
                    ["workout", "🏃", "Complete your workout"],
                    ["steps", "👣", "Reach your daily steps"],
                    ["sleep", "😴", "Meet your sleep target"]
                  ].map(([key, icon, label]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        goals[key]
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-orange-100 hover:border-orange-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(goals[key])}
                        onChange={() => toggleGoal(key)}
                        className="w-4 h-4 accent-orange-600"
                      />
                      <span className="text-lg">{icon}</span>
                      <span
                        className={`text-sm font-medium ${
                          goals[key] ? "text-green-700 line-through" : "text-gray-700"
                        }`}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-textSecondary">Today’s completion</span>
                  <span className="font-bold text-primary">
                    {Object.values(goals).filter(Boolean).length}/4
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">📊 Weekly Overview</h2>
                    <p className="text-sm text-textSecondary mt-1">
                      How well you met your weekly targets.
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">{trackingDays}/7 days</span>
                </div>

                {(() => {
                  const recent = last7DaysTracking
                    .map((day) => trackingRecords.find((item) => item.date === day.date))
                    .filter(Boolean);

                  const avgSteps = recent.length
                    ? Math.round(recent.reduce((sum, r) => sum + (Number(r.steps) || 0), 0) / recent.length)
                    : 0;
                  const avgWater = recent.length
                    ? recent.reduce((sum, r) => sum + (Number(r.waterIntake) || 0), 0) / recent.length
                    : 0;
                  const avgSleep = recent.length
                    ? recent.reduce((sum, r) => sum + (Number(r.sleepHours) || 0), 0) / recent.length
                    : 0;
                  const workoutDays = recent.filter(
                    (r) => r.workoutCompleted || Number(r.exerciseMinutes || 0) >= 30
                  ).length;

                  const metrics = [
                    ["👣", "Steps", `${avgSteps.toLocaleString()}/day`, Math.min(100, Math.round((avgSteps / 7500) * 100))],
                    ["💧", "Water", `${avgWater.toFixed(1)} L/day`, Math.min(100, Math.round((avgWater / 2) * 100))],
                    ["😴", "Sleep", `${avgSleep.toFixed(1)} h/day`, Math.min(100, Math.round((avgSleep / 7) * 100))],
                    ["🏃", "Exercise", `${workoutDays}/7 days`, Math.min(100, Math.round((workoutDays / 5) * 100))]
                  ];

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      {metrics.map(([icon, label, value, percent]) => (
                        <div key={label} className="rounded-xl bg-gray-50 p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold">{icon} {label}</span>
                            <span className="text-xs font-bold text-primary">{percent}%</span>
                          </div>
                          <p className="text-lg font-bold mt-2">{value}</p>
                          <div className="h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* E7 recommendations */}
            <div className="bg-white rounded-2xl shadow-card p-6 mt-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                    E7 • Personalized Recommendations
                  </p>
                  <h2 className="text-2xl font-bold mt-1">What should you do next?</h2>
                  <p className="text-sm text-textSecondary mt-1">
                    Personalized actions based on your FitIQ data.
                  </p>
                </div>
                <span className="text-2xl">🎯</span>
              </div>
              <Recommendation />
            </div>
          </>
        )}
      </div>
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
  <section className="bg-white p-6 rounded-2xl shadow-card">

    {/* Header */}
    <div>
      <p className="text-sm font-medium text-[#C65D3B]">
        E2 • Behavioral Pattern Mining
      </p>

      <h2 className="text-2xl font-bold text-gray-900 mt-1">
        Understand Your Habits
      </h2>

      <p className="text-sm text-textSecondary mt-1">
        FitIQ looks for patterns in how your daily habits move together.
      </p>
    </div>

    {/* Mode */}
    <div className="mt-5 p-4 rounded-xl bg-[#FFF7F3] border border-[#F3D8CC]">

      <p className="text-xs font-semibold text-[#C65D3B] uppercase tracking-wide">
        {behaviorResult.mode === "population"
          ? "Population Insight"
          : "Personal Insight"}
      </p>

      <p className="text-sm text-gray-700 mt-2 leading-relaxed">
        {behaviorResult.mode === "population"
          ? "Your personal tracking history is still limited, so FitIQ is using general fitness data to identify broad behavioral patterns."
          : "These patterns are based on your own recent tracking history."}
      </p>

    </div>

    {/* Habit Connections */}
    <div className="mt-6">

      <h3 className="text-lg font-bold text-gray-900">
        Your Habit Connections
      </h3>

      <p className="text-xs text-textSecondary mt-1 mb-4">
        These connections show whether two habits tend to move together in the data.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {behaviorResult.patterns
          ?.filter((pattern) => pattern.correlation !== null)
          .map((pattern, index) => {

            const relationshipNames = {
              sleep_steps: ["😴 Sleep", "👣 Activity"],
              sleep_exercise: ["😴 Sleep", "🏃 Exercise"],
              hydration_steps: ["💧 Hydration", "👣 Activity"],
              hydration_exercise: ["💧 Hydration", "🏃 Exercise"]
            };

            const names =
              relationshipNames[pattern.relationship] || [
                pattern.relationship,
                ""
              ];

            const correlation = Number(pattern.correlation);
            const absoluteCorrelation = Math.abs(correlation);

            let interpretation = "";
            let label = "";
            let connector = "";

            if (absoluteCorrelation < 0.3) {

              label = "No clear pattern";
              connector = "·";

              interpretation =
                "Your tracked data does not show a clear connection between these habits yet.";

            } else if (correlation > 0) {

              label =
                absoluteCorrelation >= 0.5
                  ? "Move together"
                  : "Slight connection";

              connector = "↗";

              interpretation =
                "These habits tended to increase or decrease together in your tracked data.";

            } else {

              label =
                absoluteCorrelation >= 0.5
                  ? "Move differently"
                  : "Slight inverse pattern";

              connector = "↘";

              interpretation =
                "These habits tended to move in opposite directions in your tracked data.";

            }

            return (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-5"
              >

                {/* Habit names */}
                <div className="flex items-center justify-between gap-3">

                  <div className="flex-1 text-center">
                    <p className="text-sm font-semibold text-gray-800">
                      {names[0]}
                    </p>
                  </div>

                  <div className="flex flex-col items-center shrink-0">

                    <span className="text-xl text-[#C65D3B]">
                      {connector}
                    </span>

                    <span className="text-xs font-semibold text-gray-500">
                      {correlation > 0 ? "+" : ""}
                      {correlation.toFixed(2)}
                    </span>

                  </div>

                  <div className="flex-1 text-center">
                    <p className="text-sm font-semibold text-gray-800">
                      {names[1]}
                    </p>
                  </div>

                </div>

                {/* Interpretation */}
                <div className="mt-4 text-center">

                  <span className="inline-flex px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600">
                    {label}
                  </span>

                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    {interpretation}
                  </p>

                </div>

              </div>
            );
          })}

      </div>

    </div>

    {/* What should you do? */}
    <div className="mt-5 p-4 rounded-xl bg-gray-50">

      <p className="font-semibold text-gray-800">
        💡 What should you do?
      </p>

      <p className="text-sm text-textSecondary mt-1 leading-relaxed">
        Keep tracking your sleep, hydration, exercise, and daily
        activity consistently. FitIQ can then check whether these
        patterns remain consistent over time.
      </p>

    </div>

    {/* Limitation */}
    <p className="text-xs text-gray-400 mt-4 leading-relaxed">
      A pattern does not mean that one habit causes another.
      FitIQ uses these relationships to understand your behavior,
      not to diagnose or predict cause and effect.
    </p>

  </section>
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

{/* ==================== E4 DYNAMIC PEER BENCHMARKING ==================== */}

<section className="mt-8">

  {/* Header */}
  <div className="mb-6">
    <p className="text-sm font-medium text-[#C65D3B]">
      E4 • Dynamic Peer Benchmarking
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-1">
      Your Fitness Benchmark
    </h2>

    <p className="text-sm text-gray-500 mt-1">
      See how your current fitness profile compares with similar profiles.
    </p>
  </div>

  {/* Loading */}
  {cohortLoading && (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
      <div className="w-8 h-8 border-2 border-[#C65D3B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />

      <p className="text-sm font-medium text-gray-700">
        Finding your closest benchmark profiles...
      </p>

      <p className="text-xs text-gray-400 mt-1">
        Comparing your profile with similar participants.
      </p>
    </div>
  )}

  {/* Error */}
  {cohortError && !cohortLoading && (
    <div className="bg-white rounded-2xl border border-red-100 p-6">
      <p className="text-sm font-semibold text-red-600">
        Unable to generate benchmark analysis
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Please try again after recording more profile information.
      </p>
    </div>
  )}

  {/* Success */}
  {cohortResult?.status === "success" && !cohortLoading && (
    <div className="space-y-5">

      {/* ==================== SUMMARY ==================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Similar profiles */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Similar benchmark profiles
          </p>

          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-gray-900">
              {cohortResult.cohort_size}
            </span>

            <span className="text-sm text-gray-500 mb-1">
              profiles
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-1">
            Selected based on profile similarity.
          </p>
        </div>

        {/* Similarity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Average profile match
          </p>

          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-[#C65D3B]">
              {cohortResult.average_similarity?.toFixed(1)}%
            </span>

            <span className="text-sm text-gray-500 mb-1">
              similarity
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-1">
            Average similarity across the selected profiles.
          </p>
        </div>

      </div>

      {/* ==================== COLD START INFO ==================== */}

      <div className="bg-[#FFF7F3] border border-[#F3D8CC] rounded-2xl p-5">

        <div className="flex gap-3">

          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
            <span className="text-[#C65D3B] text-sm">i</span>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800">
              Initial benchmark
            </p>

            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              This benchmark is currently based on 58 survey responses.
              These responses are used only to provide an initial comparison
              while FitIQ builds its own user population.
            </p>

            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              As FitIQ grows, the same benchmarking system can transition
              to real FitIQ user data.
            </p>
          </div>

        </div>

      </div>

      {/* ==================== BENCHMARK INSIGHT ==================== */}

      <div className="bg-white rounded-2xl border border-gray-100 p-5">

        <p className="text-xs font-medium text-[#C65D3B] uppercase tracking-wide">
          Benchmark insight
        </p>

        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
          {cohortResult.message}
        </p>

      </div>

      {/* ==================== PROFILE COMPARISON ==================== */}

      <div className="bg-white rounded-2xl border border-gray-100 p-5">

        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900">
            Your Profile vs Benchmark
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Compare your current values with the average of similar profiles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* BMI */}
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              BMI
            </p>

            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-xs text-gray-400">You</p>
                <p className="text-xl font-bold text-gray-900">
                  {cohortResult.comparisons.bmi.user?.toFixed(1)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">Benchmark</p>
                <p className="text-xl font-bold text-gray-700">
                  {cohortResult.comparisons.bmi.cohort?.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Steps */}
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              Daily Steps
            </p>

            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-xs text-gray-400">You</p>
                <p className="text-xl font-bold text-gray-900">
                  {Math.round(
                    cohortResult.comparisons.daily_steps.user || 0
                  ).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">Benchmark</p>
                <p className="text-xl font-bold text-gray-700">
                  {Math.round(
                    cohortResult.comparisons.daily_steps.cohort || 0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Exercise */}
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              Exercise Days
            </p>

            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-xs text-gray-400">You</p>
                <p className="text-xl font-bold text-gray-900">
                  {cohortResult.comparisons.exercise_days.user?.toFixed(1)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">Benchmark</p>
                <p className="text-xl font-bold text-gray-700">
                  {cohortResult.comparisons.exercise_days.cohort?.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Sleep */}
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              Sleep
            </p>

            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-xs text-gray-400">You</p>
                <p className="text-xl font-bold text-gray-900">
                  {cohortResult.comparisons.sleep.user?.toFixed(1)}h
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">Benchmark</p>
                <p className="text-xl font-bold text-gray-700">
                  {cohortResult.comparisons.sleep.cohort?.toFixed(1)}h
                </p>
              </div>
            </div>
          </div>

          {/* Water */}
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              Water Intake
            </p>

            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-xs text-gray-400">You</p>
                <p className="text-xl font-bold text-gray-900">
                  {cohortResult.comparisons.water.user?.toFixed(1)}L
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">Benchmark</p>
                <p className="text-xl font-bold text-gray-700">
                  {cohortResult.comparisons.water.cohort?.toFixed(1)}L
                </p>
              </div>
            </div>
          </div>

          {/* Consistency */}
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              Consistency
            </p>

            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-xs text-gray-400">You</p>
                <p className="text-xl font-bold text-gray-900">
                  {cohortResult.comparisons.consistency.user?.toFixed(0)}%
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">Benchmark</p>
                <p className="text-xl font-bold text-gray-700">
                  {cohortResult.comparisons.consistency.cohort?.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )}

</section>

{/* ================= E5 ACTIVITY PATTERN INTELLIGENCE ================= */}

<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

  {/* Header */}
  <div className="flex items-start justify-between mb-6">

    <div>
      <p className="text-sm font-semibold text-orange-600">
        E5 • ACTIVITY INTELLIGENCE
      </p>

      <h2 className="text-2xl font-bold text-gray-900 mt-1">
        Activity Pattern Intelligence
      </h2>

      <p className="text-sm text-gray-500 mt-1 max-w-2xl">
        Understand how your recent activity compares with your own routine.
      </p>
    </div>

    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl">
      🔎
    </div>

  </div>


  {/* Loading */}
  {anomalyLoading && (
    <div className="py-12 text-center">

      <div className="animate-spin w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full mx-auto mb-3"></div>

      <p className="text-gray-500 text-sm">
        Understanding your activity pattern...
      </p>

    </div>
  )}


  {/* Error */}
  {!anomalyLoading && anomalyError && (
    <div className="bg-red-50 border border-red-100 rounded-xl p-4">

      <p className="font-semibold text-red-700">
        Unable to load activity analysis
      </p>

      <p className="text-sm text-red-600 mt-1">
        {anomalyError}
      </p>

    </div>
  )}


  {/* Insufficient Data */}
  {!anomalyLoading &&
    !anomalyError &&
    anomalyResult?.status === "success" &&
    anomalyResult?.data_status === "insufficient_data" && (

      <div className="rounded-2xl bg-orange-50 border border-orange-100 p-6">

        <div className="flex items-start gap-4">

          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-xl">
            📊
          </div>

          <div>

            <h3 className="font-bold text-gray-900">
              {anomalyResult.insight?.title ||
                "Keep tracking to unlock activity insights"}
            </h3>

            <p className="text-sm text-gray-600 mt-1">
              {anomalyResult.insight?.message}
            </p>

            {anomalyResult.insight?.action && (
              <p className="text-sm font-semibold text-orange-700 mt-3">
                💡 {anomalyResult.insight.action}
              </p>
            )}

          </div>

        </div>

        <p className="text-xs text-gray-500 mt-5">
          {anomalyResult.records_used || 0} day
          {anomalyResult.records_used === 1 ? "" : "s"} recorded.
          Keep logging your activity so FitIQ can understand your personal
          baseline.
        </p>

      </div>
    )}

{/* Ready Result */}
{!anomalyLoading &&
  !anomalyError &&
  anomalyResult?.status === "success" &&
  anomalyResult?.data_status === "ready" && (

    <>

      {/* ================= MAIN INSIGHT ================= */}
      <div className="rounded-2xl bg-orange-50 border border-orange-100 p-5 mb-5">

        <div className="flex items-start gap-3">

          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-xl shrink-0">
            {anomalyResult.insight?.type === "activity_drop"
              ? "📉"
              : anomalyResult.insight?.type === "activity_increase"
              ? "📈"
              : anomalyResult.insight?.type === "stable"
              ? "🔥"
              : "💡"}
          </div>

          <div className="flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="text-lg font-bold text-gray-900">
                {anomalyResult.insight?.title}
              </h3>

              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white text-orange-700">
                Personal insight
              </span>

            </div>

            <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
              {anomalyResult.insight?.message}
            </p>

            {anomalyResult.insight?.action && (
              <div className="mt-3 flex items-start gap-2 bg-white rounded-xl px-3 py-2.5">

                <span className="text-sm">
                  💡
                </span>

                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    FitIQ suggestion
                  </p>

                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {anomalyResult.insight.action}
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>


      {/* ================= QUICK METRICS ================= */}
      <div className="grid grid-cols-3 gap-3 mb-5">

        {/* Recent */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">

          <p className="text-xs text-gray-500">
            Recent
          </p>

          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Number(anomalyResult.recent_activity || 0).toFixed(0)}%
          </p>

          <p className="text-[11px] text-gray-500 mt-0.5">
            Latest activity
          </p>

        </div>


        {/* Baseline */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">

          <p className="text-xs text-gray-500">
            Usual
          </p>

          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Number(anomalyResult.baseline_activity || 0).toFixed(0)}%
          </p>

          <p className="text-[11px] text-gray-500 mt-0.5">
            Your baseline
          </p>

        </div>


        {/* Stability */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">

          <div className="flex items-center justify-between">

            <p className="text-xs text-gray-500">
              Stability
            </p>

            <span className="text-sm">
              {Number(anomalyResult.stability || 0) >= 75
                ? "🟢"
                : Number(anomalyResult.stability || 0) >= 50
                ? "🟡"
                : "🔴"}
            </span>

          </div>

          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Number(anomalyResult.stability || 0).toFixed(0)}%
          </p>

          <p className="text-[11px] text-gray-500 mt-0.5">
            Routine consistency
          </p>

        </div>

      </div>


      {/* ================= RECENT VS USUAL ================= */}
      <div className="rounded-xl border border-gray-100 p-4 mb-5">

        <div className="flex items-center justify-between mb-3">

          <div>
            <p className="text-sm font-semibold text-gray-900">
              Recent activity vs usual
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              Compared with your personal activity baseline.
            </p>
          </div>

          <span className="text-xs font-semibold text-gray-500">
            {anomalyResult.records_used} tracked days
          </span>

        </div>


        <div className="space-y-3">

          {/* Recent */}
          <div>

            <div className="flex justify-between text-xs mb-1">

              <span className="text-gray-600">
                Recent activity
              </span>

              <span className="font-semibold text-gray-900">
                {Number(anomalyResult.recent_activity || 0).toFixed(0)}%
              </span>

            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(
                    Math.max(Number(anomalyResult.recent_activity || 0), 0),
                    100
                  )}%`
                }}
              />

            </div>

          </div>


          {/* Usual */}
          <div>

            <div className="flex justify-between text-xs mb-1">

              <span className="text-gray-600">
                Your usual
              </span>

              <span className="font-semibold text-gray-900">
                {Number(anomalyResult.baseline_activity || 0).toFixed(0)}%
              </span>

            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-gray-400 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(
                    Math.max(Number(anomalyResult.baseline_activity || 0), 0),
                    100
                  )}%`
                }}
              />

            </div>

          </div>

        </div>

      </div>


      {/* ================= RECENT ACTIVITY ================= */}
      <div>

        <div className="flex items-center justify-between mb-3">

          <div>

            <h3 className="text-base font-bold text-gray-900">
              Recent activity
            </h3>

            <p className="text-xs text-gray-500 mt-0.5">
              Your latest tracked activity.
            </p>

          </div>

          <span className="text-xs text-gray-500">
            {anomalyResult.records_used} tracked days
          </span>

        </div>


        <div className="space-y-2">

          {(anomalyResult.timeline || [])
            .slice(-3)
            .map((day, index, visibleDays) => {

              const score = Number(day.activity_score || 0);

              const isLatest =
                index === visibleDays.length - 1;

              return (

                <div
                  key={`${day.date}-${index}`}
                  className={`rounded-xl border p-3 ${
                    isLatest
                      ? "border-orange-200 bg-orange-50/40"
                      : "border-gray-100 bg-white"
                  }`}
                >

                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-2 min-w-0">

                      <p className="text-sm font-semibold text-gray-900">
                        {day.date}
                      </p>

                      {isLatest && (
                        <span className="text-[9px] font-bold uppercase tracking-wide bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                          Latest
                        </span>
                      )}

                    </div>

                    <p className="text-sm font-bold text-gray-900">
                      {score.toFixed(0)}%
                    </p>

                  </div>


                  {/* Score bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">

                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{
                        width: `${Math.min(
                          Math.max(score, 0),
                          100
                        )}%`
                      }}
                    />

                  </div>


                  {/* Small metrics */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500">

                    <span>
                      🚶 {Number(day.steps || 0).toLocaleString()} steps
                    </span>

                    <span>
                      🏃 {Number(day.exercise_minutes || 0)} min exercise
                    </span>

                    <span>
                      {day.workout_completed
                        ? "✓ Workout completed"
                        : "— No workout"}
                    </span>

                  </div>

                </div>

              );

            })}

        </div>

      </div>


      {/* Small context note */}
      <p className="text-[11px] text-gray-400 mt-4">
        Based on your personal activity history. More tracking helps FitIQ
        understand your routine better.
      </p>

    </>

)}
</div>


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
  <div className="max-w-6xl mx-auto">

    {/* Header */}
    <div className="mb-8">
      <h1 className="text-4xl font-bold mb-2">
        🥗 Nutrition Intelligence
      </h1>

      <p className="text-gray-500">
        Personalized nutrition recommendations based on your profile,
        fitness goal, diet preference, and USDA nutrition data.
      </p>
    </div>

    {/* Loading */}
    {nutritionLoading && (
      <div className="bg-white rounded-2xl shadow-card p-10 text-center">
        <div className="text-4xl mb-4 animate-pulse">
          🥗
        </div>

        <h2 className="text-xl font-bold">
          Analyzing your nutrition...
        </h2>

        <p className="text-gray-500 mt-2">
          Calculating your targets and finding suitable foods.
        </p>
      </div>
    )}

    {/* Error */}
    {!nutritionLoading && nutritionError && (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-red-600">
          Nutrition analysis failed
        </h2>

        <p className="text-red-500 mt-2">
          {nutritionError}
        </p>

        <button
          onClick={loadNutritionData}
          className="mt-4 px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    )}

    {/* Nutrition Results */}
    {!nutritionLoading && !nutritionError && nutritionData && (
      <>

        {/* Top Target Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Calories */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">
                  Daily Calories
                </p>

                <h2 className="text-3xl font-bold text-primary mt-2">
                  {nutritionData.targets.calorie_target}
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  kcal / day
                </p>
              </div>

              <div className="text-4xl">
                🔥
              </div>
            </div>
          </div>


          {/* Protein */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">
                  Protein Target
                </p>

                <h2 className="text-3xl font-bold text-primary mt-2">
                  {nutritionData.macro_distribution.protein_g}
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  grams / day
                </p>
              </div>

              <div className="text-4xl">
                💪
              </div>
            </div>
          </div>


          {/* Water */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">
                  Water Target
                </p>

                <h2 className="text-3xl font-bold text-primary mt-2">
                  {nutritionData.targets.water_liters}
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  liters / day
                </p>
              </div>

              <div className="text-4xl">
                💧
              </div>
            </div>
          </div>

        </div>


        {/* Body / Target Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Energy Summary */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">

            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  ⚡ Energy Target
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Based on your estimated daily energy needs
                </p>
              </div>

              <span className="px-3 py-1 bg-orange-100 text-primary rounded-full text-sm font-semibold">
                {nutritionData.diet_type}
              </span>
            </div>


            <div className="grid grid-cols-2 gap-4">

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  BMR
                </p>

                <p className="text-2xl font-bold mt-1">
                  {nutritionData.targets.bmr}
                  <span className="text-sm font-normal text-gray-500">
                    {" "}kcal
                  </span>
                </p>
              </div>


              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  TDEE
                </p>

                <p className="text-2xl font-bold mt-1">
                  {nutritionData.targets.tdee}
                  <span className="text-sm font-normal text-gray-500">
                    {" "}kcal
                  </span>
                </p>
              </div>

            </div>

          </div>


          {/* Profile Summary */}
          <div className="bg-white rounded-2xl shadow-card p-6">

            <h2 className="text-xl font-bold mb-5">
              👤 Your Plan
            </h2>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-gray-500">
                  Goal
                </p>

                <p className="font-semibold capitalize">
                  {profile?.goal || "Maintenance"}
                </p>
              </div>


              <div>
                <p className="text-sm text-gray-500">
                  Diet
                </p>

                <p className="font-semibold capitalize">
                  {nutritionData.diet_type}
                </p>
              </div>


              <div>
                <p className="text-sm text-gray-500">
                  Meals / Day
                </p>

                <p className="font-semibold">
                  {profile?.mealsPerDay || "N/A"}
                </p>
              </div>

            </div>

          </div>

        </div>


        {/* Macro Breakdown */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-8">

          <div className="mb-6">
            <h2 className="text-xl font-bold">
              🍽 Daily Macro Targets
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Your recommended macronutrient distribution
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Protein */}
            <div className="border rounded-2xl p-5">

              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  💪 Protein
                </span>

                <span className="text-primary font-bold">
                  {nutritionData.macro_distribution.protein_g} g
                </span>
              </div>

              <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "30%" }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Supports muscle maintenance and recovery
              </p>

            </div>


            {/* Carbs */}
            <div className="border rounded-2xl p-5">

              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  ⚡ Carbohydrates
                </span>

                <span className="text-primary font-bold">
                  {nutritionData.macro_distribution.carbs_g} g
                </span>
              </div>

              <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "40%" }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Provides energy for daily activity
              </p>

            </div>


            {/* Fat */}
            <div className="border rounded-2xl p-5">

              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  🥑 Healthy Fats
                </span>

                <span className="text-primary font-bold">
                  {nutritionData.macro_distribution.fat_g} g
                </span>
              </div>

              <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "30%" }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Supports essential body functions
              </p>

            </div>

          </div>

        </div>


        {/* Personalized Insight */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-8">

          <div className="flex gap-4">

            <div className="text-3xl">
              🤖
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6">
  <div className="flex items-center gap-3 mb-3">
    <span className="text-2xl">💡</span>
    <h2 className="text-xl font-bold">Nutrition Insight</h2>
  </div>

  <p className="text-gray-600 leading-relaxed">
    {nutritionData.insight}
  </p>
</div>

          </div>

        </div>


        {/* Recommended Foods */}
        <div className="mb-8">

          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              🥗 Recommended Foods
            </h2>

            <p className="text-gray-500 mt-1">
              Foods selected from USDA FoodData Central based on your
              nutrition profile and goal.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {nutritionData.recommendations.map((food, index) => (

              <div
                key={`${food.food_name}-${index}`}
                className="bg-white rounded-2xl shadow-card p-5 hover:-translate-y-1 transition-transform duration-200"
              >

                {/* Food Header */}
                <div className="flex justify-between gap-3">

                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {food.food_name}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      {food.food_category}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span className="px-2 py-1 rounded-full bg-orange-100 text-primary text-xs font-bold">
                      {food.score}
                    </span>
                  </div>

                </div>


                {/* Nutrition */}
                <div className="grid grid-cols-2 gap-3 mt-5">

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      Calories
                    </p>

                    <p className="font-bold">
                      {food.calories} kcal
                    </p>
                  </div>


                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      Protein
                    </p>

                    <p className="font-bold">
                      {food.protein_g} g
                    </p>
                  </div>


                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      Carbs
                    </p>

                    <p className="font-bold">
                      {food.carbs_g} g
                    </p>
                  </div>


                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      Fat
                    </p>

                    <p className="font-bold">
                      {food.fat_g} g
                    </p>
                  </div>

                </div>


                {/* Extra nutrition */}
                <div className="mt-4 pt-4 border-t">

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Fiber
                    </span>

                    <span className="font-semibold">
                      {food.fiber_g} g
                    </span>

                  </div>

                  <div className="flex justify-between text-sm mt-2">

                    <span className="text-gray-500">
                      Sugar
                    </span>

                    <span className="font-semibold">
                      {food.sugar_g} g
                    </span>

                  </div>

                  <div className="flex justify-between text-sm mt-2">

                    <span className="text-gray-500">
                      Sodium
                    </span>

                    <span className="font-semibold">
                      {food.sodium_mg} mg
                    </span>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>


        {/* Data Source */}
        <div className="text-center text-xs text-gray-400 pb-6">
          Nutrition recommendations powered by{" "}
          {nutritionData.data_source}
        </div>

      </>
    )}

    {/* Initial state */}
    {!nutritionLoading &&
      !nutritionError &&
      !nutritionData && (
        <div className="bg-white rounded-2xl shadow-card p-8 text-center">

          <div className="text-5xl mb-4">
            🥗
          </div>

          <h2 className="text-xl font-bold">
            Nutrition Intelligence
          </h2>

          <p className="text-gray-500 mt-2">
            Your personalized nutrition analysis will appear here.
          </p>

        </div>
      )}

  </div>
)}

  {activePage === "insights" && (
  <>
    {/* ===== E7 AI INSIGHTS PAGE ===== */}
    <div className="max-w-5xl mx-auto text-left">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">E7 • AI Interpretation Layer</p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-textPrimary mt-2">AI Insights</h1>
          <p className="text-base text-textSecondary mt-2">
            Personalized explanations and priority actions generated from all 7 analytics engines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            techModeEnabled ? "bg-gray-800 text-white" : "bg-orange-100 text-primary"
          }`}>
            {techModeEnabled ? "🔬 Technical Mode" : "👤 User Mode"}
          </span>
          <button
            onClick={() => setTechModeEnabled(prev => !prev)}
            className="bg-white border border-gray-200 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-50 transition shadow-sm"
          >
            Switch to {techModeEnabled ? "User" : "Technical"} Mode
          </button>
        </div>
      </div>

      {/* Loading State */}
      {interpretationLoading && (
        <div className="bg-white rounded-2xl shadow-card p-8 flex flex-col items-center justify-center gap-4 min-h-[200px]">
          <div className="w-12 h-12 border-4 border-orange-100 border-t-primary rounded-full animate-spin" />
          <p className="text-textSecondary text-sm font-medium">Generating your personalized AI insights…</p>
          <p className="text-xs text-gray-400">Analyzing all 7 analytics engines</p>
        </div>
      )}

      {/* Error State */}
      {interpretationError && !interpretationLoading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-red-700">
          <p className="font-semibold">⚠️ {interpretationError}</p>
          <p className="text-sm mt-1 text-red-500">Your analytics results are still displayed in the Analytics section.</p>
        </div>
      )}

      {/* No data yet */}
      {!interpretationResult && !interpretationLoading && !interpretationError && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center">
          <p className="text-2xl mb-2">🧠</p>
          <p className="font-semibold text-textPrimary">Insights will appear after your analytics data loads.</p>
          <p className="text-sm text-textSecondary mt-1">Navigate to the Dashboard first to trigger your analytics engines.</p>
        </div>
      )}

      {interpretationResult && !interpretationLoading && (() => {
        const um = interpretationResult.user_mode || {};
        const tm = interpretationResult.technical_mode || {};
        const source = interpretationResult.source || "analytics_interpretation_engine";
        const isLLM = source === "llm";

        return (
          <div className="space-y-6">

            {/* Source badge */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                isLLM
                  ? "bg-purple-100 text-purple-700"
                  : "bg-orange-100 text-primary"
              }`}>
                {isLLM ? "✨ LLM-Powered" : "⚙️ Deterministic Engine"}
              </span>
              <span className="text-xs text-gray-400">
                {isLLM
                  ? "Insights generated by Gemini/OpenAI using your analytics outputs"
                  : "Insights generated by FitIQ's built-in interpretation engine"}
              </span>
            </div>

            {/* Overall Summary */}
            {um.overall_summary && (
              <div className="bg-gradient-to-br from-primary to-orange-700 text-white rounded-2xl p-6 shadow-card">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Overall Summary</p>
                <p className="text-lg leading-relaxed font-medium">{um.overall_summary}</p>
              </div>
            )}

            {/* Strengths + Needs Attention */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {um.strengths?.length > 0 && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                  <h2 className="font-bold text-green-700 text-base mb-3 flex items-center gap-2">
                    <span>✅</span> Your Strengths
                  </h2>
                  <ul className="space-y-2">
                    {um.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-500 mt-0.5 shrink-0">●</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {um.what_needs_attention?.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <h2 className="font-bold text-amber-700 text-base mb-3 flex items-center gap-2">
                    <span>⚠️</span> What Needs Attention
                  </h2>
                  <ul className="space-y-2">
                    {um.what_needs_attention.map((n, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-amber-500 mt-0.5 shrink-0">●</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Priority Actions */}
            {um.priority_actions?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-xl font-bold mb-1">🎯 Top Priority Actions</h2>
                <p className="text-sm text-textSecondary mb-5">Personalized, engine-backed actions ranked by impact.</p>
                <div className="space-y-4">
                  {um.priority_actions.map((action, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-orange-100 bg-orange-50/40">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm">
                        {action.priority || i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-textPrimary text-sm">{action.title || action.action}</p>
                        {action.action && action.title && (
                          <p className="text-sm text-gray-600 mt-1">{action.action}</p>
                        )}
                        {action.why && (
                          <p className="text-xs text-gray-500 mt-1.5 italic">Why: {action.why}</p>
                        )}
                        {action.how_to_start && (
                          <p className="text-xs text-primary mt-1 font-medium">How to start: {action.how_to_start}</p>
                        )}
                        {action.related_engine && (
                          <span className="inline-block mt-2 text-[10px] font-bold bg-orange-100 text-primary px-2 py-0.5 rounded-full">
                            {action.related_engine}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Why These Recommendations */}
            {um.why_these_recommendations && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Why These Recommendations?</p>
                <p className="text-sm text-gray-600 leading-relaxed">{um.why_these_recommendations}</p>
              </div>
            )}

            {/* Cross-Engine Insights */}
            {um.cross_engine_insights?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-xl font-bold mb-1">🔗 Cross-Engine Insights</h2>
                <p className="text-sm text-textSecondary mb-5">How your different analytics engines connect.</p>
                <div className="space-y-3">
                  {um.cross_engine_insights.map((insight, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <span className="text-blue-400 mt-0.5 shrink-0">◆</span>
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Findings — Engine by Engine */}
            {um.key_findings?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-xl font-bold mb-1">📊 Engine-wise Analysis</h2>
                <p className="text-sm text-textSecondary mb-5">Result → Meaning → Evidence → Recommendation, per engine.</p>
                <div className="space-y-4">
                  {um.key_findings.map((finding, i) => (
                    <details key={i} className="group border border-gray-100 rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-orange-50 transition font-semibold text-sm">
                        <span>{finding.engine}</span>
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="px-4 pb-4 space-y-3 text-sm text-gray-700">
                        {finding.finding && (
                          <div className="bg-orange-50 rounded-lg p-3">
                            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Finding</p>
                            <p>{finding.finding}</p>
                          </div>
                        )}
                        {finding.evidence && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Evidence</p>
                            <p className="font-mono text-xs bg-gray-50 rounded p-2">{finding.evidence}</p>
                          </div>
                        )}
                        {finding.explanation && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Explanation</p>
                            <p>{finding.explanation}</p>
                          </div>
                        )}
                        {finding.recommendation && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">Recommendation</p>
                            <p>{finding.recommendation}</p>
                          </div>
                        )}

                        {/* Technical mode overlay */}
                        {techModeEnabled && tm[`engine_${i + 1}`] && (
                          <div className="mt-3 bg-gray-900 text-green-300 rounded-xl p-4 font-mono text-xs space-y-2">
                            <p className="text-green-400 font-bold">[ Technical / Viva Mode ]</p>
                            {Object.entries(tm[`engine_${i + 1}`]).map(([k, v]) => (
                              <div key={k}>
                                <span className="text-gray-400">{k}: </span>
                                <span>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Full Technical Mode Panel */}
            {techModeEnabled && Object.keys(tm).length > 0 && (
              <div className="bg-gray-900 text-green-300 rounded-2xl p-6 font-mono text-xs">
                <p className="text-green-400 font-bold text-sm mb-4">🔬 Full Technical / Viva Mode — All Engines</p>
                <div className="space-y-4">
                  {Object.entries(tm).map(([key, engine]) => (
                    <div key={key} className="border border-gray-700 rounded-xl p-4">
                      <p className="text-yellow-300 font-bold mb-2">{engine.name || key}</p>
                      {Object.entries(engine).filter(([k]) => k !== "name").map(([k, v]) => (
                        <div key={k} className="mb-1">
                          <span className="text-gray-400">{k}: </span>
                          <span>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        );
      })()}

    </div>
  </>
  )}

  {activePage === "tracking" && (
    <DailyTracking />
  )}

</div>

  </div>

</div>

  );
}

export default Dashboard;