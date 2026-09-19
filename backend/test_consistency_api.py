import requests

url = "http://127.0.0.1:5000/consistency-prediction"

tracking_records = [
    {
        "steps": 5000,
        "exerciseMinutes": 20,
        "sleep": 6,
        "water": 1.5
    },
    {
        "steps": 6000,
        "exerciseMinutes": 25,
        "sleep": 6.5,
        "water": 2
    },
    {
        "steps": 7500,
        "exerciseMinutes": 30,
        "sleep": 7,
        "water": 2
    },
    {
        "steps": 9000,
        "exerciseMinutes": 40,
        "sleep": 7.5,
        "water": 2.5
    },
    {
        "steps": 10000,
        "exerciseMinutes": 45,
        "sleep": 8,
        "water": 3
    }
]

response = requests.post(
    url,
    json={
        "trackingRecords": tracking_records
    }
)

print("STATUS:", response.status_code)
print("RESPONSE:")
print(response.json())