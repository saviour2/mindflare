import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from auth import requires_auth, _request_ctx_stack
from database import knowledge_base_collection, applications_collection

knowledge_base_bp = Blueprint('knowledge_base', __name__)

@knowledge_base_bp.route('/', methods=['POST'])
@requires_auth
def create_knowledge_base():
    user = _request_ctx_stack.top.current_user
    user_id = user['sub']
    
    data = request.json
    kb_name = data.get('kb_name')
    source_type = data.get('source_type')
    source_url = data.get('source_url') # For website/Github
    app_id = data.get('app_id') # To attach to app
    
    if not kb_name or not source_type:
        return jsonify({"error": "kb_name and source_type required"}), 400
        
    kb_id = str(uuid.uuid4())
    
    kb_doc = {
        "kb_id": kb_id,
        "user_id": user_id,
        "kb_name": kb_name,
        "source_type": source_type,
        "source_url": source_url,
        "chunks_count": 0,
        "vector_index_id": None,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    knowledge_base_collection.insert_one(kb_doc)
    kb_doc['_id'] = str(kb_doc['_id'])
    
    if app_id:
        applications_collection.update_one(
            {"app_id": app_id, "user_id": user_id},
            {"$push": {"knowledge_base_ids": kb_id}}
        )
        
    # Trigger celery task here
    from ingestion import process_knowledge_base
    process_knowledge_base.delay(kb_id, source_type, source_url)
    
    return jsonify({"knowledge_base": kb_doc}), 201

@knowledge_base_bp.route('/', methods=['GET'])
@requires_auth
def get_knowledge_bases():
    user = _request_ctx_stack.top.current_user
    user_id = user['sub']
    
    kbs = list(knowledge_base_collection.find({"user_id": user_id}))
    for k in kbs:
        k['_id'] = str(k['_id'])
        
    return jsonify({"knowledge_bases": kbs}), 200
