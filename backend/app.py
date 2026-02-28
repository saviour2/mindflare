from flask import Flask
from flask_restful import Api
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
api = Api(app)

@app.route("/")
def home():
    return {"message": "Welcome to Mindflare AI API"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
