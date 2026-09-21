import os
import pandas as pd
import numpy as np


# ============================================================
# RESEARCH / DEVELOPMENT DATA
# ============================================================

DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "FitIQ_E5_Features.csv"
)


def load_feature_data():
    """
    Loads the Fitbit research dataset used for
    development and validation of the E5 detection logic.
    """

    df = pd.read_csv(DATA_PATH)

    df["ActivityDate"] = pd.to_datetime(
        df["ActivityDate"],
        errors="coerce"
    )

    df = df.sort_values(
        ["Id", "ActivityDate"]
    ).reset_index(drop=True)

    return df


# ============================================================
# RESEARCH ANOMALY DETECTOR
# ============================================================

def calculate_robust_z_score(
    value,
    baseline,
    standard_deviation,
    minimum_std
):
    """
    Calculates a baseline-relative z-score.

    A minimum standard deviation prevents extremely
    sensitive anomaly detection when personal variation
    is very small.
    """

    if pd.isna(value) or pd.isna(baseline):
        return None

    if pd.isna(standard_deviation):
        return None

    effective_std = max(
        abs(float(standard_deviation)),
        minimum_std
    )

    return (
        float(value) - float(baseline)
    ) / effective_std


def calculate_anomaly_score(row):

    scores = []

    steps_score = calculate_robust_z_score(
        row["TotalSteps"],
        row["steps_baseline"],
        row["steps_baseline_std"],
        1000
    )

    active_score = calculate_robust_z_score(
        row["total_active_minutes"],
        row["active_minutes_baseline"],
        row["active_minutes_baseline_std"],
        15
    )

    if steps_score is not None:
        scores.append(abs(steps_score))

    if active_score is not None:
        scores.append(abs(active_score))

    sleep_score = None

    if (
        pd.notna(row["sleep_hours"])
        and pd.notna(row["sleep_baseline"])
    ):
        sleep_score = abs(
            float(row["sleep_deviation"])
        )

        scores.append(sleep_score)

    if not scores:
        return None

    if (
        steps_score is not None
        and active_score is not None
    ):

        activity_score = (
            abs(steps_score)
            + abs(active_score)
        ) / 2

        if sleep_score is not None:

            return float(
                activity_score * 0.8
                + sleep_score * 0.2
            )

        return float(activity_score)

    return float(np.mean(scores))


def classify_anomaly(score):

    if score is None:
        return "insufficient_data"

    if score >= 3.0:
        return "high"

    if score >= 2.0:
        return "moderate"

    return "normal"


def generate_anomaly_explanation(row):

    explanations = []

    steps_score = calculate_robust_z_score(
        row["TotalSteps"],
        row["steps_baseline"],
        row["steps_baseline_std"],
        1000
    )

    active_score = calculate_robust_z_score(
        row["total_active_minutes"],
        row["active_minutes_baseline"],
        row["active_minutes_baseline_std"],
        15
    )

    if steps_score is not None:

        if steps_score <= -2:
            explanations.append(
                "steps were substantially below the personal baseline"
            )

        elif steps_score >= 2:
            explanations.append(
                "steps were substantially above the personal baseline"
            )

    if active_score is not None:

        if active_score <= -2:
            explanations.append(
                "active minutes were substantially below the personal baseline"
            )

        elif active_score >= 2:
            explanations.append(
                "active minutes were substantially above the personal baseline"
            )

    if pd.notna(row["sleep_deviation"]):

        sleep_deviation = float(
            row["sleep_deviation"]
        )

        if sleep_deviation <= -1.5:

            explanations.append(
                "sleep was noticeably below the personal baseline"
            )

        elif sleep_deviation >= 1.5:

            explanations.append(
                "sleep was noticeably above the personal baseline"
            )

    if not explanations:

        explanations.append(
            "recent activity differed from the participant's usual pattern"
        )

    return (
        " and ".join(explanations).capitalize()
        + "."
    )


