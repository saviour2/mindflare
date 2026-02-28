from flask import Flask
from builtins import Exception
from flask_restful import Api
from flask_cors import CORS

from applications import applications_bp

app = Flask(__name__)
CORS(app)
api = Api(app)

app.register_blueprint(applications_bp, url_prefix='/api/applications')

@app.route("/")
def home():
    return {"message": "Welcome to Mindflare AI API"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
