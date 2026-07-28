from flask import Flask, request, jsonify
from flask_cors import CORS

from analytics.bodyAnalysis import (
    calculate_bmi,
    bmi_category,
    calculate_bmr,
    calculate_tdee,
    ideal_weight_range
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

    return jsonify({
        "bmi": bmi,
        "category": category,
        "bmr": bmr,
        "tdee": tdee,
        "idealWeight": {
            "min": ideal_min,
            "max": ideal_max
        }
    })


if __name__ == "__main__":
    app.run(debug=True)