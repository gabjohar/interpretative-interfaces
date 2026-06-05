from flask import Flask, request, jsonify
from flask_cors import CORS
import model_utils as mu

app = Flask(__name__)
CORS(app)

@app.route("/halftone", methods=["POST"])
def halftone_route():
    data = request.get_json(silent=True)
    
    if not data:
        return jsonify({"error": "JSON body is required"}), 400

    if "text" not in data:
        return jsonify({"error": '"text" field is required'}), 400

    text = data["text"]
    if not isinstance(text, str):
        return jsonify({"error": '"text" must be a string'}), 400

    try:
        pca_jump, umap_density = mu.process_halftone(text)
        return jsonify({
            "pca_jump": pca_jump,
            "umap_density": umap_density
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True, port=5001, use_reloader=False)
