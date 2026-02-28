import os
from flask import Blueprint, request, jsonify
from datetime import datetime
from applications import encrypt_api_key
from database import applications_collection, knowledge_base_collection, logs_collection
from models import generate_response
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import faiss
import time

chat_bp = Blueprint('chat', __name__)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

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
    
    # Update app activity for "Realtime" status
    applications_collection.update_one(
        {"app_id": app_doc["app_id"]},
        {"$set": {"last_active": datetime.utcnow(), "status": "active"}}
    )
    
    data = request.json
    messages = data.get('messages', [])
    if not messages:
        return jsonify({"error": "messages required"}), 400
        
    user_query = messages[-1]['content']
    
    # RAG PIPELINE
    kb_ids = app_doc.get("knowledge_base_ids", [])
    context_chunks = []
    if kb_ids:
        # Load FAISS indices for these KBs
        for kb_id in kb_ids:
            index_path = f"faiss_indices/{kb_id}"
            if os.path.exists(index_path):
                try:
                    vectorstore = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
                    docs = vectorstore.similarity_search(user_query, k=3)
                    for doc in docs:
                        context_chunks.append(doc.page_content)
                except Exception as e:
                    print(f"Error loading FAISS for {kb_id}: {e}")
    
    # 2. Build augmented prompt
    new_messages = list(messages)
    if context_chunks:
        context_text = "\n\n".join(context_chunks)
        augmented_prompt = f"Use the following knowledge base context to answer the user's question accurately. If the context doesn't contain the answer, say you don't know.\n\nContext:\n{context_text}\n\nUser Question:\n{user_query}"
        new_messages[-1]['content'] = augmented_prompt
        
    model_name = app_doc.get('model_name', 'meta-llama/llama-3-8b-instruct')
    
    try:
        content, usage, provider = generate_response(model_name, new_messages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    latency = time.time() - start_time
    
    # ANALYTICS LOGGING
    total_tokens = usage.get("total_tokens", 0)
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