def detect_anomalies(df):

    results = []

    for _, row in df.iterrows():

        if not bool(row["analysis_ready"]):
            continue

        score = calculate_anomaly_score(row)

        level = classify_anomaly(score)

        if level in ["moderate", "high"]:

            results.append({

                "participant_id": int(row["Id"]),

                "date": row["ActivityDate"].strftime(
                    "%Y-%m-%d"
                ),

                "anomaly_score": round(
                    score,
                    2
                ),

                "severity": level,

                "steps": int(
                    row["TotalSteps"]
                ),

                "active_minutes": int(
                    row["total_active_minutes"]
                ),

                "explanation":
                    generate_anomaly_explanation(row)
            })

    return results


# ============================================================
# USER ACTIVITY INTELLIGENCE
# ============================================================

def safe_number(value):

    try:

        if value is None:
            return None

        if value == "":
            return None

        number = float(value)

        if not np.isfinite(number):
            return None

        return number

    except (ValueError, TypeError):

        return None


def normalize_tracking_records(tracking_records):

    normalized = []

    if not isinstance(tracking_records, list):
        return normalized

    for record in tracking_records:

        if not isinstance(record, dict):
            continue

        date = record.get("date")

        if not date:
            continue

        steps = safe_number(
            record.get("steps")
        )

        exercise_minutes = safe_number(
            record.get("exerciseMinutes")
        )

        sleep_hours = safe_number(
            record.get("sleepHours")
        )

        sleep_quality = safe_number(
            record.get("sleepQuality")
        )

        workout_completed = record.get(
            "workoutCompleted",
            False
        )

        intensity = record.get(
            "exerciseIntensity"
        )

        if steps is None and exercise_minutes is None:
            continue

        normalized.append({

            "date": str(date),

            "steps": steps,

            "exercise_minutes":
                exercise_minutes,

            "sleep_hours":
                sleep_hours,

            "sleep_quality":
                sleep_quality,

            "workout_completed":
                bool(workout_completed),

            "exercise_intensity":
                intensity
        })

    if not normalized:
        return []

    df = pd.DataFrame(normalized)

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["date"]
    )

    df = (
        df.sort_values("date")
        .drop_duplicates(
            subset=["date"],
            keep="last"
        )
        .reset_index(drop=True)
    )

    return df.to_dict(
        orient="records"
    )


def calculate_activity_score(record):

    """
    Converts the user's activity into a simple
    normalized activity score.

    Steps and exercise both contribute.
    This is NOT presented as a medical score.
    """

    steps = record.get("steps")
    exercise_minutes = record.get(
        "exercise_minutes"
    )

    intensity = record.get(
        "exercise_intensity"
    )

    score_parts = []

    # --------------------------------------------------------
    # Steps
    # --------------------------------------------------------

    if steps is not None:

        # 7500 steps = 100%
        step_score = min(
            steps / 7500,
            1.0
        )

        score_parts.append(
            step_score * 0.6
        )

    # --------------------------------------------------------
    # Exercise
    # --------------------------------------------------------

    if exercise_minutes is not None:

        # 30 minutes = 100%
        exercise_score = min(
            exercise_minutes / 30,
            1.0
        )

        # Intensity provides supporting evidence.
        intensity_multiplier = {
            "Low": 0.8,
            "Medium": 1.0,
            "High": 1.15
        }.get(
            intensity,
            1.0
        )

        exercise_score = min(
            exercise_score
            * intensity_multiplier,
            1.0
        )

        score_parts.append(
            exercise_score * 0.4
        )

    if not score_parts:
        return None

    return sum(score_parts) * 100


def calculate_activity_baseline(records):

    scores = []

    for record in records:

        score = calculate_activity_score(
            record
        )

        if score is not None:
            scores.append(score)

    if not scores:
        return None

    return float(
        np.mean(scores)
    )


