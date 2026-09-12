def calculate_step_score(daily_steps):
    if daily_steps is None:
        return None

    if daily_steps < 3000:
        return 20
    elif daily_steps < 5000:
        return 40
    elif daily_steps < 7500:
        return 60
    elif daily_steps < 10000:
        return 80
    else:
        return 100
def calculate_exercise_frequency_score(exercise_days):
    if exercise_days is None:
        return None

    if exercise_days < 0 or exercise_days > 7:
        return None

    if exercise_days == 0:
        return 0
    elif exercise_days == 1:
        return 25
    elif exercise_days == 2:
        return 40
    elif exercise_days == 3:
        return 60
    elif exercise_days == 4:
        return 75
    elif exercise_days == 5:
        return 85
    elif exercise_days == 6:
        return 95
    else:
        return 100
def calculate_exercise_duration_score(duration_minutes):
    if duration_minutes is None:
        return None

    if duration_minutes < 0:
        return None

    if duration_minutes < 20:
        return 20
    elif duration_minutes < 30:
        return 40
    elif duration_minutes < 45:
        return 60
    elif duration_minutes < 60:
        return 80
    else:
        return 100

def calculate_intensity_score(intensity):
    if intensity is None:
        return None

    intensity = intensity.strip().lower()

    if intensity == "low":
        return 40
    elif intensity == "medium":
        return 70
    elif intensity == "high":
        return 100
    else:
        return None

def calculate_fitness_activity_score(
    step_score,
    frequency_score,
    duration_score,
    intensity_score
):
    scores = {
        "steps": (step_score, 0.30),
        "frequency": (frequency_score, 0.25),
        "duration": (duration_score, 0.20),
        "intensity": (intensity_score, 0.25)
    }

    total_score = 0
    total_weight = 0

    for score, weight in scores.values():
        if score is not None:
            total_score += score * weight
            total_weight += weight

    if total_weight == 0:
        return None

    return round(total_score / total_weight, 2)

def calculate_sleep_score(sleep_hours):
    if sleep_hours is None:
        return None

    if sleep_hours < 0:
        return None

    if sleep_hours < 5:
        return 20
    elif sleep_hours < 6:
        return 40
    elif sleep_hours < 7:
        return 60
    elif sleep_hours < 8:
        return 80
    elif sleep_hours <= 9:
        return 100
    else:
        return 90

def calculate_energy_score(energy_level):
    if energy_level is None:
        return None

    energy_level = energy_level.strip().lower()

    if energy_level == "low":
        return 30
    elif energy_level == "medium":
        return 65
    elif energy_level == "high":
        return 100
    else:
        return None

def calculate_recovery_score(sleep_score, energy_score):
    scores = {
        "sleep": (sleep_score, 0.60),
        "energy": (energy_score, 0.40)
    }

    total_score = 0
    total_weight = 0

    for score, weight in scores.values():
        if score is not None:
            total_score += score * weight
            total_weight += weight

    if total_weight == 0:
        return None

    return round(total_score / total_weight, 2)

def calculate_bmi_score(bmi):
    if bmi is None:
        return None

    if bmi <= 0:
        return None

    if bmi < 18.5:
        return 60
    elif bmi < 25:
        return 100
    elif bmi < 30:
        return 80
    elif bmi < 35:
        return 60
    elif bmi < 40:
        return 40
    else:
        return 20

def calculate_weight_trend_score(previous_weight, current_weight, goal):
    if previous_weight is None or current_weight is None or goal is None:
        return None

    if previous_weight <= 0 or current_weight <= 0:
        return None

    goal = goal.strip().lower()

    if goal == "lose":
        if current_weight < previous_weight:
            return 90
        elif current_weight == previous_weight:
            return 75
        else:
            return 60

    elif goal == "maintain":
        if current_weight == previous_weight:
            return 100
        else:
            return 75

    elif goal == "gain":
        if current_weight > previous_weight:
            return 90
        elif current_weight == previous_weight:
            return 75
        else:
            return 60

    else:
        return None

def calculate_body_composition_score(bmi_score, weight_trend_score):
    scores = {
        "bmi": (bmi_score, 0.60),
        "weight_trend": (weight_trend_score, 0.40)
    }

    total_score = 0
    total_weight = 0

    for score, weight in scores.values():
        if score is not None:
            total_score += score * weight
            total_weight += weight

    if total_weight == 0:
        return None

    return round(total_score / total_weight, 2)

