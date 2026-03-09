from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("")  # replace with your URI if different
db = client["stress"]  # replace with your actual DB name

# Define collection
social_stresses = db["social_stresses"]  # <-- THIS IS YOUR COLLECTION
