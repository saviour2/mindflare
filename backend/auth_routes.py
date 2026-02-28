import re
import uuid
import logging
import datetime
import os
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from database import users_collection

auth_bp = Blueprint('auth', __name__)
JWT_SECRET = os.getenv('JWT_SECRET', 'my-super-secret-jwt-key')
logger = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def _valid_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email))


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', 'User').strip()

    # ── Validation ───────────────────────────────
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if not _valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if len(name) > 80:
        return jsonify({"error": "Name too long"}), 400

    # ── Duplicate check ──────────────────────────
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "An account with this email already exists"}), 409

    # ── Create user ──────────────────────────────
    user_id = str(uuid.uuid4())
    users_collection.insert_one({
        "user_id": user_id,
        "email": email,
        "name": name,
        "password": generate_password_hash(password),
        "created_at": datetime.datetime.utcnow(),
    })

    logger.info(f"New user registered: {email} ({user_id})")
    return jsonify({"message": "Account created successfully"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = users_collection.find_one({"email": email})

    # ── Constant-time check (prevent timing attacks) ──
    if not user or not check_password_hash(user.get('password', ''), password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode({
        'sub': user['user_id'],
        'email': user['email'],
        'name': user['name'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm="HS256")

    logger.info(f"User logged in: {email}")
    return jsonify({
        "token": token,
        "user": {
            "id": user['user_id'],
            "email": user['email'],
            "name": user['name'],
        }
    }), 200


@auth_bp.route('/me', methods=['GET'])
def me():
    """Get current user profile."""
    from auth import requires_auth
    from flask import g

    @requires_auth
    def _handle():
        user_id = g.current_user['sub']
        user = users_collection.find_one(
            {"user_id": user_id},
            {"_id": 0, "password": 0}
        )
        if not user:
            return jsonify({"error": "User not found"}), 404
        if user.get('created_at'):
            user['created_at'] = user['created_at'].isoformat()
        return jsonify({"user": user}), 200

    return _handle()


@auth_bp.route('/purge', methods=['DELETE'])
def purge():
    """Delete ALL data for the authenticated user — irreversible."""
    from auth import requires_auth
    from flask import g
    from database import applications_collection, knowledge_base_collection, logs_collection

    @requires_auth
    def _handle():
        user_id = g.current_user['sub']

        applications_collection.delete_many({"user_id": user_id})
        knowledge_base_collection.delete_many({"user_id": user_id})
        logs_collection.delete_many({"user_id": user_id})
        users_collection.delete_one({"user_id": user_id})

        logger.info(f"User {user_id} purged all data")
        return jsonify({"message": "All data deleted successfully"}), 200

    return _handle()
