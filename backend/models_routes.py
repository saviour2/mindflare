from flask import Blueprint, jsonify
from auth import requires_auth
from models import fetch_available_models

models_bp = Blueprint('models', __name__)

# Cache so we don't hit the APIs on every request
_cache = {"models": None}

@models_bp.route('/', methods=['GET'])
@requires_auth
def list_models():
    """Return all available free models from OpenRouter + Groq."""
    if _cache["models"] is None:
        _cache["models"] = fetch_available_models()
    return jsonify({"models": _cache["models"]}), 200

@models_bp.route('/refresh', methods=['POST'])
@requires_auth
def refresh_models():
    """Force-refresh the model cache."""
    _cache["models"] = fetch_available_models()
    return jsonify({"models": _cache["models"], "count": len(_cache["models"])}), 200
