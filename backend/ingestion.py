import os
import uuid
import shutil
import logging
import requests
from bs4 import BeautifulSoup
from git import Repo
from celery import Celery
from database import knowledge_base_collection
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openrouter_embeddings import OpenRouterEmbeddings
from langchain_community.vectorstores import FAISS

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Absolute path to the backend directory (avoids CWD issues)
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_ROOT  = os.path.join(BACKEND_DIR, "faiss_indices")

# ─────────────────────────────────────────────
# Celery
# ─────────────────────────────────────────────
celery_app = Celery(
    "ingestion",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

# ─────────────────────────────────────────────
# NLP Tooling (loaded once at module level)
# ─────────────────────────────────────────────
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
    length_function=len,
    separators=["\n\n", "\n", ". ", " ", ""]
)
embeddings = OpenRouterEmbeddings()

# ─────────────────────────────────────────────
# PDF Extraction — PyMuPDF primary, OCR fallback
# ─────────────────────────────────────────────
def extract_from_pdf(file_path: str) -> list[str]:
    """Extract text from PDF. Tries PyMuPDF first (fast + accurate),
    then falls back to OCR via pytesseract if the PDF is image-based."""
    text = ""

    # --- Primary: PyMuPDF (fitz) ---
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        for page in doc:
            page_text = page.get_text("text")
            if page_text:
                text += page_text + "\n"
        doc.close()
        logger.info(f"PyMuPDF extracted {len(text)} chars from {file_path}")
    except ImportError:
        logger.warning("PyMuPDF not installed, falling back to OCR")
    except Exception as e:
        logger.warning(f"PyMuPDF failed: {e}, falling back to OCR")

    # --- Fallback: OCR via pdf2image + pytesseract ---
    if not text.strip():
        logger.info(f"Running OCR on {file_path}")
        try:
            import pdf2image
            import pytesseract
            images = pdf2image.convert_from_path(
                file_path,
                dpi=300,
                fmt="PNG"
            )
            for i, img in enumerate(images):
                try:
                    page_text = pytesseract.image_to_string(img, lang="eng")
                    if page_text.strip():
                        text += page_text + "\n"
                    logger.info(f"  OCR page {i+1}: {len(page_text)} chars")
                except Exception as e:
                    logger.error(f"  OCR failed on page {i+1}: {e}")
        except ImportError:
            logger.error("pdf2image/pytesseract not installed for OCR fallback")
        except Exception as e:
            logger.error(f"OCR pipeline failed: {e}")

    # --- Last resort: PyPDF2 ---
    if not text.strip():
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
            logger.info(f"PyPDF2 extracted {len(text)} chars")
        except Exception as e:
            logger.error(f"PyPDF2 also failed: {e}")

    if not text.strip():
        logger.error(f"All PDF extraction methods failed for {file_path}")
        return []

    return [text]


# ─────────────────────────────────────────────
# Website Crawling
# ─────────────────────────────────────────────
def extract_from_website(url: str, max_pages: int = 25) -> list[str]:
    """Crawl a website, staying within the same domain, up to max_pages."""
    from urllib.parse import urljoin, urlparse

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    domain = urlparse(url).netloc
    to_visit: set[str] = {url}
    visited: set[str] = set()
    all_texts: list[str] = []

    session = requests.Session()
    session.headers.update({
        "User-Agent": "MindflareBot/1.0 (+https://mindflare.ai/bot)"
    })

    logger.info(f"Crawling website: {url} (max {max_pages} pages)")

    while to_visit and len(visited) < max_pages:
        current_url = to_visit.pop()
        if current_url in visited:
            continue
        visited.add(current_url)

        try:
            resp = session.get(current_url, timeout=12, allow_redirects=True)
            if resp.status_code != 200:
                continue

            content_type = resp.headers.get("content-type", "")
            if "text/html" not in content_type:
                continue

            soup = BeautifulSoup(resp.text, "html.parser")

            # Strip noise elements
            for tag in soup(["script", "style", "nav", "footer",
                              "header", "aside", "noscript", "svg",
                              "iframe", "form"]):
                tag.decompose()

            # Extract main content
            main = soup.find("main") or soup.find("article") or soup.body
            if main:
                text = main.get_text(separator="\n", strip=True)
            else:
                text = soup.get_text(separator="\n", strip=True)

            # Skip very short pages (likely nav-only pages)
            if len(text) > 200:
                all_texts.append(f"URL: {current_url}\n\n{text}")

            # Discover more links on the same domain
            for a in soup.find_all("a", href=True):
                href = a["href"].strip()
                if href.startswith("#") or href.startswith("mailto:"):
                    continue
                abs_link = urljoin(current_url, href)
                parsed = urlparse(abs_link)
                if (parsed.netloc == domain
                        and parsed.scheme in ("http", "https")
                        and abs_link not in visited):
                    to_visit.add(abs_link)

        except requests.exceptions.Timeout:
            logger.warning(f"Timeout crawling {current_url}")
        except Exception as e:
            logger.warning(f"Error crawling {current_url}: {e}")

    logger.info(f"Crawled {len(visited)} pages, extracted {len(all_texts)} text blocks")
    return all_texts


