from flask import Blueprint, request, jsonify
from datetime import datetime
from applications import encrypt_api_key
from database import applications_collection, knowledge_base_collection, logs_collection
from models import generate_response
import time

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/', methods=['POST'])
def chat():
    start_time = time.time()
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Unauthorized"}), 401
    
    api_key_plain = auth_header.split(" ")[1]
    api_key_hash = encrypt_api_key(api_key_plain)
    
    app_doc = applications_collection.find_one({"api_key_hash": api_key_hash})
    if not app_doc:
        return jsonify({"error": "Invalid API key"}), 401
    
    data = request.json
    messages = data.get('messages', [])
    if not messages:
        return jsonify({"error": "messages required"}), 400
        
    user_query = messages[-1]['content']
    
    # RAG PIPELINE
    # 1. Embed query & get chunks (mocked)
    kb_ids = app_doc.get("knowledge_base_ids", [])
    context_chunks = []
    if kb_ids:
        # Here we would load FAISS indices for these KBs, embed user_query
        # and retrieve top 5 matching chunks from the combined space
        context_chunks.append("MOCKED: Context extracted from vectorstore related to user query.")
    
    # 2. Build augmented prompt
    if context_chunks:
        context_text = "\n".join(context_chunks)
        augmented_prompt = f"Context:\n{context_text}\n\nUser Question:\n{user_query}"
        messages[-1]['content'] = augmented_prompt
        
    model_name = app_doc.get('model_name', 'meta-llama/llama-3-8b-instruct')
    
    try:
        content, usage, provider = generate_response(model_name, messages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    latency = time.time() - start_time
    
    # ANALYTICS LOGGING
    total_tokens = usage.get("total_tokens", 0)
    # mock cost
    cost = total_tokens * 0.000002
    
    log_doc = {
        "user_id": app_doc["user_id"],
        "app_id": app_doc["app_id"],
        "model": model_name,
        "provider": provider,
        "tokens_used": total_tokens,
        "cost": cost,
        "latency": latency,
        "timestamp": datetime.utcnow()
    }
    logs_collection.insert_one(log_doc)
    
    return jsonify({
        "response": content,
        "usage": usage,
        "provider": provider
    }), 200

