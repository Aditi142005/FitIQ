import os
import pandas as pd
import numpy as np


DATA_DIR = os.path.join(
    os.path.dirname(__file__),
    "data"
)

INPUT_FILE = os.path.join(
    DATA_DIR,
    "FitIQ_E5_Cleaned_Fitbit.csv"
)

OUTPUT_FILE = os.path.join(
    DATA_DIR,
    "FitIQ_E5_Features.csv"
)


def load_cleaned_data():
    df = pd.read_csv(INPUT_FILE)

    df["ActivityDate"] = pd.to_datetime(
        df["ActivityDate"],
        errors="coerce"
    )

    df = df.sort_values(
        ["Id", "ActivityDate"]
    ).reset_index(drop=True)

    return df


def create_activity_features(df):
    # Total active minutes
    df["total_active_minutes"] = (
        df["VeryActiveMinutes"]
        + df["FairlyActiveMinutes"]
        + df["LightlyActiveMinutes"]
    )

    # Calculate participant-specific rolling features.
    grouped = df.groupby("Id", group_keys=False)

    df["steps_7d_avg"] = grouped["TotalSteps"].transform(
        lambda x: x.rolling(
            window=7,
            min_periods=3
        ).mean()
    )

    df["active_minutes_7d_avg"] = grouped[
        "total_active_minutes"
    ].transform(
        lambda x: x.rolling(
            window=7,
            min_periods=3
        ).mean()
    )

    df["calories_7d_avg"] = grouped[
        "Calories"
    ].transform(
        lambda x: x.rolling(
            window=7,
            min_periods=3
        ).mean()
    )

    # Personal historical baselines.
    #
    # shift(1) ensures today's value is NOT included
    # when calculating today's baseline.
    df["steps_baseline"] = grouped[
        "TotalSteps"
    ].transform(
        lambda x: x.shift(1).expanding().mean()
    )

    df["active_minutes_baseline"] = grouped[
        "total_active_minutes"
    ].transform(
        lambda x: x.shift(1).expanding().mean()
    )

    # Historical variability.
    df["steps_baseline_std"] = grouped[
        "TotalSteps"
    ].transform(
        lambda x: x.shift(1).expanding().std()
    )

    df["active_minutes_baseline_std"] = grouped[
        "total_active_minutes"
    ].transform(
        lambda x: x.shift(1).expanding().std()
    )

    # Deviation from personal baseline.
    df["steps_deviation"] = (
        df["TotalSteps"]
        - df["steps_baseline"]
    )

    df["active_minutes_deviation"] = (
        df["total_active_minutes"]
        - df["active_minutes_baseline"]
    )

    # Standardized deviation.
    #
    # Small epsilon prevents division by zero.
    epsilon = 1e-6

    df["steps_z_score"] = (
        df["steps_deviation"]
        / (
            df["steps_baseline_std"]
            + epsilon
        )
    )

    df["active_minutes_z_score"] = (
        df["active_minutes_deviation"]
        / (
            df["active_minutes_baseline_std"]
            + epsilon
        )
    )

    return df


def create_variability_features(df):
    grouped = df.groupby("Id", group_keys=False)

    df["steps_7d_std"] = grouped[
        "TotalSteps"
    ].transform(
        lambda x: x.rolling(
            window=7,
            min_periods=3
        ).std()
    )

    df["active_minutes_7d_std"] = grouped[
        "total_active_minutes"
    ].transform(
        lambda x: x.rolling(
            window=7,
            min_periods=3
        ).std()
    )

    return df


def create_trend_features(df):
    grouped = df.groupby("Id", group_keys=False)

    # Difference between today's value and
    # the previous day's value.
    df["steps_daily_change"] = grouped[
        "TotalSteps"
    ].diff()

    df["active_minutes_daily_change"] = grouped[
        "total_active_minutes"
    ].diff()

    # Short-term trend:
    # recent rolling average compared with
    # the previous rolling average.
    df["steps_trend"] = (
        df["steps_7d_avg"]
        - grouped["steps_7d_avg"].shift(7)
    )

    df["active_minutes_trend"] = (
        df["active_minutes_7d_avg"]
        - grouped["active_minutes_7d_avg"].shift(7)
    )

    return df


def create_sleep_features(df):
    grouped = df.groupby("Id", group_keys=False)

    # Sleep baseline uses only previous observations.
    df["sleep_baseline"] = grouped[
        "sleep_hours"
    ].transform(
        lambda x: x.shift(1).expanding().mean()
    )

    df["sleep_deviation"] = (
        df["sleep_hours"]
        - df["sleep_baseline"]
    )

    return df


def create_quality_features(df):
    # Activity unavailable days should not be
    # treated as genuine low-activity days.
    df["analysis_ready"] = (
        ~df["activity_data_unavailable"]
    )

    return df


def main():
    print("=" * 70)
    print("FITIQ E5 — FEATURE ENGINEERING")
    print("=" * 70)

    print("\nLoading cleaned dataset...")

    df = load_cleaned_data()

    print(
        f"Input shape: {df.shape}"
    )

    print("\nCreating activity features...")
    df = create_activity_features(df)

    print("Creating variability features...")
    df = create_variability_features(df)

    print("Creating trend features...")
    df = create_trend_features(df)

    print("Creating sleep features...")
    df = create_sleep_features(df)

    print("Creating quality features...")
    df = create_quality_features(df)

    # Replace infinite values created by
    # extremely small standard deviations.
    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        f"\nOutput shape: {df.shape}"
    )

    print("\nNew engineered features:")

    feature_columns = [
        "total_active_minutes",
        "steps_7d_avg",
        "active_minutes_7d_avg",
        "calories_7d_avg",
        "steps_baseline",
        "active_minutes_baseline",
        "steps_baseline_std",
        "active_minutes_baseline_std",
        "steps_deviation",
        "active_minutes_deviation",
        "steps_z_score",
        "active_minutes_z_score",
        "steps_7d_std",
        "active_minutes_7d_std",
        "steps_daily_change",
        "active_minutes_daily_change",
        "steps_trend",
        "active_minutes_trend",
        "sleep_baseline",
        "sleep_deviation",
        "analysis_ready"
    ]

    for column in feature_columns:
        print(f"  - {column}")

    print("\nSample engineered data:")

    print(
        df[
            [
                "Id",
                "ActivityDate",
                "TotalSteps",
                "steps_7d_avg",
                "steps_baseline",
                "steps_deviation",
                "steps_z_score",
                "steps_trend",
                "sleep_hours",
                "sleep_deviation",
                "analysis_ready"
            ]
        ].tail(10).to_string(index=False)
    )

    print("\nSaved feature dataset:")
    print(OUTPUT_FILE)

    print("\n" + "=" * 70)
    print("E5 FEATURE ENGINEERING COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()