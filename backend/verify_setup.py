from transformer_lens import HookedTransformer
model = HookedTransformer.from_pretrained("gpt2-small")
logits, cache = model.run_with_cache("Hello world")
print(logits.shape)
print(cache["resid_post", 0].shape) 
