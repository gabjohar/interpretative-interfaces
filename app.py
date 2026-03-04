from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import model_utils as mu

app = Flask(__name__)
CORS(app)


@app.route("/tokenize", methods=["POST"])
def tokenize_route():
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({"error": '"text" field is required'}), 400
    try:
        tokens = mu.tokenize(data["text"])
        return jsonify({"tokens": tokens})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/trace", methods=["POST"])
def trace_route():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body is required"}), 400
    
    if "text" not in data:
        return jsonify({"error": '"text" field is required'}), 400
    
    if "token_indices" not in data:
        return jsonify({"error": '"token_indices" field is required'}), 400
    
    text = data["text"]
    token_indices = data["token_indices"]

    # Ensure token_indices is a list of integers for indexing
    if not isinstance(token_indices, list) or not all(isinstance(idx, int) for idx in token_indices):
        return jsonify({"error": '"token_indices" must be a list of integers'}), 400
    
    try:
        # Build token metadata for the selected tokens
        all_tokens = mu.tokenize(text)
        n_tokens = len(all_tokens)

        for idx in token_indices:
            if idx < 0 or idx >= n_tokens:
                return jsonify({"error": f"token_index {idx} out of range (0..{n_tokens - 1})"}), 400

        selected_tokens = [{
            "index": i, "token_str": all_tokens[i]["token_str"]}
            for i in token_indices
        ]

        # Extract trajectories (768-d) for each requested token
        with torch.no_grad():
            _, cache = mu.model.run_with_cache(text)
        raw_trajectories = {idx: mu.get_token_trajectory(text, idx, cache=cache) for idx in token_indices}

        # Joint PCA so all tokens share the same 2D space
        reduced_traj, explained_variance = mu.reduce_trajectories(raw_trajectories)

        reduced_traj_stringkeys = {str(key): value for key, value in reduced_traj.items()}

        return jsonify({
                "tokens": selected_tokens,
                "trajectories": reduced_traj_stringkeys,
                "pca_explained_variance": explained_variance,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
@app.route("/attention", methods=["POST"])
def attention_route():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "JSON body is required"}), 400

    # Allow both "prompt" and "text" for now for both consistency and compatibility with Mario's version
    text = data.get("prompt") or data.get("text")

    if not text:
        return jsonify({"error": '"prompt" or "text" field is required'}), 400
    
    layer = data.get("layer", 0)
    head = data.get("head", None)

    if not isinstance(layer, int):
        return jsonify({"error": '"layer" must be an integer'}), 400

    if head is not None and not isinstance(head, int):
        return jsonify({"error": '"head" must be an integer or null'}), 400
    
    if layer < 0 or layer >= mu.model.cfg.n_layers:
        return jsonify({"error": f'layer out of range (0..{mu.model.cfg.n_layers - 1})'}), 400

    if head is not None and (head < 0 or head >= mu.model.cfg.n_heads):
        return jsonify({"error": f'head out of range (0..{mu.model.cfg.n_heads - 1})'}), 400
    
    try:
        results = mu.get_attention_patterns(text, layer, head)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
@app.route("/predict", methods=["POST"])
def predict_route():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "JSON body is required"}), 400
            
    if "text" not in data:
        return jsonify({"error": '"text" field is required'}), 400
            
    if "token_index" not in data:
        return jsonify({"error": '"token_index" field is required'}), 400
    
    text = data["text"]
    token_idx = data["token_index"]
    top_k = data.get("top_k", 5)  # data.get(key, default)

    if not isinstance(token_idx, int):
        return jsonify({"error": '"token_index" must be an integer'}), 400
    
    if not isinstance(top_k, int) or top_k < 1:
        return jsonify({"error": '"top_k" must be a positive integer'}), 400
    
    try:
        tokens = mu.tokenize(text)
        n_tokens = len(tokens)

        if token_idx < 0 or token_idx >= n_tokens:
            return jsonify({"error": f"token_index {token_idx} out of range (0..{n_tokens - 1})"}), 400
        
        predictions = mu.predict_by_layer(text, token_idx, top_k=top_k)

        return jsonify({
            "token_index": token_idx,
            "predictions_by_layer": predictions
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