def calculate_meal_frequency_score(meals_per_day):
    if meals_per_day is None:
        return None

    if meals_per_day < 0:
        return None

    if meals_per_day <= 1:
        return 30
    elif meals_per_day == 2:
        return 60
    elif meals_per_day == 3:
        return 100
    elif meals_per_day == 4:
        return 90
    elif meals_per_day == 5:
        return 80
    else:
        return 70

def calculate_hydration_score(water_liters):
    if water_liters is None:
        return None

    if water_liters < 0:
        return None

    if water_liters < 1.0:
        return 30
    elif water_liters < 1.5:
        return 50
    elif water_liters < 2.0:
        return 70
    elif water_liters < 2.5:
        return 85
    elif water_liters <= 3.5:
        return 100
    else:
        return 90

def calculate_nutrition_score(meal_frequency_score, hydration_score):
    scores = {
        "meal_frequency": (meal_frequency_score, 0.60),
        "hydration": (hydration_score, 0.40)
    }

    total_score = 0
    total_weight = 0

    for score, weight in scores.values():
        if score is not None:
            total_score += score * weight
            total_weight += weight

    if total_weight == 0:
        return None

    return round(total_score / total_weight, 2)

def calculate_consistency_score(consistent_days, total_tracked_days):
    if consistent_days is None or total_tracked_days is None:
        return None

    if total_tracked_days <= 0:
        return None

    if consistent_days < 0 or consistent_days > total_tracked_days:
        return None

    score = (consistent_days / total_tracked_days) * 100

    return round(score, 2)

def is_consistent_day(
    steps_met,
    exercise_met,
    sleep_met,
    hydration_met
):
    behaviors = [
        steps_met,
        exercise_met,
        sleep_met,
        hydration_met
    ]

    completed = sum(
        1 for behavior in behaviors
        if behavior is True
    )

    return completed >= 3

def calculate_consistency_from_history(daily_consistency):
    if daily_consistency is None or len(daily_consistency) == 0:
        return None

    consistent_days = sum(
        1 for day in daily_consistency
        if day is True
    )

    total_tracked_days = len(daily_consistency)

    return calculate_consistency_score(
        consistent_days,
        total_tracked_days
    )

def calculate_fis_score(
    fitness_activity_score,
    recovery_score,
    body_composition_score,
    nutrition_score,
    consistency_score
):
    scores = {
        "fitness_activity": (fitness_activity_score, 0.30),
        "recovery": (recovery_score, 0.20),
        "body_composition": (body_composition_score, 0.20),
        "nutrition": (nutrition_score, 0.15),
        "consistency": (consistency_score, 0.15)
    }

    total_score = 0
    total_weight = 0

    for score, weight in scores.values():
        if score is not None:
            total_score += score * weight
            total_weight += weight

    if total_weight == 0:
        return None

    fis_score = total_score / total_weight

    return round(fis_score, 2)
