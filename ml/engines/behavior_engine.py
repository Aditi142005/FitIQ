import pandas as pd


DATASET_PATH = "ml/data/FitIQ_FitLife360_Cleaned_Foundation.csv"


def load_foundation_data():
    df = pd.read_csv(DATASET_PATH)

    return df

def calculate_pearson_correlation(x_values, y_values):

    if len(x_values) != len(y_values):
        return None

    if len(x_values) < 2:
        return None

    x_mean = sum(x_values) / len(x_values)
    y_mean = sum(y_values) / len(y_values)

    numerator = sum(
        (x - x_mean) * (y - y_mean)
        for x, y in zip(x_values, y_values)
    )

    x_squared_sum = sum(
        (x - x_mean) ** 2
        for x in x_values
    )

    y_squared_sum = sum(
        (y - y_mean) ** 2
        for y in y_values
    )

    denominator = (x_squared_sum * y_squared_sum) ** 0.5

    if denominator == 0:
        return None

    return numerator / denominator


def calculate_population_patterns(df):

    relationships = {
        "sleep_steps": ("hours_sleep", "daily_steps"),
        "sleep_exercise": ("hours_sleep", "duration_minutes"),
        "hydration_steps": ("hydration_level", "daily_steps"),
        "hydration_exercise": ("hydration_level", "duration_minutes")
    }

    patterns = []

    for name, (column_x, column_y) in relationships.items():

        data = df[[column_x, column_y]].dropna()

        x_values = data[column_x].tolist()
        y_values = data[column_y].tolist()

        correlation = calculate_pearson_correlation(
            x_values,
            y_values
        )

        patterns.append({
            "relationship": name,
            "correlation": round(correlation, 2)
                if correlation is not None else None
        })

    return patterns

def inspect_behavior_columns(df):

    columns = [
        "hours_sleep",
        "daily_steps",
        "hydration_level",
        "duration_minutes"
    ]

    for column in columns:
        print(f"\n{column}")
        print("Min:", df[column].min())
        print("Max:", df[column].max())
        print("Mean:", round(df[column].mean(), 2))
        print("Unique values:", df[column].nunique())