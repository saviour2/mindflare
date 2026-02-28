"""
GitHub integration routes:
  GET  /api/github/auth             -> redirect to GitHub OAuth
  GET  /api/github/callback         -> handle GitHub OAuth callback
  POST /api/github/auto-pr          -> generate integration code + open PR
  GET  /api/github/repos            -> list user's connected GitHub repos
"""
import os
import logging
import requests
import base64
from flask import Blueprint, request, jsonify, g, redirect
from auth import requires_auth
from database import users_collection
from encryption import encrypt_symmetric, decrypt_symmetric
from dotenv import load_dotenv
import json
import google.generativeai as genai

load_dotenv()

logger = logging.getLogger(__name__)
github_bp = Blueprint('github', __name__)

def get_github_client_id():
    return os.getenv("GITHUB_CLIENT_ID", "")

def get_github_client_secret():
    return os.getenv("GITHUB_CLIENT_SECRET", "")

def get_frontend_url():
    return os.getenv("FRONTEND_URL", "http://localhost:3000")


# ─────────────────────────────────────────────
# OAuth Flow
# ─────────────────────────────────────────────

@github_bp.route('/auth', methods=['GET'])
@requires_auth
def github_auth():
    """Redirect to GitHub OAuth authorization page."""
    user_id = g.current_user['sub']
    scope   = "repo,read:user"
    state   = encrypt_symmetric(user_id)  # encode user_id as CSRF token
    
    oauth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={get_github_client_id()}"
        f"&scope={scope}"
        f"&state={state}"
        f"&redirect_uri={get_frontend_url()}/github/callback"
    )
    return jsonify({"url": oauth_url}), 200


@github_bp.route('/callback', methods=['POST'])
@requires_auth
def github_callback():
    """Exchange OAuth code for access token and persist it."""
    data = request.json or {}
    code  = data.get("code")
    state = data.get("state")
    
    if not code or not state:
        return jsonify({"error": "code and state required"}), 400
    
    # Exchange code -> access_token
    resp = requests.post(
        "https://github.com/login/oauth/access_token",
        data={
            "client_id":     get_github_client_id(),
            "client_secret": get_github_client_secret(),
            "code":          code,
        },
        headers={"Accept": "application/json"},
        timeout=10,
    )
    
    if not resp.ok:
        return jsonify({"error": "Failed to exchange OAuth code"}), 502
    
    token_data   = resp.json()
    access_token = token_data.get("access_token")
    
    if not access_token:
        return jsonify({"error": token_data.get("error_description", "No access token")}), 400
    
    # Verify state == encrypted user_id
    try:
        decoded_user_id = decrypt_symmetric(state)
    except Exception:
        return jsonify({"error": "Invalid state parameter"}), 400
    
    user_id = g.current_user['sub']
    if decoded_user_id != user_id:
        return jsonify({"error": "State mismatch"}), 400
    
    # Fetch GitHub username
    gh_user = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        timeout=10,
    ).json()
    
    github_login = gh_user.get("login", "")
    
    # Store encrypted token in user document
    encrypted_token = encrypt_symmetric(access_token)
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "github_access_token": encrypted_token,
            "github_login":        github_login,
        }}
    )
    
    return jsonify({"message": "GitHub connected", "github_login": github_login}), 200


@github_bp.route('/status', methods=['GET'])
@requires_auth
def github_status():
    """Return whether the user has connected their GitHub account."""
    user_id = g.current_user['sub']
    user    = users_collection.find_one({"user_id": user_id})
    connected = bool(user and user.get("github_access_token"))
    return jsonify({
        "connected":     connected,
        "github_login":  user.get("github_login", "") if user else ""
    }), 200


@github_bp.route('/repos', methods=['GET'])
@requires_auth  
def list_repos():
    """List the authenticated user's GitHub repositories."""
    user_id = g.current_user['sub']
    user    = users_collection.find_one({"user_id": user_id})
    
    if not user or not user.get("github_access_token"):
        return jsonify({"error": "GitHub not connected"}), 400
    
    token = decrypt_symmetric(user["github_access_token"])
    
    resp = requests.get(
        "https://api.github.com/user/repos?sort=updated&per_page=50&type=owner",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
        timeout=10,
    )
    
    if not resp.ok:
        return jsonify({"error": "Failed to fetch repositories"}), 502
    
    repos = [
        {
            "full_name":    r["full_name"],
            "name":         r["name"],
            "description":  r.get("description") or "",
            "language":     r.get("language") or "",
            "html_url":     r["html_url"],
            "default_branch": r.get("default_branch", "main"),
        }
        for r in resp.json()
    ]
    
    return jsonify({"repos": repos}), 200


