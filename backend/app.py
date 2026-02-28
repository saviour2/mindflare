from flask import Flask
from builtins import Exception
from flask_restful import Api
from flask_cors import CORS

from applications import applications_bp
from knowledge_base import knowledge_base_bp
from chat import chat_bp
from auth_routes import auth_bp
from analytics_routes import analytics_bp

app = Flask(__name__)
CORS(app)
api = Api(app)

app.register_blueprint(applications_bp, url_prefix='/api/applications')
app.register_blueprint(knowledge_base_bp, url_prefix='/api/knowledge_base')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

@app.route("/")
def home():
    return {"message": "Welcome to Mindflare AI API"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
