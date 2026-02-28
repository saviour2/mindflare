from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import uuid
import os
from database import users_collection

auth_bp = Blueprint('auth', __name__)
JWT_SECRET = os.getenv('JWT_SECRET', 'my-super-secret-jwt-key')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name', 'User')
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
        
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400
        
    hashed_password = generate_password_hash(password)
    user_id = str(uuid.uuid4())
    
    users_collection.insert_one({
        "user_id": user_id,
        "email": email,
        "name": name,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow()
    })
    
    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = users_collection.find_one({"email": email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid credentials"}), 401
        
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
            "name": user['name']
        }
    }), 200

@auth_bp.route('/purge', methods=['DELETE'])
def purge():
    # We need requires_auth but it's imported in other files. 
    # Let's import it here or handle it manually.
    from auth import requires_auth
    from flask import g
    from database import applications_collection, knowledge_base_collection, logs_collection
    
    @requires_auth
    def handle_purge():
        user_id = g.current_user['sub']
        
        # Delete apps
        applications_collection.delete_many({"user_id": user_id})
        # Delete KBs
        knowledge_base_collection.delete_many({"user_id": user_id})
        # Delete logs
        logs_collection.delete_many({"user_id": user_id})
        # Delete user
        users_collection.delete_one({"user_id": user_id})
        
        return jsonify({"message": "Soul purged successfully"}), 200
        
    return handle_purge()
