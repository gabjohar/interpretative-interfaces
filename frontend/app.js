const N_LAYERS = 12;  // GPT-2 small has 12 layers

let currentText = '';
let currentTokens = [];
let selectedIndices = new Set();

let currentPredictData = null;
let currentPredictLayer = 11;  // Default
let currentPredictTokenIndex = null;
let currentTraceData = null;
let currentAttnLayer = 0;
let currentAttnHead = 0;

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
            y: maxY === minY ? 0.5 : (p.y - minY) / (maxY - minY),
            rawX: p.x,
            rawY: p.y
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
    selectedIndices.clear();

    renderTokenChips(currentTokens);
    showScreen("screen-tokens");
}


async function handleTraceClick() {
    if (selectedIndices.size === 0) {
        return;
    }

    currentTraceData = await trace(currentText, [...selectedIndices]);

    renderTrajectory(currentTraceData);
    showScreen("screen-trace");
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


async function handleMultiLayersAttention() {
    document.getElementById("single-heatmap-view").style.display = "none";
    document.getElementById("shared-planes-container").style.display = "block";
    await handleAllLayersAttention();
}


async function handleSingleHeadAttention() {
    document.getElementById("shared-planes-container").style.display = "none";
    document.getElementById("single-heatmap-view").style.display = "block";
    await renderSingleHeadUI();
}


async function handleSinglePlaneClick(layer) {
    currentPredictLayer = layer;
    togglePlaneView(true);
    
    const tokenIndex = Array.from(selectedIndices)[0];
    if (currentPredictTokenIndex !== tokenIndex) {
        currentPredictData = await predict(currentText, tokenIndex);
        currentPredictTokenIndex = tokenIndex;
    }
    renderSinglePlaneUI();
}

const handleClosePlaneClick = () => togglePlaneView(false);


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

function renderTokenChips(tokens, containerId = "token-chip-container") {
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    const traceButton = document.getElementById("trace-button");
    const predictButton = document.getElementById("predict-button");

    container.innerHTML = "";

    tokens.forEach((token) => {
        const chip = document.createElement("span");
        chip.className = "token-chip";
        chip.textContent = token.token_str;
        chip.dataset.index = token.index;

        if (token.token_str === "<|endoftext|>") {
            chip.classList.add("token-bos");
        } else {

            if (selectedIndices.has(token.index)) {
                chip.classList.add("selected");
            }

            chip.addEventListener("click", async function () {
                if (selectedIndices.has(token.index)) {
                    selectedIndices.delete(token.index);

                } else if (selectedIndices.size < 3) {  // max 3 selected at once
                    selectedIndices.add(token.index);
                }

                syncTokenSelectionUI();

                const isTraceScreen = document.getElementById("screen-trace").classList.contains("active");

                if (isTraceScreen) {
                    if (selectedIndices.size > 0) {
                        const data = await trace(currentText, [...selectedIndices]);
                        currentTraceData = data;
                        renderTrajectory(data);
                    } else {
                        // Clear all dots if everything is deselected
                        for (let layer = 0; layer < N_LAYERS; layer++) {
                            renderDots(layer, [], {});
                        }
                    }
                } else {
                    // Show buttons
                    const display = selectedIndices.size > 0 ? "block" : "none";
                    traceButton.style.display = display;
                    predictButton.style.display = display;
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

    const layerData = currentPredictData.predictions_by_layer.find(l => l.layer === currentPredictLayer);
    const HTML = layerData ? layerData.top_tokens.map(t => {
        const percent = (t.probability * 100).toFixed(2);
        return `
            <div class="prediction-item">
                <div class="prediction-token-chip">${t.token}</div>
                <div class="bar-track"><div class="bar-fill" style="width: ${percent}%;"></div></div>
                <div class="bar-label">${percent}%</div>
            </div>`;
    }).join('') : "";

    document.getElementById("predict-container").innerHTML = HTML;
    document.getElementById("single-plane-predict-container").innerHTML = HTML;

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


function renderSinglePlaneUI() {
    document.getElementById("single-plane-layer-chips").innerHTML = Array.from({length: N_LAYERS}, (_, i) => 
        `<span class="layer-chip ${i === currentPredictLayer ? "selected" : ""}" onclick="currentPredictLayer=${i}; renderSinglePlaneUI()">${i}</span>`
    ).join('');

    document.getElementById("single-plane-tokens-row").innerHTML = Array.from(selectedIndices).map(tokenIdx => 
        `<span class="token-chip ${tokenIdx === currentPredictTokenIndex ? 'selected' : ''}" 
            onclick="predict(currentText, ${tokenIdx}).then(data => { currentPredictData = data; currentPredictTokenIndex = ${tokenIdx}; renderSinglePlaneUI(); })">
            ${currentTokens.find(t=>t.index===tokenIdx).token_str}
        </span>`
    ).join('');

    renderPredictUI();

    const container = document.getElementById("single-plane-dots-container");

    if (!container) {
        return;
    }
    
    container.innerHTML = "";

    const tokenIdx = currentPredictTokenIndex;
    
    if (currentTraceData && tokenIdx !== null) {

        const points = normalizeCoords(currentTraceData.trajectories)[String(tokenIdx)];
        
        points?.forEach(point => {
            const dot = document.createElement("div");
            dot.className = "trajectory-dot"; 
            dot.style.transform = "translate(-50%, -50%)"; 
            dot.style.backgroundColor = "var(--color-black)";
            dot.style.opacity = point.layer === currentPredictLayer ? "1" : "0.2";
            dot.style.left = `${point.x * 100}%`;
            dot.style.bottom = `${point.y * 100}%`;
            dot.setAttribute("data-tooltip", `layer: ${point.layer}\nx: ${point.rawX}\ny: ${point.rawY}`);
            
            container.appendChild(dot);
        });
    }
}


async function renderSingleHeadUI() {
    document.getElementById("attention-layer-chips").innerHTML = Array.from({length: N_LAYERS}, (_, i) => 
        `<span class="layer-chip ${i === currentAttnLayer ? "selected" : ""}" onclick="currentAttnLayer=${i}; renderSingleHeadUI()">${i}</span>`
    ).join('');

    document.getElementById("attention-head-chips").innerHTML = Array.from({length: N_LAYERS}, (_, i) => 
        `<span class="layer-chip ${i === currentAttnHead ? "selected" : ""}" onclick="currentAttnHead=${i}; renderSingleHeadUI()">${i}</span>`
    ).join('');

    const data = await attention(currentText, currentAttnLayer, currentAttnHead);
    const n = data.attention_matrix.length;
    const tokens = data.tokens;
    const box = document.getElementById("single-heatmap-box");
    
    box.style.border = "none";
    box.style.width = "fit-content";
    box.style.height = "auto";
    box.style.backgroundColor = "transparent";

    box.innerHTML = `
        <div style="display: grid; grid-template-columns: max-content 450px; grid-template-rows: max-content 450px; gap: 5px;">
            <div></div> <div style="display: grid; grid-template-columns: repeat(${n}, 1fr); justify-items: center; align-items: end;">
                ${tokens.map(t => `<span style="font-family: var(--font-family); font-size: 16px; writing-mode: vertical-rl; transform: rotate(180deg); padding-bottom: 5px;">${t}</span>`).join('')}
            </div>
            
            <div style="display: grid; grid-template-rows: repeat(${n}, 1fr); align-items: center; justify-items: end; padding-right: 5px;">
                ${tokens.map(t => `<span style="font-family: var(--font-family); font-size: 16px;">${t}</span>`).join('')}
            </div>
            
            <div class="heatmap-grid" style="border: 4px solid var(--color-black); background-color: var(--color-white); grid-template-columns: repeat(${n}, 1fr); grid-template-rows: repeat(${n}, 1fr);">
                ${data.attention_matrix.flatMap((row, i) => 
                    row.map((val, j) => `<div class="heatmap-cell" style="opacity: ${val};" title="${tokens[i]} → ${tokens[j]}\nattention: ${val.toFixed(3)}"></div>`)
                ).join('')}
            </div>
        </div>
    `;
}


// =======================================================
//                     Helper functions                  =
// =======================================================


const togglePlaneView = (showSingle) => {
    document.getElementById("single-plane-view").style.display = showSingle ? "block" : "none";
    document.getElementById("shared-planes-container").style.display = showSingle ? "none" : "block";
    document.getElementById("trace-tokens-row").style.display = showSingle ? "none" : "flex";
    document.getElementById("screen-trace").style.display = showSingle ? "none" : "";
};


function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s =>
        s.classList.remove('active')
    );

    document.getElementById(id).classList.add('active');

    if (id === 'screen-input') {
        setTimeout(() => {
            const textarea = document.getElementById('text-input');
            textarea.focus(); 
            
            const textLength = textarea.value.length;
            textarea.setSelectionRange(textLength, textLength);
        }, 0);
    }

    // Show planes on Trace or Attention
    const sharedPlanes = document.getElementById("shared-planes-container");
    const traceTokens = document.getElementById("trace-tokens-row");

    if (id === "screen-trace") {
        sharedPlanes.style.display = "block";
        traceTokens.style.display = "flex";
        renderTokenChips(currentTokens, "trace-tokens-row");

    } else if (id === "screen-attention") {
        sharedPlanes.style.display = "block";
        traceTokens.style.display = "none";
    } else {
        sharedPlanes.style.display = "none";
        traceTokens.style.display = "none";
    }
}

function syncTokenSelectionUI() {
    document.querySelectorAll('.token-chip').forEach(chip => {
        const idx = parseInt(chip.dataset.index);
        if (!isNaN(idx)) {
            if (selectedIndices.has(idx)) {
                chip.classList.add("selected");
            } else {
                chip.classList.remove("selected");
            }
        }
    });
}

// =======================================================
//                   Plane Interaction                   =
// =======================================================

function setupPlaneInteractions() {
    const planes = document.querySelectorAll(".plane");

    planes.forEach((plane, index) => {
        plane.addEventListener("click", async (event) => {
            event.stopPropagation();
            
            if (document.getElementById("screen-trace").classList.contains("active")) {
                // If on Trace, open the 2D Trajectory/Prediction view
                await handleSinglePlaneClick(index);
                
            } else if (document.getElementById("screen-attention").classList.contains("active")) {
                // If on Attention, set the layer and open the 2D Heatmap view
                currentAttnLayer = index;
                await handleSingleHeadAttention();
            }
        });
    });
}

setupPlaneInteractions();

// =======================================================
//                Onboarding trail effect                =
// =======================================================

let lastX = null;
let lastY = null;
const activeSquares = new Set();
const onboardingScreen = document.getElementById('screen-onboarding');

onboardingScreen.addEventListener('mousemove', (event) => {
    
    if (lastX === null) {
        lastX = event.clientX;
        lastY = event.clientY;
    }

    // Distance moved
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    
    const maxDistance = Math.max(Math.abs(dx), Math.abs(dy));
    const steps = Math.max(1, Math.floor(maxDistance / 32));

    for (let i = 1; i <= steps; i++) {
        const pointX = lastX + (dx * (i / steps));
        const pointY = lastY + (dy * (i / steps));

        const gridX = Math.floor(pointX / 32) * 32;
        const gridY = Math.floor(pointY / 32) * 32;

        drawSquare(gridX, gridY);
    }

    lastX = event.clientX;
    lastY = event.clientY;
});

// Reset
onboardingScreen.addEventListener('mouseleave', () => {
    lastX = null; 
    lastY = null;
});


function drawSquare(x, y) {
    const id = `${x},${y}`;
    
    if (activeSquares.has(id)) {
        return;
    }

    activeSquares.add(id);

    const square = document.createElement('div');
    square.className = 'trail-square';
    square.style.left = `${x}px`;
    square.style.top = `${y}px`;
    onboardingScreen.appendChild(square);

    setTimeout(() => { 
        square.remove(); 
        activeSquares.delete(id); 
    }, 800);
}