def calculate_recent_activity(records):

    recent_scores = []

    for record in records:

        score = calculate_activity_score(
            record
        )

        if score is not None:
            recent_scores.append(score)

    if not recent_scores:
        return None

    return float(
        np.mean(recent_scores)
    )


def calculate_stability(records):

    scores = []

    for record in records:

        score = calculate_activity_score(
            record
        )

        if score is not None:
            scores.append(score)

    if len(scores) < 3:
        return None

    mean_score = np.mean(scores)

    if mean_score == 0:
        return 0

    standard_deviation = np.std(
        scores
    )

    # Convert variation into a stability
    # percentage. Lower variation = higher stability.
    coefficient = (
        standard_deviation
        / mean_score
    )

    stability = (
        1 - min(coefficient, 1)
    ) * 100

    return float(
        max(0, min(stability, 100))
    )


def calculate_step_percentage_change(
    recent_record,
    baseline_steps
):

    recent_steps = recent_record.get(
        "steps"
    )

    if (
        recent_steps is None
        or baseline_steps is None
        or baseline_steps <= 0
    ):
        return None

    return (
        (
            recent_steps
            - baseline_steps
        )
        / baseline_steps
    ) * 100


def generate_user_insight(
    records,
    baseline_score,
    stability
):

    if len(records) < 3:

        return {

            "type": "insufficient_data",

            "title":
                "Keep tracking to unlock activity insights",

            "message":
                "We need a few more days of tracking to understand your personal activity pattern.",

            "action":
                "Keep recording your daily activity."
        }

    recent_record = records[-1]

    recent_score = calculate_activity_score(
        recent_record
    )

    if (
        recent_score is None
        or baseline_score is None
    ):

        return {

            "type": "insufficient_data",

            "title":
                "Keep tracking your activity",

            "message":
                "Once we have enough activity data, FitIQ can identify meaningful changes in your routine.",

            "action":
                "Continue your daily tracking."
        }

    difference = (
        recent_score
        - baseline_score
    )

    # --------------------------------------------------------
    # Significant activity decrease
    # --------------------------------------------------------

    if difference <= -20:

        steps = recent_record.get(
            "steps"
        )

        baseline_steps = np.mean([
            record["steps"]
            for record in records[:-1]
            if record.get("steps") is not None
        ]) if any(
            record.get("steps") is not None
            for record in records[:-1]
        ) else None

        percentage = calculate_step_percentage_change(
            recent_record,
            baseline_steps
        )

        if percentage is not None:

            percentage_text = (
                f"{abs(round(percentage))}% below"
            )

            message = (
                f"Your activity dipped recently. "
                f"You recorded {int(steps):,} steps, "
                f"about {percentage_text} your recent average."
            )

        else:

            message = (
                "Your recent activity was noticeably "
                "below your usual level."
            )

        return {

            "type": "activity_drop",

            "title":
                "Your activity dipped recently",

            "message":
                message,

            "action":
                "Try adding a short walk or light activity today."
        }

    # --------------------------------------------------------
    # Significant activity increase
    # --------------------------------------------------------

    if difference >= 20:

        return {

            "type": "activity_increase",

            "title":
                "You're more active than usual",

            "message":
                "Your recent activity is noticeably above your usual pattern.",

            "action":
                "Keep the momentum while allowing enough recovery."
        }

    # --------------------------------------------------------
    # Stable routine
    # --------------------------------------------------------

    if stability is not None and stability >= 80:

        return {

            "type": "stable",

            "title":
                "Your routine is staying consistent",

            "message":
                f"Your activity has remained fairly stable. "
                f"Your current activity consistency is "
                f"{round(stability)}%.",

            "action":
                "Keep building on this routine."
        }

    # --------------------------------------------------------
    # Mild variation
    # --------------------------------------------------------

    return {

        "type": "normal_variation",

        "title":
            "Your activity is changing normally",

        "message":
            "Your recent activity is within the range of your usual pattern.",

        "action":
            "Continue tracking to help FitIQ understand your routine better."
    }


