const N_LAYERS = 12;  // GPT-2 small has 12 layers

let currentText = '';
let currentTokens = [];
let selectedIndices = new Set();

let currentPredictData = null;
let currentPredictLayer = 11;  // Default
let currentPredictTokenIndex = null;

// =======================================================
//                    Fetch functions                    =
// =======================================================

async function tokenize(text) {
    try {
        const res = await fetch('http://localhost:5001/tokenize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!res.ok) {
            throw new Error("Tokenize request failed")
        }

        return res.json();

    } catch {
        // fallback to example JSON when server is offline
        const res = await fetch('../backend/examples/example1_tokenize.json');

        return res.json();
    }
}


async function trace(text, tokenIndices) {
    try {
        const res = await fetch('http://localhost:5001/trace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, token_indices: tokenIndices })
        });

        if (!res.ok) {
            throw new Error("Trace request failed")
        }
        
        return res.json();
    
    } catch {
        // fallback to example JSON when server is offline
        const res = await fetch('../backend/examples/example1_trace.json');

        return res.json();
    }
}


async function attention(text, layer, head = null) {
    try {
        const body = head !== null ? { text, layer, head } : { text, layer };
        const res = await fetch('http://localhost:5001/attention', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error("Attention request failed")
        }
        
        return res.json();
    
    } catch {
        // fallback to example JSON when server is offline
        const res = await fetch('../backend/examples/example1_attention.json');

        return res.json();
    }
}


async function predict(text, tokenIndex) {
    try {
        const res = await fetch('http://localhost:5001/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, token_index: tokenIndex })
        });

        if (!res.ok) {
            throw new Error("Predict request failed")
        }
        
        return res.json();
    
    } catch {
        // fallback to example JSON when server is offline
        const res = await fetch('../backend/examples/example1_predict.json');

        return res.json();
    }
}

// =======================================================
//                  Trajectory functions                 = 
// =======================================================

function normalizeCoords(trajectories) {
    const allX = Object.values(trajectories).flat().map(p => p.x);
    const allY = Object.values(trajectories).flat().map(p => p.y);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const norm = {};

    for (const [idx, points] of Object.entries(trajectories)) {
        norm[idx] = points.map(p => ({
            layer: p.layer,
            x: maxX === minX ? 0.5 : (p.x - minX) / (maxX - minX),
            y: maxY === minY ? 0.5 : (p.y - minY) / (maxY - minY)
        }));
    }
    
    return norm;
}

// =======================================================
//                  Attention functions                  =
// =======================================================

function averageHeads(allHeadsMatrix) {
    // allHeadsMatrix: [12 heads][n][n]
    return allHeadsMatrix[0].map((row, i) =>
        row.map((_, j) => 
            allHeadsMatrix.reduce((sum, head) => sum + head[i][j], 0) / allHeadsMatrix.length
        )
    );
}

// =======================================================
//                     Event handlers                    =
// =======================================================

async function handleTokenizeClick() {
    currentText = document.getElementById("text-input").value;

    const data = await tokenize(currentText);
    currentTokens = data.tokens;

    renderTokenChips(currentTokens);
    showScreen("screen-tokens");
}


async function handleTraceClick() {
    if (selectedIndices.size === 0) {
        return;
    }

    const data = await trace(currentText, [...selectedIndices]);

    renderTrajectory(data);
    showScreen("screen-trace");
}


async function handleSingleHeadAttention(currentLayer, selectedHead) {

    const data = await attention(currentText, currentLayer, selectedHead);

    renderHeatmap(currentLayer, data.attention_matrix);
    showScreen("screen-attention");
}


async function handleAllLayersAttention() {
    const matrices = [];

    for (let layer = 0; layer < N_LAYERS; layer++) {
        const data = await attention(currentText, layer);
        matrices.push(data);
    }
    
    matrices.forEach((data, layer) => {
        const averageMatrix = averageHeads(data.attention_matrix);
        renderHeatmap(layer, averageMatrix);
    });

    showScreen("screen-attention");
}


async function handlePredictClick() {
    if (selectedIndices.size === 0) {
        return;
    }
    
    // Logit lens predicts for a single token, so grab the first one selected
    const tokenIndex = Array.from(selectedIndices)[0];
    const data = await predict(currentText, tokenIndex);
    
    renderPredict(data);
    showScreen("screen-predict");
}

// =======================================================
//                     Render functions                  =
// =======================================================

function renderTokenChips(tokens) {
    const container = document.getElementById("token-chip-container");
    const traceButton = document.getElementById("trace-button");
    const predictButton = document.getElementById("predict-button");

    container.innerHTML = "";
    selectedIndices.clear();
    traceButton.style.display = "none";
    predictButton.style.display = "none";

    tokens.forEach((token) => {
        const chip = document.createElement("span");
        chip.className = "token-chip";
        chip.textContent = token.token_str;

        if (token.token_str === "<|endoftext|>") {
            chip.classList.add("token-bos");
        } else {
            chip.addEventListener("click", function () {
                if (selectedIndices.has(token.index)) {
                    selectedIndices.delete(token.index);
                    chip.classList.remove("selected");

                } else if (selectedIndices.size < 3) {  // max 3 selected at once
                    selectedIndices.add(token.index);
                    chip.classList.add("selected");
                }

                // Show buttons
                if (selectedIndices.size > 0) {
                    traceButton.style.display = "inline-block";
                    predictButton.style.display = "inline-block";
                } else {
                    traceButton.style.display = "none";
                    predictButton.style.display = "none";
                }
            });
        }
        container.appendChild(chip);
    });
}


