# API Reference

Base URL: `http://localhost:5000`

All endpoints accept `POST` requests with JSON bodies and return JSON responses. CORS is enabled for all origins.

---

## `POST /tokenize`

Break input text into GPT-2 subword tokens.

### Request

```json
{
  "text": "The cat sat on the mat"
}
```

| Field  | Type   | Required | Description          |
|--------|--------|----------|----------------------|
| `text` | string | yes      | The text to tokenize |

### Response

```json
{
  "tokens": [
    { "index": 0, "token_str": "The", "token_id": 464 },
    { "index": 1, "token_str": " cat", "token_id": 3797 },
    { "index": 2, "token_str": " sat", "token_id": 3332 },
    { "index": 3, "token_str": " on", "token_id": 319 },
    { "index": 4, "token_str": " the", "token_id": 262 },
    { "index": 5, "token_str": " mat", "token_id": 2603 }
  ]
}
```

| Field              | Type   | Description                                      |
|--------------------|--------|--------------------------------------------------|
| `tokens`           | array  | Ordered list of token objects                    |
| `tokens[].index`   | int    | Position in the sequence (0-indexed)             |
| `tokens[].token_str` | string | The string representation of the token (may include leading spaces) |
| `tokens[].token_id`  | int    | The token's ID in GPT-2's vocabulary (0–50256)  |

### Notes

- GPT-2 uses byte-pair encoding (BPE). Words may be split into subword tokens (e.g. `"understanding"` → `[" understanding"]` or `[" under", "standing"]`).
- Leading spaces are part of the token string — this is normal BPE behavior.
- GPT-2's vocabulary size is 50,257 tokens.

---

## `POST /trace`

Get the 2D trajectory of selected tokens through all 12 layers of GPT-2. Embeddings at each layer are extracted from the residual stream and projected to 2D using PCA.

### Request

```json
{
  "text": "The cat sat on the mat",
  "token_indices": [1, 4]
}
```

| Field            | Type     | Required | Description                              |
|------------------|----------|----------|------------------------------------------|
| `text`           | string   | yes      | The input text                           |
| `token_indices`  | int[]    | yes      | Which token positions to trace (0-indexed, from `/tokenize` output) |

### Response

```json
{
  "tokens": [
    { "index": 1, "token_str": " cat" },
    { "index": 4, "token_str": " the" }
  ],
  "trajectories": {
    "1": [
      { "layer": 0, "x": -2.34, "y": 1.56 },
      { "layer": 1, "x": -1.89, "y": 2.01 },
      { "layer": 2, "x": -1.12, "y": 2.45 },
      { "layer": 3, "x": -0.78, "y": 2.89 },
      { "layer": 4, "x": -0.34, "y": 3.12 },
      { "layer": 5, "x": 0.12, "y": 3.45 },
      { "layer": 6, "x": 0.56, "y": 3.67 },
      { "layer": 7, "x": 0.89, "y": 3.89 },
      { "layer": 8, "x": 1.23, "y": 4.01 },
      { "layer": 9, "x": 1.56, "y": 4.12 },
      { "layer": 10, "x": 1.78, "y": 4.23 },
      { "layer": 11, "x": 1.92, "y": 4.34 }
    ],
    "4": [
      { "layer": 0, "x": 0.45, "y": -0.78 },
      { "layer": 1, "x": 0.67, "y": -0.56 },
      { "layer": 2, "x": 0.89, "y": -0.23 },
      { "layer": 3, "x": 1.12, "y": 0.12 },
      { "layer": 4, "x": 1.34, "y": 0.45 },
      { "layer": 5, "x": 1.56, "y": 0.78 },
      { "layer": 6, "x": 1.78, "y": 1.12 },
      { "layer": 7, "x": 1.89, "y": 1.45 },
      { "layer": 8, "x": 1.92, "y": 1.78 },
      { "layer": 9, "x": 1.95, "y": 2.01 },
      { "layer": 10, "x": 1.97, "y": 2.12 },
      { "layer": 11, "x": 1.98, "y": 2.23 }
    ]
  },
  "pca_explained_variance": [0.34, 0.21]
}
```

| Field                      | Type          | Description                                         |
|----------------------------|---------------|-----------------------------------------------------|
| `tokens`                   | array         | The traced tokens with index and string             |
| `trajectories`             | object        | Keyed by token index (as string). Each value is an array of 12 layer points |
| `trajectories[idx][].layer`| int           | Layer number (0–11)                                 |
| `trajectories[idx][].x`    | float         | PCA component 1 coordinate                         |
| `trajectories[idx][].y`    | float         | PCA component 2 coordinate                         |
| `pca_explained_variance`   | float[2]      | Proportion of variance captured by each PCA component (sums to < 1.0) |

### Notes

- All requested tokens are reduced in a **shared PCA space**, so their positions are directly comparable.
- Each trajectory has exactly 12 points (one per layer), representing the token's residual stream embedding after that layer's transformations.
- `pca_explained_variance` tells you how much information the 2D projection retains. Values like `[0.34, 0.21]` mean 55% of the variance is captured — typical for high-dimensional neural network activations.
- Tokens that start far apart and converge may be developing similar contextual meaning. Tokens that diverge are being pushed into different semantic roles by the model.

---

## `POST /attention`

Get the attention pattern matrix for a specific layer and attention head. Shows how much each token attends to every other token.

### Request

```json
{
  "text": "The cat sat on the mat",
  "layer": 5,
  "head": 3
}
```

