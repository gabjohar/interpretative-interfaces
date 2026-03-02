from transformer_lens import HookedTransformer, utils
import torch
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

model = HookedTransformer.from_pretrained("gpt2-small")

def get_token_trajectory(text: str, token_index: int) -> list[dict]:
  """Returns the residual stream vector for one token at each layer."""
  _, cache = model.run_with_cache(text)
  n_layers = model.cfg.n_layers # 12 for GPT-2 small
  trajectory = []
  for layer in range(n_layers):
    embedding = cache["resid_post", layer][0, token_index, :]
    trajectory.append({"layer": layer,
    "embedding": embedding.tolist() # convert tensor to list
    })
  return trajectory

def get_tokens(text: str) ->list[dict]:
    tokens = model.to_str_tokens(text)
    return [{"index": i, "token_str" : t} for i, t in enumerate(tokens)]

def get_attention_patterns(text: str, layer: int, head: int |None) ->dict:
    tokens = model.to_tokens(text)
    tokens_strs = model.to_str_tokens(text)

    with torch.no_grad():
        _, cache = model.run_with_cache(tokens,names_filter=lambda name: "pattern" in name)
    
    attn_key = f"blocks.{layer}.attn.hook_pattern"
    attn_pattern = cache[attn_key][0]

    if head is not None:
        attention_data = attn_pattern[head].tolist()
    else:
        attention_data = attn_pattern.tolist()
    
    return {
            "tokens": tokens_strs,
            "attention": attention_data,
            "n_heads": model.cfg.n_heads,
            "n_layers": model.cfg.n_layers,
            }

