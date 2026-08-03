#calculate body mass index (BMI) based on weight and height
def calculate_bmi(weight, height):
    """
    weight -> kg
    height -> cm
    """

    height_m = height / 100

    bmi = weight / (height_m ** 2)

    return round(bmi, 2)

#categorize BMI into underweight, normal, overweight, or obese
def bmi_category(bmi):

    if bmi < 18.5:
        return "Underweight"

    elif bmi < 25:
        return "Normal"

    elif bmi < 30:
        return "Overweight"

    else:
        return "Obese"

#calculate basal metabolic rate (BMR) based on weight, height, age, and gender
def calculate_bmr(weight, height, age, gender):

    gender = gender.lower()

    if gender == "male":
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5

    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161

    return round(bmr, 2)

def calculate_health_score(data):

    score = 100

    bmi = data["bmi"]

    if bmi < 18.5 or bmi > 30:
        score -= 20
    elif bmi >= 25:
        score -= 10


    if data["sleepHours"] < 7:
        score -= 10


    if data["waterIntake"] < 2:
        score -= 10


    if data["dailySteps"] < 5000:
        score -= 15


    if data["exerciseFrequency"] < 3:
        score -= 15


    if data["stressLevel"] >= 4:
        score -= 10


    if score < 0:
        score = 0

    return score
#calculate total daily energy expenditure (TDEE) based on BMR and activity level
def calculate_tdee(bmr, activity_level):

    activity_level = activity_level.lower()

    multipliers = {
        "low": 1.2,
        "moderate": 1.55,
        "high": 1.725
    }

    multiplier = multipliers.get(activity_level, 1.2)

    tdee = bmr * multiplier

    return round(tdee, 2)

#calculate ideal weight range based on height
def ideal_weight_range(height):
    """
    height -> cm
    Returns (minimum_weight, maximum_weight)
    """

    height_m = height / 100

    minimum = 18.5 * (height_m ** 2)
    maximum = 24.9 * (height_m ** 2)

    return round(minimum, 2), round(maximum, 2)
#testing the functions
if __name__ == "__main__":

    bmi = calculate_bmi(70, 170)

    print("BMI:", bmi)
    print("Category:", bmi_category(bmi))

    bmr = calculate_bmr(
        weight=70,
        height=170,
        age=22,
        gender="Male"
    )

    print("BMR:", bmr)

    tdee = calculate_tdee(
        bmr,
        "Moderate"
    )

    print("Daily Calories:", tdee)

    ideal_min, ideal_max = ideal_weight_range(170)

    print("Ideal Weight Range:", ideal_min, "-", ideal_max, "kg")