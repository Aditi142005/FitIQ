import requests

data = {
    "age": 21,
    "gender": "female",
    "height_cm": 160,
    "weight_kg": 55,
    "activity_level": "moderate",
    "goal": "maintenance",
    "diet_type": "vegetarian"
}

response = requests.post(
    "http://127.0.0.1:5000/nutrition",
    json=data
)

print("Status:", response.status_code)
print("Response:")
print(response.json())