import uuid
import os
import re
import logging
import shutil
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from auth import requires_auth
from database import knowledge_base_collection, applications_collection

knowledge_base_bp = Blueprint('knowledge_base', __name__)
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {"application/pdf", "application/x-pdf"}
MAX_PDF_SIZE_MB = 50
MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024

URL_REGEX = re.compile(
    r"^(https?://)?"
    r"([\da-z\.-]+)\.([a-z\.]{2,6})"
    r"([/\w \.-]*)*/?$",
    re.IGNORECASE
)

GITHUB_URL_REGEX = re.compile(
    r"^https?://github\.com/[\w.-]+/[\w.-]+(\.git)?$",
    re.IGNORECASE
)


def _validate_url(url: str) -> bool:
    return bool(URL_REGEX.match(url))

def _validate_github_url(url: str) -> bool:
    return bool(GITHUB_URL_REGEX.match(url))


@knowledge_base_bp.route('/', methods=['POST'])
@requires_auth
def create_knowledge_base():
    user = g.current_user
    user_id = user['sub']
    source_url = None

    # ── Parse form / JSON ──────────────────────
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        kb_name = request.form.get('kb_name', '').strip()
        source_type = request.form.get('source_type', '').strip().lower()
        app_id = request.form.get('app_id', '').strip() or None
        file = request.files.get('file')

        if source_type == 'pdf':
            if not file or file.filename == '':
                return jsonify({"error": "A PDF file is required"}), 400

            # ── File type validation ──
            filename = file.filename
            if not filename.lower().endswith('.pdf'):
                return jsonify({"error": "Only PDF files are allowed"}), 400

            content_type = file.content_type or ''
            if content_type and content_type not in ALLOWED_MIME_TYPES:
                # Some browsers send application/octet-stream for PDFs, allow it
                if not content_type.startswith('application/'):
                    return jsonify({"error": "Invalid file type"}), 400

            # ── File size validation ──
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)     # Seek back to start

            if file_size > MAX_PDF_SIZE_BYTES:
                return jsonify({"error": f"File too large. Maximum size is {MAX_PDF_SIZE_MB} MB"}), 400

            if file_size == 0:
                return jsonify({"error": "Uploaded file is empty"}), 400

            # ── Safe filename ──
            safe_name = re.sub(r'[^\w\-_\.]', '_', os.path.basename(filename))
            uid = uuid.uuid4().hex
            os.makedirs('uploads', exist_ok=True)
            source_url = os.path.join('uploads', f"{uid}_{safe_name}")
            file.save(source_url)
            logger.info(f"Saved PDF upload: {source_url} ({file_size} bytes)")
        else:
            source_url = request.form.get('source_url', '').strip()
    else:
        data = request.get_json(silent=True) or {}
        kb_name = data.get('kb_name', '').strip()
        source_type = data.get('source_type', '').strip().lower()
        source_url = data.get('source_url', '').strip()
        app_id = data.get('app_id', '').strip() or None

    # ── Input validation ────────────────────────
    if not kb_name:
        _cleanup(source_url, source_type)
        return jsonify({"error": "kb_name is required"}), 400

    if len(kb_name) > 100:
        _cleanup(source_url, source_type)
        return jsonify({"error": "kb_name must be under 100 characters"}), 400

    if source_type not in ('pdf', 'website', 'github'):
        _cleanup(source_url, source_type)
        return jsonify({"error": "source_type must be pdf, website, or github"}), 400

    if source_type in ('website', 'github') and not source_url:
        return jsonify({"error": "source_url is required for this source type"}), 400

    if source_type == 'website':
        # Normalize URL
        if not source_url.startswith(('http://', 'https://')):
            source_url = 'https://' + source_url
        if not _validate_url(source_url):
            return jsonify({"error": "Invalid website URL"}), 400

    if source_type == 'github':
        if not source_url.startswith(('http://', 'https://')):
            source_url = 'https://github.com/' + source_url
        if not _validate_github_url(source_url):
            return jsonify({"error": "Invalid GitHub repository URL. Format: https://github.com/owner/repo"}), 400

    # ── Create KB document ───────────────────────
    kb_id = str(uuid.uuid4())
    kb_doc = {
        "kb_id": kb_id,
        "user_id": user_id,
        "kb_name": kb_name,
        "source_type": source_type,
        "source_url": source_url if source_type != 'pdf' else None,  # Don't persist local path
        "chunks_count": 0,
        "vector_index_path": None,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "error": None,
    }

    knowledge_base_collection.insert_one(kb_doc)
    kb_doc['_id'] = str(kb_doc['_id'])
    logger.info(f"[KB:{kb_id}] Created | type={source_type} | user={user_id}")

    # ── Optionally link to app ───────────────────
    if app_id:
        applications_collection.update_one(
            {"app_id": app_id, "user_id": user_id},
            {"$push": {"knowledge_base_ids": kb_id}}
        )

    # ── Dispatch Celery task ─────────────────────
    try:
        from ingestion import process_knowledge_base
        process_knowledge_base.delay(kb_id, source_type, source_url)
        logger.info(f"[KB:{kb_id}] Dispatched to Celery")
    except Exception as e:
        logger.error(f"[KB:{kb_id}] Failed to dispatch Celery task: {e}")
        knowledge_base_collection.update_one(
            {"kb_id": kb_id},
            {"$set": {"status": "failed", "error": "Failed to queue ingestion task"}}
        )

    return jsonify({"knowledge_base": kb_doc, "message": "Ingestion started"}), 201


