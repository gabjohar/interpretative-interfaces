print("Importing TransformerLens...")
from transformer_lens import HookedTransformer
import torch

print("Loading model...")
model = HookedTransformer.from_pretrained("gpt2-small")
print("Model ready!")

def accumulated_residual_change(text: str) -> list[float]:
    """
    Measures accumulated residual stream change per layer.
    Returns 12 values for GPT-2 small.
    """

    with torch.no_grad():
        _, cache = model.run_with_cache(text)

        accumulated_residual, _ = cache.accumulated_resid(
            layer=-1,
            incl_mid=True,
            pos_slice=-1,
            return_labels=True
        )

        # residual changes
        residual_diffs = accumulated_residual[1:] - accumulated_residual[:-1]

        # norm of each change
        magnitudes = torch.norm(residual_diffs, dim=-1)[:, 0]

        # combine attn + mlp into one value per layer
        combined = []

        for i in range(0, len(magnitudes), 2):
            layer_total = magnitudes[i] + magnitudes[i + 1]
            combined.append(float(layer_total))

    return combined