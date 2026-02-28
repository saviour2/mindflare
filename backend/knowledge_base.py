import uuid
from datetime import datetime
import os
from flask import Blueprint, request, jsonify, g
from auth import requires_auth
from database import knowledge_base_collection, applications_collection

knowledge_base_bp = Blueprint('knowledge_base', __name__)

@knowledge_base_bp.route('/', methods=['POST'])
@requires_auth
def create_knowledge_base():
    user = g.current_user
    user_id = user['sub']
    
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        kb_name = request.form.get('kb_name')
        source_type = request.form.get('source_type')
        app_id = request.form.get('app_id')
        
        file = request.files.get('file')
        if source_type == 'pdf' and file:
            os.makedirs('uploads', exist_ok=True)
            source_url = os.path.join('uploads', f"{uuid.uuid4().hex}_{file.filename}")
            file.save(source_url)
        else:
            source_url = request.form.get('source_url')
    else:
        data = request.json or {}
        kb_name = data.get('kb_name')
        source_type = data.get('source_type')
        source_url = data.get('source_url')
        app_id = data.get('app_id')

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
    user = g.current_user
    user_id = user['sub']
    
    kbs = list(knowledge_base_collection.find({"user_id": user_id}))
    for k in kbs:
        k['_id'] = str(k['_id'])
        
    return jsonify({"knowledge_bases": kbs}), 200
