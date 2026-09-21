import os
import pandas as pd


DATA_DIR = os.path.join(
    os.path.dirname(__file__),
    "data"
)

FILES = [
    "dailyActivity_merged.csv",
    "sleepDay_merged.csv",
    "weightLogInfo_merged.csv"
]


def inspect_file(filename):
    path = os.path.join(DATA_DIR, filename)

    print("\n" + "=" * 70)
    print(f"FILE: {filename}")
    print("=" * 70)

    if not os.path.exists(path):
        print("FILE NOT FOUND")
        return

    df = pd.read_csv(path)

    print(f"\nShape: {df.shape}")

    print("\nColumns:")
    for column in df.columns:
        print(f"  - {column}")

    print("\nData types:")
    print(df.dtypes)

    print("\nFirst 5 rows:")
    print(df.head())

    print("\nMissing values:")
    missing = df.isnull().sum()
    missing = missing[missing > 0]

    if missing.empty:
        print("  No missing values")
    else:
        print(missing)

    print("\nDuplicate rows:")
    print(df.duplicated().sum())

    print("\nUnique participants:")
    if "Id" in df.columns:
        print(df["Id"].nunique())
    else:
        print("Id column not found")

    print("\nDate information:")

    date_columns = [
        column
        for column in df.columns
        if "date" in column.lower()
    ]

    if date_columns:
        for column in date_columns:
            dates = pd.to_datetime(
                df[column],
                errors="coerce"
            )

            print(
                f"  {column}: "
                f"{dates.min()} → {dates.max()}"
            )
    else:
        print("  No date column detected")

    print("\nNumerical summary:")
    print(df.describe(include="all").transpose())


def main():
    print("=" * 70)
    print("FITIQ E5 — FITBIT DATASET INSPECTION")
    print("=" * 70)

    for filename in FILES:
        inspect_file(filename)

    print("\n" + "=" * 70)
    print("INSPECTION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()