# ─────────────────────────────────────────────
# Auto-PR Engine (Gemini Powered)
# ─────────────────────────────────────────────

def get_gemini_api_key():
    return os.getenv("GEMINI_API_KEY", "")

def fetch_repo_context(token: str, repo_full_name: str, default_branch: str) -> str:
    """Fetch file tree and key file snippets to provide to Gemini as context."""
    base_url = f"https://api.github.com/repos/{repo_full_name}"
    headers  = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    
    tree_resp = requests.get(
        f"{base_url}/git/trees/{default_branch}?recursive=1",
        headers=headers, timeout=10
    )
    if not tree_resp.ok:
        return "Could not fetch repository structure."
    
    tree_data = tree_resp.json().get("tree", [])
    
    # Extract file paths to show project structure
    all_paths = [item["path"] for item in tree_data if item["type"] == "blob"]
    
    key_files = {}
    important_files = ['package.json', 'next.config.js', 'next.config.ts', 'vite.config.js', 'vite.config.ts', 'index.html', 'README.md', 'app/layout.tsx', 'src/App.jsx', 'src/main.jsx', 'src/index.js']
    
    # Only fetch a few extremely important files to save context window and avoid github rate limits
    for p in all_paths:
        if p.split('/')[-1] in important_files or any(p.endswith(ext) for ext in ['config.js', 'config.ts']):
            file_resp = requests.get(f"{base_url}/contents/{p}?ref={default_branch}", headers=headers, timeout=10)
            if file_resp.ok:
                try:
                    content = base64.b64decode(file_resp.json().get("content", "")).decode("utf-8")
                    key_files[p] = content
                except Exception:
                    pass
    
    context = "Repository File Structure:\\n" + "\\n".join(all_paths) + "\\n\\n"
    context += "Key Config/Core Files Snippets:\\n"
    for k, v in key_files.items():
        context += f"--- {k} ---\\n{v[:2000]}\\n\\n"
    return context


def _generate_integration_with_gemini(repo_context: str, app_id: str, api_key: str, client_secret: str) -> dict:
    """Uses Gemini 1.5 Flash to generate custom integration code."""
    gemini_key = get_gemini_api_key()
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY is missing in environment variables.")
        
    genai.configure(api_key=gemini_key)
    model = genai.GenerativeModel("gemini-1.5-flash") 
    
    prompt = f"""
You are an expert developer helping to integrate a chatbot into a repository.
You are given the file structure and key file contents of the user's repository.
Your task:
1. Understand the code structure and framework (e.g., Next.js, React, plain HTML/JS).
2. Generate the exactly needed files to inject the `mindflare-sdk` chatbot into their app.
   The credentials they need to use are:
   appId: '{app_id}'
   apiKey: '{api_key}'
   clientSecret: '{client_secret}'
   Usually the email/password should be loadable from env variables (like process.env.MINDFLARE_EMAIL), so please create an .env.example-style file for it.

Please return ONLY a valid JSON object in this precise format (no markdown formatting, no codeblock tags around it, no surrounding text, just pure JSON):
{{
  "stack": "Name of the detected stack",
  "files": {{
    "path/to/file1.ext": "content of file 1",
    "path/to/file2.ext": "content of file 2"
  }}
}}

Make sure you write robust, production-ready, bug-free integration code that works directly.

Repository Context:
{repo_context}
"""
    response = model.generate_content(prompt)
    try:
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[7:-3].strip()
        elif text.startswith('```'):
            text = text[3:-3].strip()
        result = json.loads(text)
        return result
    except Exception as e:
        logger.error(f"Failed to parse Gemini response: {{e}}\\n{{response.text}}")
        raise ValueError("Failed to parse Gemini integration code.")




