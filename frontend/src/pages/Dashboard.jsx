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