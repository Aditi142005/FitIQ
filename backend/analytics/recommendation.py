def generate_recommendations(data):

    recommendations = []

    bmi = data.get("bmi")
    sleep = data.get("sleepHours")
    water = data.get("waterIntake")
    steps = data.get("dailySteps")
    exercise = data.get("exerciseFrequency")
    goal = data.get("goal")


    # BMI based recommendation
    if bmi:
        if bmi > 25:
            recommendations.append(
                "Your BMI is above the healthy range. Focus on regular exercise and balanced nutrition."
            )

        elif bmi < 18.5:
            recommendations.append(
                "Your BMI is below the healthy range. Consider improving your calorie and nutrient intake."
            )


    # Sleep recommendation
    if sleep and sleep < 7:
        recommendations.append(
            "Try getting at least 7-8 hours of sleep for better recovery."
        )


    # Water recommendation
    if water and water < 2:
        recommendations.append(
            "Increase your daily water intake to stay hydrated."
        )


    # Activity recommendation
    if steps and steps < 8000:
        recommendations.append(
            "Increase your daily steps gradually to improve activity levels."
        )


    # Exercise recommendation
    if exercise and exercise < 3:
        recommendations.append(
            "Try exercising at least 3 days per week."
        )


    # Goal based
    if goal == "Weight Loss":
        recommendations.append(
            "Focus on a calorie deficit diet with regular cardio activities."
        )

    elif goal == "Muscle Gain":
        recommendations.append(
            "Include strength training and sufficient protein intake."
        )


    if len(recommendations) == 0:
        recommendations.append(
            "Great job! Maintain your current healthy lifestyle."
        )


    return recommendations