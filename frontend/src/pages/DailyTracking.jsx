import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import {
  saveDailyTracking,
  getDailyTracking
} from "../services/firestoreService";

function DailyTracking() {
  const [trackingData, setTrackingData] = useState({
  steps: "",
  waterIntake: "",
  sleepHours: "",
    sleepQuality: "",
  exerciseMinutes: "",
  caloriesConsumed: "",
  stressLevel: "",
  energyLevel: "",
  workoutCompleted: false
});

const [isRecorded, setIsRecorded] = useState(false);
const [loading, setLoading] = useState(true);

  useEffect(() => {

  async function loadTodayData() {

    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    const data = await getDailyTracking(user.uid);

if (data) {

  setTrackingData({
    steps: data.steps || "",
    waterIntake: data.waterIntake || "",
    sleepHours: data.sleepHours || "",
    sleepQuality: data.sleepQuality || "",
    exerciseMinutes: data.exerciseMinutes || "",
    caloriesConsumed: data.caloriesConsumed || "",
    stressLevel: data.stressLevel || "",
    energyLevel: data.energyLevel || "",
    workoutCompleted: data.workoutCompleted || false
  });

  setIsRecorded(true);

} else {

  setIsRecorded(false);

}

    setLoading(false);
  }

  loadTodayData();

}, []);

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setTrackingData({
      ...trackingData,
      [name]: type === "checkbox" ? checked : value
    });

  };

  const handleSave = async () => {

  try {

    const user = auth.currentUser;

    if (!user) {
      alert("No user logged in.");
      return;
    }

    // Check required fields
    if (
      trackingData.steps === "" ||
      trackingData.waterIntake === "" ||
      trackingData.sleepHours === "" ||
      trackingData.sleepQuality === "" ||
      trackingData.exerciseMinutes === "" ||
      trackingData.caloriesConsumed === "" ||
      trackingData.stressLevel === "" ||
      trackingData.energyLevel === ""
    ) {
      alert("Please complete all required daily tracking fields.");
      return;
    }

    // Convert values to numbers
    const steps = Number(trackingData.steps);
    const waterIntake = Number(trackingData.waterIntake);
    const sleepHours = Number(trackingData.sleepHours);
    const sleepQuality = Number(trackingData.sleepQuality);
    const exerciseMinutes = Number(trackingData.exerciseMinutes);
    const caloriesConsumed = Number(trackingData.caloriesConsumed);
    const stressLevel = Number(trackingData.stressLevel);
    const energyLevel = Number(trackingData.energyLevel);

    // Check negative values
    if (
      steps < 0 ||
      waterIntake < 0 ||
      sleepHours < 0 ||
      sleepQuality < 0 ||
      exerciseMinutes < 0 ||
      caloriesConsumed < 0
    ) {
      alert("Values cannot be negative.");
      return;
    }

    // Check stress and energy range
    if (
  stressLevel < 1 ||
  stressLevel > 5 ||
  energyLevel < 1 ||
  energyLevel > 5 ||
  sleepQuality < 1 ||
  sleepQuality > 5
) {
  alert("Sleep quality, stress, and energy levels must be between 1 and 5.");
  return;
}

    // Check realistic limits
    if (sleepHours > 24) {
      alert("Sleep hours cannot exceed 24 hours.");
      return;
    }

    if (waterIntake > 20) {
      alert("Please enter a realistic water intake.");
      return;
    }

    if (steps > 100000) {
      alert("Please enter a realistic step count.");
      return;
    }

    if (exerciseMinutes > 1440) {
      alert("Exercise duration cannot exceed 24 hours.");
      return;
    }

    if (caloriesConsumed > 10000) {
      alert("Please enter a realistic calorie value.");
      return;
    }

    await saveDailyTracking(user.uid, {
      steps,
      waterIntake,
      sleepHours,
        sleepQuality,
      exerciseMinutes,
      caloriesConsumed,
      stressLevel,
      energyLevel,
      workoutCompleted: trackingData.workoutCompleted
    });

    setIsRecorded(true);

    // Notify Dashboard that today's tracking was saved
    window.dispatchEvent(new Event("dailyTrackingUpdated"));

    alert("Today's tracking data saved 🎉");

  } catch (error) {

    console.error(error);
    alert(error.message);

  }

};

  if (loading) {
    return <p>Loading...</p>;
  }

  return (

    <div>

      <h1 className="text-4xl font-bold mb-8">
        📅 Daily Tracking
      </h1>
    <div className="mb-6 text-center">

  {isRecorded ? (
    <p className="text-green-600 font-semibold">
      🟢 Today's tracking recorded
    </p>
  ) : (
    <p className="text-orange-600 font-semibold">
      ⚪ Today's tracking not recorded
    </p>
  )}

</div>
      <div className="bg-white p-6 rounded-2xl shadow-card max-w-xl mx-auto">

        <input
  type="number"
  min="0"
  max="100000"
  name="steps"
          placeholder="Daily steps"
          value={trackingData.steps}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-3"
        />

        <input
  type="number"
  min="0"
  max="20"
  step="0.1"
  name="waterIntake"
          placeholder="Water intake (litres)"
          value={trackingData.waterIntake}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-3"
        />

        <input
  type="number"
  min="0"
  max="24"
  step="0.5"
  name="sleepHours"
          placeholder="Sleep hours"
          value={trackingData.sleepHours}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-3"
        />
        <label className="block mb-2">
  Sleep Quality (1-5)
</label>

<input
  type="number"
  min="1"
  max="5"
  name="sleepQuality"
  placeholder="Sleep quality (1-5)"
  value={trackingData.sleepQuality}
  onChange={handleChange}
  className="w-full border p-3 rounded mb-3"
/>
        <input
  type="number"
  min="0"
  max="1440"
  name="exerciseMinutes"
          placeholder="Exercise duration (minutes)"
          value={trackingData.exerciseMinutes}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-3"
        />

        <input
  type="number"
  min="0"
  max="10000"
  name="caloriesConsumed"
          placeholder="Calories consumed"
          value={trackingData.caloriesConsumed}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-3"
        />

        <label className="block mb-2">
          Stress Level (1-5)
        </label>

        <input
          type="number"
          min="1"
          max="5"
          name="stressLevel"
          value={trackingData.stressLevel}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-3"
        />

        <label className="block mb-2">
          Energy Level (1-5)
        </label>

        <input
          type="number"
          min="1"
          max="5"
          name="energyLevel"
          value={trackingData.energyLevel}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-4"
        />

        <label className="flex items-center gap-3 mb-6">

          <input
            type="checkbox"
            name="workoutCompleted"
            checked={trackingData.workoutCompleted}
            onChange={handleChange}
          />

          <span>Workout completed today</span>

        </label>

        <button
          onClick={handleSave}
          className="bg-primary text-white px-6 py-3 rounded-xl"
        >
          Save Today's Data
        </button>

      </div>

    </div>

  );
}

export default DailyTracking;