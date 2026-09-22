"""
FitIQ E6 - Nutritional Intelligence Engine Test

Tests:
1. Vegetarian profile
2. Vegan profile
3. Non-vegetarian profile
4. Mixed diet profile

Run from the FitIQ project root:

    python ml\test_nutrition_engine.py
"""

from engines.nutrition_engine import analyze_nutrition


# ============================================================
# TEST PROFILES
# ============================================================

profiles = {
    "Vegetarian": {
        "age": 21,
        "gender": "female",
        "height_cm": 160,
        "weight_kg": 55,
        "activity_level": "moderate",
        "goal": "maintenance",
        "diet_type": "vegetarian",
    },

    "Vegan": {
        "age": 22,
        "gender": "female",
        "height_cm": 165,
        "weight_kg": 58,
        "activity_level": "moderate",
        "goal": "weight_loss",
        "diet_type": "vegan",
    },

    "Non-Vegetarian": {
        "age": 21,
        "gender": "male",
        "height_cm": 175,
        "weight_kg": 70,
        "activity_level": "active",
        "goal": "muscle_gain",
        "diet_type": "non_vegetarian",
    },

    "Mixed": {
        "age": 23,
        "gender": "female",
        "height_cm": 162,
        "weight_kg": 60,
        "activity_level": "light",
        "goal": "maintenance",
        "diet_type": "mixed",
    },
}


# ============================================================
# VALIDATION FUNCTION
# ============================================================

def validate_result(result):
    """
    Validate the output returned by analyze_nutrition().
    Raises AssertionError if anything is incorrect.
    """

    # --------------------------------------------------------
    # Basic response validation
    # --------------------------------------------------------

    assert isinstance(result, dict), \
        "Engine output must be a dictionary"

    assert result.get("status") == "success", \
        f"Engine returned status: {result.get('status')}"

    # --------------------------------------------------------
    # Required top-level fields
    # --------------------------------------------------------

    required_fields = [
        "targets",
        "macro_distribution",
        "diet_type",
        "recommendations",
        "insight",
        "data_source",
    ]

    for field in required_fields:
        assert field in result, \
            f"Missing required field: {field}"

    # --------------------------------------------------------
    # Targets validation
    # --------------------------------------------------------

    targets = result["targets"]

    target_fields = [
        "bmr",
        "tdee",
        "calorie_target",
        "water_liters",
    ]

    for field in target_fields:
        assert field in targets, \
            f"Missing target field: {field}"

        assert targets[field] > 0, \
            f"{field} must be greater than zero"

    # --------------------------------------------------------
    # Macro validation
    # --------------------------------------------------------

    macros = result["macro_distribution"]

    macro_fields = [
        "protein_g",
        "carbs_g",
        "fat_g",
    ]

    for field in macro_fields:
        assert field in macros, \
            f"Missing macro field: {field}"

        assert macros[field] > 0, \
            f"{field} must be greater than zero"

    # --------------------------------------------------------
    # Diet type validation
    # --------------------------------------------------------

    assert result["diet_type"] in [
        "vegan",
        "vegetarian",
        "non_vegetarian",
        "mixed",
    ], \
        f"Invalid diet type: {result['diet_type']}"

    # --------------------------------------------------------
    # Recommendation validation
    # --------------------------------------------------------

    recommendations = result["recommendations"]

    assert isinstance(recommendations, list), \
        "Recommendations must be a list"

    assert len(recommendations) > 0, \
        "No recommendations returned"

    # We expect up to 6 recommendations.
    assert len(recommendations) <= 6, \
        "More than 6 recommendations returned"

    # --------------------------------------------------------
    # Validate each food recommendation
    # --------------------------------------------------------

    required_food_fields = [
        "food_name",
        "food_category",
        "diet_type",
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "fiber_g",
        "sugar_g",
        "sodium_mg",
        "score",
    ]

    for food in recommendations:

        assert isinstance(food, dict), \
            "Each recommendation must be a dictionary"

        # Required fields
        for field in required_food_fields:
            assert field in food, \
                f"Missing food field: {field}"

        # Food name
        assert str(food["food_name"]).strip(), \
            "Food name cannot be empty"

        # Nutrient values
        numeric_fields = [
            "calories",
            "protein_g",
            "carbs_g",
            "fat_g",
            "fiber_g",
            "sugar_g",
            "sodium_mg",
        ]

        for field in numeric_fields:
            assert food[field] >= 0, \
                f"{field} cannot be negative"

        # Recommendation score
        assert 0 <= food["score"] <= 100, \
            f"Invalid recommendation score: {food['score']}"

    # --------------------------------------------------------
    # Insight validation
    # --------------------------------------------------------

    assert isinstance(result["insight"], str), \
        "Insight must be a string"

    assert result["insight"].strip(), \
        "Insight cannot be empty"

    # --------------------------------------------------------
    # USDA source validation
    # --------------------------------------------------------

    assert "USDA" in str(result["data_source"]).upper(), \
        "Nutrition data source should reference USDA"


# ============================================================
# PRINT RESULT
# ============================================================

def print_result(name, result):
    """
    Print a clean summary of the E6 engine result.
    """

    targets = result["targets"]
    macros = result["macro_distribution"]

    print(f"Status       : {result['status']}")
    print(f"BMR          : {targets['bmr']:.1f} kcal")
    print(f"TDEE         : {targets['tdee']:.1f} kcal")
    print(f"Calorie      : {targets['calorie_target']:.0f} kcal/day")
    print(f"Protein      : {macros['protein_g']:.1f} g")
    print(f"Carbs        : {macros['carbs_g']:.1f} g")
    print(f"Fat          : {macros['fat_g']:.1f} g")
    print(f"Diet         : {result['diet_type']}")

    print("\nRecommendations:")

    for index, food in enumerate(result["recommendations"], start=1):

        print(
            f"{index}. "
            f"{food['food_name']} | "
            f"{food['calories']:.1f} kcal | "
            f"Protein {food['protein_g']:.1f}g | "
            f"Fiber {food['fiber_g']:.1f}g | "
            f"Score {food['score']:.1f}"
        )

    print(f"\nInsight: {result['insight']}")


# ============================================================
# MAIN TEST
# ============================================================

def main():

    print("=" * 70)
    print("FITIQ E6 - NUTRITIONAL INTELLIGENCE ENGINE TEST")
    print("=" * 70)

    passed = 0
    failed = 0

    total_tests = len(profiles)

    # --------------------------------------------------------
    # Run every test profile
    # --------------------------------------------------------

    for name, profile in profiles.items():

        print("\n" + "-" * 70)
        print(f"TEST PROFILE: {name}")
        print("-" * 70)

        try:

            # Run E6 engine
            result = analyze_nutrition(profile)

            # Print result
            print_result(name, result)

            # Validate result
            validate_result(result)

            # Test passed
            print("\nPASS ✓")
            passed += 1

        except Exception as error:

            # Test failed
            print("\nFAIL ✗")
            print(f"Error: {error}")

            failed += 1

    # ========================================================
    # FINAL SUMMARY
    # ========================================================

    print("\n" + "=" * 70)
    print("FINAL TEST SUMMARY")
    print("=" * 70)

    print(f"Passed: {passed}/{total_tests}")
    print(f"Failed: {failed}/{total_tests}")

    # --------------------------------------------------------
    # Final status
    # --------------------------------------------------------

    if failed == 0:
        print("\nE6 NUTRITIONAL INTELLIGENCE ENGINE WORKING ✓")
    else:
        print("\nE6 NEEDS FIXING ✗")

    print("=" * 70)


# ============================================================
# PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()