"""
OpenRouter Embeddings — LangChain-compatible wrapper.

Uses the free nvidia/llama-nemotron-embed-vl-1b-v2 vision-language model
via OpenRouter's OpenAI-compatible API. No local model downloads needed.
"""
import os
import logging
import requests
from typing import List
from langchain_core.embeddings import Embeddings

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/embeddings"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free"


def _call_openrouter_embeddings(texts: List[str], max_retries: int = 3) -> List[List[float]]:
    """Call OpenRouter embeddings API with a batch of texts.
    Includes retry logic for transient failures."""
    import time as _time

    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not set in environment")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": EMBEDDING_MODEL,
        "input": texts,
        "encoding_format": "float",
    }

    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()

            embeddings = sorted(data["data"], key=lambda x: x["index"])
            return [e["embedding"] for e in embeddings]
        except Exception as e:
            last_error = e
            logger.warning(f"Embedding API attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                _time.sleep(1.5 * attempt)  # backoff: 1.5s, 3s

    raise last_error


class OpenRouterEmbeddings(Embeddings):
    """LangChain-compatible embeddings class that uses OpenRouter API.
    
    Inherits from langchain_core.embeddings.Embeddings so FAISS
    recognizes it as a proper embeddings object (not a bare callable).
    """

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents."""
        if not texts:
            return []

        all_embeddings: List[List[float]] = []
        batch_size = 20

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            try:
                embeddings = _call_openrouter_embeddings(batch)
                all_embeddings.extend(embeddings)
            except Exception as e:
                logger.error(f"OpenRouter embedding error (batch {i//batch_size}): {e}")
                raise

        return all_embeddings

    def embed_query(self, text: str) -> List[float]:
        """Embed a single query string."""
        result = _call_openrouter_embeddings([text])
        return result[0]
