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

logger = logging.getLogger(__name__)
github_bp = Blueprint('github', __name__)

GITHUB_CLIENT_ID     = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "http://localhost:3000")


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
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope={scope}"
        f"&state={state}"
        f"&redirect_uri={FRONTEND_URL}/github/callback"
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
            "client_id":     GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
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
# Auto-PR Engine
# ─────────────────────────────────────────────

def _detect_stack(token: str, repo_full_name: str, default_branch: str) -> str:
    """Detect the frontend stack by examining repo file tree."""
    base_url = f"https://api.github.com/repos/{repo_full_name}"
    headers  = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    
    try:
        tree = requests.get(
            f"{base_url}/git/trees/{default_branch}?recursive=1",
            headers=headers, timeout=10
        ).json()
        
        files = {item["path"].lower() for item in tree.get("tree", []) if item["type"] == "blob"}
    except Exception:
        files = set()
    
    if "next.config.js" in files or "next.config.ts" in files or "next.config.mjs" in files:
        return "nextjs"
    if "vite.config.js" in files or "vite.config.ts" in files:
        return "react-vite"
    if "package.json" in files:
        return "react"
    if any(f.endswith(".html") for f in files):
        return "html"
    return "html"


def _generate_integration_code(stack: str, app_id: str, api_key: str, client_secret: str) -> dict[str, str]:
    """
    Generate the integration code for the detected stack.
    Returns a dict of {relative_file_path: file_content}
    """
    sdk_init = f"""import {{ Mindflare }} from 'mindflare-sdk';

const mindflare = new Mindflare({{
  email:        process.env.MINDFLARE_EMAIL,
  password:     process.env.MINDFLARE_PASSWORD,
  clientSecret: process.env.MINDFLARE_CLIENT_SECRET,
  appId:        '{app_id}',
  apiKey:       '{api_key}',
}});

export default mindflare;"""

    env_template = f"""# Mindflare AI Configuration (auto-generated)
# Fill in your actual credentials below
MINDFLARE_EMAIL=your-email@example.com
MINDFLARE_PASSWORD=your-password
MINDFLARE_CLIENT_SECRET={client_secret}
"""

    if stack == "nextjs":
        component = """'use client';
import { useEffect } from 'react';
import mindflare from '@/lib/mindflare';

/**
 * Drop this component wherever you want the Mindflare chat widget.
 * Add <MindflareChatWidget /> to your layout.tsx or any page.
 */
export default function MindflareChatWidget() {
  useEffect(() => {
    mindflare.mountChat('#mindflare-chat');
    return () => { /* cleanup if needed */ };
  }, []);

  return <div id="mindflare-chat" />;
}
"""
        return {
            "lib/mindflare.ts":                  sdk_init,
            "components/MindflareChatWidget.tsx": component,
            ".env.local.example":                 env_template,
        }

    elif stack in ("react", "react-vite"):
        component = """import { useEffect } from 'react';
import mindflare from './lib/mindflare';

/**
 * Drop this component wherever you want the Mindflare chat widget.
 */
export default function MindflareChatWidget() {
  useEffect(() => {
    mindflare.mountChat('#mindflare-chat');
  }, []);

  return <div id="mindflare-chat" />;
}
"""
        return {
            "src/lib/mindflare.js":                sdk_init.replace("from 'mindflare-sdk'", "from 'mindflare-sdk'"),
            "src/components/MindflareChatWidget.jsx": component,
            ".env.example":                        env_template,
        }

    else:  # plain HTML
        html_snippet = f"""<!DOCTYPE html>
<!-- Mindflare Chatbot Widget Integration (auto-generated) -->
<!-- Add this snippet to your HTML pages -->
<script type="module">
  import {{ Mindflare }} from 'https://cdn.jsdelivr.net/npm/mindflare-sdk@0.2.0/dist/index.mjs';
  const mf = new Mindflare({{
    email:        'YOUR_EMAIL',
    password:     'YOUR_PASSWORD',
    clientSecret: '{client_secret}',
    appId:        '{app_id}',
    apiKey:       '{api_key}',
  }});
  mf.mountChat('#mindflare-chat');
</script>
<div id="mindflare-chat"></div>
"""
        readme = """# Mindflare Integration

Paste the contents of `mindflare-snippet.html` into your HTML page.
Replace the placeholders with your actual credentials from the Mindflare dashboard.
"""
        return {
            "mindflare-snippet.html": html_snippet,
            "MINDFLARE_README.md":    readme,
        }


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
    
    # 1. Detect stack
    stack = _detect_stack(gh_token, repo_full_name, default_branch)
    logger.info(f"Detected stack: {stack} for {repo_full_name}")
    
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
    
    # 4. Generate and commit integration files
    files = _generate_integration_code(stack, app_id, api_key, client_secret)
    
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
