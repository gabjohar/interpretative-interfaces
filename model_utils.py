print("Importing TransformerLens...")
from transformer_lens import HookedTransformer

print("Loading model...")
model = HookedTransformer.from_pretrained("gpt2-small")
print("Model ready!")


def tokenize(text: str) -> list[dict]:
    """Returns list of {index, token_str, token_id} for each token."""
    tokens = model.to_tokens(text)          # tensor of token IDs
    str_tokens = model.to_str_tokens(text)  # list of strings
    return [
        {"index": i, "token_str": s, "token_id": int(tokens[0, i])}
        for i, s in enumerate(str_tokens)
    ]
