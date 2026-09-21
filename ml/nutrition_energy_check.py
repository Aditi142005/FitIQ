import pandas as pd
from pathlib import Path


# ============================================================
# PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "nutrition"

FOOD_FILE = DATA_DIR / "food.csv"
FOOD_NUTRIENT_FILE = DATA_DIR / "food_nutrient.csv"


# ============================================================
# LOAD
# ============================================================

food = pd.read_csv(
    FOOD_FILE,
    encoding="latin1"
)

food_nutrient = pd.read_csv(
    FOOD_NUTRIENT_FILE,
    encoding="latin1",
    low_memory=False
)


# ============================================================
# FOUNDATION FOODS
# ============================================================

foundation = food[
    food["data_type"].str.lower() == "foundation_food"
].copy()

foundation_ids = set(
    foundation["fdc_id"]
)


# ============================================================
# ENERGY RECORDS
# ============================================================

energy = food_nutrient[
    food_nutrient["fdc_id"].isin(foundation_ids)
    &
    food_nutrient["nutrient_id"].isin([2047, 2048])
].copy()


energy["energy_type"] = energy["nutrient_id"].map({
    2047: "Atwater General (2047)",
    2048: "Atwater Specific (2048)"
})


# ============================================================
# 1. COVERAGE
# ============================================================

print("=" * 80)
print("1. ENERGY COVERAGE")
print("=" * 80)

total_foods = len(foundation)

general_foods = energy[
    energy["nutrient_id"] == 2047
]["fdc_id"].nunique()

specific_foods = energy[
    energy["nutrient_id"] == 2048
]["fdc_id"].nunique()

both_foods = (
    energy.groupby("fdc_id")["nutrient_id"]
    .nunique()
)

both_count = (both_foods == 2).sum()

general_only = (
    (both_foods == 1)
    &
    energy.groupby("fdc_id")["nutrient_id"]
    .first().eq(2047)
).sum()

specific_only = (
    (both_foods == 1)
    &
    energy.groupby("fdc_id")["nutrient_id"]
    .first().eq(2048)
).sum()

print("Foundation foods:", total_foods)
print("2047 available:", general_foods)
print("2048 available:", specific_foods)
print("Both 2047 + 2048:", both_count)
print("2047 only:", general_only)
print("2048 only:", specific_only)
print("Neither:", total_foods - len(both_foods))


# ============================================================
# 2. MISSING 2047 — DOES 2048 EXIST?
# ============================================================

print("\n" + "=" * 80)
print("2. FOODS MISSING 2047")
print("=" * 80)

general_ids = set(
    energy.loc[
        energy["nutrient_id"] == 2047,
        "fdc_id"
    ]
)

specific_ids = set(
    energy.loc[
        energy["nutrient_id"] == 2048,
        "fdc_id"
    ]
)

missing_general = foundation[
    ~foundation["fdc_id"].isin(general_ids)
].copy()

fallback_available = missing_general[
    missing_general["fdc_id"].isin(specific_ids)
]

print(
    "Foods without 2047:",
    len(missing_general)
)

print(
    "Of those, 2048 available:",
    len(fallback_available)
)

print(
    "Of those, neither energy value:",
    len(
        missing_general[
            ~missing_general["fdc_id"].isin(specific_ids)
        ]
    )
)


# ============================================================
# 3. BOTH VALUES — COMPARE THEM
# ============================================================

print("\n" + "=" * 80)
print("3. 2047 VS 2048")
print("=" * 80)

both = energy[
    energy["fdc_id"].isin(
        foundation_ids
    )
].pivot_table(
    index="fdc_id",
    columns="nutrient_id",
    values="amount",
    aggfunc="first"
).reset_index()

both = both.dropna(
    subset=[2047, 2048]
)

both["difference_kcal"] = (
    both[2048] - both[2047]
)

both["absolute_difference"] = (
    both["difference_kcal"].abs()
)

both["percent_difference"] = (
    both["absolute_difference"]
    / both[2047].replace(0, pd.NA)
) * 100


print(
    "Foods with both values:",
    len(both)
)

print(
    "\nDifference statistics:"
)

print(
    both[
        [
            "difference_kcal",
            "absolute_difference",
            "percent_difference"
        ]
    ]
    .describe()
    .to_string()
)


# ============================================================
# 4. LARGEST DIFFERENCES
# ============================================================

print("\n" + "=" * 80)
print("4. LARGEST ENERGY DIFFERENCES")
print("=" * 80)

largest = (
    both
    .sort_values(
        "absolute_difference",
        ascending=False
    )
    .head(20)
)

largest = largest.merge(
    foundation[
        [
            "fdc_id",
            "description"
        ]
    ],
    on="fdc_id",
    how="left"
)

print(
    largest[
        [
            "fdc_id",
            "description",
            2047,
            2048,
            "difference_kcal",
            "percent_difference"
        ]
    ]
    .to_string(index=False)
)


# ============================================================
# 5. ENERGY VALUE QUALITY
# ============================================================

print("\n" + "=" * 80)
print("5. ENERGY VALUE QUALITY")
print("=" * 80)

print(
    "2047 zero values:",
    (energy.loc[
        energy["nutrient_id"] == 2047,
        "amount"
    ] == 0).sum()
)

print(
    "2048 zero values:",
    (energy.loc[
        energy["nutrient_id"] == 2048,
        "amount"
    ] == 0).sum()
)

print(
    "2047 negative values:",
    (
        energy.loc[
            energy["nutrient_id"] == 2047,
            "amount"
        ] < 0
    ).sum()
)

print(
    "2048 negative values:",
    (
        energy.loc[
            energy["nutrient_id"] == 2048,
            "amount"
        ] < 0
    ).sum()
)


# ============================================================
# DONE
# ============================================================

print("\n" + "=" * 80)
print("ENERGY CHECK COMPLETED")
print("=" * 80)