| Field   | Type   | Required | Description                        |
|---------|--------|----------|------------------------------------|
| `text`  | string | yes      | The input text                     |
| `layer` | int    | yes      | Layer index (0–11)                 |
| `head`  | int    | yes      | Attention head index (0–11)        |

### Response

```json
{
  "tokens": ["The", " cat", " sat", " on", " the", " mat"],
  "attention_matrix": [
    [1.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    [0.15, 0.45, 0.20, 0.08, 0.07, 0.05],
    [0.10, 0.25, 0.35, 0.12, 0.10, 0.08],
    [0.08, 0.12, 0.18, 0.42, 0.12, 0.08],
    [0.05, 0.08, 0.10, 0.15, 0.52, 0.10],
    [0.03, 0.30, 0.05, 0.07, 0.15, 0.40]
  ]
}
```

| Field                       | Type       | Description                                           |
|-----------------------------|------------|-------------------------------------------------------|
| `tokens`                    | string[]   | Token strings in sequence order                       |
| `attention_matrix`          | float[][]  | Square matrix of shape `[n_tokens, n_tokens]`         |
| `attention_matrix[i][j]`    | float      | How much token `i` attends to token `j` (0.0–1.0)    |

### Notes

- Each **row** sums to ~1.0 (softmax probabilities). Row `i` shows the attention distribution for token `i` — which earlier tokens it's "looking at".
- GPT-2 uses **causal attention**: token `i` can only attend to tokens `0..i` (not future tokens). The upper-right triangle of the matrix is always 0.
- GPT-2 small has **12 layers x 12 heads = 144** distinct attention patterns per input.
- Common patterns to look for:
  - **Previous token heads**: strong diagonal (each token attends to the one before it)
  - **Induction heads**: token attends to the token that followed a similar token earlier in the sequence
  - **Position heads**: strong column on token 0 (everything attends to the first token)

---

## `POST /predict`

Apply the logit lens: project the residual stream at each layer through the unembedding matrix to see what the model would predict at that intermediate stage.

### Request

```json
{
  "text": "The cat sat on the mat",
  "token_index": 5
}
```

| Field          | Type   | Required | Description                                              |
|----------------|--------|----------|----------------------------------------------------------|
| `text`         | string | yes      | The input text                                           |
| `token_index`  | int    | yes      | Which token position to inspect predictions for (0-indexed) |

### Response

```json
{
  "predictions_by_layer": [
    {
      "layer": 0,
      "top_tokens": [
        { "token": " the", "probability": 0.08 },
        { "token": " a", "probability": 0.05 },
        { "token": ",", "probability": 0.04 },
        { "token": " and", "probability": 0.03 },
        { "token": " of", "probability": 0.02 }
      ]
    },
    {
      "layer": 1,
      "top_tokens": [
        { "token": " the", "probability": 0.10 },
        { "token": " a", "probability": 0.06 },
        { "token": " his", "probability": 0.04 },
        { "token": ",", "probability": 0.03 },
        { "token": " her", "probability": 0.03 }
      ]
    },
    {
      "layer": 11,
      "top_tokens": [
        { "token": ".", "probability": 0.35 },
        { "token": ",", "probability": 0.15 },
        { "token": " and", "probability": 0.08 },
        { "token": "\n", "probability": 0.06 },
        { "token": " with", "probability": 0.04 }
      ]
    }
  ]
}
```

| Field                                        | Type     | Description                                            |
|----------------------------------------------|----------|--------------------------------------------------------|
| `predictions_by_layer`                       | array    | One entry per layer (12 total)                         |
| `predictions_by_layer[].layer`               | int      | Layer number (0–11)                                    |
| `predictions_by_layer[].top_tokens`          | array    | Top 5 predicted next tokens at this layer              |
| `predictions_by_layer[].top_tokens[].token`  | string   | The predicted token string                             |
| `predictions_by_layer[].top_tokens[].probability` | float | Probability after softmax (0.0–1.0)                   |

### Notes

- The logit lens reveals how the model's "guess" evolves through its layers. Early layers tend to predict generic, high-frequency tokens. Later layers converge on the contextually correct prediction.
- `token_index` refers to the position in the sequence. The prediction at position `i` is the model's guess for what comes **after** token `i`.
- Probabilities within each layer's `top_tokens` do **not** sum to 1.0 — they're only the top 5 out of 50,257 possible tokens.
- This technique was introduced in [Interpreting GPT: The Logit Lens](https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru/interpreting-gpt-the-logit-lens).

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Description of what went wrong"
}
```

| HTTP Status | Meaning                                                    |
|-------------|------------------------------------------------------------|
| `400`       | Bad request — missing or invalid fields in the request body |
| `500`       | Server error — model inference failed                       |

Common errors:

| Error message                          | Cause                                        |
|----------------------------------------|----------------------------------------------|
| `"text" field is required`             | Missing `text` in request body               |
| `"token_indices" field is required`    | Missing `token_indices` in `/trace` request  |
| `token_index N out of range (0–M)`    | Requested a token index beyond the sequence  |
| `layer must be between 0 and 11`      | Invalid layer number                         |
| `head must be between 0 and 11`       | Invalid attention head number                |

---

## Model Details

| Property        | Value       |
|-----------------|-------------|
| Model           | GPT-2 Small |
| Parameters      | 124M        |
| Vocabulary size | 50,257      |
| Embedding dim   | 768         |
| Layers          | 12          |
| Attention heads | 12          |
| Context length  | 1,024 tokens |
