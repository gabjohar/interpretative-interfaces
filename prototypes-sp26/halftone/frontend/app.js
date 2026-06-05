const POEM_TEXT = `in Just- spring when the world is mud- luscious the little lame balloonman whistles far and wee and eddieandbill come running from marbles and piracies and it's spring when the world is puddle-wonderful the queer old balloonman whistles far and wee and bettyandisbel come dancing from hop-scotch and jump-rope and it's spring and the goat-footed balloonMan whistles far and wee`;

const PCA_HALFTONE = {
    gridN: 100,
    influence: 0.018,
    minSize: 0.002,
    maxSize: 0.018,
    aspect: 0.41,
    power: 1.15,
    color: '#1f3050'
};
const UMAP_HALFTONE = {
    gridN: 120,
    influence: 0.038,
    minSize: 0.55,
    maxSize: 30,
    power: 1.05,
    color: '#7a2b1f'
};

const TAB10 = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

let currentText = '';
let currentPcaJump = null;
let currentUmapDensity = null;

// =======================================================
//                    Fetch functions                    =
// =======================================================

async function halftone(text) {
    try {
        const res = await fetch('http://localhost:5001/halftone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!res.ok) {
            throw new Error("Halftone request failed")
        }
        return res.json();

    } catch {
        const res = await fetch('examples/example_halftone.json');
        return res.json();
    }
}

// =======================================================
//                   Halftone renderers                  =
// =======================================================

