def generate_recommendations(data):

    recommendations = []

    bmi = data.get("bmi")
    sleep = data.get("sleepHours")
    water = data.get("waterIntake")
    steps = data.get("dailySteps")
    exercise = data.get("exerciseFrequency")
    stress = data.get("stressLevel")
    goal = data.get("goal")


    # BMI
    if bmi < 18.5:
        recommendations.append(
            "Your BMI is low. Focus on a balanced calorie-rich diet."
        )

    elif bmi >= 25:
        recommendations.append(
            "Your BMI is high. Maintain a balanced diet and regular exercise."
        )


    # Sleep
    if sleep < 7:
        recommendations.append(
            "Improve your sleep duration. Aim for 7-8 hours daily."
        )


    # Water
    if water < 2:
        recommendations.append(
            "Increase your water intake to stay hydrated."
        )


    # Steps
    if steps < 5000:
        recommendations.append(
            "Increase your daily steps gradually. Aim for 5000+ steps."
        )


    # Exercise
    if exercise < 3:
        recommendations.append(
            "Try exercising at least 3 days per week."
        )


    # Stress
    if stress >= 4:
        recommendations.append(
            "Your stress level is high. Include relaxation activities."
        )


    # Goal based
    if goal == "Weight Loss":
        recommendations.append(
            "Focus on calorie control and consistent physical activity."
        )

    elif goal == "Weight Gain":
        recommendations.append(
            "Increase protein intake and follow strength training."
        )

    elif goal == "Maintain Fitness" and len(recommendations) == 0:
        recommendations.append(
        "Maintain your current healthy lifestyle habits."
    )


    if len(recommendations) == 0:
        recommendations.append(
            "Great job! Continue maintaining your healthy habits."
        )


    return recommendations