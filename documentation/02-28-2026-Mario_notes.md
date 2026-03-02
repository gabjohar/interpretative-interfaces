# Flask and the backend

We have set up the backend using Flask. The backend serves a cruial role in web application by handling requests, processing data, and serving content to clients. 

---
## Backend structure
for Task 1.6 I set up the structure for the backend, where we keep all of the TransformerLens/Model logic in `models_utils.py` and let Flask handle HTTP concerns, in `app.py`. is the two file separation structure that I've worked on for the week 2 tasks. 

 `models_utils.py functions`: 

 * get_token_trajectory: takes in a text(string prompt) and index for which token you want to see the embedding across each layer of the transformer (int), and returns a list of residual stream vector for the token at every layer.
   
 * get_tokens: takes in a prompt(string) and returns a list of each corresponding token that the llm interpeted using transformer library method to_str_tokens, and their index.

 * get_attention_patterns: takes in a json formatted input where we have the prompt, layer and head of the desired attension pattern we want to see. returns a dictionary  that has the readable token string and attention matrix, and model config into so the frontend knows the shape the model its working with. what it does is run a forward pass through the model with the prompt and intercepts the attenion softmax outputs at the specified layers with the transformer lens caching system.


---
## curl commands and running the server
the curl command is a terminal tool for transferring data from or to a server using URLS: it supports HTTPS protocol which is what we will be using which is the -X flag. since We will be sending information about the prompt and  

We start the server using `flask --app __appName__ run`. when first running the server I had trouble understanding the appname but its just the name of the file.

## completed tasks
completed tasks 1.6, 2.2, and 2.4
