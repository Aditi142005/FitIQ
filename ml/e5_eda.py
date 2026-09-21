import os
import pandas as pd
import matplotlib.pyplot as plt


DATA_DIR = os.path.join(
    os.path.dirname(__file__),
    "data"
)


def load_data(filename):
    path = os.path.join(DATA_DIR, filename)
    return pd.read_csv(path)


def inspect_activity(df):
    print("\n" + "=" * 70)
    print("E5 EDA — DAILY ACTIVITY")
    print("=" * 70)

    print("\nShape:", df.shape)

    print("\nParticipants:", df["Id"].nunique())

    print(
        "Date range:",
        pd.to_datetime(df["ActivityDate"]).min(),
        "to",
        pd.to_datetime(df["ActivityDate"]).max()
    )

    print("\nRecords per participant:")
    print(
        df.groupby("Id")
        .size()
        .describe()
    )

    print("\nActivity statistics:")
    columns = [
        "TotalSteps",
        "TotalDistance",
        "VeryActiveMinutes",
        "FairlyActiveMinutes",
        "LightlyActiveMinutes",
        "SedentaryMinutes",
        "Calories"
    ]

    print(
        df[columns]
        .describe()
        .round(2)
    )

    print("\nZero-value counts:")
    for column in columns:
        count = (df[column] == 0).sum()
        print(f"{column}: {count}")


def inspect_sleep(df):
    print("\n" + "=" * 70)
    print("E5 EDA — SLEEP")
    print("=" * 70)

    print("\nShape:", df.shape)

    print("\nParticipants:", df["Id"].nunique())

    print("\nDuplicate rows:", df.duplicated().sum())

    df["SleepDate"] = pd.to_datetime(
        df["SleepDay"]
    )

    print(
        "\nDate range:",
        df["SleepDate"].min(),
        "to",
        df["SleepDate"].max()
    )

    columns = [
        "TotalSleepRecords",
        "TotalMinutesAsleep",
        "TotalTimeInBed"
    ]

    print("\nSleep statistics:")
    print(
        df[columns]
        .describe()
        .round(2)
    )


def inspect_weight(df):
    print("\n" + "=" * 70)
    print("E5 EDA — WEIGHT")
    print("=" * 70)

    print("\nShape:", df.shape)

    print("\nParticipants:", df["Id"].nunique())

    print("\nMissing values:")
    print(df.isnull().sum())

    print("\nWeight statistics:")
    print(
        df[
            [
                "WeightKg",
                "BMI",
                "Fat"
            ]
        ]
        .describe()
        .round(2)
    )


def plot_activity_distributions(df):
    print("\nGenerating activity distribution plots...")

    plt.figure(figsize=(9, 5))
    plt.hist(df["TotalSteps"], bins=30)
    plt.xlabel("Daily Steps")
    plt.ylabel("Number of Records")
    plt.title("Distribution of Daily Steps")
    plt.tight_layout()
    plt.show()

    plt.figure(figsize=(9, 5))
    plt.hist(df["Calories"], bins=30)
    plt.xlabel("Calories Burned")
    plt.ylabel("Number of Records")
    plt.title("Distribution of Daily Calories")
    plt.tight_layout()
    plt.show()

    plt.figure(figsize=(9, 5))
    plt.hist(df["SedentaryMinutes"], bins=30)
    plt.xlabel("Sedentary Minutes")
    plt.ylabel("Number of Records")
    plt.title("Distribution of Sedentary Minutes")
    plt.tight_layout()
    plt.show()


def plot_sleep_distributions(df):
    print("\nGenerating sleep distribution plots...")

    sleep_hours = (
        df["TotalMinutesAsleep"] / 60
    )

    plt.figure(figsize=(9, 5))
    plt.hist(sleep_hours, bins=25)
    plt.xlabel("Sleep Duration (Hours)")
    plt.ylabel("Number of Records")
    plt.title("Distribution of Sleep Duration")
    plt.tight_layout()
    plt.show()


def plot_activity_relationships(df):
    print("\nGenerating relationship plots...")

    plt.figure(figsize=(9, 5))
    plt.scatter(
        df["TotalSteps"],
        df["Calories"],
        alpha=0.5
    )
    plt.xlabel("Daily Steps")
    plt.ylabel("Calories Burned")
    plt.title("Daily Steps vs Calories Burned")
    plt.tight_layout()
    plt.show()

    plt.figure(figsize=(9, 5))
    plt.scatter(
        df["VeryActiveMinutes"],
        df["Calories"],
        alpha=0.5
    )
    plt.xlabel("Very Active Minutes")
    plt.ylabel("Calories Burned")
    plt.title("Very Active Minutes vs Calories")
    plt.tight_layout()
    plt.show()


def plot_participant_trends(df):
    print("\nGenerating participant trend examples...")

    df["ActivityDate"] = pd.to_datetime(
        df["ActivityDate"]
    )

    participants = (
        df["Id"]
        .value_counts()
        .head(3)
        .index
    )

    for participant in participants:

        user_df = (
            df[df["Id"] == participant]
            .sort_values("ActivityDate")
        )

        plt.figure(figsize=(10, 5))

        plt.plot(
            user_df["ActivityDate"],
            user_df["TotalSteps"],
            marker="o"
        )

        plt.xlabel("Date")
        plt.ylabel("Daily Steps")
        plt.title(
            f"Daily Steps Trend — Participant {participant}"
        )

        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()


def main():

    print("=" * 70)
    print("FITIQ E5 — EXPLORATORY DATA ANALYSIS")
    print("=" * 70)

    activity_df = load_data(
        "dailyActivity_merged.csv"
    )

    sleep_df = load_data(
        "sleepDay_merged.csv"
    )

    weight_df = load_data(
        "weightLogInfo_merged.csv"
    )

    inspect_activity(activity_df)

    inspect_sleep(sleep_df)

    inspect_weight(weight_df)

    plot_activity_distributions(
        activity_df
    )

    plot_sleep_distributions(
        sleep_df
    )

    plot_activity_relationships(
        activity_df
    )

    plot_participant_trends(
        activity_df
    )

    print("\n" + "=" * 70)
    print("E5 EDA COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()