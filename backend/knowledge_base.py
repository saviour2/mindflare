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

    # ── Dispatch ingestion task ──────────────────
    # Strategy: always use background thread UNLESS a live Celery worker
    # responds to a ping within 1 second.  Redis being up is NOT enough —
    # we also need a worker process actually consuming the queue.
    import threading
    from ingestion import run_ingestion_pipeline, celery_app, process_knowledge_base

    use_celery = os.getenv("USE_CELERY", "false").lower() == "true"
    worker_alive = False

    if use_celery:
        try:
            # inspect().ping() broadcasts to all workers with a 1s timeout.
            # Returns a dict like {worker_name: {'ok': 'pong'}} if any alive.
            i = celery_app.control.inspect(timeout=1.0)
            pong = i.ping()
            worker_alive = bool(pong)
            if worker_alive:
                logger.info(f"[KB:{kb_id}] Celery workers alive: {list(pong.keys())}")
            else:
                logger.warning(f"[KB:{kb_id}] No Celery workers responded to ping")
        except Exception as e:
            logger.warning(f"[KB:{kb_id}] Celery inspect failed: {e}")

    if worker_alive:
        process_knowledge_base.delay(kb_id, source_type, source_url)
        logger.info(f"[KB:{kb_id}] Dispatched via Celery")
    else:
        def _run():
            run_ingestion_pipeline(kb_id, source_type, source_url)

        t = threading.Thread(target=_run, daemon=True, name=f"kb-ingest-{kb_id[:8]}")
        t.start()
        logger.info(f"[KB:{kb_id}] Dispatched via background thread (set USE_CELERY=true to use Celery)")

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


@knowledge_base_bp.route('/<kb_id>/tree', methods=['GET'])
@requires_auth
def get_kb_tree(kb_id):
    """Return a tree structure of the knowledge base chunks for visualization."""
    import os, re
    from collections import defaultdict

    user = g.current_user
    user_id = user['sub']

    kb = knowledge_base_collection.find_one(
        {"kb_id": kb_id, "user_id": user_id},
        {"_id": 0, "kb_name": 1, "source_type": 1, "chunks_count": 1,
         "status": 1, "total_chars": 1, "source_pages": 1, "vector_index_path": 1}
    )
    if not kb:
        return jsonify({"error": "Knowledge base not found"}), 404

    if kb.get("status") != "completed":
        return jsonify({"error": "Knowledge base not yet completed"}), 409

    # Load FAISS index to read chunk texts
    index_path = kb.get("vector_index_path") or os.path.join("faiss_indices", kb_id)
    if not os.path.exists(index_path):
        return jsonify({"error": "Vector index not found on disk"}), 404

    try:
        from langchain_community.vectorstores import FAISS
        from openrouter_embeddings import OpenRouterEmbeddings
        embeddings = OpenRouterEmbeddings()
        vs = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
        # Access raw docstore docs
        docs = list(vs.docstore._dict.values())
    except Exception as e:
        return jsonify({"error": f"Could not load index: {str(e)}"}), 500

    source_type = kb.get("source_type", "unknown")

    # Build tree from chunk texts
    # For website: group by URL path segments
    # For github: group by file directory
    # For pdf: group by page/section headings

    def build_website_tree(docs):
        from urllib.parse import urlparse
        url_map = defaultdict(list)
        for doc in docs:
            text = doc.page_content
            url_match = re.match(r'^URL:\s*(https?://[^\n]+)', text)
            if url_match:
                raw_url = url_match.group(1).strip()
                parsed = urlparse(raw_url)
                path = parsed.path.rstrip('/') or '/'
                url_map[path].append(text[:120].replace('\n', ' '))
            else:
                url_map['/'].append(text[:120].replace('\n', ' '))

        root = {"name": kb["kb_name"], "type": "root", "children": []}
        grouped = defaultdict(lambda: defaultdict(list))
        for path, chunks in url_map.items():
            parts = [p for p in path.split('/') if p]
            if not parts:
                grouped['(root)'][''].extend(chunks)
            elif len(parts) == 1:
                grouped[parts[0]][''].extend(chunks)
            else:
                grouped[parts[0]]['/'.join(parts[1:])].extend(chunks)

        for section, sub in grouped.items():
            node = {"name": f"/{section}" if section != '(root)' else '/', "type": "section", "children": []}
            for subpath, chunk_list in sub.items():
                if subpath:
                    node["children"].append({
                        "name": f"/{subpath}",
                        "type": "page",
                        "chunks": len(chunk_list),
                        "preview": chunk_list[0][:80] if chunk_list else ""
                    })
                else:
                    node["chunks"] = len(chunk_list)
                    node["preview"] = chunk_list[0][:80] if chunk_list else ""
            root["children"].append(node)
        return root

    def build_github_tree(docs):
        file_map = defaultdict(list)
        for doc in docs:
            text = doc.page_content
            file_match = re.match(r'^File:\s*([^\n]+)', text)
            if file_match:
                filepath = file_match.group(1).strip()
            else:
                filepath = 'unknown'
            file_map[filepath].append(text[:100].replace('\n', ' '))

        root = {"name": kb["kb_name"], "type": "root", "children": []}
        dirs = defaultdict(list)
        for filepath, chunks in file_map.items():
            parts = filepath.split('/')
            if len(parts) == 1:
                root["children"].append({"name": parts[0], "type": "file", "chunks": len(chunks), "preview": chunks[0][:80] if chunks else ""})
            else:
                dir_name = parts[0]
                dirs[dir_name].append((('/').join(parts[1:]), chunks))

        for dir_name, files in dirs.items():
            node = {"name": dir_name, "type": "directory", "children": []}
            for fname, chunks in files:
                node["children"].append({"name": fname, "type": "file", "chunks": len(chunks), "preview": chunks[0][:80] if chunks else ""})
            root["children"].append(node)
        return root

    def build_pdf_tree(docs):
        root = {"name": kb["kb_name"], "type": "root", "children": []}
        sections = defaultdict(list)
        for doc in docs:
            text = doc.page_content
            heading_match = re.search(r'^(#{1,3}\s+.+|[A-Z][A-Z\s]{4,})', text, re.MULTILINE)
            if heading_match:
                heading = heading_match.group(0).strip()[:40]
            else:
                heading = "Content"
            sections[heading].append(text[:100].replace('\n', ' '))

        for heading, chunks in list(sections.items())[:30]:
            root["children"].append({
                "name": heading,
                "type": "section",
                "chunks": len(chunks),
                "preview": chunks[0][:80] if chunks else ""
            })
        return root

    if source_type == 'website':
        tree = build_website_tree(docs)
    elif source_type == 'github':
        tree = build_github_tree(docs)
    else:
        tree = build_pdf_tree(docs)

    tree["meta"] = {
        "total_chunks": kb.get("chunks_count", len(docs)),
        "total_chars": kb.get("total_chars", 0),
        "source_pages": kb.get("source_pages", 0),
        "source_type": source_type,
    }

    return jsonify({"tree": tree}), 200


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
