# Concrete Poetry

A visualization of how GPT-2 small reads E. E. Cummings' "[in Just-]". Each word in the poem is hidden behind a black bar, and as the animation plays, bars grow when the model is paying attention to that word (token, to be exact), and shrink back accordingly.

Personally, it might be interesting to see how the words/tokens that repeat in the poem, especially like the three "spring"s tend to grow together when the model encounters one, which is similar to the "duplicate token head" idea in the interpretability in 50 lines notebook we did.

## Controls

Five buttons at the bottom of the page:

- **Play**: start (or resume) the animation.
- **Pause**: freeze/stop at the current frame.
- **Row**: switch to row mode (see below) and start playing.
- **Layer**: switch to layer mode (see below) and start playing.
- **Reveal**: press and hold to remove every mask at once, so the full poem becomes readable. Release to re-mask it.

You can also **hover** over any single bar to briefly peek at the token underneath it.

## Modes

**Row** walks through the model's attention matrix one token at a time, across all twelve layers. You see the moment-by-moment story (row-by-row in the matrix) of which words the model focuses on as it reads, then layer by layer. Note that a full cycle takes a long time (about half hour) because there are a lot of tokens per layer, and there are twelve layers of them. It's currently meant for slow and observable viewing. However, we can potentially choose a specific layer that looks more interesting or worth examining later if needed, or we might want to add a slider or control that allows users to jump to a specific layer and row as needed. You can pause whenever you like or switch to layer mode for the overall view.

**Layer** compresses each layer's attention into a single frame and then moves on to the next layer. You can see how the model's overall focus shifts from layer to layer, which is more about words each layer cares about the most without stepping through every individual token. A full cycle is much shorter than the row mode, but individual token change is less noticeable.

## Label

There is a small indicator above the buttons showing which layer (and in row mode, which row and thus token) is currently driving the visualization.

## Heads

This prototype uses an average-head function (also used in our very first prototype in winter quarter) that collapses the 12 attention heads in each layer into a single attention matrix per layer.

## How to run the interface
To run the interface,

1. Open a terminal in the backend folder (from winter quarter) and run `python app.py`.
2. Open a new terminal in the concrete-attention folder and run `python -m http.server 8080`.
3. Navigate to `http://localhost:8080` in your web browser.