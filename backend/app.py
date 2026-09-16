import profile

from flask import Flask, request, jsonify
from flask_cors import CORS
from analytics.recommendation import generate_recommendations
from analytics.bodyAnalysis import (
    calculate_bmi,
    bmi_category,
    calculate_bmr,
    calculate_tdee,
    ideal_weight_range,
    calculate_health_score
)
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml"))
from engines.fis_engine import (
    calculate_step_score,
    calculate_exercise_frequency_score,
    calculate_exercise_duration_score,
    calculate_intensity_score,
    calculate_sleep_score,
    calculate_energy_score,
    calculate_fitness_activity_score,
    calculate_recovery_score,
    calculate_body_composition_score,
    calculate_nutrition_score,
    calculate_consistency_score,
    calculate_fis_score,
    calculate_bmi_score,
    calculate_weight_trend_score,
    calculate_meal_frequency_score,
    calculate_hydration_score,
    calculate_consistency_from_history,
)
from engines.behavior_engine import (
    load_foundation_data,
    analyze_behavior
)
app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "FitIQ Backend Running 🚀"


@app.route("/body-analysis", methods=["POST"])
def body_analysis():

    data = request.get_json()

    age = data["age"]
    gender = data["gender"]
    height = data["height"]
    weight = data["weight"]
    activity = data["activityLevel"]

    bmi = calculate_bmi(weight, height)

    category = bmi_category(bmi)

    bmr = calculate_bmr(
        weight,
        height,
        age,
        gender
    )

    tdee = calculate_tdee(
        bmr,
        activity
    )

    ideal_min, ideal_max = ideal_weight_range(height)
    health_data = {
    "bmi": bmi,
    "sleepHours": data["sleepHours"],
    "waterIntake": data["waterIntake"],
    "dailySteps": data["dailySteps"],
    "exerciseFrequency": data["exerciseFrequency"],
    "stressLevel": data["stressLevel"]
}

    health_score = calculate_health_score(health_data)
    print("Health Data Received:", health_data)
    return jsonify({
        "bmi": bmi,
        "category": category,
        "bmr": bmr,
        "tdee": tdee,
        "idealWeight": {
            "min": ideal_min,
            "max": ideal_max
        },
        "healthScore": health_score
    })
@app.route("/fis", methods=["POST"])
def fis():
    data = request.get_json()

    profile = data.get("profile", {})
    tracking_records = data.get("trackingRecords", [])

    step_score = calculate_step_score(
        profile.get("averageSteps")
    )

    frequency_score = calculate_exercise_frequency_score(
        profile.get("exerciseDays")
    )

    duration_score = calculate_exercise_duration_score(
        profile.get("averageExerciseDuration")
    )

    intensities = [
        record.get("exerciseIntensity")
        for record in tracking_records
        if record.get("exerciseIntensity")
    ]

    intensity_score = None

    if intensities:
        intensity_scores = [
            calculate_intensity_score(intensity)
            for intensity in intensities
        ]

        intensity_scores = [
            score for score in intensity_scores
            if score is not None
        ]

        if intensity_scores:
            intensity_score = sum(intensity_scores) / len(intensity_scores)

    fitness_activity_score = calculate_fitness_activity_score(
        step_score,
        frequency_score,
        duration_score,
        intensity_score
    )
    sleep_score = calculate_sleep_score(
    profile.get("averageSleepHours")
)

    energy_values = [
    record.get("energyLevel")
    for record in tracking_records
    if record.get("energyLevel")
]

    energy_scores = [
    calculate_energy_score(energy)
    for energy in energy_values
]

    energy_scores = [
    score for score in energy_scores
    if score is not None
]

    energy_score = None

    if energy_scores:
        energy_score = sum(energy_scores) / len(energy_scores)

    recovery_score = calculate_recovery_score(
    sleep_score,
    energy_score
)
    bmi_score = calculate_bmi_score(
    profile.get("bmi")
)

    weight_trend_score = calculate_weight_trend_score(
    profile.get("previousWeight"),
    profile.get("weight"),
    profile.get("goal")
)

    body_composition_score = calculate_body_composition_score(
    bmi_score,
    weight_trend_score
)
    meal_frequency_score = calculate_meal_frequency_score(
    profile.get("mealsPerDay")
)

    hydration_score = calculate_hydration_score(
    profile.get("averageWaterIntake")
)

    nutrition_score = calculate_nutrition_score(
    meal_frequency_score,
    hydration_score
)
    consistency_score = calculate_consistency_from_history(
    profile.get("dailyConsistency")
)
    fis_score = calculate_fis_score(
    fitness_activity_score,
    recovery_score,
    body_composition_score,
    nutrition_score,
    consistency_score
)

    return jsonify({
    "fitnessActivity": {
        "stepScore": step_score,
        "frequencyScore": frequency_score,
        "durationScore": duration_score,
        "intensityScore": round(intensity_score, 2)
            if intensity_score is not None else None,
        "score": fitness_activity_score
    },

    "recovery": {
        "sleepScore": sleep_score,
        "energyScore": round(energy_score, 2)
            if energy_score is not None else None,
        "score": recovery_score
    },
    "bodyComposition": {
    "bmiScore": bmi_score,
    "weightTrendScore": weight_trend_score,
    "score": body_composition_score
    },
    "nutrition": {
    "mealFrequencyScore": meal_frequency_score,
    "hydrationScore": hydration_score,
    "score": nutrition_score
},
    "consistency": {
    "score": consistency_score
},
    
    "fis": fis_score
})

@app.route("/behavior", methods=["POST"])
def behavior_analysis():

    data = request.get_json()

    tracking_records = data.get("trackingRecords", [])

    foundation_df = load_foundation_data()

    result = analyze_behavior(
        tracking_records,
        foundation_df
    )

    return jsonify(result)

@app.route("/recommendations", methods=["POST"])
def recommendations():

    data = request.json

    result = generate_recommendations(data)

    return jsonify({
        "recommendations": result
    })

if __name__ == "__main__":
    app.run(debug=True)