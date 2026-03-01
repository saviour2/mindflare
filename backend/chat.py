import os
import time
import logging
import uuid
from flask import Blueprint, request, jsonify, g
from datetime import datetime
from applications import encrypt_api_key
from database import applications_collection, knowledge_base_collection, logs_collection, conversations_collection
from models import generate_response
from openrouter_embeddings import OpenRouterEmbeddings
from langchain_community.vectorstores import FAISS

logger = logging.getLogger(__name__)
chat_bp = Blueprint('chat', __name__)

# Loaded once at module level
embeddings = OpenRouterEmbeddings()

# Absolute path to the backend directory (avoids CWD issues)
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_ROOT  = os.path.join(BACKEND_DIR, "faiss_indices")

MAX_CONTEXT_CHUNKS = 5          # Max retrieved chunks per query
MAX_CONTEXT_CHARS  = 8000       # Hard cap on total context injected
MAX_MESSAGE_LENGTH = 4000       # Max length of a single user message
MAX_CONVERSATION_TURNS = 20     # Max messages in history sent to LLM


# ─────────────────────────────────────────────
# Shared RAG Helper
# ─────────────────────────────────────────────
def _retrieve_context(kb_ids: list, user_query: str) -> str:
    """Query FAISS indices for the given KB IDs and return merged context."""
    if not kb_ids or not user_query.strip():
        print(f"[RAG] Skipped — kb_ids={kb_ids}, query_empty={not user_query.strip()}", flush=True)
        return ""

    print(f"[RAG] Retrieving context for {len(kb_ids)} KB(s): {kb_ids}", flush=True)
    print(f"[RAG] Query: {user_query[:120]}", flush=True)
    context_chunks: list[str] = []

    for kb_id in kb_ids:
        index_path = os.path.join(FAISS_ROOT, kb_id)
        print(f"[RAG]   KB {kb_id} → path={index_path}, exists={os.path.exists(index_path)}", flush=True)
        if not os.path.exists(index_path):
            logger.warning(f"FAISS index missing for kb_id={kb_id} at {index_path}")
            continue

        # Verify both index files exist
        faiss_file = os.path.join(index_path, "index.faiss")
        pkl_file = os.path.join(index_path, "index.pkl")
        if not os.path.exists(faiss_file) or not os.path.exists(pkl_file):
            logger.error(f"FAISS index incomplete for kb_id={kb_id}: "
                         f"faiss={os.path.exists(faiss_file)}, pkl={os.path.exists(pkl_file)}")
            continue

        try:
            vs = FAISS.load_local(
                index_path, embeddings,
                allow_dangerous_deserialization=True
            )
            print(f"[RAG]   Loaded FAISS index, searching...", flush=True)
            docs = vs.similarity_search(user_query, k=MAX_CONTEXT_CHUNKS)
            print(f"[RAG]   Found {len(docs)} documents", flush=True)
            for doc in docs:
                chunk = doc.page_content.strip()
                if chunk:
                    context_chunks.append(chunk)
        except Exception as e:
            logger.error(f"FAISS load/search error for kb_id={kb_id}: {e}", exc_info=True)
            print(f"[RAG]   ERROR for kb_id={kb_id}: {e}", flush=True)

    if not context_chunks:
        print(f"[RAG] No context chunks retrieved from any KB", flush=True)
        return ""

    # Merge and truncate to stay within context budget
    merged = "\n\n---\n\n".join(context_chunks)
    if len(merged) > MAX_CONTEXT_CHARS:
        merged = merged[:MAX_CONTEXT_CHARS] + "\n\n[Context truncated for length]"

    print(f"[RAG] Returning {len(context_chunks)} chunks ({len(merged)} chars)", flush=True)
    return merged


def _build_augmented_messages(
    messages: list,
    context: str,
    system_prompt: str = ""
) -> list:
    """Build the final message list for the LLM with system prompt and optional RAG context.

    Structure:
      [system]   → system_prompt  (+ KB context if available)
      [user]     → original messages (history preserved)
      [assistant]
      ...
      [user]     → latest user message (unchanged)
    
    By keeping context in the system message and the user message untouched,
    the LLM can freely reference both KB context AND conversation history.
    """
    # Trim to last N turns to avoid token overrun
    trimmed = messages[-MAX_CONVERSATION_TURNS:]

    if not trimmed:
        return trimmed

    base_system = system_prompt.strip() if system_prompt else "You are a helpful assistant."

    if context:
        system_content = (
            f"{base_system}\n\n"
            "--- IMPORTANT INSTRUCTIONS ---\n"
            "You have been provided with knowledge base context below. "
            "You MUST use this context as your PRIMARY source of information when answering the user's question. "
            "Base your answers on the knowledge base content. Do NOT make up information that is not in the context. "
            "If the context does not contain relevant information, say so clearly.\n\n"
            f"=== Knowledge Base Context ===\n{context}\n=== End of Context ==="
        )
    else:
        system_content = base_system

    return [{"role": "system", "content": system_content}] + list(trimmed)


