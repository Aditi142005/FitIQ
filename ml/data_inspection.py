import pandas as pd
df = pd.read_csv("data/FitIQ_FitLife360_Cleaned_Foundation.csv")
#print(df.head())
#print(df.shape)
#print(df.columns)
#print(df.dtypes)
print(df.isnull().sum())
print("\n--- CATEGORICAL VALUES ---")

print("\nGender:")
print(df["gender"].unique())

print("\nActivity Types:")
print(df["activity_type"].unique())

print("\nIntensity:")
print(df["intensity"].unique())

print("\nSmoking Status:")
print(df["smoking_status"].unique())

print("\nHealth Conditions:")
print(df["health_condition"].unique())

print("\nFitness Level:")
print(df["fitness_level"].unique())
print("\n--- NUMERICAL SUMMARY ---")
print(df.describe())
print("\n--- HEALTH & FITNESS SUMMARY ---")

health_columns = [
    "weight_kg",
    "bmi",
    "fitiq_bmi",
    "hours_sleep",
    "stress_level",
    "daily_steps",
    "hydration_level",
    "avg_heart_rate",
    "resting_heart_rate",
    "blood_pressure_systolic",
    "blood_pressure_diastolic",
    "calories_burned",
    "duration_minutes",
    "fitness_level"
]

print(df[health_columns].describe())
print("\n--- BMI VALIDATION ---")

calculated_bmi = df["weight_kg"] / (df["height_cm"] / 100) ** 2

print("Calculated BMI:")
print(calculated_bmi.describe())

print("\nExisting BMI:")
print(df["bmi"].describe())

print("\nFitIQ BMI:")
print(df["fitiq_bmi"].describe())
print("\n--- BMI COMPARISON ---")

print(
    df[
        [
            "height_cm",
            "weight_kg",
            "bmi_original",
            "bmi",
            "fitiq_bmi"
        ]
    ].head(10)
)
print("\n--- BMI DIFFERENCE ANALYSIS ---")

bmi_difference = df["fitiq_bmi"] - df["bmi"]

print("Mean difference:", bmi_difference.mean())
print("Minimum difference:", bmi_difference.min())
print("Maximum difference:", bmi_difference.max())
print("Records with difference:", (bmi_difference != 0).sum())
print("\n--- DUPLICATE CHECK ---")

duplicate_count = df.duplicated().sum()

print("Duplicate rows:", duplicate_count)
print("\n--- DATA QUALITY FLAGS ---")

flag_columns = [
    "steps_invalid_flag",
    "heart_rate_anomaly_flag",
    "systolic_anomaly_flag",
    "diastolic_anomaly_flag",
    "health_condition_missing_flag"
]

for column in flag_columns:
    print(f"{column}:")
    print(df[column].value_counts())
    print("\n--- FLAGGED RECORDS ---")

print("\nInvalid Steps:")
print(df[df["steps_invalid_flag"] == 1][
    ["participant_id", "date", "daily_steps", "steps_invalid_flag"]
])

print("\nHeart Rate Anomalies:")
print(df[df["heart_rate_anomaly_flag"] == 1][
    ["participant_id", "date", "avg_heart_rate", "heart_rate_anomaly_flag"]
])

print("\nSystolic BP Anomalies:")
print(df[df["systolic_anomaly_flag"] == 1][
    ["participant_id", "date", "blood_pressure_systolic", "systolic_anomaly_flag"]
])
print("\n--- PARTICIPANT 58 BP CHECK ---")

participant_58 = df[df["participant_id"] == 58]

print(
    participant_58[
        [
            "participant_id",
            "date",
            "blood_pressure_systolic",
            "blood_pressure_diastolic",
            "systolic_anomaly_flag",
            "diastolic_anomaly_flag"
        ]
    ].head(20)
)

print("\nParticipant 58 systolic BP statistics:")
print(participant_58["blood_pressure_systolic"].describe())
print("\n--- PARTICIPANT COVERAGE ---")

records_per_participant = df["participant_id"].value_counts()

print("Number of participants:", records_per_participant.count())
print("\nRecords per participant:")
print(records_per_participant.describe())

print("\nParticipants with fewest records:")
print(records_per_participant.nsmallest(10))

print("\nParticipants with most records:")
print(records_per_participant.nlargest(10))

print("\n--- HEALTH CONDITION ANALYSIS ---")

print("Health condition counts:")
print(df["health_condition"].value_counts(dropna=False))

print("\nHealth condition percentages:")
print(df["health_condition"].value_counts(normalize=True, dropna=False) * 100)

print("\n--- MISSING DAILY STEPS ---")

print(
    df[df["daily_steps"].isna()][
        [
            "participant_id",
            "date",
            "daily_steps",
            "hours_sleep",
            "stress_level",
            "activity_type",
            "duration_minutes",
            "calories_burned"
        ]
    ]
)

print("\n--- HEART RATE ANOMALY CHECK ---")

print(
    df[df["heart_rate_anomaly_flag"] == 1][
        [
            "participant_id",
            "date",
            "avg_heart_rate",
            "activity_type",
            "duration_minutes",
            "intensity"
        ]
    ]
)

print("\n--- SYSTOLIC BP ANOMALY COMPARISON ---")

print("Overall systolic BP:")
print(df["blood_pressure_systolic"].describe())

print("\nParticipant 58 systolic BP:")
print(df[df["participant_id"] == 58]["blood_pressure_systolic"].describe())

print("\nFlagged systolic BP values:")
print(
    df[df["systolic_anomaly_flag"] == 1]["blood_pressure_systolic"].value_counts()
)

print("\n--- CATEGORICAL FEATURE ANALYSIS ---")

categorical_columns = [
    "gender",
    "activity_type",
    "intensity",
    "health_condition",
    "smoking_status"
]

for column in categorical_columns:
    print(f"\n{column}:")
    print(df[column].value_counts(dropna=False))

    print("\n--- NUMERICAL FEATURE RANGES ---")

numerical_columns = [
    "age",
    "height_cm",
    "weight_kg",
    "duration_minutes",
    "calories_burned",
    "avg_heart_rate",
    "hours_sleep",
    "stress_level",
    "daily_steps",
    "hydration_level",
    "bmi",
    "resting_heart_rate",
    "blood_pressure_systolic",
    "blood_pressure_diastolic",
    "fitiq_bmi"
]

print(df[numerical_columns].describe().T[
    ["min", "max", "mean", "std"]
])

print("\n--- BMI TEMPORAL CHECK ---")

participant_id = 1

participant = df[df["participant_id"] == participant_id].sort_values("date")

print(
    participant[
        [
            "date",
            "height_cm",
            "weight_kg",
            "bmi_original",
            "bmi",
            "fitiq_bmi"
        ]
    ].head(20)
)