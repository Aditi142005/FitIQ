import pandas as pd

DATA_PATH = "data/FitIQ_FitLife360_Cleaned_Foundation.csv"

df = pd.read_csv(DATA_PATH)

print("\n===== SHAPE =====")
print(df.shape)

print("\n===== COLUMNS =====")
print(df.columns.tolist())

print("\n===== NUMERICAL SUMMARY =====")
print(df.describe().T)

print("\n===== MISSING VALUES =====")
print(df.isnull().sum())

print("\n===== UNIQUE PARTICIPANTS =====")
print(df["participant_id"].nunique())

print("\n===== DATE RANGE =====")
print(df["date"].min(), "to", df["date"].max())

print("\n===== CATEGORICAL DISTRIBUTIONS =====")

for column in [
    "gender",
    "activity_type",
    "intensity",
    "smoking_status",
    "fitness_level"
]:
    print(f"\n--- {column} ---")
    print(df[column].value_counts().head(10))

print("\n===== KEY CORRELATIONS =====")

columns = [
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
    "fitiq_bmi"
]

print(df[columns].corr()["fitiq_bmi"].sort_values(ascending=False))

print("\n===== EDA COMPLETE =====")