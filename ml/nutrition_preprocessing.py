import pandas as pd
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "nutrition"

OUTPUT_DIR = DATA_DIR / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FOOD_FILE = DATA_DIR / "food.csv"
FOOD_NUTRIENT_FILE = DATA_DIR / "food_nutrient.csv"
NUTRIENT_FILE = DATA_DIR / "nutrient.csv"
CATEGORY_FILE = DATA_DIR / "food_category.csv"


# ============================================================
# CANONICAL NUTRIENTS
# ============================================================

# USDA Foundation Foods nutrient IDs selected for FitIQ.
#
# Energy:
# 2047 = Metabolizable Energy (Atwater General Factor)
#
# Macronutrients:
# 1003 = Protein
# 1004 = Total lipid (fat)
# 1005 = Carbohydrate, by difference
#
# Other nutrition indicators:
# 1079 = Fiber, total dietary
# 1063 = Sugars, Total
# 1093 = Sodium, Na
# 1092 = Potassium, K
# 1087 = Calcium, Ca
# 1089 = Iron, Fe

TARGET_NUTRIENTS = {
    2047: "calories_kcal",
    1003: "protein_g",
    1004: "fat_g",
    1005: "carbohydrate_g",
    1079: "fiber_g",
    1063: "sugar_g",
    1093: "sodium_mg",
    1092: "potassium_mg",
    1087: "calcium_mg",
    1089: "iron_mg",
}


# ============================================================
# HELPER
# ============================================================

def section(title):
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


# ============================================================
# 1. LOAD DATA
# ============================================================

section("1. LOADING DATA")

food = pd.read_csv(FOOD_FILE, encoding="latin1")
food_nutrient = pd.read_csv(
    FOOD_NUTRIENT_FILE,
    encoding="latin1",
    low_memory=False
)
nutrient = pd.read_csv(NUTRIENT_FILE, encoding="latin1")
category = pd.read_csv(CATEGORY_FILE, encoding="latin1")

print("Food:", food.shape)
print("Food nutrient:", food_nutrient.shape)
print("Nutrient:", nutrient.shape)
print("Category:", category.shape)


# ============================================================
# 2. SELECT FOUNDATION FOODS
# ============================================================

section("2. SELECTING FOUNDATION FOODS")

foundation_foods = food[
    food["data_type"].str.lower() == "foundation_food"
].copy()

print("Foundation foods:", len(foundation_foods))
print("Unique foundation food IDs:", foundation_foods["fdc_id"].nunique())


# ============================================================
# 3. MERGE FOOD CATEGORY
# ============================================================

section("3. ADDING FOOD CATEGORIES")

category_lookup = category[
    ["id", "description"]
].copy()

category_lookup = category_lookup.rename(
    columns={
        "id": "food_category_id",
        "description": "food_category"
    }
)

foundation_foods = foundation_foods.merge(
    category_lookup,
    on="food_category_id",
    how="left"
)

print(
    "Foods with missing category:",
    foundation_foods["food_category"].isna().sum()
)


# ============================================================
# 4. SELECT NUTRIENT RECORDS
# ============================================================

section("4. SELECTING CANONICAL NUTRIENTS")

foundation_nutrients = food_nutrient[
    food_nutrient["fdc_id"].isin(
        foundation_foods["fdc_id"]
    )
].copy()

print(
    "Foundation nutrient records:",
    len(foundation_nutrients)
)

selected_nutrients = foundation_nutrients[
    foundation_nutrients["nutrient_id"].isin(
        TARGET_NUTRIENTS.keys()
    )
].copy()

print(
    "Selected nutrient records:",
    len(selected_nutrients)
)

print(
    "Unique foods represented:",
    selected_nutrients["fdc_id"].nunique()
)

print(
    "Unique selected nutrients:",
    selected_nutrients["nutrient_id"].nunique()
)


# ============================================================
# 5. HANDLE INVALID NUMERIC VALUES
# ============================================================

section("5. CLEANING NUTRIENT AMOUNTS")

selected_nutrients["amount"] = pd.to_numeric(
    selected_nutrients["amount"],
    errors="coerce"
)

missing_before = selected_nutrients["amount"].isna().sum()
negative_before = (selected_nutrients["amount"] < 0).sum()

print("Missing amounts:", missing_before)
print("Negative amounts:", negative_before)


# Carbohydrate-by-difference contains a small number of
# tiny negative values. These are not meaningful negative
# nutrient quantities, so they are clipped to zero.

carb_mask = (
    (selected_nutrients["nutrient_id"] == 1005)
    & (selected_nutrients["amount"] < 0)
)

print(
    "Negative carbohydrate values corrected:",
    carb_mask.sum()
)

