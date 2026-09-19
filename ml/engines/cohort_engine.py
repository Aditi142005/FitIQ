import os
import re
import pandas as pd


# ============================================================
# FILE PATH
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

SURVEY_PATH = os.path.join(
    BASE_DIR,
    "data",
    "FitIQ_Survey_Responses.csv"
)


# ============================================================
# HELPERS
# ============================================================

def normalize_text(value):
    if pd.isna(value):
        return ""

    value = str(value).strip().lower()

    # Remove markdown formatting accidentally present
    value = value.replace("**", "")

    return value


def parse_range_midpoint(value):
    """
    Converts ranges such as:
    6-7 hours -> 6.5
    1-2 litres -> 1.5
    5-6 days -> 5.5
    """

    if pd.isna(value):
        return None

    text = normalize_text(value)

    numbers = re.findall(r"\d+(?:\.\d+)?", text)

    if len(numbers) >= 2:
        return (
            float(numbers[0]) +
            float(numbers[1])
        ) / 2

    if len(numbers) == 1:
        return float(numbers[0])

    return None


def parse_steps(value):
    """
    Converts survey step ranges to approximate daily steps.
    """

    if pd.isna(value):
        return None

    text = normalize_text(value)

    if "not tracked" in text:
        return None

    if "more than 10000" in text:
        return 11000

    if "less than 3000" in text:
        return 2000

    if "3000-5000" in text:
        return 4000

    if "5000-8000" in text:
        return 6500

    if "8000-10000" in text:
        return 9000

    return None


def parse_exercise_days(value):
    """
    Converts exercise-frequency categories into approximate
    number of exercise days per week.
    """

    if pd.isna(value):
        return None

    text = normalize_text(value)

    if "0 days" in text:
        return 0

    if "1-2 days" in text:
        return 1.5

    if "3-4 days" in text:
        return 3.5

    if "5-6 days" in text:
        return 5.5

    if "everyday" in text:
        return 7

    return None


def calculate_bmi(height_cm, weight_kg):
    """
    BMI = weight / height^2
    """

    if height_cm is None or weight_kg is None:
        return None

    if height_cm <= 0 or weight_kg <= 0:
        return None

    height_m = height_cm / 100

    return weight_kg / (height_m ** 2)


def activity_score(value):
    """
    Converts activity level into an ordinal score.
    """

    text = normalize_text(value)

    mapping = {
        "low": 1,
        "moderate": 2,
        "high": 3,
        "very high": 4
    }

    return mapping.get(text, 2)


def goal_match(user_goal, participant_goal):
    return (
        normalize_text(user_goal)
        == normalize_text(participant_goal)
    )


# ============================================================
# LOAD DATA
# ============================================================

def load_survey_data():
    """
    Loads the real-world FitIQ survey dataset.
    """

    if not os.path.exists(SURVEY_PATH):
        raise FileNotFoundError(
            f"Survey dataset not found at: {SURVEY_PATH}"
        )

    df = pd.read_csv(SURVEY_PATH)

    return df


# ============================================================
# PREPARE SURVEY DATA
# ============================================================