def _log_interaction(user_id, app_id, model_name, provider, usage, latency, is_playground=False):
    """Write an analytics log document."""
    try:
        total_tokens = usage.get("total_tokens", 0) if isinstance(usage, dict) else 0
        cost = total_tokens * 0.000002  # rough estimate

        logs_collection.insert_one({
            "user_id": user_id,
            "app_id": app_id,
            "model": model_name,
            "provider": provider,
            "tokens_used": total_tokens,
            "cost": cost,
            "latency": round(latency, 4),
            "is_playground": is_playground,
            "timestamp": datetime.utcnow(),
        })
    except Exception as e:
        logger.error(f"Failed to write analytics log: {e}")


def _save_conversation(app_id, conversation_id, messages):
    """Persist conversation history in MongoDB."""
    if conversations_collection is None:
        return
    try:
        conversations_collection.update_one(
            {"conversation_id": conversation_id},
            {
                "$set": {
                    "app_id": app_id,
                    "updated_at": datetime.utcnow(),
                    "messages": messages[-100:] # Keep last 100 per thread
                }
            },
            upsert=True
        )
    except Exception as e:
        logger.error(f"Failed to save conversation: {e}")

def _validate_messages(messages) -> tuple[bool, str]:
    """Validate the messages array structure."""
    if not isinstance(messages, list) or len(messages) == 0:
        return False, "messages must be a non-empty array"
    for m in messages:
        if not isinstance(m, dict):
            return False, "each message must be an object"
        if m.get("role") not in ("user", "assistant", "system"):
            return False, f"invalid role: {m.get('role')}"
        content = m.get("content", "")
        if not isinstance(content, str):
            return False, "message content must be a string"
        if len(content) > MAX_MESSAGE_LENGTH:
            return False, f"message too long (max {MAX_MESSAGE_LENGTH} chars)"
    return True, ""


# ─────────────────────────────────────────────
# Production Chat Endpoint (API key auth)
# ─────────────────────────────────────────────
@chat_bp.route('/', methods=['POST'])
def chat():
    start_time = time.time()

    # ── Auth Phase 1: Verify JWT (Login Requirement) ──
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authentication required. Please login with your email and password."}), 401
    
    token_str = auth_header[7:].strip()
    try:
        from auth_routes import JWT_SECRET
        import jwt
        payload = jwt.decode(token_str, JWT_SECRET, algorithms=["HS256"])
        user_id_from_token = payload['sub']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Session expired. Please login again."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid authentication token."}), 401

    # ── Auth Phase 2: Verify Client Secret & API Key ──
    client_secret_provided = request.headers.get("X-Mindflare-Client-Secret")
    api_key_plain = request.headers.get("X-Mindflare-Api-Key")

    if not client_secret_provided or not api_key_plain:
        return jsonify({"error": "Client Secret and API Key are required to interface with the engine."}), 401

    from database import users_collection
    user_record = users_collection.find_one({"user_id": user_id_from_token})
    
    if not user_record or user_record.get("client_secret") != client_secret_provided:
        return jsonify({"error": "Invalid Client Secret provided."}), 403

    api_key_hash = encrypt_api_key(api_key_plain)
    
    query = {
        "api_key_hash": api_key_hash,
        "user_id": user_id_from_token
    }

    app_doc = applications_collection.find_one(query)
    if not app_doc:
        return jsonify({"error": "Invalid API Key for this application."}), 401

    # ── Parse & validate request ─────────────────
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    messages = data.get("messages", [])
    conv_id  = data.get("conversation_id") or str(uuid.uuid4())
    
    valid, err = _validate_messages(messages)
    if not valid:
        return jsonify({"error": err}), 400

    user_query = messages[-1].get("content", "")

    # ── RAG ──────────────────────────────────────
    kb_ids = app_doc.get("knowledge_base_ids", [])
    context = _retrieve_context(kb_ids, user_query)
    system_prompt = app_doc.get("system_prompt", "You are a helpful assistant.")
    augmented_msgs = _build_augmented_messages(messages, context, system_prompt)

    # ── LLM call ────────────────────────────────
    model_name = app_doc.get("model_name", "llama-3.1-8b-instant")
    max_tokens = app_doc.get("max_tokens", 1024)
    temperature = app_doc.get("temperature", 0.7)
    try:
        content, usage, provider = generate_response(model_name, augmented_msgs, max_tokens, temperature)
    except Exception as e:
        logger.error(f"LLM error for app {app_doc['app_id']}: {e}")
        return jsonify({"error": "The AI model is temporarily unavailable. Please try again."}), 503

    latency = time.time() - start_time
    full_history = messages + [{"role": "assistant", "content": content}]

    # ── Persistence ─────────────────────────────
    # Standard analytics log
    _log_interaction(
        user_id=app_doc["user_id"],
        app_id=app_doc["app_id"],
        model_name=model_name,
        provider=provider,
        usage=usage,
        latency=latency
    )
    
    # NEW: Full conversation persistence
    _save_conversation(app_doc["app_id"], conv_id, full_history)

    # Update app last_active
    applications_collection.update_one(
        {"app_id": app_doc["app_id"]},
        {"$set": {"last_active": datetime.utcnow(), "status": "active"}}
    )

    return jsonify({
        "response": content,
        "usage": usage,
        "provider": provider,
        "context_used": bool(context),
    }), 200