def analyze_user_activity(
    tracking_records
):

    records = normalize_tracking_records(
        tracking_records
    )

    # --------------------------------------------------------
    # No usable records
    # --------------------------------------------------------

    if len(records) == 0:

        return {

            "status": "success",

            "mode": "personal",

            "data_status":
                "no_data",

            "records_used": 0,

            "baseline": None,

            "recent_activity": None,

            "stability": None,

            "insight": {

                "type": "insufficient_data",

                "title":
                    "Start tracking your activity",

                "message":
                    "Record your daily activity to unlock personalized activity insights.",

                "action":
                    "Complete today's Daily Tracking."
            },

            "timeline": []
        }

    # --------------------------------------------------------
    # Insufficient history
    # --------------------------------------------------------

    if len(records) < 3:

        timeline = []

        for record in records:

            score = calculate_activity_score(
                record
            )

            timeline.append({

                "date":
                    record["date"].strftime(
                        "%Y-%m-%d"
                    ),

                "activity_score":
                    round(score, 1)
                    if score is not None
                    else None,

                "steps":
                    record.get("steps"),

                "exercise_minutes":
                    record.get(
                        "exercise_minutes"
                    )
            })

        return {

            "status": "success",

            "mode": "personal",

            "data_status":
                "insufficient_data",

            "records_used":
                len(records),

            "baseline": None,

            "recent_activity": None,

            "stability": None,

            "insight":
                generate_user_insight(
                    records,
                    None,
                    None
                ),

            "timeline":
                timeline
        }

    # --------------------------------------------------------
    # Personal baseline
    #
    # The most recent day is compared against
    # previous history so today's activity does
    # not influence its own baseline.
    # --------------------------------------------------------

    previous_records = records[:-1]

    baseline_score = calculate_activity_baseline(
        previous_records
    )

    recent_score = calculate_activity_score(
        records[-1]
    )

    stability = calculate_stability(
        records
    )

    insight = generate_user_insight(
        records,
        baseline_score,
        stability
    )

    # --------------------------------------------------------
    # Timeline
    # --------------------------------------------------------

    timeline = []

    for record in records[-14:]:

        score = calculate_activity_score(
            record
        )

        timeline.append({

            "date":
                record["date"].strftime(
                    "%Y-%m-%d"
                ),

            "activity_score":
                round(score, 1)
                if score is not None
                else None,

            "steps":
                record.get("steps"),

            "exercise_minutes":
                record.get(
                    "exercise_minutes"
                ),

            "workout_completed":
                record.get(
                    "workout_completed"
                )
        })

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {

        "status": "success",

        "mode": "personal",

        "data_status":
            "ready",

        "records_used":
            len(records),

        "baseline_activity":
            round(
                baseline_score,
                1
            ) if baseline_score is not None
            else None,

        "recent_activity":
            round(
                recent_score,
                1
            ) if recent_score is not None
            else None,

        "stability":
            round(
                stability,
                1
            ) if stability is not None
            else None,

        "insight":
            insight,

        "timeline":
            timeline
    }


# ============================================================
# RESEARCH ANALYSIS
# ============================================================

def detect_plateau_windows(df):

    candidates = []

    for participant_id, group in df.groupby("Id"):

        group = (
            group[
                group["analysis_ready"]
            ]
            .copy()
            .sort_values("ActivityDate")
        )

        if len(group) < 7:
            continue

        for index in range(6, len(group)):

            window = group.iloc[
                index - 6:index + 1
            ]

            rolling_values = (
                window["steps_7d_avg"]
                .dropna()
            )

            if len(rolling_values) < 5:
                continue

            average_steps = (
                rolling_values.mean()
            )

            average_change = (
                rolling_values
                .diff()
                .abs()
                .mean()
            )

            variability = (
                rolling_values.std()
            )

            if average_steps <= 0:
                continue

            change_ratio = (
                average_change
                / average_steps
            )

            variability_ratio = (
                variability
                / average_steps
            )

            if (
                change_ratio <= 0.08
                and variability_ratio <= 0.12
            ):

                candidates.append({

                    "participant_id":
                        int(participant_id),

                    "start_date":
                        window[
                            "ActivityDate"
                        ].iloc[0],

                    "end_date":
                        window[
                            "ActivityDate"
                        ].iloc[-1],

                    "average_steps":
                        float(
                            rolling_values.mean()
                        )
                })

    return candidates


