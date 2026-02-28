import os
import requests
from flask import Blueprint, request, Response, jsonify
from auth import requires_auth

voice_bp = Blueprint('voice', __name__)


def get_elevenlabs_key():
    return os.getenv("ELEVENLABS_API_KEY", "")


def get_groq_key():
    return os.getenv("GROQ_API_KEY", "")


@voice_bp.route('/transcribe', methods=['POST'])
@requires_auth
def transcribe():
    """
    Transcribe audio using Groq's Whisper API.
    Expects multipart/form-data with 'audio' field containing audio file (webm/ogg/wav/mp4).
    """
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    api_key = get_groq_key()
    if not api_key:
        return jsonify({"error": "GROQ_API_KEY is missing"}), 500

    try:
        files = {
            'file': (audio_file.filename or 'audio.webm', audio_file.stream, audio_file.mimetype or 'audio/webm')
        }
        data = {
            'model': 'whisper-large-v3',
            'response_format': 'json',
            'language': 'en'
        }
        headers = {
            'Authorization': f'Bearer {api_key}'
        }
        response = requests.post(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            headers=headers,
            files=files,
            data=data
        )

        if not response.ok:
            return jsonify({"error": f"Groq Whisper Error: {response.text}"}), response.status_code

        result = response.json()
        return jsonify({"text": result.get("text", "").strip()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@voice_bp.route('/synthesize', methods=['POST'])
@requires_auth
def synthesize():
    """
    Synthesize text to speech using ElevenLabs API.
    Expects JSON: { "text": "Hello world", "voice_id": "21m00Tcm4TlvDq8ikWAM" (optional) }
    """
    data = request.json or {}
    text = data.get("text")

    if not text:
        return jsonify({"error": "Text is required"}), 400

    api_key = get_elevenlabs_key()
    if not api_key:
        return jsonify({"error": "ELEVENLABS_API_KEY is missing in backend (.env)"}), 500

    # Default Rachel voice if none provided
    voice_id = data.get("voice_id", "21m00Tcm4TlvDq8ikWAM")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }

    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, stream=True)
        if not response.ok:
            return jsonify({"error": f"ElevenLabs API Error: {response.text}"}), response.status_code

        def generate():
            for chunk in response.iter_content(chunk_size=4096):
                yield chunk

        return Response(generate(), content_type="audio/mpeg")
    except Exception as e:
        return jsonify({"error": str(e)}), 500
