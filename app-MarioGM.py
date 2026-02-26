from flask import Flask, jsonify, request
from models_utils import get_token_trajectory, get_tokens

app = Flask(__name__)

@app.route("/tokenize", methods=["POST"])
def tokenize():
    data = request.get_json()
    text = data["text"]
    results = get_tokens(text)
    return jsonify({"tokens": results})


