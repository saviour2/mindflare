import re
import uuid
import logging
import datetime
import os
import secrets
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
    client_secret = f"mf_sk_{secrets.token_urlsafe(16)}"
    users_collection.insert_one({
        "user_id": user_id,
        "client_secret": client_secret,
        "email": email,
        "name": name,
        "password": generate_password_hash(password),
        "created_at": datetime.datetime.utcnow(),
    })

    logger.info(f"New user registered: {email} ({user_id})")
    return jsonify({"message": "Account created successfully", "client_secret": client_secret}), 201


import requests

@auth_bp.route('/auth0-sync', methods=['POST'])
def auth0_sync():
    """Sync an Auth0 user into the MongoDB and return a valid custom HS256 JWT by verifying the access token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    
    token = auth_header.split(" ")[1]

    # Verify the token with Auth0's /userinfo endpoint
    # The domain should ideally be in env vars, but dev-nh7aeq727fmpmxak.us.auth0.com is currently used
    auth0_domain = os.getenv('AUTH0_DOMAIN', 'dev-nh7aeq727fmpmxak.us.auth0.com')
    userinfo_url = f"https://{auth0_domain}/userinfo"
    
    resp = requests.get(userinfo_url, headers={"Authorization": f"Bearer {token}"})
    if resp.status_code != 200:
        return jsonify({"error": "Invalid Auth0 access token"}), 401
        
    userinfo = resp.json()
    
    auth0_sub = userinfo.get('sub')
    email = userinfo.get('email', '').strip().lower()
    name = userinfo.get('name', 'User').strip()

    if not auth0_sub or not email:
        return jsonify({"error": "Missing required user claims from Auth0"}), 400

    user = users_collection.find_one({"email": email})
    
    if not user:
        # Create user with a randomly generated, unguessable password
        user_id = str(uuid.uuid4())
        client_secret = f"mf_sk_{secrets.token_urlsafe(16)}"
        users_collection.insert_one({
            "user_id": user_id,
            "client_secret": client_secret,
            "email": email,
            "name": name,
            "auth0_sub": auth0_sub,
            "password": generate_password_hash(str(uuid.uuid4()) + "MindFlare2024!"),
            "created_at": datetime.datetime.utcnow(),
        })
        user = users_collection.find_one({"user_id": user_id})
    else:
        # Update user with auth0_sub if it's not set
        if not user.get('auth0_sub'):
            users_collection.update_one(
                {"user_id": user['user_id']},
                {"$set": {"auth0_sub": auth0_sub}}
            )
        if not user.get('client_secret'):
            client_secret = f"mf_sk_{secrets.token_urlsafe(16)}"
            users_collection.update_one(
                {"user_id": user['user_id']},
                {"$set": {"client_secret": client_secret}}
            )
            user['client_secret'] = client_secret

    # Issue standard Mindflare JWT so SDK works seamlessly 
    token = jwt.encode({
        'sub': user['user_id'],
        'email': user['email'],
        'name': user['name'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {
            "id": user['user_id'],
            "email": user['email'],
            "name": user['name'],
            "client_secret": user.get('client_secret'),
        }
    }), 200


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

    # Migration: Ensure existing users also have a client_secret
    if not user.get('client_secret'):
        client_secret = f"mf_sk_{secrets.token_urlsafe(16)}"
        users_collection.update_one(
            {"user_id": user['user_id']},
            {"$set": {"client_secret": client_secret}}
        )
        user['client_secret'] = client_secret

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
            "client_secret": user.get('client_secret'),
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
