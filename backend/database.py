import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/mindflare")

try:
    client = MongoClient(MONGO_URI)
    db = client.get_database()
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    db = None

# Collections
if db is not None:
    applications_collection = db["applications"]
    knowledge_base_collection = db["knowledge_bases"]
    logs_collection = db["logs"]
    users_collection = db["users"]
else:
    applications_collection = None
    knowledge_base_collection = None
    logs_collection = None
    users_collection = None

def get_db():
    return db
