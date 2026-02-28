import logging
import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_restful import Api
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

from applications import applications_bp
from knowledge_base import knowledge_base_bp
from chat import chat_bp
from auth_routes import auth_bp
from analytics_routes import analytics_bp
from models_routes import models_bp
from github_routes import github_bp

app = Flask(__name__)

# ── Security settings ───────────────────────────────────────
app.config["MAX_CONTENT_LENGTH"] = 52 * 1024 * 1024  # 52 MB (covers 50 MB PDFs + overhead)
app.config["JSON_SORT_KEYS"] = False

# ── CORS ─────────────────────────────────────────────────────
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add your production domain here e.g. "https://app.mindflare.ai"
]}})

api = Api(app)

# ── Blueprints ───────────────────────────────────────────────
app.register_blueprint(applications_bp,    url_prefix='/api/applications')
app.register_blueprint(knowledge_base_bp,  url_prefix='/api/knowledge_base')
app.register_blueprint(chat_bp,            url_prefix='/api/chat')
app.register_blueprint(auth_bp,            url_prefix='/api/auth')
app.register_blueprint(analytics_bp,       url_prefix='/api/analytics')
app.register_blueprint(models_bp,          url_prefix='/api/models')
app.register_blueprint(github_bp,          url_prefix='/api/github')

# ── Global error handlers ────────────────────────────────────
@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File too large. Maximum upload size is 50 MB"}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

@app.route("/")
def home():
    return jsonify({"message": "Mindflare AI API", "version": "1.0.0", "status": "ok"})

@app.route("/api/health")
def health():
    from database import db
    mongo_ok = db is not None
    try:
        db.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    return jsonify({
        "status": "healthy" if mongo_ok else "degraded",
        "mongodb": "connected" if mongo_ok else "disconnected"
    }), 200 if mongo_ok else 503


if __name__ == "__main__":
    app.run(debug=False, port=5000, host="0.0.0.0")
