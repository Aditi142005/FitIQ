import numpy as np


def calculate_consistency_score(record):
    """
    Calculates a daily consistency score from tracked behavior.

    Each completed target contributes equally:
    - Steps >= 7500
    - Exercise >= 30 minutes
    - Sleep >= 7 hours
    - Water >= 2 liters

    Returns a score from 0 to 100.
    """

    checks = []

    steps = record.get("steps", record.get("dailySteps"))
    exercise = record.get(
        "exerciseMinutes",
        record.get("duration_minutes")
    )
    sleep = record.get(
        "sleep",
        record.get("sleepHours")
    )
    water = record.get(
        "water",
        record.get("waterIntake")
    )

    if steps is not None:
        checks.append(float(steps) >= 7500)

    if exercise is not None:
        checks.append(float(exercise) >= 30)

    if sleep is not None:
        checks.append(float(sleep) >= 7)

    if water is not None:
        checks.append(float(water) >= 2)

    if not checks:
        return None

    return (sum(checks) / len(checks)) * 100


def calculate_consistency_forecast(tracking_records):
    """
    Analyzes recent tracking history and estimates the user's
    short-term consistency trend.
    """

    scores = []

    for record in tracking_records:
        score = calculate_consistency_score(record)

        if score is not None:
            scores.append(score)

    if len(scores) < 3:
        return {
            "status": "insufficient_data",
            "message": "Track at least 3 days to generate a consistency forecast.",
            "current_score": None,
            "projected_score": None,
            "trend": None
        }

    # Recent consistency
    current_score = float(np.mean(scores[-3:]))

    # Compare recent performance with earlier performance
    midpoint = len(scores) // 2

    earlier_scores = scores[:midpoint]
    recent_scores = scores[midpoint:]

    earlier_average = float(np.mean(earlier_scores))
    recent_average = float(np.mean(recent_scores))

    change = recent_average - earlier_average

    # Determine trend
    if change >= 5:
        trend = "improving"
    elif change <= -5:
     trend = "declining"
    else:
        trend = "stable"

    # Simple 7-day projection
    projected_score = current_score + (change * 0.5)

    projected_score = max(
        0,
        min(100, projected_score)
    )

    if trend == "improving":
        message = (
            "Your consistency is improving. "
            "Maintaining your recent routine could strengthen "
            "your fitness progress."
        )

    elif trend == "declining":
        message = (
         "Your recent consistency is showing a downward short-term trend. "
         "Small daily actions can help you get back on track."
        )
    else:
        message = (
            "Your consistency is relatively stable. "
            "Keeping your current routine can help maintain progress."
        )

    return {
        "status": "success",
        "current_score": round(current_score, 2),
        "projected_score": round(projected_score, 2),
        "trend": trend,
        "change": round(change, 2),
        "message": message,
        "daily_scores": [round(score, 2) for score in scores]
    }