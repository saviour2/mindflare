import os
import requests

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Groq-native model IDs (use Groq directly for these)
GROQ_MODEL_IDS = {
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "qwen/qwen3-32b",
    "moonshotai/kimi-k2-instruct",
    "allam-2-7b",
}

def call_openrouter(model_name, messages):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mindflare.ai",
        "X-Title": "Mindflare AI"
    }
    payload = {"model": model_name, "messages": messages}
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code == 200:
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        return content, usage
    else:
        raise Exception(f"OpenRouter Error {resp.status_code}: {resp.text}")

def call_groq(model_name, messages):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {"model": model_name, "messages": messages}
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code == 200:
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        return content, usage
    else:
        raise Exception(f"Groq Error {resp.status_code}: {resp.text}")

def generate_response(model_name, messages):
    """Route to the correct provider based on model ID."""
    if model_name in GROQ_MODEL_IDS:
        try:
            content, usage = call_groq(model_name, messages)
            return content, usage, "groq"
        except Exception as e:
            print(f"Groq failed for {model_name}: {e}, falling back to OpenRouter")
            content, usage = call_openrouter(model_name, messages)
            return content, usage, "openrouter"

    try:
        content, usage = call_openrouter(model_name, messages)
        return content, usage, "openrouter"
    except Exception as e:
        print(f"OpenRouter failed for {model_name}: {e}, falling back to Groq")
        fallback = "llama-3.1-8b-instant"
        content, usage = call_groq(fallback, messages)
        return content, usage, "groq-fallback"


def fetch_available_models():
    """Fetch free OpenRouter models + active Groq chat models."""
    results = []

    # --- OpenRouter: free models ---
    try:
        resp = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
            timeout=10
        )
        or_models = resp.json().get("data", [])
        for m in or_models:
            prompt_price = str(m.get("pricing", {}).get("prompt", "1"))
            if prompt_price == "0":
                model_id = m["id"]
                # Skip the generic router and vision-only / thinking-only models
                if model_id == "openrouter/free":
                    continue
                results.append({
                    "id": model_id,
                    "name": m.get("name", model_id),
                    "provider": "openrouter",
                    "context_length": m.get("context_length", 8192),
                    "free": True,
                })
    except Exception as e:
        print(f"Failed to fetch OpenRouter models: {e}")

    # --- Groq: all chat-capable models ---
    try:
        resp = requests.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            timeout=10
        )
        groq_models = resp.json().get("data", [])
        # Skip audio/guard/embedding models
        skip_keywords = ["whisper", "guard", "tts", "embed", "safeguard", "orpheus", "prompt-guard"]
        for m in groq_models:
            mid = m["id"]
            if any(k in mid.lower() for k in skip_keywords):
                continue
            results.append({
                "id": mid,
                "name": mid,
                "provider": "groq",
                "context_length": m.get("context_window", 8192),
                "free": True,
            })
    except Exception as e:
        print(f"Failed to fetch Groq models: {e}")

    return results
