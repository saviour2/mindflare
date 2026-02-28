import os
import faiss
from celery import Celery
from database import knowledge_base_collection
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.docstore import InMemoryDocstore

# Setup Celery
celery_app = Celery("ingestion", broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"))

text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

def extract_text(kb_id, source_type, source_url):
    # Mock text extraction depending on type
    if source_type == "pdf":
        return ["This is extracted mock text from a PDF file using Tesseract OCR."]
    elif source_type == "website":
        return ["This is structured text crawled from a website using BeautifulSoup."]
    elif source_type == "github":
        return ["This is code and documentation extracted from a GitHub repository, excluding node_modules."]
    
    return []

@celery_app.task
def process_knowledge_base(kb_id, source_type, source_url):
    print(f"Starting ingestion for KB: {kb_id}, Type: {source_type}")
    
    knowledge_base_collection.update_one(
        {"kb_id": kb_id},
        {"$set": {"status": "processing"}}
    )
    
    # 1. Extraction (mocked for simplicity due to environment constraints here)
    texts = extract_text(kb_id, source_type, source_url)
    
    # 2. Chunking
    chunks = text_splitter.create_documents(texts)
    chunks_content = [chunk.page_content for chunk in chunks]
    
    # 3. Embedding (Using fake embeddings or simple HuggingFace to not break environment)
    # We will simply mock Faiss index creation or use FAISS locally since this is a demonstration
    
    # Normally we'd use:
    # from langchain_community.embeddings import HuggingFaceEmbeddings
    # embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    # vectorstore = FAISS.from_texts(chunks_content, embeddings)
    # vectorstore.save_local(f"faiss_indices/{kb_id}")
    
    # Updating DB
    knowledge_base_collection.update_one(
        {"kb_id": kb_id},
        {"$set": {
            "status": "completed",
            "chunks_count": len(chunks),
            "vector_index_id": f"faiss_indices/{kb_id}"
        }}
    )
    print(f"Completed ingestion for KB: {kb_id}")

