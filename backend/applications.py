import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from auth import requires_auth
from database import applications_collection
import secrets
import hashlib

applications_bp = Blueprint('applications', __name__)

def encrypt_api_key(api_key):
    # In a real scenario, use a symmetric encryption (KMS or cryptography Fernet)
    # For now, we hash it to store securely if we only verify, but if we need to show it:
    # the requirements state "API keys must be encrypted before storing".
    # Since an API key is essentially a bearer token, hashing is standard.
    # However, if we need to retrieve the key to show the user, we'd need two-way encryption.
    # We will use hashlib.sha256 for secure verification.
    return hashlib.sha256(api_key.encode()).hexdigest()

@applications_bp.route('/', methods=['POST'])
@requires_auth
def create_app():
    user = g.current_user
    user_id = user['sub']
    
    data = request.json
    app_name = data.get('app_name')
    model_name = data.get('model_name', 'meta-llama/llama-3-8b-instruct')
    
    if not app_name:
        return jsonify({"error": "app_name is required"}), 400
        
    api_key_plain = secrets.token_urlsafe(32)
    api_key_encrypted = encrypt_api_key(api_key_plain)
    
    app_doc = {
        "app_id": str(uuid.uuid4()),
        "user_id": user_id,
        "app_name": app_name,
        "api_key_hash": api_key_encrypted, 
        # Requirement says "encrypted before storing". 
        # If we need to send it back, we just return the plain key once upon creation.
        "model_name": model_name,
        "knowledge_base_ids": [],
        "created_at": datetime.utcnow()
    }
    
    applications_collection.insert_one(app_doc)
    
    app_doc['_id'] = str(app_doc['_id'])
    
    # Return plain text API key only ONCE
    return jsonify({"app": app_doc, "api_key": api_key_plain}), 201

@applications_bp.route('/', methods=['GET'])
@requires_auth
def get_apps():
    user = g.current_user
    user_id = user['sub']
    
    apps = list(applications_collection.find({"user_id": user_id}))
    for a in apps:
        a['_id'] = str(a['_id'])
        
    return jsonify({"applications": apps}), 200

@applications_bp.route('/<app_id>', methods=['DELETE'])
@requires_auth
def delete_app(app_id):
    user = g.current_user
    user_id = user['sub']
    
    result = applications_collection.delete_one({"app_id": app_id, "user_id": user_id})
    if result.deleted_count == 1:
        return jsonify({"message": "App deleted"}), 200
    return jsonify({"error": "App not found or unauthorized"}), 404

@applications_bp.route('/<app_id>/model', methods=['PUT'])
@requires_auth
def update_model(app_id):
    user = g.current_user
    user_id = user['sub']
    
    data = request.json
    model_name = data.get('model_name')
    
    if not model_name:
        return jsonify({"error": "model_name required"}), 400
        
    res = applications_collection.update_one(
        {"app_id": app_id, "user_id": user_id},
        {"$set": {"model_name": model_name}}
    )
    
    if res.matched_count == 1:
        return jsonify({"message": "Model updated"}), 200
    return jsonify({"error": "App not found"}), 404

@applications_bp.route('/<app_id>', methods=['GET'])
@requires_auth
def get_app(app_id):
    user = g.current_user
    user_id = user['sub']
    
    app_doc = applications_collection.find_one({"app_id": app_id, "user_id": user_id})
    if not app_doc:
        return jsonify({"error": "App not found"}), 404
    
    app_doc['_id'] = str(app_doc['_id'])
    return jsonify({"app": app_doc}), 200

@applications_bp.route('/<app_id>/knowledge_bases', methods=['PUT'])
@requires_auth
def update_knowledge_bases(app_id):
    """Set the list of knowledge bases attached to this app."""
    user = g.current_user
    user_id = user['sub']
    
    data = request.json
    kb_ids = data.get('knowledge_base_ids', [])
    
    res = applications_collection.update_one(
        {"app_id": app_id, "user_id": user_id},
        {"$set": {"knowledge_base_ids": kb_ids}}
    )
    
    if res.matched_count == 1:
        return jsonify({"message": "Knowledge bases updated"}), 200
    return jsonify({"error": "App not found"}), 404

@applications_bp.route('/<app_id>/config', methods=['PUT'])
@requires_auth
def update_config(app_id):
    """Update app config: model, system_prompt, and knowledge_base_ids."""
    user = g.current_user
    user_id = user['sub']
    
    data = request.json
    update_fields = {}
    
    if 'model_name' in data:
        update_fields['model_name'] = data['model_name']
    if 'knowledge_base_ids' in data:
        update_fields['knowledge_base_ids'] = data['knowledge_base_ids']
    if 'system_prompt' in data:
        update_fields['system_prompt'] = data['system_prompt']
    if 'chatbot_name' in data:
        update_fields['chatbot_name'] = data['chatbot_name']
    if 'chatbot_icon' in data:
        update_fields['chatbot_icon'] = data['chatbot_icon']
        
    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400
        
    res = applications_collection.update_one(
        {"app_id": app_id, "user_id": user_id},
        {"$set": update_fields}
    )
    
    if res.matched_count == 1:
        return jsonify({"message": "Config updated"}), 200
    return jsonify({"error": "App not found"}), 404
