import { useState } from "react";
import { auth } from "../firebase/firebase";
import { updateUserProfile } from "../services/firestoreService";
import { useNavigate } from "react-router-dom";
function ProfileSetup() {
const navigate = useNavigate();
  const [profile, setProfile] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    goal: "",
    activityLevel: "",
    dietPreference: ""
  });


  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };


 const handleSubmit = async (e) => {
  e.preventDefault();

  try {

    const user = auth.currentUser;

    if (!user) {
      alert("No user logged in.");
      return;
    }

    await updateUserProfile(user.uid, {
  ...profile,
  age: Number(profile.age),
  height: Number(profile.height),
  weight: Number(profile.weight),
});

    alert("Profile saved successfully! 🎉");

    navigate("/dashboard");

  } catch (error) {
    alert(error.message);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">

      <div className="bg-white p-8 rounded-2xl shadow-card w-full max-w-md">

        <h1 className="text-3xl font-heading font-bold mb-6">
          Complete Your Profile
        </h1>


        <form 
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input
            name="age"
            placeholder="Age"
            value={profile.age}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          />


          <input
            name="height"
            placeholder="Height (cm)"
            value={profile.height}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          />


          <input
            name="weight"
            placeholder="Weight (kg)"
            value={profile.weight}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          />


          <select
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          >
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>


          <select
            name="goal"
            value={profile.goal}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          >
            <option value="">Fitness Goal</option>
            <option>Weight Loss</option>
            <option>Muscle Gain</option>
            <option>Maintain Fitness</option>
          </select>


          <select
            name="activityLevel"
            value={profile.activityLevel}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          >
            <option value="">Activity Level</option>
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
          </select>


          <select
            name="dietPreference"
            value={profile.dietPreference}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          >
            <option value="">Diet Preference</option>
            <option>Vegetarian</option>
            <option>Non-Vegetarian</option>
            <option>Vegan</option>
          </select>


          <button
            className="w-full bg-primary text-white py-3 rounded-xl"
          >
            Save Profile
          </button>


        </form>

      </div>

    </div>
  );
}


export default ProfileSetup;