# ─────────────────────────────────────────────
# Playground Endpoint (JWT auth)
# ─────────────────────────────────────────────
@chat_bp.route('/playground/<app_id>', methods=['POST'])
def playground_chat(app_id):
    """Playground endpoint — authenticated via user JWT, not API key.
    Only the app owner can access this."""
    from auth import requires_auth

    @requires_auth
    def _handle():
        start_time = time.time()
        user_id = g.current_user["sub"]

        # ── Ownership check ──────────────────────
        app_doc = applications_collection.find_one(
            {"app_id": app_id, "user_id": user_id}
        )
        if not app_doc:
            return jsonify({"error": "App not found or unauthorized"}), 404

        # ── Parse & validate ─────────────────────
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        messages = data.get("messages", [])
        conv_id  = data.get("conversation_id") or f"playground-{app_id}"
        
        valid, err = _validate_messages(messages)
        if not valid:
            return jsonify({"error": err}), 400

        user_query = messages[-1].get("content", "")

        # ── RAG ──────────────────────────────────
        kb_ids = app_doc.get("knowledge_base_ids", [])
        print(f"[Playground] App {app_id} | KB IDs: {kb_ids}", flush=True)
        context = _retrieve_context(kb_ids, user_query)
        print(f"[Playground] Context retrieved: {len(context)} chars | has_context={bool(context)}", flush=True)
        if context:
            print(f"[Playground] Context preview: {context[:200]}...", flush=True)
        system_prompt = app_doc.get("system_prompt", "You are a helpful assistant.")
        augmented_msgs = _build_augmented_messages(messages, context, system_prompt)

        # ── LLM call ─────────────────────────────
        model_name = app_doc.get("model_name", "llama-3.1-8b-instant")
        max_tokens = app_doc.get("max_tokens", 1024)
        temperature = app_doc.get("temperature", 0.7)
        print(f"[Playground] Calling {model_name} | max_tokens={max_tokens} | temperature={temperature}", flush=True)
        try:
            content, usage, provider = generate_response(model_name, augmented_msgs, max_tokens, temperature)
        except Exception as e:
            logger.error(f"[Playground] LLM error for app {app_id}: {e}")
            return jsonify({"error": "The AI model is temporarily unavailable. Please try again."}), 503

        latency = time.time() - start_time
        full_history = messages + [{"role": "assistant", "content": content}]

        # ── Persistence ──────────────────────────
        _log_interaction(
            user_id=user_id,
            app_id=app_id,
            model_name=model_name,
            provider=provider,
            usage=usage,
            latency=latency,
            is_playground=True
        )
        
        # Save history for owner review
        _save_conversation(app_id, conv_id, full_history)

        return jsonify({
            "response": content,
            "usage": usage,
            "provider": provider,
            "context_used": bool(context),
            "chatbot_name": app_doc.get("chatbot_name") or app_doc.get("app_name", "Assistant"),
        }), 200

    return _handle()