function renderTrajectory(data) {
    const trajectories = normalizeCoords(data.trajectories);
    const tokenColors = {
        0: "var(--color-token-1)",
        1: "var(--color-token-2)",
        2: "var(--color-token-3)"
    };

    const selectedTokenIndices = data.tokens.map(token => token.index);

    for (let layer = 0; layer < N_LAYERS; layer++) {
        const positions = [];

        selectedTokenIndices.forEach((tokenIdx, colorIdx) => {
            const point = trajectories[String(tokenIdx)].find(p => p.layer === layer);

            if (point) {
                positions.push({
                    tokenIdx: colorIdx,
                    x: point.x,
                    y: point.y,
                    // opacity increases with layer number
                    opacity: (layer + 1) / N_LAYERS
                });
            }
        });
        renderDots(layer, positions, tokenColors);
    }
}


function renderPredict(data) {
    currentPredictData = data;
    currentPredictTokenIndex = data.token_index;
    renderPredictUI();
}


function renderPredictUI() {
    if (!currentPredictData) {
        return;
    }

    // Draw bars
    const layerData = currentPredictData.predictions_by_layer.find(l => l.layer === currentPredictLayer);
    document.getElementById("predict-container").innerHTML = layerData ? 
        layerData.top_tokens.map(t => {
            const percent = (t.probability * 100).toFixed(2);
            return `
                <div class="prediction-item">
                    <div class="prediction-token-chip">${t.token}</div>
                    <div class="bar-track"><div class="bar-fill" style="width: ${percent}%;"></div></div>
                    <div class="bar-label">${percent}%</div>
                </div>`;
        }).join('') : "";

    // Draw interactive token selection
    const tokensRow = document.getElementById("predict-tokens-row");
    tokensRow.innerHTML = "";
    currentTokens.forEach(t => {
        const isBos = t.token_str === "<|endoftext|>";
        const chip = document.createElement("span");
        
        chip.className = `token-chip ${isBos ? "token-bos" : ""} ${t.index === currentPredictTokenIndex ? "selected" : ""}`.trim();
        chip.textContent = t.token_str;
        
        if (!isBos) {
            chip.addEventListener("click", async () => {
                currentPredictData = await predict(currentText, t.index);
                currentPredictTokenIndex = t.index;
                renderPredictUI();
            });
        }

        tokensRow.appendChild(chip);
    });

    // Draw interactive layer chips
    const layerChips = document.getElementById("predict-layer-chips");
    layerChips.innerHTML = "";

    for (let i = 0; i < N_LAYERS; i++) {
        const chip = document.createElement("span");
        chip.className = `layer-chip ${i === currentPredictLayer ? "selected" : ""}`.trim();
        chip.textContent = i;
        
        chip.addEventListener("click", () => {
            currentPredictLayer = i;
            renderPredictUI();
        });

        layerChips.appendChild(chip);
    }
}


function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s =>
        s.classList.remove('active')
    );

    document.getElementById(id).classList.add('active');

    // Show planes on Trace or Attention
    const sharedPlanes = document.getElementById("shared-planes-container");
    if (id === "screen-trace" || id === "screen-attention") {
        sharedPlanes.style.display = "block";
    } else {
        sharedPlanes.style.display = "none";
    }
}

// =======================================================
//                   Plane Interaction                   =
// =======================================================

function setupPlaneInteractions() {
    const planesContainer = document.getElementById("shared-planes-container");
    const planes = document.querySelectorAll(".plane");

    if (!planesContainer) {
        return;
    }

    // Double click: toggles the flat 2D collapse view
    planesContainer.addEventListener("dblclick", () => {
        if (!planesContainer.classList.contains("has-focus")) {
            planesContainer.classList.toggle("face-user");
        }
    });

    // Single click: selects a specific plane
    planes.forEach(plane => {
        plane.addEventListener("click", (event) => {
            if (planesContainer.classList.contains("face-user")) {
                return;
            }
            
            event.stopPropagation(); 

            if (plane.classList.contains("focused")) {
                plane.classList.remove("focused");
                planesContainer.classList.remove("has-focus");
            } else {
                planes.forEach(p => p.classList.remove("focused"));
                plane.classList.add("focused");
                planesContainer.classList.add("has-focus");
            }
        });
    });

    // Click background: clears the focus
    planesContainer.addEventListener("click", () => {
        if (planesContainer.classList.contains("has-focus")) {
            planes.forEach(p => p.classList.remove("focused"));
            planesContainer.classList.remove("has-focus");
        }
    });
}

setupPlaneInteractions();