@github_bp.route('/auto-pr', methods=['POST'])
@requires_auth
def auto_pr():
    """
    Create a pull request that integrates the Mindflare chatbot into the user's repo.
    
    Body:
        repo_full_name  e.g. "ansh/my-website"
        default_branch  e.g. "main"
        app_id          Mindflare app ID
        api_key         App API key
    """
    user_id = g.current_user['sub']
    user    = users_collection.find_one({"user_id": user_id})
    
    if not user or not user.get("github_access_token"):
        return jsonify({"error": "GitHub not connected. Please connect your GitHub account first."}), 400
    
    data = request.json or {}
    repo_full_name = data.get("repo_full_name")
    default_branch = data.get("default_branch", "main")
    app_id         = data.get("app_id")
    api_key        = data.get("api_key")
    
    if not all([repo_full_name, app_id, api_key]):
        return jsonify({"error": "repo_full_name, app_id, api_key are required"}), 400
    
    gh_token      = decrypt_symmetric(user["github_access_token"])
    client_secret = user_id  # User ID is the client secret
    
    headers       = {"Authorization": f"Bearer {gh_token}", "Accept": "application/vnd.github+json"}
    base_url      = f"https://api.github.com/repos/{repo_full_name}"
    
    # 1. Fetch repo context and have Gemini generate the integration files
    repo_context = fetch_repo_context(gh_token, repo_full_name, default_branch)
    try:
        gemini_result = _generate_integration_with_gemini(repo_context, app_id, api_key, client_secret)
        stack = gemini_result.get("stack", "Unknown Framework")
        files = gemini_result.get("files", {})
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Gemini generation error: {e}")
        return jsonify({"error": "Failed to generate integration code via Gemini."}), 500
    
    logger.info(f"Gemini detected stack: {stack} for {repo_full_name}")

    # 2. Get latest commit SHA for default branch
    ref_resp = requests.get(f"{base_url}/git/ref/heads/{default_branch}", headers=headers, timeout=10)
    if not ref_resp.ok:
        return jsonify({"error": f"Could not fetch branch: {default_branch}"}), 400
    
    base_sha = ref_resp.json()["object"]["sha"]
    
    # 3. Create a new branch
    pr_branch = "mindflare/chatbot-integration"
    branch_resp = requests.post(
        f"{base_url}/git/refs",
        headers=headers,
        json={"ref": f"refs/heads/{pr_branch}", "sha": base_sha},
        timeout=10,
    )
    # 409 = branch already exists, that's OK
    if not branch_resp.ok and branch_resp.status_code != 422:
        return jsonify({"error": "Failed to create integration branch"}), 502
    
    for file_path, content in files.items():
        encoded = base64.b64encode(content.encode()).decode()
        
        # Check if file exists (to get its SHA for updates)
        existing = requests.get(f"{base_url}/contents/{file_path}?ref={pr_branch}", headers=headers, timeout=10)
        file_sha = existing.json().get("sha") if existing.ok else None
        
        payload = {
            "message": f"feat(mindflare): Add {file_path} — Chatbot integration",
            "content": encoded,
            "branch":  pr_branch,
        }
        if file_sha:
            payload["sha"] = file_sha
        
        commit_resp = requests.put(
            f"{base_url}/contents/{file_path}",
            headers=headers,
            json=payload,
            timeout=10,
        )
        
        if not commit_resp.ok:
            logger.error(f"Failed to commit {file_path}: {commit_resp.text}")
            return jsonify({"error": f"Failed to commit file: {file_path}"}), 502
    
    # 5. Open the Pull Request
    pr_body = f"""## 🔥 Mindflare AI Chatbot Integration

This PR was automatically generated by **Mindflare AI** to integrate your chatbot into this project.

### What's included
- **Stack detected**: `{stack}`
- **Files added**: {', '.join(f'`{f}`' for f in files.keys())}

### Setup
1. Merge this PR
2. Fill in your `.env` credentials (see `.env.local.example` / `.env.example`)
3. Add `<MindflareChatWidget />` to your layout or page component

### Authentication
Your integration uses **strict multi-key authentication**:
- Platform email + password (set in `.env`)  
- Client Secret (your User ID — pre-filled)
- App ID: `{app_id}`
- API Key: `{api_key}`

---
*Generated by [Mindflare AI](http://localhost:3000) · Dashboard → Applications → Auto PR*
"""
    pr_resp = requests.post(
        f"{base_url}/pulls",
        headers=headers,
        json={
            "title": "feat: Mindflare AI Chatbot Integration 🤖",
            "body":  pr_body,
            "head":  pr_branch,
            "base":  default_branch,
        },
        timeout=10,
    )
    
    if not pr_resp.ok and pr_resp.status_code != 422:  # 422 = PR already exists
        logger.error(f"Failed to open PR: {pr_resp.text}")
        return jsonify({"error": "Failed to open pull request"}), 502
    
    pr_data = pr_resp.json()
    pr_url  = pr_data.get("html_url", f"https://github.com/{repo_full_name}/pulls")
    
    return jsonify({
        "message": "Pull request created successfully!",
        "pr_url":  pr_url,
        "stack":   stack,
        "files":   list(files.keys()),
    }), 200
