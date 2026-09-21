import os
import pandas as pd
import numpy as np


# ============================================================
# FitIQ - USDA Foundation Foods EDA
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data", "nutrition")


FOOD_FILE = os.path.join(DATA_DIR, "food.csv")
FOOD_NUTRIENT_FILE = os.path.join(DATA_DIR, "food_nutrient.csv")
NUTRIENT_FILE = os.path.join(DATA_DIR, "nutrient.csv")
CATEGORY_FILE = os.path.join(DATA_DIR, "food_category.csv")
PORTION_FILE = os.path.join(DATA_DIR, "food_portion.csv")


def section(title):
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def main():

    section("LOADING DATA")

    food = pd.read_csv(FOOD_FILE, low_memory=False)
    food_nutrient = pd.read_csv(
        FOOD_NUTRIENT_FILE,
        low_memory=False
    )
    nutrient = pd.read_csv(
        NUTRIENT_FILE,
        low_memory=False
    )
    category = pd.read_csv(
        CATEGORY_FILE,
        low_memory=False
    )
    portion = pd.read_csv(
        PORTION_FILE,
        low_memory=False
    )

    print("Food:", food.shape)
    print("Food nutrient:", food_nutrient.shape)
    print("Nutrient:", nutrient.shape)
    print("Category:", category.shape)
    print("Portion:", portion.shape)

    # ========================================================
    # 1. FOOD DATA TYPE DISTRIBUTION
    # ========================================================

    section("1. FOOD DATA TYPE DISTRIBUTION")

    print(
        food["data_type"]
        .value_counts(dropna=False)
        .to_string()
    )

    # ========================================================
    # 2. FOUNDATION FOODS ONLY
    # ========================================================

    foundation_food = food[
        food["data_type"] == "foundation_food"
    ].copy()

    section("2. FOUNDATION FOOD DATASET")

    print(f"Foundation food rows: {len(foundation_food):,}")
    print(
        f"Foundation food IDs: "
        f"{foundation_food['fdc_id'].nunique():,}"
    )

    print("\nSample:")
    print(
        foundation_food[
            [
                "fdc_id",
                "description",
                "food_category_id"
            ]
        ]
        .head(10)
        .to_string(index=False)
    )

    # ========================================================
    # 3. FOUNDATION FOOD MISSING VALUES
    # ========================================================

    section("3. FOUNDATION FOOD MISSING VALUES")

    missing = foundation_food.isnull().sum()
    missing_percent = (
        missing / len(foundation_food) * 100
    ).round(2)

    missing_table = pd.DataFrame({
        "missing_count": missing,
        "missing_percent": missing_percent
    })

    print(
        missing_table
        .sort_values("missing_count", ascending=False)
        .to_string()
    )

    # ========================================================
    # 4. FOOD CATEGORY DISTRIBUTION
    # ========================================================

    section("4. FOUNDATION FOOD CATEGORY DISTRIBUTION")

    foundation_category = foundation_food.merge(
        category,
        left_on="food_category_id",
        right_on="id",
        how="left"
    )

    category_counts = (
        foundation_category["description_y"]
        .value_counts(dropna=False)
    )

    print(category_counts.to_string())

    # ========================================================
    # 5. NUTRIENT DEFINITIONS
    # ========================================================

    section("5. NUTRIENT DEFINITIONS")

    important_nutrients = nutrient[
        nutrient["name"].str.contains(
            "Energy|Protein|Carbohydrate|Total lipid|Fat|Fiber|Sugars|Sodium|Potassium|Calcium|Iron|Vitamin",
            case=False,
            na=False
        )
    ]

    print(
        important_nutrients[
            [
                "id",
                "name",
                "unit_name"
            ]
        ]
        .to_string(index=False)
    )

    # ========================================================
    # 6. NUTRIENTS ASSOCIATED WITH FOUNDATION FOODS
    # ========================================================

    section("6. NUTRIENTS AVAILABLE FOR FOUNDATION FOODS")

    foundation_ids = foundation_food["fdc_id"]

    foundation_nutrients = food_nutrient[
        food_nutrient["fdc_id"].isin(foundation_ids)
    ].copy()

    print(
        f"Nutrition records for foundation foods: "
        f"{len(foundation_nutrients):,}"
    )

    print(
        f"Unique foundation foods with nutrients: "
        f"{foundation_nutrients['fdc_id'].nunique():,}"
    )

    print(
        f"Unique nutrient IDs used: "
        f"{foundation_nutrients['nutrient_id'].nunique():,}"
    )

    # ========================================================
    # 7. NUTRIENT COVERAGE PER FOOD
    # ========================================================

    section("7. NUTRIENT COVERAGE PER FOUNDATION FOOD")

    nutrient_counts = (
        foundation_nutrients
        .groupby("fdc_id")["nutrient_id"]
        .nunique()
    )

    print(
        nutrient_counts.describe()
        .to_string()
    )

    print("\nFoods with lowest nutrient coverage:")

    lowest_coverage = (
        nutrient_counts
        .sort_values()
        .head(20)
    )

    print(lowest_coverage.to_string())

    # ========================================================
    # 8. MAP NUTRIENT NAMES
    # ========================================================

    section("8. NUTRIENT NAME MAPPING")

    nutrient_mapped = foundation_nutrients.merge(
        nutrient[
            [
                "id",
                "name",
                "unit_name"
            ]
        ],
        left_on="nutrient_id",
        right_on="id",
        how="left"
    )

    print(
        nutrient_mapped[
            [
                "fdc_id",
                "nutrient_id",
                "name",
                "unit_name",
                "amount"
            ]
        ]
        .head(20)
        .to_string(index=False)
    )

    # ========================================================
    # 9. TARGET NUTRIENTS
    # ========================================================

    section("9. TARGET NUTRIENT COVERAGE")

    target_patterns = [
        "Energy",
        "Protein",
        "Carbohydrate",
        "Total lipid",
        "Fiber",
        "Sugars",
        "Sodium",
        "Potassium",
        "Calcium",
        "Iron"
    ]

    for pattern in target_patterns:

        matches = nutrient[
            nutrient["name"]
            .str.contains(
                pattern,
                case=False,
                na=False
            )
        ]

        if matches.empty:
            print(
                f"{pattern:<20} -> NOT FOUND"
            )
            continue

        ids = matches["id"].tolist()

        count = foundation_nutrients[
            foundation_nutrients["nutrient_id"].isin(ids)
        ]["fdc_id"].nunique()

        percentage = (
            count / len(foundation_food) * 100
        )

        names = matches["name"].tolist()

        print(
            f"{pattern:<20} -> "
            f"{count:>4}/{len(foundation_food)} foods "
            f"({percentage:>6.2f}%) | "
            f"{names}"
        )
    # ========================================================
    # 10. AMOUNT QUALITY CHECK
    # ========================================================

    section("10. NUTRIENT AMOUNT QUALITY CHECK")

    amount = foundation_nutrients["amount"]

    print("Missing amount:", amount.isna().sum())
    print("Zero amount:", (amount == 0).sum())
    print("Negative amount:", (amount < 0).sum())
    print("Positive amount:", (amount > 0).sum())

    # Map nutrient names before inspecting negative values
    negative_records = foundation_nutrients[
        foundation_nutrients["amount"] < 0
    ].merge(
        nutrient[
            [
                "id",
                "name",
                "unit_name"
            ]
        ],
        left_on="nutrient_id",
        right_on="id",
        how="left"
    )

    print("\nNegative amount records:")

    if negative_records.empty:
        print("No negative nutrient amounts found.")
    else:
        print(
            negative_records[
                [
                    "fdc_id",
                    "nutrient_id",
                    "name",
                    "unit_name",
                    "amount"
                ]
            ]
            .to_string(index=False)
        )

    # ========================================================
    # 11. NUTRIENT DISTRIBUTION
    # ========================================================

    section("11. NUTRIENT DISTRIBUTION")

    nutrient_summary = (
        nutrient_mapped
        .groupby(
            [
                "nutrient_id",
                "name",
                "unit_name"
            ]
        )["amount"]
        .agg(
            count="count",
            mean="mean",
            median="median",
            minimum="min",
            maximum="max"
        )
        .reset_index()
    )

    important_summary = nutrient_summary[
        nutrient_summary["name"].str.contains(
            "Energy|Protein|Carbohydrate|Total lipid|Fiber|Sugars|Sodium|Potassium|Calcium|Iron",
            case=False,
            na=False
        )
    ]

    print(
        important_summary
        .sort_values("name")
        .to_string(index=False)
    )

    # ========================================================
    # 12. PORTION DATA
    # ========================================================

    section("12. PORTION DATA")

    foundation_portions = portion[
        portion["fdc_id"].isin(foundation_ids)
    ].copy()

    print(
        f"Portion records linked to foundation foods: "
        f"{len(foundation_portions):,}"
    )

    print(
        f"Unique foods with portion data: "
        f"{foundation_portions['fdc_id'].nunique():,}"
    )

    print(
        f"Foods without portion data: "
        f"{len(foundation_food) - foundation_portions['fdc_id'].nunique():,}"
    )

    print("\nGram weight summary:")

    print(
        foundation_portions["gram_weight"]
        .describe()
        .to_string()
    )

    # ========================================================
    # 13. DUPLICATE CHECK
    # ========================================================

    section("13. DUPLICATE CHECK")

    print(
        "Foundation food duplicates:",
        foundation_food.duplicated().sum()
    )

    print(
        "Foundation nutrient duplicates:",
        foundation_nutrients.duplicated().sum()
    )

    # ========================================================
    # 14. DATASET SUMMARY
    # ========================================================

    section("14. EDA SUMMARY")

    print(f"""
Foundation foods:
    {len(foundation_food):,}

Foods with nutrient records:
    {foundation_nutrients['fdc_id'].nunique():,}

Unique nutrients used:
    {foundation_nutrients['nutrient_id'].nunique():,}

Food categories represented:
    {foundation_food['food_category_id'].nunique():,}

Foundation portion records:
    {len(foundation_portions):,}
""")

    print("=" * 80)
    print("EDA COMPLETED")
    print("=" * 80)


if __name__ == "__main__":
    main()