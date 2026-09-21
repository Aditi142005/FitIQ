import os
import pandas as pd


DATA_DIR = os.path.join(
    os.path.dirname(__file__),
    "data"
)

ACTIVITY_FILE = os.path.join(
    DATA_DIR,
    "dailyActivity_merged.csv"
)

SLEEP_FILE = os.path.join(
    DATA_DIR,
    "sleepDay_merged.csv"
)

OUTPUT_FILE = os.path.join(
    DATA_DIR,
    "FitIQ_E5_Cleaned_Fitbit.csv"
)


def load_activity_data():
    activity = pd.read_csv(ACTIVITY_FILE)

    activity["ActivityDate"] = pd.to_datetime(
        activity["ActivityDate"],
        errors="coerce"
    )

    activity = activity.dropna(
        subset=["Id", "ActivityDate"]
    )

    activity = activity.drop_duplicates()

    activity = activity.sort_values(
        ["Id", "ActivityDate"]
    ).reset_index(drop=True)

    return activity


def create_activity_quality_flag(activity):
    activity["activity_data_unavailable"] = (
        (activity["TotalSteps"] == 0)
        & (activity["TotalDistance"] == 0)
        & (activity["VeryActiveMinutes"] == 0)
        & (activity["FairlyActiveMinutes"] == 0)
        & (activity["LightlyActiveMinutes"] == 0)
    )

    return activity


def load_sleep_data():
    sleep = pd.read_csv(SLEEP_FILE)

    sleep["SleepDay"] = pd.to_datetime(
        sleep["SleepDay"],
        errors="coerce"
    )

    sleep = sleep.dropna(
        subset=["Id", "SleepDay"]
    )

    # Remove exact duplicate sleep records.
    sleep = sleep.drop_duplicates()

    sleep = sleep.sort_values(
        ["Id", "SleepDay"]
    ).reset_index(drop=True)

    # Convert minutes into hours.
    sleep["sleep_hours"] = (
        sleep["TotalMinutesAsleep"] / 60
    )

    return sleep


def merge_activity_and_sleep(activity, sleep):
    sleep_for_merge = sleep[
        [
            "Id",
            "SleepDay",
            "sleep_hours"
        ]
    ].copy()

    sleep_for_merge = sleep_for_merge.rename(
        columns={
            "SleepDay": "ActivityDate"
        }
    )

    merged = activity.merge(
        sleep_for_merge,
        on=["Id", "ActivityDate"],
        how="left"
    )

    return merged


def main():
    print("=" * 70)
    print("FITIQ E5 — PREPROCESSING")
    print("=" * 70)

    print("\nLoading activity data...")
    activity = load_activity_data()

    print(
        f"Activity records after cleaning: "
        f"{len(activity)}"
    )

    print("\nCreating activity quality flag...")
    activity = create_activity_quality_flag(
        activity
    )

    unavailable_count = int(
        activity["activity_data_unavailable"].sum()
    )

    print(
        f"Likely unavailable activity records: "
        f"{unavailable_count}"
    )

    print("\nLoading sleep data...")
    sleep = load_sleep_data()

    print(
        f"Sleep records after removing duplicates: "
        f"{len(sleep)}"
    )

    print("\nMerging activity and sleep data...")
    cleaned = merge_activity_and_sleep(
        activity,
        sleep
    )

    print(
        f"Final cleaned dataset shape: "
        f"{cleaned.shape}"
    )

    print("\nMissing sleep values:")
    print(
        cleaned["sleep_hours"]
        .isna()
        .sum()
    )

    print("\nActivity quality distribution:")
    print(
        cleaned[
            "activity_data_unavailable"
        ].value_counts()
    )

    cleaned.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\nSaved cleaned dataset:")
    print(OUTPUT_FILE)

    print("\nFinal columns:")
    for column in cleaned.columns:
        print(f"  - {column}")

    print("\n" + "=" * 70)
    print("E5 PREPROCESSING COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()