import os
import pandas as pd


# ============================================================
# FitIQ - USDA Nutrition Dataset Inspection
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data", "nutrition")

FILES = [
    "food.csv",
    "food_nutrient.csv",
    "nutrient.csv",
    "food_category.csv",
    "food_portion.csv"
]


def inspect_file(filename):
    path = os.path.join(DATA_DIR, filename)

    print("\n" + "=" * 80)
    print(f"FILE: {filename}")
    print("=" * 80)

    if not os.path.exists(path):
        print(f"ERROR: File not found -> {path}")
        return

    try:
        df = pd.read_csv(path, low_memory=False)
    except Exception as e:
        print(f"ERROR while reading file: {e}")
        return

    # --------------------------------------------------------
    # Basic information
    # --------------------------------------------------------
    print("\n[1] SHAPE")
    print(f"Rows    : {df.shape[0]:,}")
    print(f"Columns : {df.shape[1]:,}")

    print("\n[2] COLUMNS")
    for i, column in enumerate(df.columns, start=1):
        print(f"{i:>3}. {column}")

    print("\n[3] DATA TYPES")
    print(df.dtypes.to_string())

    # --------------------------------------------------------
    # Missing values
    # --------------------------------------------------------
    print("\n[4] MISSING VALUES")

    missing = df.isnull().sum()
    missing_percent = (missing / len(df) * 100).round(2)

    missing_table = pd.DataFrame({
        "missing_count": missing,
        "missing_percent": missing_percent
    })

    missing_table = missing_table[
        missing_table["missing_count"] > 0
    ].sort_values(
        "missing_count",
        ascending=False
    )

    if missing_table.empty:
        print("No missing values found.")
    else:
        print(missing_table.to_string())

    # --------------------------------------------------------
    # Duplicate rows
    # --------------------------------------------------------
    print("\n[5] DUPLICATES")
    duplicate_count = df.duplicated().sum()
    duplicate_percent = (
        duplicate_count / len(df) * 100
        if len(df) > 0
        else 0
    )

    print(f"Duplicate rows : {duplicate_count:,}")
    print(f"Duplicate %    : {duplicate_percent:.2f}%")

    # --------------------------------------------------------
    # Unique values
    # --------------------------------------------------------
    print("\n[6] UNIQUE VALUES")

    unique_table = pd.DataFrame({
        "unique_count": df.nunique(dropna=True),
        "total_rows": len(df)
    })

    print(unique_table.to_string())

    # --------------------------------------------------------
    # Numerical summary
    # --------------------------------------------------------
    numeric_columns = df.select_dtypes(
        include="number"
    ).columns.tolist()

    print("\n[7] NUMERICAL COLUMNS")
    if not numeric_columns:
        print("No numerical columns found.")
    else:
        print(numeric_columns)

        print("\nNumerical summary:")
        print(
            df[numeric_columns]
            .describe()
            .T
            .to_string()
        )

    # --------------------------------------------------------
    # Categorical/object summary
    # --------------------------------------------------------
    categorical_columns = df.select_dtypes(
        include=["object", "category"]
    ).columns.tolist()

    print("\n[8] CATEGORICAL / TEXT COLUMNS")

    if not categorical_columns:
        print("No categorical/text columns found.")
    else:
        for column in categorical_columns:
            unique_count = df[column].nunique(dropna=True)

            print(
                f"\n{column} "
                f"(unique values: {unique_count:,})"
            )

            # Only display frequency values when manageable.
            if unique_count <= 30:
                print(
                    df[column]
                    .value_counts(dropna=False)
                    .head(30)
                    .to_string()
                )
            else:
                print("Too many unique values to display.")

    # --------------------------------------------------------
    # First few records
    # --------------------------------------------------------
    print("\n[9] FIRST 5 RECORDS")
    print(df.head().to_string())

    # --------------------------------------------------------
    # Last few records
    # --------------------------------------------------------
    print("\n[10] LAST 5 RECORDS")
    print(df.tail().to_string())

    # --------------------------------------------------------
    # Memory usage
    # --------------------------------------------------------
    memory_mb = df.memory_usage(deep=True).sum() / (
        1024 ** 2
    )

    print("\n[11] MEMORY USAGE")
    print(f"{memory_mb:.2f} MB")

    print("\nInspection completed.")


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 80)
    print("FitIQ - USDA Foundation Foods Dataset Inspection")
    print("=" * 80)

    print(f"\nNutrition data directory:")
    print(DATA_DIR)

    print("\nFiles to inspect:")
    for filename in FILES:
        print(f" - {filename}")

    for filename in FILES:
        inspect_file(filename)

    print("\n" + "=" * 80)
    print("ALL FILES INSPECTED")
    print("=" * 80)


if __name__ == "__main__":
    main()