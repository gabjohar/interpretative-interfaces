# Steven's Week 7 Notes

## Findings
- GPT-2 automatically prepends `<|endoftext|>` token, so the activation shapes include that extra token. This means:
    - `print(logits.shape)` should be `(1, 3, 50257)`
    - `print(cache["resid_post", 0].shape)` should be `(1, 3, 768)` 
- Several tokens start with a space, and such leading spaces create different tokens (e.g. `' can'` and `'can'`) 
- Long and/or rare words are split into multiple tokens, which would change how trajectories should be interpreted since a token might not be a full word. 
- A possible mental model for thinking about layers (not an exact/accurate breakdown, just for understanding): 
    - Layers 0-3 ——> reading words 
    - Layers 4-7 ——> understanding sentence 
    - Layers 8-10 ——> deciding meaning 
    - Layer 11 ——> steering toward the final next-token prediction

## Thoughts
- PCA helps visualize how representations change and the shared PCA space makes token comparison possible
- PCA highlights directional change across layers, while UMAP emphasizes proximity.
- With only 12 layers and 3 test tokens for a short sentence, UMAP's structure seems less obvious. I further explored this with a longer sentence that contains richer semantic structure, which forms more obvious clusters.
- Both plots do not directly reveal semantic meanings but are good for showing the trace of how the model's internal representation evolves across layers.
- Prompt design and/or input matter! Richer semantic sentences might produce clearer trajectory structure and improve interpretability.

(These are based on visible patterns like jumps and clustering, and I do not really understand the underlying math.)