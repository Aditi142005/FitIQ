import os
import pandas as pd


DATA_DIR = os.path.join(
    os.path.dirname(__file__),
    "data"
)


def main():

    activity_path = os.path.join(
        DATA_DIR,
        "dailyActivity_merged.csv"
    )

    sleep_path = os.path.join(
        DATA_DIR,
        "sleepDay_merged.csv"
    )

    activity = pd.read_csv(activity_path)
    sleep = pd.read_csv(sleep_path)

    activity["ActivityDate"] = pd.to_datetime(
        activity["ActivityDate"]
    )

    sleep["SleepDay"] = pd.to_datetime(
        sleep["SleepDay"]
    )

    print("=" * 70)
    print("FITIQ E5 — DATA QUALITY INVESTIGATION")
    print("=" * 70)

    # --------------------------------------------------
    # 1. ZERO STEP RECORDS
    # --------------------------------------------------

    print("\n" + "=" * 70)
    print("1. ZERO-STEP RECORDS")
    print("=" * 70)

    zero_steps = activity[
        activity["TotalSteps"] == 0
    ]

    print(
        f"\nTotal zero-step records: "
        f"{len(zero_steps)}"
    )

    print("\nZero-step records by participant:")

    print(
        zero_steps["Id"]
        .value_counts()
        .sort_index()
    )

    print("\nZero-step records with activity values:")

    print(
        zero_steps[
            [
                "Id",
                "ActivityDate",
                "TotalSteps",
                "TotalDistance",
                "VeryActiveMinutes",
                "FairlyActiveMinutes",
                "LightlyActiveMinutes",
                "SedentaryMinutes",
                "Calories"
            ]
        ].to_string(index=False)
    )

    # --------------------------------------------------
    # 2. ZERO CALORIES
    # --------------------------------------------------

    print("\n" + "=" * 70)
    print("2. ZERO-CALORIE RECORDS")
    print("=" * 70)

    zero_calories = activity[
        activity["Calories"] == 0
    ]

    print(
        f"\nTotal zero-calorie records: "
        f"{len(zero_calories)}"
    )

    print(
        zero_calories[
            [
                "Id",
                "ActivityDate",
                "TotalSteps",
                "TotalDistance",
                "Calories"
            ]
        ].to_string(index=False)
    )

    # --------------------------------------------------
    # 3. DUPLICATE SLEEP RECORDS
    # --------------------------------------------------

    print("\n" + "=" * 70)
    print("3. DUPLICATE SLEEP RECORDS")
    print("=" * 70)

    duplicate_sleep = sleep[
        sleep.duplicated(
            keep=False
        )
    ].sort_values(
        ["Id", "SleepDay"]
    )

    print(
        f"\nDuplicate sleep rows: "
        f"{len(duplicate_sleep)}"
    )

    print("\nDuplicate records:")

    print(
        duplicate_sleep.to_string(
            index=False
        )
    )

    # --------------------------------------------------
    # 4. MULTIPLE SLEEP RECORDS
    # --------------------------------------------------

    print("\n" + "=" * 70)
    print("4. MULTIPLE SLEEP RECORDS FOR SAME USER/DAY")
    print("=" * 70)

    sleep_counts = (
        sleep
        .groupby(
            ["Id", "SleepDay"]
        )
        .size()
        .reset_index(
            name="record_count"
        )
    )

    multiple_records = sleep_counts[
        sleep_counts["record_count"] > 1
    ]

    print(
        f"\nUser-days with multiple records: "
        f"{len(multiple_records)}"
    )

    print(
        multiple_records.to_string(
            index=False
        )
    )

    # --------------------------------------------------
    # 5. PARTICIPANT COVERAGE
    # --------------------------------------------------

    print("\n" + "=" * 70)
    print("5. PARTICIPANT COVERAGE")
    print("=" * 70)

    activity_days = (
        activity
        .groupby("Id")
        .size()
    )

    sleep_days = (
        sleep
        .groupby("Id")
        .size()
    )

    coverage = pd.DataFrame({
        "activity_days": activity_days,
        "sleep_days": sleep_days
    })

    print(
        coverage
        .fillna(0)
        .sort_values(
            "activity_days"
        )
        .to_string()
    )

    print("\n" + "=" * 70)
    print("DATA QUALITY INVESTIGATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()