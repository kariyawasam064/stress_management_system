from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb+srv://sajindu:saji1234@cluster0.bx77a.mongodb.net")  # replace with your URI if different
db = client["stress"]  # replace with your actual DB name

# Define collection
social_stresses = db["social_stresses"]  # <-- THIS IS YOUR COLLECTION