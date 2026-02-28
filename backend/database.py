import os
import logging
from pymongo import MongoClient, ASCENDING, IndexModel
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/mindflare")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Check connection
    client.admin.command("ping")
    db = client.get_database()
    logger.info("MongoDB connected successfully")
except Exception as e:
    logger.critical(f"Failed to connect to MongoDB: {e}")
    db = None

# ── Collections ──────────────────────────────────────────────
if db is not None:
    applications_collection  = db["applications"]
    knowledge_base_collection = db["knowledge_bases"]
    logs_collection          = db["logs"]
    users_collection         = db["users"]
    conversations_collection = db["conversations"]

    # ── Indexes (idempotent — safe to run multiple times) ─────
    try:
        users_collection.create_index(
            [("email", ASCENDING)], unique=True, name="idx_users_email"
        )
        applications_collection.create_index(
            [("user_id", ASCENDING)], name="idx_apps_user"
        )
        applications_collection.create_index(
            [("api_key_hash", ASCENDING)], unique=True, name="idx_apps_api_key"
        )
        knowledge_base_collection.create_index(
            [("user_id", ASCENDING)], name="idx_kbs_user"
        )
        knowledge_base_collection.create_index(
            [("kb_id", ASCENDING)], unique=True, name="idx_kbs_id"
        )
        logs_collection.create_index(
            [("user_id", ASCENDING), ("timestamp", ASCENDING)],
            name="idx_logs_user_time"
        )
        logs_collection.create_index(
            [("app_id", ASCENDING), ("timestamp", ASCENDING)],
            name="idx_logs_app_time"
        )
        conversations_collection.create_index(
            [("conversation_id", ASCENDING)], unique=False, name="idx_conv_id"
        )
        conversations_collection.create_index(
            [("app_id", ASCENDING), ("updated_at", ASCENDING)],
            name="idx_conv_app_time"
        )
        logger.info("MongoDB indexes ensured")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
else:
    applications_collection  = None
    knowledge_base_collection = None
    logs_collection          = None
    users_collection         = None
    conversations_collection = None


def get_db():
    return db
