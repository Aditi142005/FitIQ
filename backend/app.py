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

@app.route("/recommendations", methods=["POST"])
def recommendations():

    data = request.json

    result = generate_recommendations(data)

    return jsonify({
        "recommendations": result
    })

if __name__ == "__main__":
    app.run(debug=True)