def merge_plateaus(candidates):

    if not candidates:
        return []

    candidates = sorted(
        candidates,
        key=lambda item: (
            item["participant_id"],
            item["start_date"]
        )
    )

    merged = []

    for candidate in candidates:

        if not merged:

            merged.append(
                candidate.copy()
            )

            continue

        previous = merged[-1]

        same_participant = (
            candidate["participant_id"]
            == previous["participant_id"]
        )

        adjacent_or_overlapping = (
            candidate["start_date"]
            <= previous["end_date"]
            + pd.Timedelta(days=1)
        )

        if (
            same_participant
            and adjacent_or_overlapping
        ):

            previous["end_date"] = max(
                previous["end_date"],
                candidate["end_date"]
            )

            previous["average_steps"] = (
                previous["average_steps"]
                + candidate["average_steps"]
            ) / 2

        else:

            merged.append(
                candidate.copy()
            )

    results = []

    for plateau in merged:

        duration = (
            plateau["end_date"]
            - plateau["start_date"]
        ).days + 1

        results.append({

            "participant_id":
                plateau["participant_id"],

            "start_date":
                plateau["start_date"].strftime(
                    "%Y-%m-%d"
                ),

            "end_date":
                plateau["end_date"].strftime(
                    "%Y-%m-%d"
                ),

            "duration_days":
                duration,

            "average_steps":
                round(
                    plateau["average_steps"],
                    2
                ),

            "message":
                "Activity remained relatively stable during this period."
        })

    return results


def detect_plateaus(df):

    return merge_plateaus(
        detect_plateau_windows(df)
    )


