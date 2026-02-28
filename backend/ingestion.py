import os
import uuid
import shutil
import requests
from bs4 import BeautifulSoup
from git import Repo
import faiss
from celery import Celery
from database import knowledge_base_collection
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import pdf2image
import pytesseract

# Setup Celery
celery_app = Celery("ingestion", broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"))

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def extract_from_pdf(file_path):
    print(f"Extracting PDF with OCR: {file_path}")
    text = ""
    try:
        images = pdf2image.convert_from_path(file_path)
        for i, img in enumerate(images):
            try:
                text += pytesseract.image_to_string(img) + "\n"
            except Exception as e:
                print(f"Tesseract error on page {i}: {e}")
    except Exception as e:
        print(f"PDF extract error: {e}")
        # fallback simple extract if OCR fails
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        except Exception:
            pass
    return [text] if text.strip() else []

def extract_from_website(url, max_pages=20):
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
    
    from urllib.parse import urljoin, urlparse
    domain = urlparse(url).netloc
    to_visit = {url}
    visited = set()
    all_texts = []
    
    print(f"Crawling website: {url} (max {max_pages} pages)")
    
    while to_visit and len(visited) < max_pages:
        current_url = to_visit.pop()
        if current_url in visited:
            continue
        
        visited.add(current_url)
        try:
            headers = {"User-Agent": "Mindflare Bot"}
            res = requests.get(current_url, headers=headers, timeout=10)
            if res.status_code != 200: continue
            
            soup = BeautifulSoup(res.text, "html.parser")
            
            # Extract text
            for script in soup(["script", "style"]):
                script.extract()
            text = soup.get_text(separator="\n", strip=True)
            if text:
                all_texts.append(text)
            
            # Find more links
            for link in soup.find_all("a", href=True):
                absolute_link = urljoin(current_url, link["href"])
                parsed_link = urlparse(absolute_link)
                # Stay on same domain and avoid fragments
                if parsed_link.netloc == domain and parsed_link.fragment == "":
                    if absolute_link not in visited:
                        to_visit.add(absolute_link)
                        
        except Exception as e:
            print(f"Error crawling {current_url}: {e}")
            
    return all_texts

def extract_from_github(repo_url):
    print(f"Ingesting GitHub repo: {repo_url}")
    texts = []
    tmp_dir = f"/tmp/mindflare_repo_{uuid.uuid4().hex}"
    try:
        Repo.clone_from(repo_url, tmp_dir, depth=1)
        valid_extensions = {".py", ".js", ".ts", ".tsx", ".jsx", ".md", ".txt", ".json", ".html", ".css", ".go", ".java", ".c", ".cpp"}
        for root, dirs, files in os.walk(tmp_dir):
            if ".git" in dirs: dirs.remove(".git")
            if "node_modules" in dirs: dirs.remove("node_modules")
            if "venv" in dirs: dirs.remove("venv")
            for file in files:
                ext = os.path.splitext(file)[1]
                if ext in valid_extensions:
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            texts.append(f.read())
                    except: pass
    except Exception as e:
        print(f"GitHub extraction error: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
    return texts

def extract_text(kb_id, source_type, source_url):
    if source_type == "pdf":
        return extract_from_pdf(source_url) # source_url is the local path for PDF
    elif source_type == "website":
        return extract_from_website(source_url)
    elif source_type == "github":
        return extract_from_github(source_url)
    return []

@celery_app.task
def process_knowledge_base(kb_id, source_type, source_url):
    print(f"Starting ingestion for KB: {kb_id}, Type: {source_type}")
    
    knowledge_base_collection.update_one(
        {"kb_id": kb_id},
        {"$set": {"status": "processing"}}
    )
    
    # 1. Extraction
    texts = extract_text(kb_id, source_type, source_url)
    if not texts:
        knowledge_base_collection.update_one({"kb_id": kb_id}, {"$set": {"status": "failed", "error": "No text extracted"}})
        return

    # 2. Chunking
    chunks = text_splitter.create_documents(texts)
    chunks_content = [chunk.page_content for chunk in chunks]
    if not chunks_content:
        knowledge_base_collection.update_one({"kb_id": kb_id}, {"$set": {"status": "failed", "error": "No valid chunks extracted"}})
        return
        
    # 3. Embedding
    index_path = f"faiss_indices/{kb_id}"
    os.makedirs(os.path.dirname(index_path), exist_ok=True)
    try:
        vectorstore = FAISS.from_texts(chunks_content, embeddings)
        vectorstore.save_local(index_path)
    except Exception as e:
        print(f"FAISS error: {e}")
        knowledge_base_collection.update_one({"kb_id": kb_id}, {"$set": {"status": "failed", "error": str(e)}})
        return
        
    # Updating DB
    knowledge_base_collection.update_one(
        {"kb_id": kb_id},
        {"$set": {
            "status": "completed",
            "chunks_count": len(chunks),
            "vector_index_id": index_path
        }}
    )
    
    # Cleanup pdf if needed
    if source_type == 'pdf' and os.path.exists(source_url):
        os.remove(source_url)
        
    print(f"Completed ingestion for KB: {kb_id}")
