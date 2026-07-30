import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { getUserProfile } from "../services/firestoreService";
import { useNavigate} from "react-router-dom";
import { logout } from "../services/authService";
import Sidebar from "../components/Sidebar";

function Dashboard() {

  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("dashboard");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {

      const user = auth.currentUser;

      if (!user) return;

      const data = await getUserProfile(user.uid);
      console.log(data);
      setProfile(data);

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
        Welcome to FitIQ
      </h1>

      <p className="text-xl text-textSecondary mt-4">
        Your personalized fitness journey starts here.
      </p>

      {profile && (
        <>
         {/* Profile Card */}
<div className="mt-8 bg-white p-6 rounded-2xl shadow-card max-w-md mx-auto">

  <h2 className="text-2xl font-bold mb-4">
    Your Profile
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


{/* Body Analysis Card */}
{profile.bodyAnalysis && (
  <div className="mt-8 bg-white p-6 rounded-2xl shadow-card max-w-md mx-auto">

    <h2 className="text-2xl font-bold mb-4">
      📊 Body Analysis
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
      {profile.bodyAnalysis.idealWeight.min} kg -{" "}
      {profile.bodyAnalysis.idealWeight.max} kg
    </p>

  </div>
)}
        </>
      )}

    </>
  )}

  {activePage === "analytics" && (
    <h1 className="text-4xl font-bold">
      Analytics
    </h1>
  )}

  {activePage === "profile" && (
    <h1 className="text-4xl font-bold">
      Profile
    </h1>
  )}

  {activePage === "nutrition" && (
    <h1 className="text-4xl font-bold">
      Nutrition
    </h1>
  )}

  {activePage === "workout" && (
    <h1 className="text-4xl font-bold">
      Workout
    </h1>
  )}

  {activePage === "recommendations" && (
    <h1 className="text-4xl font-bold">
      Recommendations
    </h1>
  )}

</div>

  </div>

</div>

  );
}

export default Dashboard;