selected_nutrients.loc[
    carb_mask,
    "amount"
] = 0


# For the selected nutrition fields, missing amount means
# that USDA did not provide that nutrient value for that food.
# We keep it as NaN rather than inventing a value.

print(
    "Missing amounts after cleaning:",
    selected_nutrients["amount"].isna().sum()
)

print(
    "Negative amounts after cleaning:",
    (
        selected_nutrients["amount"] < 0
    ).sum()
)


# ============================================================
# 6. MAP NUTRIENT IDS TO FITIQ COLUMN NAMES
# ============================================================

section("6. MAPPING NUTRIENTS")

selected_nutrients["nutrient_name_fitiq"] = (
    selected_nutrients["nutrient_id"]
    .map(TARGET_NUTRIENTS)
)

selected_nutrients = selected_nutrients[
    [
        "fdc_id",
        "nutrient_id",
        "amount",
        "nutrient_name_fitiq"
    ]
]


# ============================================================
# 7. CHECK DUPLICATES
# ============================================================

section("7. CHECKING FOOD-NUTRIENT DUPLICATES")

duplicate_pairs = (
    selected_nutrients
    .duplicated(
        subset=["fdc_id", "nutrient_id"],
        keep=False
    )
)

print(
    "Duplicate food-nutrient pairs:",
    duplicate_pairs.sum()
)

if duplicate_pairs.sum() > 0:

    print("\nDuplicate examples:")

    print(
        selected_nutrients[
            duplicate_pairs
        ]
        .sort_values(
            ["fdc_id", "nutrient_id"]
        )
        .head(30)
        .to_string(index=False)
    )

    raise ValueError(
        "Duplicate fdc_id + nutrient_id pairs found. "
        "Review them before continuing."
    )


# ============================================================
# 8. PIVOT TO ONE ROW PER FOOD
# ============================================================

section("8. CREATING ONE ROW PER FOOD")

nutrition_wide = selected_nutrients.pivot(
    index="fdc_id",
    columns="nutrient_name_fitiq",
    values="amount"
).reset_index()

nutrition_wide.columns.name = None

print(
    "Nutrition table shape:",
    nutrition_wide.shape
)


# ============================================================
# 9. MERGE FOOD INFORMATION
# ============================================================

section("9. MERGING FOOD INFORMATION")

food_info = foundation_foods[
    [
        "fdc_id",
        "description",
        "food_category"
    ]
].copy()

food_info = food_info.rename(
    columns={
        "description": "food_name"
    }
)

cleaned = food_info.merge(
    nutrition_wide,
    on="fdc_id",
    how="left"
)


# ============================================================
# 10. COLUMN ORDER
# ============================================================

section("10. ORGANIZING FINAL DATASET")

final_columns = [
    "fdc_id",
    "food_name",
    "food_category",
    "calories_kcal",
    "protein_g",
    "fat_g",
    "carbohydrate_g",
    "fiber_g",
    "sugar_g",
    "sodium_mg",
    "potassium_mg",
    "calcium_mg",
    "iron_mg"
]

cleaned = cleaned[
    final_columns
]


# ============================================================
# 11. FINAL QUALITY CHECK
# ============================================================

section("11. FINAL DATA QUALITY CHECK")

print("Final shape:", cleaned.shape)

print(
    "\nMissing values:"
)

print(
    cleaned.isna()
    .sum()
    .to_string()
)

print(
    "\nDuplicate foods:",
    cleaned["fdc_id"].duplicated().sum()
)

print(
    "\nNegative numeric values:"
)

numeric_columns = final_columns[3:]

negative_counts = (
    cleaned[numeric_columns] < 0
).sum()

print(
    negative_counts.to_string()
)


# ============================================================
# 12. NUTRIENT RANGE CHECK
# ============================================================

section("12. NUTRIENT RANGE CHECK")

print(
    cleaned[numeric_columns]
    .describe()
    .T
    .to_string()
)


# ============================================================
# 13. SAMPLE CLEANED DATA
# ============================================================

section("13. SAMPLE CLEANED DATA")

print(
    cleaned.head(10)
    .to_string(index=False)
)


# ============================================================
# 14. SAVE
# ============================================================

section("14. SAVING CLEANED DATASET")

output_file = (
    OUTPUT_DIR /
    "FitIQ_Nutrition_Cleaned.csv"
)

cleaned.to_csv(
    output_file,
    index=False
)

print(
    "Saved:",
    output_file
)


# ============================================================
# 15. FINAL SUMMARY
# ============================================================

section("PREPROCESSING COMPLETED")

print(
    "Foundation foods:",
    len(cleaned)
)

print(
    "Final columns:",
    len(cleaned.columns)
)

print(
    "Output:",
    output_file
)