function renderPcaDirectionHalftone(canvas, data, opts) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.9;

    const points = data.points;
    const gridN = opts.gridN;
    const inf2 = 2 * opts.influence * opts.influence;

    const coords = points.map(p => [p.x, p.y]);
    const jumps = points.map(p => p.jump || 0);
    const angles = points.map(p => p.angle || 0);

    ctx.fillStyle = opts.color;

    for (let i = 0; i < gridN; i++) {
        const gx = i / (gridN - 1);
        for (let j = 0; j < gridN; j++) {
            const gy = j / (gridN - 1);

            let weighted = 0, kernelSum = 0;
            let sinAvg = 0, cosAvg = 0;

            for (let k = 0; k < points.length; k++) {
                const dx = coords[k][0] - gx;
                const dy = coords[k][1] - gy;
                const kk = Math.exp(-(dx * dx + dy * dy) / inf2);
                const jw = jumps[k] * kk;

                weighted += jw;
                kernelSum += kk;
                sinAvg += Math.sin(angles[k]) * jw;
                cosAvg += Math.cos(angles[k]) * jw;
            }

            const tone = weighted / (kernelSum + 1e-8);
            const angle = Math.atan2(sinAvg, cosAvg);

            const width = (opts.minSize + Math.pow(tone, opts.power) * opts.maxSize) * w;
            const height = width * opts.aspect;
            const px = gx * w;
            const py = (1 - gy) * h;

            ctx.beginPath();
            ctx.ellipse(px, py, width / 2, height / 2, -angle, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.globalAlpha = 1;
}

function renderHalftoneField(canvas, data, opts) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.9;

    const points = data.points;
    const gridN = opts.gridN;
    const inf2 = 2 * opts.influence * opts.influence;
    const weightKey = opts.weightKey || null;

    const coords = points.map(p => [p.x, p.y]);
    const weights = weightKey ? points.map(p => p[weightKey] || 0) : null;

    const tones = new Float64Array(gridN * gridN);
    let maxTone = 0;

    for (let i = 0; i < gridN; i++) {
        const gx = i / (gridN - 1);
        for (let j = 0; j < gridN; j++) {
            const gy = j / (gridN - 1);
            let weighted = 0, kernelSum = 0;
            for (let k = 0; k < points.length; k++) {
                const dx = coords[k][0] - gx;
                const dy = coords[k][1] - gy;
                const kk = Math.exp(-(dx * dx + dy * dy) / inf2);
                if (weights) {
                    weighted += weights[k] * kk;
                    kernelSum += kk;
                } else {
                    weighted += kk;
                }
            }
            const tone = weights ? weighted / (kernelSum + 1e-8) : weighted;
            tones[i * gridN + j] = tone;
            if (tone > maxTone) maxTone = tone;
        }
    }

    const ptToPx = w / 8 / 72;
    const pt2ToPx2 = ptToPx * ptToPx;

    ctx.fillStyle = opts.color;

    for (let i = 0; i < gridN; i++) {
        for (let j = 0; j < gridN; j++) {
            const tone = tones[i * gridN + j] / (maxTone || 1);
            const sPx2 = (opts.minSize + Math.pow(tone, opts.power) * opts.maxSize) * pt2ToPx2;
            const r = Math.sqrt(sPx2 / Math.PI);
            const px = (i / (gridN - 1)) * w;
            const py = (1 - j / (gridN - 1)) * h;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.globalAlpha = 1;
}

// =======================================================
//                  Trajectory renderer                  =
// =======================================================

function renderTrajectoryPlot(canvas, data, opts) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const points = data.points;
    const sizeKey = opts.sizeKey || null;

    const byToken = {};
    for (const p of points) {
        const idx = p.token_index;
        if (!byToken[idx]) byToken[idx] = [];
        byToken[idx].push(p);
    }
    const tokenIndices = Object.keys(byToken).map(Number).sort((a, b) => a - b);
    for (const idx of tokenIndices) {
        byToken[idx].sort((a, b) => a.layer - b.layer);
    }

    // background grid at 0.1 increments
    ctx.strokeStyle = 'rgba(10, 14, 24, 0.13)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 10; g++) {
        const pos = g / 10;
        ctx.beginPath();
        ctx.moveTo(pos * w, 0);
        ctx.lineTo(pos * w, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos * h);
        ctx.lineTo(w, pos * h);
        ctx.stroke();
    }

    const ptToPx = w / 8 / 72;

    ctx.lineWidth = 0.8 * ptToPx;
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < tokenIndices.length; i++) {
        const trail = byToken[tokenIndices[i]];
        ctx.strokeStyle = TAB10[i % TAB10.length];
        ctx.beginPath();
        for (let j = 0; j < trail.length; j++) {
            const p = trail[j];
            const px = p.x * w;
            const py = (1 - p.y) * h;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    ctx.globalAlpha = 0.75;
    for (let i = 0; i < tokenIndices.length; i++) {
        const trail = byToken[tokenIndices[i]];
        ctx.fillStyle = TAB10[i % TAB10.length];
        for (let j = 0; j < trail.length; j++) {
            const p = trail[j];
            let s;
            if (sizeKey) {
                const v = p[sizeKey] || 0;
                s = 10 + Math.sqrt(v) * 80;
            } else {
                s = 20;
            }
            const r = Math.sqrt(s / Math.PI) * ptToPx;
            const px = p.x * w;
            const py = (1 - p.y) * h;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.globalAlpha = 1;
}

// =======================================================
//                    Hover interaction                  =
// =======================================================

function setupHover(canvas, mode, tooltipEl) {
    canvas.addEventListener('mousemove', (e) => {
        const points = mode === 'pca'
            ? currentPcaJump && currentPcaJump.points
            : currentUmapDensity && currentUmapDensity.points;
        if (!points) return;

        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width;
        const cy = 1 - (e.clientY - rect.top) / rect.height;
        if (cx < 0 || cx > 1 || cy < 0 || cy > 1) {
            hideTooltip(tooltipEl, canvas);
            return;
        }

        let nearest = null;
        let nearestDistPx2 = Infinity;
        for (const p of points) {
            const dxPx = (p.x - cx) * rect.width;
            const dyPx = (p.y - cy) * rect.height;
            const d = dxPx * dxPx + dyPx * dyPx;
            if (d < nearestDistPx2) { nearestDistPx2 = d; nearest = p; }
        }

        const thresholdPx = 14;
        if (nearest && Math.sqrt(nearestDistPx2) < thresholdPx) {
            showTooltip(nearest, mode, e.clientX, e.clientY, tooltipEl);
            canvas.style.cursor = 'crosshair';
        } else {
            hideTooltip(tooltipEl, canvas);
        }
    });

    canvas.addEventListener('mouseleave', () => hideTooltip(tooltipEl, canvas));
}

function hideTooltip(el, canvas) {
    el.style.display = 'none';
    if (canvas) canvas.style.cursor = 'default';
}

function showTooltip(p, mode, x, y, el) {
    const tokenText = (p.token_str || '').replace(/^\s+/, '') || '␣ (space)';
    const tokenHtml = escapeHtml(tokenText);

    const layerHtml = (mode === 'pca' && p.layer > 0)
        ? `${p.layer - 1}&nbsp;&rarr;&nbsp;${p.layer}`
        : String(p.layer);

    const xHtml = p.x.toFixed(2);
    const yHtml = p.y.toFixed(2);

    el.innerHTML =
        `<div class="tt-row"><span class="tt-key">token</span><span class="tt-val token">${tokenHtml}</span></div>` +
        `<div class="tt-row"><span class="tt-key">layer</span><span class="tt-val">${layerHtml}</span></div>` +
        `<div class="tt-row"><span class="tt-key">x</span><span class="tt-val">${xHtml}</span></div>` +
        `<div class="tt-row"><span class="tt-key">y</span><span class="tt-val">${yHtml}</span></div>`;

    el.className = 'tooltip tooltip-' + mode;
    el.style.display = 'block';
    const rect = el.getBoundingClientRect();
    let px = x + 18;
    let py = y + 18;
    if (px + rect.width  > window.innerWidth  - 10) px = x - rect.width  - 18;
    if (py + rect.height > window.innerHeight - 10) py = y - rect.height - 18;
    el.style.left = px + 'px';
    el.style.top  = py + 'px';
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// =======================================================
//                     Event handlers                    =
// =======================================================

async function handleProduceClick() {
    const produceBtn = document.getElementById('produceBtn');
    const textInput = document.getElementById('textInput');
    const pcaCanvas = document.getElementById('pcaCanvas');
    const umapCanvas = document.getElementById('umapCanvas');
    const pcaTraceCanvas = document.getElementById('pcaTraceCanvas');
    const umapTraceCanvas = document.getElementById('umapTraceCanvas');
    const pcaPlate = pcaCanvas.closest('.plate');
    const umapPlate = umapCanvas.closest('.plate');

    produceBtn.disabled = true;
    produceBtn.textContent = 'printing…';
    pcaPlate.classList.add('is-printing');
    umapPlate.classList.add('is-printing');
    await new Promise(r => requestAnimationFrame(r));

    currentText = textInput.value;
    const data = await halftone(currentText);
    currentPcaJump = data.pca_jump;
    currentUmapDensity = data.umap_density;

    renderPcaDirectionHalftone(pcaCanvas, currentPcaJump, PCA_HALFTONE);
    await new Promise(r => requestAnimationFrame(r));
    renderHalftoneField(umapCanvas, currentUmapDensity, {
        ...UMAP_HALFTONE,
        weightKey: null
    });
    await new Promise(r => requestAnimationFrame(r));

    renderTrajectoryPlot(pcaTraceCanvas, currentPcaJump, { sizeKey: 'jump' });
    await new Promise(r => requestAnimationFrame(r));
    renderTrajectoryPlot(umapTraceCanvas, currentUmapDensity, { sizeKey: null });

    pcaPlate.classList.remove('is-printing');
    umapPlate.classList.remove('is-printing');
    produceBtn.disabled = false;
    produceBtn.textContent = 'print';
}

function setupViewToggle() {
    document.querySelectorAll('.view-toggle-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            const plate = btn.closest('.plate');
            plate.querySelectorAll('.view-toggle-opt').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            plate.classList.remove('is-trace-mode', 'is-overprint-mode');
            if (view === 'trace') plate.classList.add('is-trace-mode');
            else if (view === 'overprint') plate.classList.add('is-overprint-mode');
        });
    });
}

// =======================================================
//                          Init                         =
// =======================================================

window.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const produceBtn = document.getElementById('produceBtn');
    const pcaCanvas = document.getElementById('pcaCanvas');
    const umapCanvas = document.getElementById('umapCanvas');
    const pcaTraceCanvas = document.getElementById('pcaTraceCanvas');
    const umapTraceCanvas = document.getElementById('umapTraceCanvas');
    const tooltip = document.getElementById('tooltip');

    textInput.value = POEM_TEXT;

    setupHover(pcaCanvas, 'pca', tooltip);
    setupHover(umapCanvas, 'umap', tooltip);
    setupHover(pcaTraceCanvas, 'pca', tooltip);
    setupHover(umapTraceCanvas, 'umap', tooltip);

    setupViewToggle();

    produceBtn.addEventListener('click', handleProduceClick);
});