@knowledge_base_bp.route('/', methods=['GET'])
@requires_auth
def get_knowledge_bases():
    user = g.current_user
    user_id = user['sub']

    kbs = list(knowledge_base_collection.find(
        {"user_id": user_id},
        {"_id": 1, "kb_id": 1, "kb_name": 1, "source_type": 1,
         "chunks_count": 1, "status": 1, "created_at": 1,
         "error": 1, "total_chars": 1, "source_pages": 1}
    ).sort("created_at", -1))

    for k in kbs:
        k['_id'] = str(k['_id'])
        if k.get('created_at'):
            k['created_at'] = k['created_at'].isoformat()

    return jsonify({"knowledge_bases": kbs}), 200


@knowledge_base_bp.route('/<kb_id>', methods=['GET'])
@requires_auth
def get_knowledge_base(kb_id):
    user = g.current_user
    user_id = user['sub']

    kb = knowledge_base_collection.find_one(
        {"kb_id": kb_id, "user_id": user_id},
        {"_id": 0}
    )
    if not kb:
        return jsonify({"error": "Knowledge base not found"}), 404

    if kb.get('created_at'):
        kb['created_at'] = kb['created_at'].isoformat()

    return jsonify({"knowledge_base": kb}), 200


@knowledge_base_bp.route('/<kb_id>', methods=['DELETE'])
@requires_auth
def delete_kb(kb_id):
    user = g.current_user
    user_id = user['sub']

    # Verify ownership first
    kb = knowledge_base_collection.find_one(
        {"kb_id": kb_id, "user_id": user_id},
        {"vector_index_path": 1, "source_type": 1}
    )
    if not kb:
        return jsonify({"error": "Knowledge base not found or unauthorized"}), 404

    # Delete FAISS index from disk
    index_path = kb.get("vector_index_path") or os.path.join("faiss_indices", kb_id)
    if os.path.exists(index_path):
        try:
            shutil.rmtree(index_path)
            logger.info(f"[KB:{kb_id}] Deleted FAISS index at {index_path}")
        except Exception as e:
            logger.warning(f"[KB:{kb_id}] Could not delete FAISS index: {e}")

    # Remove reference from all user apps
    applications_collection.update_many(
        {"user_id": user_id},
        {"$pull": {"knowledge_base_ids": kb_id}}
    )

    knowledge_base_collection.delete_one({"kb_id": kb_id, "user_id": user_id})
    logger.info(f"[KB:{kb_id}] Deleted by user {user_id}")
    return jsonify({"message": "Knowledge base deleted successfully"}), 200


def _cleanup(path, source_type):
    """Delete temp upload file on validation error."""
    if source_type == 'pdf' and path and os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            pass
