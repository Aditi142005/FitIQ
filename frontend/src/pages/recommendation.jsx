import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { auth } from "../firebase/firebase";
import { getUserProfile } from "../services/firestoreService";

function Recommendation() {

  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);


  useEffect(() => {

    async function fetchProfile(){

      const user = auth.currentUser;

      if(!user) return;

      const data = await getUserProfile(user.uid);

      setProfile(data);

    }

    fetchProfile();

  }, []);



  // MOVE THIS HERE 👇
  const fetchRecommendations = useCallback(async()=>{


    try{

      const response = await axios.post(
        "http://127.0.0.1:5000/recommendations",
        {
          bmi: profile.bodyAnalysis?.bmi,
          sleepHours: profile.sleepHours,
          waterIntake: profile.waterIntake,
          dailySteps: profile.dailySteps,
          exerciseFrequency: profile.exerciseFrequency,
          goal: profile.goal
        }
      );


      setRecommendations(response.data.recommendations);

    }
    catch(error){

      console.log(error);

    }

  }, [profile]);



  // KEEP THIS BELOW fetchRecommendations 👇
  useEffect(() => {

    if(profile){
      fetchRecommendations();
    }

  }, [profile, fetchRecommendations]);



  return (

    <div>

      <h1 className="text-4xl font-bold mb-8">
        🎯 Recommendations
      </h1>


      <div className="bg-white p-6 rounded-2xl shadow-card max-w-xl">

      {
        recommendations.map((item,index)=>(

          <p key={index} className="mb-3">
            • {item}
          </p>

        ))
      }

      </div>

    </div>

  );

}

export default Recommendation;