import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.join(os.getcwd(), '..', 'ml'))
from engines.meal_recommendation_engine import recommend_daily_meal_plan

profiles = [
    {
        'name': 'Vegetarian User',
        'profile': {'age': 25, 'gender': 'male', 'dietPreference': 'vegetarian', 'goal': 'muscle_gain', 'activityLevel': 'moderate'},
        'targets': {'calorie_target': 2400, 'macro_distribution': {'protein_g': 150, 'carbs_g': 270, 'fat_g': 80}, 'water_liters': 3.0}
    },
    {
        'name': 'Non-Vegetarian User',
        'profile': {'age': 28, 'gender': 'male', 'dietPreference': 'non_vegetarian', 'goal': 'weight_loss', 'activityLevel': 'active'},
        'targets': {'calorie_target': 2000, 'macro_distribution': {'protein_g': 150, 'carbs_g': 200, 'fat_g': 65}, 'water_liters': 3.5}
    },
    {
        'name': 'Vegan User',
        'profile': {'age': 24, 'gender': 'female', 'dietPreference': 'vegan', 'goal': 'maintenance', 'activityLevel': 'moderate'},
        'targets': {'calorie_target': 1800, 'macro_distribution': {'protein_g': 110, 'carbs_g': 200, 'fat_g': 60}, 'water_liters': 2.5}
    }
]

for p in profiles:
    print('='*60)
    print('TEST:', p['name'])
    res = recommend_daily_meal_plan(p['profile'], p['targets'])
    mp = res['meal_plan']
    for slot in ['breakfast', 'lunch', 'snack', 'dinner']:
        item = mp[slot]
        print(f"  {slot.upper()}: {item['meal']} ({item['calories']} kcal | Pro: {item['protein']}g | Carbs: {item['carbs']}g | Fat: {item['fats']}g)")
    print('  PLANNED TOTALS:', res['planned_totals'])
    print('  SUMMARY:', res['summary'])
    print('  HYDRATION:', res['hydration'])
