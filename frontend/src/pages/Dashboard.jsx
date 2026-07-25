import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { getUserProfile } from "../services/firestoreService";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";

function Dashboard() {

  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background p-8">

  <div className="flex justify-between items-center">

    <h1 className="text-3xl font-heading font-bold text-primary">
      FitIQ 🧡
    </h1>

    <button
      onClick={handleLogout}
      className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-orange-700 transition"
    >
      Logout
    </button>

  </div>


  <div className="mt-20 text-center">

    <h1 className="text-5xl font-heading font-bold text-textPrimary">
      Welcome to FitIQ
    </h1>

    <p className="text-xl text-textSecondary mt-4">
      Your personalized fitness journey starts here.
    </p>
    {profile && (
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
  onClick={() => navigate("/profile-setup")}
  className="mt-6 bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-orange-700 transition"
>
  Edit Profile
</button>
  </div>
)}

  </div>

</div>
  );
}

export default Dashboard;