def analyze_e5():

    df = load_feature_data()

    anomalies = detect_anomalies(df)

    plateaus = detect_plateaus(df)

    return {

        "status": "success",

        "dataset_records":
            len(df),

        "participants":
            int(df["Id"].nunique()),

        "anomaly_count":
            len(anomalies),

        "plateau_count":
            len(plateaus),

        "anomalies":
            anomalies,

        "plateaus":
            plateaus
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    result = analyze_e5()

    print(
        "\nE5 RESEARCH ANALYSIS"
    )

    print(
        "Records:",
        result["dataset_records"]
    )

    print(
        "Participants:",
        result["participants"]
    )

    print(
        "Anomalies:",
        result["anomaly_count"]
    )

    print(
        "Plateaus:",
        result["plateau_count"]
    )

    # --------------------------------------------------------
    # Test with Firestore-shaped user data
    # --------------------------------------------------------

    test_records = [

        {
            "date": "2026-09-14",
            "steps": 8000,
            "waterIntake": 2.2,
            "sleepHours": 7.5,
            "sleepQuality": 4,
            "exerciseMinutes": 35,
            "exerciseIntensity": "Medium",
            "caloriesConsumed": 2100,
            "stressLevel": 2,
            "energyLevel": 4,
            "workoutCompleted": True
        },

        {
            "date": "2026-09-15",
            "steps": 7600,
            "waterIntake": 2.0,
            "sleepHours": 7,
            "sleepQuality": 4,
            "exerciseMinutes": 30,
            "exerciseIntensity": "Medium",
            "caloriesConsumed": 2000,
            "stressLevel": 2,
            "energyLevel": 4,
            "workoutCompleted": True
        },

        {
            "date": "2026-09-16",
            "steps": 8200,
            "waterIntake": 2.3,
            "sleepHours": 7.5,
            "sleepQuality": 5,
            "exerciseMinutes": 40,
            "exerciseIntensity": "High",
            "caloriesConsumed": 2200,
            "stressLevel": 2,
            "energyLevel": 5,
            "workoutCompleted": True
        },

        {
            "date": "2026-09-17",
            "steps": 4200,
            "waterIntake": 1.8,
            "sleepHours": 6,
            "sleepQuality": 3,
            "exerciseMinutes": 10,
            "exerciseIntensity": "Low",
            "caloriesConsumed": 2100,
            "stressLevel": 4,
            "energyLevel": 2,
            "workoutCompleted": False
        }
    ]

    user_result = analyze_user_activity(
        test_records
    )

    print(
        "\nE5 PERSONAL USER ANALYSIS"
    )

    print(
        "Records used:",
        user_result["records_used"]
    )

    print(
        "Baseline:",
        user_result["baseline_activity"]
    )

    print(
        "Recent activity:",
        user_result["recent_activity"]
    )

    print(
        "Stability:",
        user_result["stability"]
    )

    print(
        "Insight:"
    )

    print(
        user_result["insight"]
    )

    # --------------------------------------------------------
    # TEST 2: STABLE ACTIVITY
    # --------------------------------------------------------

    stable_records = [

        {
            "date": "2026-09-14",
            "steps": 7500,
            "exerciseMinutes": 30,
            "exerciseIntensity": "Medium",
            "sleepHours": 7,
            "sleepQuality": 4,
            "workoutCompleted": True
        },

        {
            "date": "2026-09-15",
            "steps": 7600,
            "exerciseMinutes": 30,
            "exerciseIntensity": "Medium",
            "sleepHours": 7,
            "sleepQuality": 4,
            "workoutCompleted": True
        },

        {
            "date": "2026-09-16",
            "steps": 7450,
            "exerciseMinutes": 32,
            "exerciseIntensity": "Medium",
            "sleepHours": 7.5,
            "sleepQuality": 4,
            "workoutCompleted": True
        },

        {
            "date": "2026-09-17",
            "steps": 7550,
            "exerciseMinutes": 30,
            "exerciseIntensity": "Medium",
            "sleepHours": 7,
            "sleepQuality": 4,
            "workoutCompleted": True
        }
    ]

    stable_result = analyze_user_activity(
        stable_records
    )

    print(
        "\nE5 STABLE ACTIVITY TEST"
    )

    print(
        "Records used:",
        stable_result["records_used"]
    )

    print(
        "Baseline:",
        stable_result["baseline_activity"]
    )

    print(
        "Recent activity:",
        stable_result["recent_activity"]
    )

    print(
        "Stability:",
        stable_result["stability"]
    )

    print(
        "Insight:"
    )

    print(
        stable_result["insight"]
    )


    # --------------------------------------------------------
    # TEST 3: INSUFFICIENT DATA
    # --------------------------------------------------------

    insufficient_records = [

        {
            "date": "2026-09-16",
            "steps": 7000,
            "exerciseMinutes": 30,
            "exerciseIntensity": "Medium",
            "sleepHours": 7,
            "sleepQuality": 4,
            "workoutCompleted": True
        },

        {
            "date": "2026-09-17",
            "steps": 7200,
            "exerciseMinutes": 25,
            "exerciseIntensity": "Medium",
            "sleepHours": 6.5,
            "sleepQuality": 3,
            "workoutCompleted": False
        }
    ]

    insufficient_result = analyze_user_activity(
        insufficient_records
    )

    print(
        "\nE5 INSUFFICIENT DATA TEST"
    )

    print(
        "Records used:",
        insufficient_result["records_used"]
    )

    print(
        "Data status:",
        insufficient_result["data_status"]
    )

    print(
        "Insight:"
    )

    print(
        insufficient_result["insight"]
    )