def prepare_survey_data(df):
    """
    Converts survey responses into numerical features
    required for cohort comparison.
    """

    prepared = pd.DataFrame()

    prepared["age"] = pd.to_numeric(
        df["Age"],
        errors="coerce"
    )

    prepared["gender"] = (
        df["Gender"]
        .astype(str)
        .str.strip()
    )

    prepared["height_cm"] = pd.to_numeric(
        df["Height(in cm)"],
        errors="coerce"
    )

    prepared["weight_kg"] = pd.to_numeric(
        df["Weight(in kg)"],
        errors="coerce"
    )

    prepared["bmi"] = prepared.apply(
        lambda row: calculate_bmi(
            row["height_cm"],
            row["weight_kg"]
        ),
        axis=1
    )

    prepared["sleep"] = df[
        "Average sleep duration per day"
    ].apply(parse_range_midpoint)

    prepared["daily_steps"] = df[
        "Average daily steps"
    ].apply(parse_steps)

    exercise_column = next(
    column
    for column in df.columns
    if "how many days per week do you exercise" in column.lower()
)

    prepared["exercise_days"] = df[
        exercise_column
    ].apply(parse_exercise_days)

    activity_column = next(
    column
    for column in df.columns
    if "current activity level" in column.lower()
)

    prepared["activity_level"] = (
         df[activity_column]
        .astype(str)
        .str.replace("**", "", regex=False)
        .str.strip()
)

    prepared["activity_score"] = prepared[
        "activity_level"
    ].apply(activity_score)

    prepared["water"] = df[
        "Daily water intake"
    ].apply(parse_range_midpoint)

    consistency_column = next(
    column
    for column in df.columns
    if "how consistent are you with your fitness routine" in column.lower()
)

    prepared["consistency"] = (
    pd.to_numeric(
        df[consistency_column],
        errors="coerce"
    ) * 20
)

    prepared["fitness_goal"] = (
        df[
            "What is your primary fitness goal?"
        ]
        .astype(str)
        .str.strip()
    )

    return prepared


# ============================================================
# SIMILARITY
# ============================================================

def calculate_similarity(user, participant):
    """
    Calculates similarity between the current FitIQ user
    and one survey participant.

    Score range: 0-100
    """

    scores = []

    # --------------------------------------------------------
    # AGE
    # --------------------------------------------------------

    if user.get("age") is not None and participant["age"] is not None:

        age_difference = abs(
            float(user["age"]) -
            float(participant["age"])
        )

        age_score = max(
            0,
            1 - (age_difference / 10)
        )

        scores.append(
            ("age", age_score, 0.15)
        )

    # --------------------------------------------------------
    # BMI
    # --------------------------------------------------------

    if user.get("bmi") is not None and participant["bmi"] is not None:

        bmi_difference = abs(
            float(user["bmi"]) -
            float(participant["bmi"])
        )

        bmi_score = max(
            0,
            1 - (bmi_difference / 8)
        )

        scores.append(
            ("bmi", bmi_score, 0.25)
        )

    # --------------------------------------------------------
    # GENDER
    # --------------------------------------------------------

    if user.get("gender") and participant["gender"]:

        gender_score = (
            1
            if normalize_text(user["gender"])
            == normalize_text(participant["gender"])
            else 0
        )

        scores.append(
            ("gender", gender_score, 0.10)
        )

    # --------------------------------------------------------
    # ACTIVITY LEVEL
    # --------------------------------------------------------

    if user.get("activity_level"):

        user_activity_score = activity_score(
            user["activity_level"]
        )

        participant_activity_score = participant[
            "activity_score"
        ]

        activity_difference = abs(
            user_activity_score -
            participant_activity_score
        )

        activity_similarity = max(
            0,
            1 - (activity_difference / 3)
        )

        scores.append(
            ("activity", activity_similarity, 0.20)
        )

    # --------------------------------------------------------
    # EXERCISE FREQUENCY
    # --------------------------------------------------------

    if (
        user.get("exercise_days") is not None
        and participant["exercise_days"] is not None
    ):

        exercise_difference = abs(
            float(user["exercise_days"]) -
            float(participant["exercise_days"])
        )

        exercise_similarity = max(
            0,
            1 - (exercise_difference / 7)
        )

        scores.append(
            (
                "exercise_frequency",
                exercise_similarity,
                0.15
            )
        )

    # --------------------------------------------------------
    # FITNESS GOAL
    # --------------------------------------------------------

    if user.get("fitness_goal"):

        goal_score = (
            1
            if goal_match(
                user["fitness_goal"],
                participant["fitness_goal"]
            )
            else 0
        )

        scores.append(
            ("goal", goal_score, 0.15)
        )

    # --------------------------------------------------------
    # WEIGHTED SIMILARITY
    # --------------------------------------------------------

    if not scores:
        return 0

    weighted_sum = sum(
        score * weight
        for _, score, weight in scores
    )

    total_weight = sum(
        weight
        for _, _, weight in scores
    )

    if total_weight == 0:
        return 0

    return round(
        (weighted_sum / total_weight) * 100,
        2
    )


