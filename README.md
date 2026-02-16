# Interpretative Interfaces

A Python backend for exploring GPT-2's internal representations through mechanistic interpretability. Built with [TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) and Flask, this project provides API endpoints that let a visual frontend inspect how a language model processes text — token by token, layer by layer.

## What This Does

This backend powers an interactive visualization tool that lets users:

- **Tokenize** text and see how GPT-2 breaks it into subword tokens
- **Trace** token embeddings through all 12 layers of GPT-2, reduced to 2D via PCA
- **Inspect attention patterns** — which tokens attend to which, at any layer and head
- **Apply the logit lens** — see what the model would predict at each intermediate layer, revealing how meaning builds up through the network

## Project Structure

```
interpretative-interfaces/
├── app.py                             # Flask server with all API endpoints
├── model_utils.py                     # Core functions: tokenize, trace, attention, predict
├── requirements.txt                   # Pinned Python dependencies
├── notebooks/
│   ├── tutorial-walkthrough.ipynb     # Annotated TransformerLens tutorial
│   ├── tokenization.ipynb             # Tokenization experiments
│   ├── embedding_extraction.ipynb     # Layer-by-layer embedding extraction
│   └── dimensionality_reduction.ipynb # PCA/UMAP reduction + trajectory plots
├── examples/                          # Saved JSON responses for frontend mock data
│   ├── example1_tokenize.json
│   ├── example1_trace.json
│   ├── example1_attention.json
│   ├── example1_predict.json
│   └── ...
└── API.md                             # Full endpoint documentation
```

## Setup

### Prerequisites

- Python 3.10+
- ~2 GB disk space for the GPT-2 model (downloaded on first run)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/interpretative-interfaces.git
cd interpretative-interfaces

python -m venv venv
source venv/bin/activate   # on Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### Run the Server

```bash
python app.py
```

The server starts on `http://localhost:5000`. The first run will download GPT-2 small (~500 MB).

## API Endpoints

### `POST /tokenize`

Break text into GPT-2 tokens.

```bash
curl -X POST http://localhost:5000/tokenize \
  -H "Content-Type: application/json" \
  -d '{"text": "The cat sat on the mat"}'
```

### `POST /trace`

Get 2D trajectory of selected tokens through all 12 layers (PCA-reduced).

```bash
curl -X POST http://localhost:5000/trace \
  -H "Content-Type: application/json" \
  -d '{"text": "The cat sat on the mat", "token_indices": [1, 4]}'
```

### `POST /attention`

Get the attention matrix for a specific layer and head.

```bash
curl -X POST http://localhost:5000/attention \
  -H "Content-Type: application/json" \
  -d '{"text": "The cat sat on the mat", "layer": 5, "head": 3}'
```

### `POST /predict`

Apply the logit lens: see top-5 predicted tokens at each layer for a given position.

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "The cat sat on the mat", "token_index": 5}'
```

See [API.md](API.md) for full request/response schemas.

## Tech Stack

- **[TransformerLens](https://github.com/TransformerLensOrg/TransformerLens)** — hooks into GPT-2 internals (activations, attention patterns, residual stream)
- **[Flask](https://flask.palletsprojects.com/)** — lightweight API server
- **[scikit-learn](https://scikit-learn.org/)** — PCA for dimensionality reduction
- **[NumPy](https://numpy.org/)** — tensor/array manipulation

## Resources

- [How-to Transformer Mechanistic Interpretability in 50 Lines](https://www.alignmentforum.org/posts/hnzHrdqn3nrjveayv/how-to-transformer-mechanistic-interpretability-in-50-lines)
- [Interpreting GPT: The Logit Lens](https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru/interpreting-gpt-the-logit-lens)
- [TransformerLens Getting Started](https://transformerlensorg.github.io/TransformerLens/content/getting_started_mech_interp.html)

## License

MIT
