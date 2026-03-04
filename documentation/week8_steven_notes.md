# Steven's Week 8 Notes

## What I did

- Completed Task 2.1 (`/trace`)
- Completed Task 2.3 (`/predict`)
- Documented API response examples in `api_test_examples_Steven.md` 
- Added optional parameters such as:
    - `cache` in `get_token_trajectory` 
    - `top_k` in `predict_by_layer`

    These were added as attempts to allow potential optimization and future flexibility. 
- Attempted to integrate different versions of `app.py` and `model_utils.py` into a more consistent backend.

## Findings & Thoughts/Considerations

- JSON objects do not guarantee key order, so the response fields may appear reordered compared to the order in the original code. This does not affect correctness since the frontend should rely on keys rather than ordering.
- Token indexing should be consistent (e.g. whether to include the default `<|endoftext|>` token).
- Early-layer predictions can include lexical fragments like "`rices`" or "`hematically`". This could reflect how the model operates on tokens rather than full words.
- Values such as PCA coordinates and token probabilities may contain many decimal places. We might want to consider the pros and cons of rounding (e.g. to 2 decimals). Potential tradeoffs include:
    - Readability vs precision (i.e. loss of information)
    - Cleaner UI vs harder debugging
    - Smaller response size vs irreversibility (rounding in the backend removes the original precision)
- Possible optimizations (still exploring):
    - Shared activation caches to prevent repeated forward passes.

### Visualization considerations for PCA/UMAP:
As mentioned during last week's meeting, since each point in the plot of PCA/UMAP represents the token embedding at a specific layer, a single plot itself already encodes the overall layer movement. I therefore have been thinking about the possible 3D visualization where the third axis allows our panel-like visualization.

I would say the concept of time ends up being somehow interesting. That is, rather than an additional PCA/UMAP dimension, we can use layer index (0-11) as the z-axis. Conceptually, the layout would look a lot like Polly's design last week, but instead of turning pages discretely, we will be entering a sort of "layer tunnel" (a stack of layers) moving into and out of a page along the z-axis continuously, and the path on the plot might look like the following:

    token path
    o-o-o-O-o-o-o
          ^
        current layer

where the remaining points stay visible but faded into the background.

For visual aid/inspiration, see [this link](https://www.youtube.com/watch?v=GNsD7b2xbNk)