"""print(calculate_step_score(2500))
print(calculate_step_score(6000))
print(calculate_step_score(12000))
print(calculate_step_score(None))

print(calculate_exercise_frequency_score(0))
print(calculate_exercise_frequency_score(3))
print(calculate_exercise_frequency_score(5))
print(calculate_exercise_frequency_score(7))
print(calculate_exercise_frequency_score(None))
print(calculate_exercise_frequency_score(10))

print(calculate_exercise_duration_score(15))
print(calculate_exercise_duration_score(30))
print(calculate_exercise_duration_score(50))
print(calculate_exercise_duration_score(75))
print(calculate_exercise_duration_score(None))
print(calculate_exercise_duration_score(-10))

print(calculate_intensity_score("Low"))
print(calculate_intensity_score("Medium"))
print(calculate_intensity_score("High"))
print(calculate_intensity_score(None))
print(calculate_intensity_score("Unknown"))

step = calculate_step_score(8000)
frequency = calculate_exercise_frequency_score(5)
duration = calculate_exercise_duration_score(60)
intensity = calculate_intensity_score("High")

fitness_score = calculate_fitness_activity_score(
    step,
    frequency,
    duration,
    intensity
)

print("Step Score:", step)
print("Frequency Score:", frequency)
print("Duration Score:", duration)
print("Intensity Score:", intensity)
print("Fitness & Activity Score:", fitness_score)

print("Sleep Score:", calculate_sleep_score(7.5))
print("Sleep Score:", calculate_sleep_score(5))
print("Sleep Score:", calculate_sleep_score(8.5))
print("Sleep Score:", calculate_sleep_score(10))
print("Sleep Score:", calculate_sleep_score(None))

print("Energy Score:", calculate_energy_score("Low"))
print("Energy Score:", calculate_energy_score("Medium"))
print("Energy Score:", calculate_energy_score("High"))
print("Energy Score:", calculate_energy_score(None))
print("Energy Score:", calculate_energy_score("Unknown"))

print("Recovery Score:", calculate_recovery_score(80, 100))
print("Recovery Score:", calculate_recovery_score(60, 65))
print("Recovery Score:", calculate_recovery_score(40, 30))
print("Recovery Score:", calculate_recovery_score(None, 100))
print("Recovery Score:", calculate_recovery_score(None, None))

print("BMI Score:", calculate_bmi_score(17))
print("BMI Score:", calculate_bmi_score(22))
print("BMI Score:", calculate_bmi_score(27))
print("BMI Score:", calculate_bmi_score(32))
print("BMI Score:", calculate_bmi_score(37))
print("BMI Score:", calculate_bmi_score(42))
print("BMI Score:", calculate_bmi_score(None))

print("Weight Trend Score:", calculate_weight_trend_score(80, 78, "lose"))
print("Weight Trend Score:", calculate_weight_trend_score(80, 80, "maintain"))
print("Weight Trend Score:", calculate_weight_trend_score(60, 62, "gain"))
print("Weight Trend Score:", calculate_weight_trend_score(80, 82, "lose"))
print("Weight Trend Score:", calculate_weight_trend_score(None, 80, "lose"))
print("Weight Trend Score:", calculate_weight_trend_score(80, 78, "unknown"))

print("Body Composition Score:", calculate_body_composition_score(100, 90))
print("Body Composition Score:", calculate_body_composition_score(80, 60))
print("Body Composition Score:", calculate_body_composition_score(60, 40))
print("Body Composition Score:", calculate_body_composition_score(None, 90))
print("Body Composition Score:", calculate_body_composition_score(None, None))

print("Meal Frequency Score:", calculate_meal_frequency_score(1))
print("Meal Frequency Score:", calculate_meal_frequency_score(2))
print("Meal Frequency Score:", calculate_meal_frequency_score(3))
print("Meal Frequency Score:", calculate_meal_frequency_score(4))
print("Meal Frequency Score:", calculate_meal_frequency_score(6))
print("Meal Frequency Score:", calculate_meal_frequency_score(None))

print("Hydration Score:", calculate_hydration_score(0.8))
print("Hydration Score:", calculate_hydration_score(1.2))
print("Hydration Score:", calculate_hydration_score(1.8))
print("Hydration Score:", calculate_hydration_score(2.2))
print("Hydration Score:", calculate_hydration_score(3.0))
print("Hydration Score:", calculate_hydration_score(4.0))
print("Hydration Score:", calculate_hydration_score(None))

print("Nutrition Score:", calculate_nutrition_score(100, 100))
print("Nutrition Score:", calculate_nutrition_score(80, 70))
print("Nutrition Score:", calculate_nutrition_score(60, 50))
print("Nutrition Score:", calculate_nutrition_score(None, 85))
print("Nutrition Score:", calculate_nutrition_score(None, None))

print("Consistency Score:", calculate_consistency_score(30, 30))
print("Consistency Score:", calculate_consistency_score(24, 30))
print("Consistency Score:", calculate_consistency_score(15, 30))
print("Consistency Score:", calculate_consistency_score(0, 30))
print("Consistency Score:", calculate_consistency_score(None, 30))
print("Consistency Score:", calculate_consistency_score(31, 30))

print("Consistent Day:", is_consistent_day(True, True, True, True))
print("Consistent Day:", is_consistent_day(True, True, False, True))
print("Consistent Day:", is_consistent_day(True, False, False, True))
print("Consistent Day:", is_consistent_day(False, False, False, False))

print(
    "Consistency Score:",
    calculate_consistency_from_history(
        [True, True, True, False, True]
    )
)

print(
    "Consistency Score:",
    calculate_consistency_from_history(
        [True, False, False, True, False]
    )
)

print(
    "Consistency Score:",
    calculate_consistency_from_history(
        [True, True, True, True, True]
    )
)

print(
    "Consistency Score:",
    calculate_consistency_from_history([])
)"""

print(
    "FIS Score:",
    calculate_fis_score(
        90.25,
        88,
        96,
        100,
        80
    )
)

print(
    "FIS Score:",
    calculate_fis_score(
        60,
        50,
        70,
        60,
        40
    )
)

print(
    "FIS Score:",
    calculate_fis_score(
        90,
        None,
        80,
        70,
        85
    )
)

print(
    "FIS Score:",
    calculate_fis_score(
        None,
        None,
        None,
        None,
        None
    )
)