# ─────────────────────────────────────────────
# GitHub Ingestion
# ─────────────────────────────────────────────
def extract_from_github(repo_url: str) -> list[str]:
    """Clone a GitHub repo (shallow) and read all relevant source files."""
    MAX_FILE_SIZE_BYTES = 500_000  # 500 KB per file

    VALID_EXTENSIONS = {
        ".py", ".js", ".ts", ".tsx", ".jsx",
        ".md", ".txt", ".json", ".html", ".css",
        ".go", ".java", ".c", ".cpp", ".h", ".hpp",
        ".rs", ".rb", ".php", ".swift", ".kt",
        ".yaml", ".yml", ".toml", ".env.example",
        ".sh", ".bash", ".sql"
    }

    SKIP_DIRS = {
        ".git", "node_modules", "venv", ".venv", "env",
        "__pycache__", ".next", "dist", "build", "coverage",
        ".pytest_cache", ".mypy_cache", "vendor"
    }

    texts: list[str] = []
    tmp_dir = f"/tmp/mindflare_repo_{uuid.uuid4().hex}"

    logger.info(f"Cloning GitHub repo: {repo_url}")

    try:
        Repo.clone_from(repo_url, tmp_dir, depth=1)

        file_count = 0
        for root, dirs, files in os.walk(tmp_dir):
            # Skip unwanted directories in-place
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

            # Relative path for labelling
            rel_root = os.path.relpath(root, tmp_dir)

            for fname in sorted(files):
                ext = os.path.splitext(fname)[1].lower()
                if ext not in VALID_EXTENSIONS:
                    continue

                fpath = os.path.join(root, fname)
                fsize = os.path.getsize(fpath)

                if fsize > MAX_FILE_SIZE_BYTES:
                    logger.info(f"Skipping large file: {fname} ({fsize} bytes)")
                    continue

                if fsize == 0:
                    continue

                try:
                    with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()
                    label = f"File: {rel_root}/{fname}\n\n{content}"
                    texts.append(label)
                    file_count += 1
                except Exception as e:
                    logger.warning(f"Could not read {fpath}: {e}")

        logger.info(f"GitHub ingestion: {file_count} files extracted from {repo_url}")

    except Exception as e:
        logger.error(f"GitHub extraction error: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    return texts


# ─────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────
def extract_text(source_type: str, source_url: str) -> list[str]:
    if source_type == "pdf":
        return extract_from_pdf(source_url)
    elif source_type == "website":
        return extract_from_website(source_url)
    elif source_type == "github":
        return extract_from_github(source_url)
    return []


# ─────────────────────────────────────────────
# Core Pipeline (callable directly or via Celery)
# ─────────────────────────────────────────────
def run_ingestion_pipeline(kb_id: str, source_type: str, source_url: str, celery_task=None):
    """The actual ingestion work. Called by the Celery task or directly in a thread."""
    logger.info(f"[KB:{kb_id}] Starting ingestion | type={source_type}")

    def _update(fields: dict):
        knowledge_base_collection.update_one(
            {"kb_id": kb_id}, {"$set": fields}
        )

    def _progress(pct: int, message: str):
        """Write live progress update to MongoDB so frontend can poll it."""
        _update({
            "status": "processing",
            "progress": pct,
            "progress_message": message,
        })
        logger.info(f"[KB:{kb_id}] {pct}% — {message}")

    try:
        _progress(0, "Starting ingestion...")

        # ── Stage 1: Extract (0 → 40%) ─────────────────
        stage_labels = {
            "pdf": "Reading and extracting PDF text...",
            "website": "Crawling website pages...",
            "github": "Cloning and reading repository files...",
        }
        _progress(5, stage_labels.get(source_type, "Extracting source..."))

        texts = extract_text(source_type, source_url)

        if not texts:
            _update({
                "status": "failed",
                "progress": 0,
                "progress_message": "",
                "error": "No text could be extracted from the source"
            })
            return

        total_chars = sum(len(t) for t in texts)
        source_label = {
            "pdf": f"Extracted {total_chars:,} characters",
            "website": f"Crawled {len(texts)} pages ({total_chars:,} chars)",
            "github": f"Read {len(texts)} files ({total_chars:,} chars)",
        }.get(source_type, f"Extracted {len(texts)} text blocks")

        _progress(40, f"{source_label} \u2014 splitting into chunks...")

        # ── Stage 2: Chunk (40 → 60%) ───────────────────
        docs = text_splitter.create_documents(texts)
        chunk_texts = [doc.page_content for doc in docs if doc.page_content.strip()]

        if not chunk_texts:
            _update({
                "status": "failed",
                "progress": 0,
                "progress_message": "",
                "error": "Text extracted but chunking produced no content"
            })
            return

        _progress(60, f"Created {len(chunk_texts)} chunks \u2014 generating embeddings...")

        # ── Stage 3: Embed + FAISS (60 → 90%) ───────────
        index_path = os.path.join(FAISS_ROOT, kb_id)
        os.makedirs(FAISS_ROOT, exist_ok=True)

        try:
            _progress(65, f"Embedding {len(chunk_texts)} chunks (this may take a moment)...")
            vectorstore = FAISS.from_texts(chunk_texts, embeddings)
            _progress(88, "Saving vector index to disk...")
            vectorstore.save_local(index_path)
            logger.info(f"[KB:{kb_id}] FAISS index saved to {index_path}")
        except Exception as e:
            logger.error(f"[KB:{kb_id}] FAISS error: {e}")
            _update({
                "status": "failed",
                "progress": 0,
                "progress_message": "",
                "error": f"Embedding failed: {str(e)}"
            })
            return

        # ── Stage 4: Finalize (90 → 100%) ───────────────
        _progress(95, "Saving knowledge base to database...")

        _update({
            "status": "completed",
            "progress": 100,
            "progress_message": "Ingestion complete",
            "chunks_count": len(chunk_texts),
            "vector_index_path": index_path,
            "total_chars": total_chars,
            "source_pages": len(texts),
            "error": None,
        })

        # ── Stage 5: Cleanup uploaded PDF ───────────────
        if source_type == "pdf" and source_url and os.path.exists(source_url):
            try:
                os.remove(source_url)
                logger.info(f"[KB:{kb_id}] Cleaned up temp file: {source_url}")
            except Exception as e:
                logger.warning(f"[KB:{kb_id}] Could not delete temp file: {e}")

        logger.info(f"[KB:{kb_id}] \u2713 Ingestion complete \u2014 {len(chunk_texts)} chunks")

    except Exception as exc:
        logger.error(f"[KB:{kb_id}] Unhandled exception: {exc}", exc_info=True)
        _update({
            "status": "failed",
            "progress": 0,
            "progress_message": "",
            "error": str(exc)
        })
        # Only retry if called through Celery
        if celery_task is not None:
            try:
                raise celery_task.retry(exc=exc)
            except Exception:
                pass


# ─────────────────────────────────────────────
# Celery Task Wrapper
# ─────────────────────────────────────────────
@celery_app.task(bind=True, max_retries=2, default_retry_delay=10)
def process_knowledge_base(self, kb_id: str, source_type: str, source_url: str):
    """Celery entry point — delegates to run_ingestion_pipeline."""
    run_ingestion_pipeline(kb_id, source_type, source_url, celery_task=self)
