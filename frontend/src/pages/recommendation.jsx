import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase/firebase";
import { getUserProfile } from "../services/firestoreService";

function Recommendation() {
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const user = auth.currentUser;

        if (!user) {
          setError("Please log in to view your recommendations.");
          return;
        }

        const data = await getUserProfile(user.uid);

        if (!data) {
          setError("Your profile is not available yet.");
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error("Unable to load recommendation profile:", err);
        setError("Unable to load your recommendations.");
      }
    }

    loadRecommendations();
  }, []);

  useEffect(() => {
    if (!profile) return;

    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError("");

        const response = await axios.post(
          "http://127.0.0.1:5000/recommendations",
          {
            bmi: profile.bodyAnalysis?.bmi,
            sleepHours: profile.sleepHours,
            waterIntake: profile.waterIntake,
            dailySteps: profile.dailySteps,
            exerciseFrequency: profile.exerciseFrequency,
            stressLevel: profile.stressLevel,
            energyLevel: profile.energyLevel,
            goal: profile.goal
          }
        );

        setRecommendations(
          Array.isArray(response.data?.recommendations)
            ? response.data.recommendations
            : []
        );
      } catch (err) {
        console.error("Recommendation request failed:", err);
        setError("Recommendations are temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [profile]);

  if (loading) {
    return (
      <div className="rounded-xl bg-orange-50 p-4 text-sm text-gray-600">
        Generating your personalized recommendations…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-orange-50 p-4 text-sm text-gray-600">
        {error}
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        No new recommendations are available right now.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {recommendations.map((item, index) => (
        <div
          key={`${index}-${item}`}
          className="rounded-xl border border-orange-100 bg-orange-50/60 p-4"
        >
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
              {index + 1}
            </span>
            <p className="text-sm leading-relaxed text-gray-700">{item}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Recommendation;
