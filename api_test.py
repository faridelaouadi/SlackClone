import requests

api_key = "ZsDhKYMNVtzRxcbGwrOBKhNElDE4ZRDv"

response = requests.get("https://api.giphy.com/v1/gifs/search?api_key=ZsDhKYMNVtzRxcbGwrOBKhNElDE4ZRDv&q=nav&limit=1&offset=0&rating=G&lang=en")
json = response.json()
print(json["data"][0]["images"]["hd"]["mp4"])