# ============================================================
# FIND COHORT
# ============================================================

def find_cohort(user, prepared_df, cohort_size=10):
    """
    Finds the most similar survey participants.
    """

    df = prepared_df.copy()

    df["similarity"] = df.apply(
        lambda row: calculate_similarity(
            user,
            row
        ),
        axis=1
    )

    df = df.sort_values(
        "similarity",
        ascending=False
    )

    cohort = df.head(cohort_size).copy()

    return cohort


# ============================================================
# COHORT STATISTICS
# ============================================================

def calculate_cohort_statistics(cohort):
    """
    Calculates anonymous cohort benchmarks.
    """

    return {
        "average_bmi": round(
            cohort["bmi"].mean(),
            2
        ),

        "average_steps": round(
            cohort["daily_steps"].mean(),
            0
        )
        if cohort["daily_steps"].notna().any()
        else None,

        "average_exercise_days": round(
            cohort["exercise_days"].mean(),
            1
        )
        if cohort["exercise_days"].notna().any()
        else None,

        "average_sleep": round(
            cohort["sleep"].mean(),
            1
        )
        if cohort["sleep"].notna().any()
        else None,

        "average_water": round(
            cohort["water"].mean(),
            1
        )
        if cohort["water"].notna().any()
        else None,

        "average_consistency": round(
            cohort["consistency"].mean(),
            1
        )
        if cohort["consistency"].notna().any()
        else None
    }


# ============================================================
# USER VS COHORT
# ============================================================

def calculate_user_comparison(
    user,
    cohort_stats
):
    """
    Compares current user metrics with cohort averages.
    """

    comparisons = {}

    metrics = {
        "bmi": (
            user.get("bmi"),
            cohort_stats["average_bmi"]
        ),

        "daily_steps": (
            user.get("daily_steps"),
            cohort_stats["average_steps"]
        ),

        "exercise_days": (
            user.get("exercise_days"),
            cohort_stats["average_exercise_days"]
        ),

        "sleep": (
            user.get("sleep"),
            cohort_stats["average_sleep"]
        ),

        "water": (
            user.get("water"),
            cohort_stats["average_water"]
        ),

        "consistency": (
            user.get("consistency"),
            cohort_stats["average_consistency"]
        )
    }

    for key, (user_value, cohort_value) in metrics.items():

        if user_value is None or cohort_value is None:
            comparisons[key] = {
                "user": user_value,
                "cohort": cohort_value,
                "difference": None
            }

            continue

        difference = (
            float(user_value) -
            float(cohort_value)
        )

        comparisons[key] = {
            "user": round(float(user_value), 2),
            "cohort": round(float(cohort_value), 2),
            "difference": round(difference, 2)
        }

    return comparisons


# ============================================================
# MAIN E4 ANALYSIS
# ============================================================

def analyze_cohort(user):
    """
    Complete E4 Cohort Intelligence pipeline.
    """

    df = load_survey_data()

    prepared_df = prepare_survey_data(df)

    # Remove rows without essential comparison features
    prepared_df = prepared_df.dropna(
        subset=[
            "age",
            "bmi"
        ]
    )

    cohort = find_cohort(
        user,
        prepared_df,
        cohort_size=10
    )

    if len(cohort) == 0:
        return {
            "status": "insufficient_data",
            "message": "Not enough comparable participants were found.",
            "cohort_size": 0
        }

    cohort_stats = calculate_cohort_statistics(
        cohort
    )

    comparisons = calculate_user_comparison(
        user,
        cohort_stats
    )

    average_similarity = round(
        cohort["similarity"].mean(),
        2
    )

    return {
        "status": "success",
        "cohort_size": int(len(cohort)),
        "average_similarity": average_similarity,
        "cohort_stats": cohort_stats,
        "comparisons": comparisons,
        "message": (
            "Your comparison is based on "
            "similar participants from the FitIQ "
            "real-world survey dataset."
        )
    }