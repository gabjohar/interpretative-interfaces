from flask import Flask, jsonify, request
from flask_cors import CORS
from model_utils_Mario import get_token_trajectory, get_tokens, get_attention_patterns

app = Flask(__name__)

@app.route("/tokenize", methods=["POST"])
def tokenize():
    data = request.get_json()
    text = data["text"]
    results = get_tokens(text)
    return jsonify({"tokens": results})

@app.route("/attention", methods=["POST"])
def get_attention():
    data = request.get_json()
    prompt = data.get("prompt", "")
    layer = data.get("layer", 0)
    head = data.get("head",None)

    if not prompt: 
        return jsonify({"error": "prompt is required"}),400

    results = get_attention_patterns(prompt,layer,head)
    return jsonify(results)
