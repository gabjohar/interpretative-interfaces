from transformer_lens import HookedTransformer
from sklearn.decomposition import PCA
import numpy as np
import torch

# Load the model
model = HookedTransformer.from_pretrained("gpt2-small")

def tokenize(text: str) -> list[dict]:
    """
    Returns list of {index, token_str, token_id} for each token.
    """
    
    tokens = model.to_tokens(text) # tensor of token IDs
    str_tokens = model.to_str_tokens(text) # list of strings
    
    return [{
        "index": i, "token_str": s, "token_id": int(tokens[0, i])}
        for i, s in enumerate(str_tokens)
    ]

# Optional cache parameter to allow reuse of an existing forward-pass cache to avoid recomputation
def get_token_trajectory(text: str, token_index: int, cache=None) -> list[dict]:
    """
    Returns the residual stream vector for one token at each layer.
    """
    if cache is None:
        _, cache = model.run_with_cache(text)
        
    n_layers = model.cfg.n_layers # 12 for GPT-2 small
    trajectory = []
    
    for layer in range(n_layers):
        embedding = cache["resid_post", layer][0, token_index, :] # shape (768,)
        trajectory.append({
            "layer": layer,
            "embedding": embedding.tolist() # convert tensor to list
        })
        
    return trajectory


def reduce_trajectories(trajectories: dict[int, list]) -> tuple[dict[int, list[dict]], list[float]]:
    """
    Input: {token_index: [768-dim embedding per layer]}
    Output: {token_index: [{layer, x, y} per layer]}, explained_variance_ratio
    All tokens share the same PCA space so trajectories are comparable.
    """

    # Collect ALL embeddings into one matrix for joint PCA
    # to see multiple tokens moving in the same space
    all_embeddings = []
    labels = [] # (token_index, layer) pairs
    
    for token_idx, layers in trajectories.items():
        for layer_data in layers:
            all_embeddings.append(layer_data["embedding"])
            labels.append((token_idx, layer_data["layer"]))
            
    all_embeddings = np.array(all_embeddings)
    
    pca = PCA(n_components=2)
    # Fit the model with all_embeddings and apply the dimensionality reduction on all_embeddings.
    coords_2d = pca.fit_transform(all_embeddings)  # shape: (number_of_points, 2)
    
    # Reconstruct per-token trajectories with 2D coordinates
    result = {}
    
    for i, (token_idx, layer) in enumerate(labels):
        if token_idx not in result:
            result[token_idx] = []
            
        result[token_idx].append({
            "layer": layer,
            "x": float(coords_2d[i, 0]),
            "y": float(coords_2d[i, 1])
        })
    
    explained_variance = pca.explained_variance_ratio_.tolist()

    return result, explained_variance

def predict_by_layer(text: str, token_index: int, top_k: int=5) -> list[dict]:
    """
    Logit lens: for each layer, project resid_post[0, token_index, :] through ln_final + unembed,
    return top_k next-token predictions and probabilities.
    """

    _, cache = model.run_with_cache(text)
    
    predictions = []

    for layer in range(model.cfg.n_layers):
        residual = cache["resid_post", layer][0, token_index, :]  # (768,)
        # project to vocab
        logits = model.unembed(model.ln_final(residual.unsqueeze(0).unsqueeze(0)))
        probs = torch.softmax(logits[0, 0], dim=-1)

        top_probs, top_ids = torch.topk(probs, k=top_k)
        top_tokens = [{
            "token": model.tokenizer.decode(int(token_id)),
            "probability": float(probability)}
            for token_id, probability in zip(top_ids, top_probs)
        ]

        predictions.append({"layer": layer, "top_tokens": top_tokens})

    return predictions
