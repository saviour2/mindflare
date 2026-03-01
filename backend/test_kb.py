import sys
import os
from openrouter_embeddings import OpenRouterEmbeddings
from langchain_community.vectorstores import FAISS

embeddings = OpenRouterEmbeddings()
base = "faiss_indices/1d30b766-50b6-4693-ae99-1c88166d8373"

v = FAISS.load_local(base, embeddings, allow_dangerous_deserialization=True)

docs = list(v.docstore._dict.values())
for count, d in enumerate(docs[:5]):
    print(f"--- Doc {count} ---")
    print(d.page_content[:200])

