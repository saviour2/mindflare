import requests
import json
import logging

class Mindflare:
    """Official Mindflare Python Client."""
    
    def __init__(self, email, password, client_secret, app_id, api_key, base_url="http://localhost:5000"):
        self.email = email
        self.password = password
        self.client_secret = client_secret
        self.app_id = app_id
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.jwt_token = None
        
    def connect(self):
        """Authenticate the SDK via Identity login to fetch temporal JWT."""
        if self.jwt_token:
            return
            
        res = requests.post(f"{self.base_url}/api/auth/login", json={
            "email": self.email,
            "password": self.password
        })
        
        if not res.ok:
            try:
                msg = res.json().get("error", res.reason)
            except:
                msg = res.text
            raise Exception(f"Mindflare SDK Authentication Failed: {msg}")
            
        self.jwt_token = res.json().get("token")
        
    def chat(self, messages, model=None):
        """Send a chat completion request to your Mindflare app."""
        self.connect()
        
        payload = {"messages": messages}
        if model:
            payload["model"] = model
            
        headers = {
            "Authorization": f"Bearer {self.jwt_token}",
            "X-Mindflare-App-Id": self.app_id,
            "X-Mindflare-Api-Key": self.api_key,
            "X-Mindflare-Client-Secret": self.client_secret,
            "Content-Type": "application/json",
            "User-Agent": "mindflare-sdk-python/0.1.0"
        }
        
        res = requests.post(f"{self.base_url}/api/chat/", json=payload, headers=headers)
        if not res.ok:
            try:
                msg = res.json().get("error", res.reason)
            except:
                msg = res.text
            raise Exception(f"Mindflare Chat Error: {msg}")
            
        return res.json()
        
    def ask(self, question, system_prompt=None):
        """Convenience function for single-turn Q&A."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": question})
        
        res = self.chat(messages)
        return res.get("response")
