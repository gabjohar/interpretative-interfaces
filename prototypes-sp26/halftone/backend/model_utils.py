print("Importing TransformerLens...")
from transformer_lens import HookedTransformer
from sklearn.decomposition import PCA
import numpy as np
import umap
import torch
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

model = None


def _ensure_model():
    global model
    if model is None:
        print("Loading model...")
        model = HookedTransformer.from_pretrained("gpt2-small")
        print("Model ready!")


def get_residual_points(text: str) -> dict:

    tokens = model.to_str_tokens(text)

    with torch.no_grad():
        _, cache = model.run_with_cache(text)

    points = []

    for layer in range(model.cfg.n_layers):
        residuals = cache["resid_post", layer][0]

        for token_index, token_str in enumerate(tokens):
            if token_str == "<|endoftext|>":
                continue

            points.append({
                "token_index": token_index,
                "token_str": token_str,
                "layer": layer,
                "embedding": residuals[token_index].tolist()
            })

    return {
        "tokens": [t for t in tokens if t != "<|endoftext|>"],
        "points": points
    }


def reduce_points_pca(residual_data: dict) -> dict:
    """Projects all token-layer residual vectors into a shared 2D PCA space."""
    embeddings = np.array([
        point["embedding"] for point in residual_data["points"]
    ])

    pca = PCA(n_components=2)
    coords = pca.fit_transform(embeddings)

    points = []

    for point, coord in zip(residual_data["points"], coords):
        points.append({
            "token_index": point["token_index"],
            "token_str": point["token_str"],
            "layer": point["layer"],
            "x": float(coord[0]),
            "y": float(coord[1])
        })

    return {
        "tokens": residual_data["tokens"],
        "points": points,
        "explained_variance": pca.explained_variance_ratio_.tolist()
    }


def reduce_points_umap(residual_data: dict) -> dict:
    """Projects all token-layer residual vectors into a shared 2D UMAP space."""
    embeddings = np.array([
        point["embedding"] for point in residual_data["points"]
    ])

    reducer = umap.UMAP(n_components=2, random_state=42, n_jobs=1)
    coords = reducer.fit_transform(embeddings)

    points = []

    for point, coord in zip(residual_data["points"], coords):
        points.append({
            "token_index": point["token_index"],
            "token_str": point["token_str"],
            "layer": point["layer"],
            "x": float(coord[0]),
            "y": float(coord[1])
        })

    return {
        "tokens": residual_data["tokens"],
        "points": points
    }


def normalize_points(data: dict) -> dict:
    xs = np.array([point["x"] for point in data["points"]])
    ys = np.array([point["y"] for point in data["points"]])

    min_x, max_x = xs.min(), xs.max()
    min_y, max_y = ys.min(), ys.max()

    range_x = max_x - min_x or 1
    range_y = max_y - min_y or 1

    points = []

    for point in data["points"]:
        points.append({
            **point,
            "x": float((point["x"] - min_x) / range_x),
            "y": float((point["y"] - min_y) / range_y)
        })

    result = {
        "tokens": data["tokens"],
        "points": points
    }

    if "explained_variance" in data:
        result["explained_variance"] = data["explained_variance"]

    return result


def add_layer_jumps(norm_data: dict) -> dict:
    lookup = {
        (point["token_index"], point["layer"]): point
        for point in norm_data["points"]
    }

    raw_jumps = []

    for point in norm_data["points"]:
        if point["layer"] == 0:
            raw_jumps.append(0.0)
            continue

        prev = lookup.get((point["token_index"], point["layer"] - 1))

        if prev is None:
            raw_jumps.append(0.0)
        else:
            dx = point["x"] - prev["x"]
            dy = point["y"] - prev["y"]
            raw_jumps.append(float(np.sqrt(dx ** 2 + dy ** 2)))

    raw_jumps = np.array(raw_jumps)
    jump_range = raw_jumps.max() - raw_jumps.min() or 1

    points = []

    for point, raw_jump in zip(norm_data["points"], raw_jumps):
        points.append({
            **point,
            "jump": float((raw_jump - raw_jumps.min()) / jump_range),
            "raw_jump": float(raw_jump)
        })

    result = {
        "tokens": norm_data["tokens"],
        "points": points
    }

    if "explained_variance" in norm_data:
        result["explained_variance"] = norm_data["explained_variance"]

    return result


def add_point_density(norm_data: dict, bandwidth: float = 0.08) -> dict:
    coords = np.array([
        [point["x"], point["y"]]
        for point in norm_data["points"]
    ])

    densities = []

    for coord in coords:
        dist_sq = np.sum((coords - coord) ** 2, axis=1)
        density = np.sum(np.exp(-dist_sq / (2 * bandwidth ** 2)))
        densities.append(density)

    densities = np.array(densities)
    density_range = densities.max() - densities.min() or 1

    points = []

    for point, density in zip(norm_data["points"], densities):
        points.append({
            **point,
            "density": float((density - densities.min()) / density_range),
            "raw_density": float(density)
        })

    return {
        "tokens": norm_data["tokens"],
        "points": points
    }


def add_pca_tangent_direction(data: dict) -> dict:
    lookup = {
        (p["token_index"], p["layer"]): p
        for p in data["points"]
    }

    points = []

    for p in data["points"]:
        token_index = p["token_index"]
        layer = p["layer"]

        prev = lookup.get((token_index, layer - 1))
        next_p = lookup.get((token_index, layer + 1))

        if prev is not None and next_p is not None:
            dx = next_p["x"] - prev["x"]
            dy = next_p["y"] - prev["y"]
        elif prev is not None:
            dx = p["x"] - prev["x"]
            dy = p["y"] - prev["y"]
        elif next_p is not None:
            dx = next_p["x"] - p["x"]
            dy = next_p["y"] - p["y"]
        else:
            dx, dy = 0.0, 0.0

        angle = float(np.arctan2(dy, dx))

        points.append({
            **p,
            "tangent_dx": float(dx),
            "tangent_dy": float(dy),
            "angle": angle,
            "angle_degrees": float(np.degrees(angle))
        })

    result = {
        "tokens": data["tokens"],
        "points": points
    }

    if "explained_variance" in data:
        result["explained_variance"] = data["explained_variance"]

    return result


def process_halftone(text: str) -> tuple[dict, dict]:

    _ensure_model()
    residual_data = get_residual_points(text)

    pca_data = reduce_points_pca(residual_data)
    umap_data = reduce_points_umap(residual_data)

    pca_norm = normalize_points(pca_data)
    umap_norm = normalize_points(umap_data)

    pca_jump = add_layer_jumps(pca_norm)
    pca_jump = add_pca_tangent_direction(pca_jump)

    umap_density = add_point_density(umap_norm)

    return pca_jump, umap_density
