import os
import requests

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def call_openrouter(model_name, messages):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_name,
        "messages": messages
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    if resp.status_code == 200:
        return resp.json()["choices"][0]["message"]["content"], resp.json().get("usage", {})
    else:
        raise Exception(f"OpenRouter Error: {resp.text}")

def call_groq(model_name, messages):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Map model if groq doesn't support the exact one
    # To be safe, just use 'llama3-8b-8192' as default fallback locally for groq
    groq_model = "llama3-8b-8192"
    
    payload = {
        "model": groq_model,
        "messages": messages
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    if resp.status_code == 200:
        return resp.json()["choices"][0]["message"]["content"], resp.json().get("usage", {})
    else:
        raise Exception(f"Groq Error: {resp.text}")

def generate_response(model_name, messages):
    try:
        content, usage = call_openrouter(model_name, messages)
        provider = "openrouter"
    except Exception as e:
        print(f"OpenRouter failed, falling back to Groq: {e}")
        try:
            content, usage = call_groq(model_name, messages)
            provider = "groq"
        except Exception as e2:
            raise Exception(f"Both OpenRouter and Groq failed: {e2}")
            
    return content, usage, provider
