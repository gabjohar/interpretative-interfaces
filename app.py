from flask import Flask, request, jsonify
from flask_cors import CORS
from model_utils import tokenize

app = Flask(__name__)
CORS(app)


@app.route("/tokenize", methods=["POST"])
def tokenize_route():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": '"text" field is required'}), 400
    try:
        tokens = tokenize(data["text"])
        return jsonify({"tokens": tokens})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
