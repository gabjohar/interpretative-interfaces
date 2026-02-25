# Notes -- Feb 21, 2026
---
## Environment
 - setting up a virtual enviorment in python `python3 -m venv "folderName"`
 - going into that folder and installing the libraries needed (i.e TransformerLens, flask, numpy, scikit-lern, jupyter notebook.
 - creating the directories that follow the structure of the project
 - running `jupyter notebook` in terminal to open up the online application to create and run code.(you could also use colab especialy if you don't have a lot of computing resources in your computer)
---
## Transformer-mechanistic-interpretablity page
 - There are 3 Techniques that are taught in the [how to learn Tansfromer-mechanistic-interpretablity in 50 lines or less](https://www.alignmentforum.org/posts/hnzHrdqn3nrjveayv/how-to-transformer-mechanistic-interpretability-in-50-lines) the first one is learning how to find which layer in the llm is using infromation from the prompt And where its going. 
- The second Technique is working wtih the attention module in Transformer lens, and creating a visual on which Attention-head in the specific layer is relevant to some token 
- the Third Technique is using Circuitsvis attention plots to look at which head is looking at which token in the prompt (personally hard to interpret)
- The residual Steam is important info to know because its a bus that goes from layer to layer, with multiple columns of seats corresponding to to each position in the prompt. this info is used by Attention heads & MLP where they read and write back to the residual stream.

---
## Resources 
 - [Transformer Explainer](https://poloclub.github.io/transformer-explainer/)
 - [how to learn Tansfromer-mechanistic-interpretablity in 50 lines or less](htt    ps://www.alignmentforum.org/posts/hnzHrdqn3nrjveayv/how-to-transformer-mechanistic-interpretability-in-50-lines)

