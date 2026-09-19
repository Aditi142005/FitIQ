def generate_behavior_insights(mode, patterns):

    insights = []

    relationship_names = {
        "sleep_steps": "sleep and daily steps",
        "sleep_exercise": "sleep and exercise duration",
        "hydration_steps": "hydration and daily steps",
        "hydration_exercise": "hydration and exercise duration"
    }

    if mode == "personal":
        prefix = "Based on your recent tracking, "
    else:
        prefix = "In the broader FitIQ fitness data, "

    for pattern in patterns[:2]:

        relationship = relationship_names.get(
            pattern["relationship"],
            pattern["relationship"]
        )

        strength = pattern["strength"]

        if strength == "Strong positive":
            message = (
                prefix +
                f"a strong positive relationship was observed between "
                f"{relationship}."
            )

        elif strength == "Moderate positive":
            message = (
                prefix +
                f"a moderate positive relationship was observed between "
                f"{relationship}."
            )

        elif strength == "Moderate negative":
            message = (
                prefix +
                f"a moderate negative relationship was observed between "
                f"{relationship}."
            )

        elif strength == "Strong negative":
            message = (
                prefix +
                f"a strong negative relationship was observed between "
                f"{relationship}."
            )

        else:
            message = (
                prefix +
                f"no meaningful relationship was detected between "
                f"{relationship}."
            )

        if mode == "personal":
            advice = (
                "Continue tracking these behaviors to understand "
                "your patterns over time."
            )
        else:
            advice = (
                "Keep tracking your own behavior to build "
                "personalized insights over time."
            )

        insights.append({
            "title": relationship.title(),
            "message": message,
            "advice": advice
        })

    return {
        "insights": insights
    }