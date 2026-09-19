from engines.cohort_engine import analyze_cohort


user = {
    "age": 18,
    "gender": "Male",
    "bmi": 16.36,
    "activity_level": "Low",
    "exercise_days": 3,
    "fitness_goal": "Maintain Fitness",
    "daily_steps": 5796.4,
    "sleep": 6.4,
    "water": 2,
    "consistency": 66.67
}


result = analyze_cohort(user)


print("\n========== E4 COHORT RESULT ==========\n")

print("Status:", result["status"])

print(
    "Cohort size:",
    result.get("cohort_size")
)

print(
    "Average similarity:",
    result.get("average_similarity"),
    "%"
)


print("\nCohort statistics:")

for key, value in result.get(
    "cohort_stats",
    {}
).items():

    print(
        f"{key}: {value}"
    )


print("\nUser vs cohort:")

for key, value in result.get(
    "comparisons",
    {}
).items():

    print(
        f"{key}: "
        f"user={value['user']} | "
        f"cohort={value['cohort']} | "
        f"difference={value['difference']}"
    )


print("\nMessage:")

print(
    result.get("message")
)