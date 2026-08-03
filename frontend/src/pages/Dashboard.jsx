import { useEffect, useState } from "react";
import Recommendation from "./recommendation";
import { auth } from "../firebase/firebase";
import { 
  getUserProfile,
  updateDailyGoals,
  updateTodayCompletion
} from "../services/firestoreService";
import { useNavigate} from "react-router-dom";
import { logout } from "../services/authService";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [goals, setGoals] = useState({
  water: false,
  workout: false,
  steps: false,
  sleep: false
});
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

const calculateHealthScore = () => {

  if (!profile) return 0;

  let score = 100;

  // BMI score
  const bmi = profile.bodyAnalysis?.bmi;

  if (bmi < 18.5 || bmi >= 30) {
    score -= 15;
  } 
  else if (bmi >= 25) {
    score -= 10;
  }


  // Sleep score
  if (profile.sleepHours < 6) {
    score -= 15;
  }
  else if (profile.sleepHours < 7) {
    score -= 5;
  }


  // Water score
  if (profile.waterIntake < 2) {
    score -= 10;
  }


  // Activity score
  if (profile.dailySteps < 5000) {
    score -= 10;
  }
  else if (profile.dailySteps >= 10000) {
    score += 5;
  }


  // Exercise frequency
  if (profile.exerciseFrequency === 0) {
    score -= 15;
  }
  else if (profile.exerciseFrequency >= 4) {
    score += 5;
  }


  // Stress
  if (profile.stressLevel >= 8) {
    score -= 10;
  }


  // Energy
  if (profile.energyLevel >= 8) {
    score += 5;
  }


  return Math.min(Math.max(score,0),100);

};

const healthScore = calculateHealthScore();

  useEffect(() => {
    async function fetchProfile() {

      const user = auth.currentUser;

      if (!user) return;

      const data = await getUserProfile(user.uid);
      console.log(data);
      setProfile(data);
      setStreak(data.streak || 0);
      setTodayCompleted(data.todayCompleted || false);
    }

    fetchProfile();

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

    {profile?.bodyAnalysis && (
      <div className="bg-white p-6 rounded-2xl shadow-card max-w-md mx-auto">

        <h2 className="text-2xl font-bold mb-4">
          Body Analysis
        </h2>

        <p>
          <strong>BMI:</strong> {profile.bodyAnalysis.bmi}
        </p>

        <p>
          <strong>Category:</strong> {profile.bodyAnalysis.category}
        </p>

        <p>
          <strong>BMR:</strong> {profile.bodyAnalysis.bmr} kcal/day
        </p>

        <p>
          <strong>TDEE:</strong> {profile.bodyAnalysis.tdee} kcal/day
        </p>

        <p>
          <strong>Ideal Weight:</strong>{" "}
          {profile.bodyAnalysis.idealWeight.min} kg -
          {profile.bodyAnalysis.idealWeight.max} kg
        </p>

      </div>
    )}

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

{activePage === "recommendations" && (
   <Recommendation />
)}

</div>

  </div>

</div>

  );
}

export default Dashboard;