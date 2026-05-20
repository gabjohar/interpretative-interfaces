(() => {
    'use strict';

    // Poem — E.E. Cummings, "[in Just-]"
    const TOKENS = [
        '<|endoftext|>',
        'in', ' Just', '-', ' spring', ' when', ' the', ' world', ' is', ' mud', '-',
        ' l', 'us', 'cious', ' the', ' little', ' lame', ' balloon', 'man',
        ' whist', 'les', ' far', ' and', ' wee',
        ' and', ' ed', 'die', 'and', 'bill', ' come',
        ' running', ' from', ' mar', 'bles', ' and',
        ' pir', 'acies', ' and', ' it', "'s",
        ' spring', ' when', ' the', ' world', ' is', ' p', 'uddle', '-', 'w', 'onder', 'ful',
        ' the', ' queer', ' old', ' balloon', 'man', ' whist', 'les',
        ' far', ' and', ' wee',
        ' and', ' bet', 'ty', 'and', 'is', 'bel', ' come', ' dancing',
        ' from', ' hop', '-', 'sc', 'ot', 'ch', ' and', ' jump', '-', 'ro', 'pe', ' and',
        ' it', "'s", ' spring', ' and', ' the', ' goat', '-', 'footed', ' balloon', 'Man',
        ' whist', 'les', ' far', ' and', ' wee',
    ];
    const N = TOKENS.length;

    const POEM_LINES = [
        [1, 2, 3],
        [4, '          ', 5, 6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18],
        [19, 20, '          ', 21, '          ', 22, 23],
        [24, 25, 26, 27, 28, 29],
        [30, 31, 32, 33, 34],
        [35, 36, 37, 38, 39],
        [40],
        [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
        [51, 52],
        [53, 54, 55, 56, 57],
        [58, '          ', 59, '             ', 60],
        [61, 62, 63, 64, 65, 66, 67, 68],
        [69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
        [81, 82],
        [83],
        [84],
        [85],
        [86, 87, 88],
        [89, 90, '          ', 91, 92],
        [93],
        [94],
        [95],
    ];

    const LINE_POSITIONS = [
        { x:  4, y:  4 },
        { x: 14, y: 11 },
        { x: 28, y: 18 },
        { x:  8, y: 25 },
        { x: 26, y: 33 },
        { x:  6, y: 44 },
        { x: 30, y: 49 },
        { x: 12, y: 55 },
        { x: 38, y: 62 },
        { x: 10, y: 69 },
        { x: 32, y: 76 },
        { x: 12, y: 82 },
        { x: 64, y:  4 },
        { x: 58, y: 12 },
        { x: 60, y: 20 },
        { x: 84, y: 26 },
        { x: 62, y: 32 },
        { x: 55, y: 40 },
        { x: 68, y: 45 },
        { x: 78, y: 57 },
        { x: 56, y: 63 },
        { x: 78, y: 69 },
        { x: 72, y: 75 },
        { x: 60, y: 81 },
    ];

    const LINE_SCALES = [
        1.00, 1.00, 1.00, 1.00,
        1.00, 1.00, 1.00, 1.00,
        1.00, 1.00, 1.00, 1.00,
        1.00, 1.00, 1.00, 1.00,
        1.00, 1.00, 1.00, 1.00,
        1.00, 1.00, 1.00, 1.00,
    ];

    // Attention data
    const POEM_TEXT = "in Just- spring when the world is mud- luscious the little lame balloonman whistles far and wee and eddieandbill come running from marbles and piracies and it's spring when the world is puddle-wonderful the queer old balloonman whistles far and wee and bettyandisbel come dancing from hop-scotch and jump-rope and it's spring and the goat-footed balloonMan whistles far and wee";

    function averageHeads(allHeadsMatrix) {
        return allHeadsMatrix[0].map((row, i) =>
            row.map((_, j) =>
                allHeadsMatrix.reduce((sum, head) => sum + head[i][j], 0) / allHeadsMatrix.length
            )
        );
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
            const res = await fetch('./example.json');
            return res.json();
        }
    }

    const NUM_LAYERS = 12;

    let ATTENTION = Array.from({ length: NUM_LAYERS }, () =>
        Array.from({ length: N }, () => new Array(N).fill(0))
    );

    const BASE_SIZE_VH = 2.0;
    const MAX_SIZE_VH  = 3.7;

    const composition = document.getElementById('composition');
    const tokenEls = new Array(N).fill(null);
    function buildPage() {
        composition.innerHTML = '';
        for (let i = 0; i < N; i++) tokenEls[i] = null;
        POEM_LINES.forEach((items, li) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'line';
            lineDiv.style.left = `${LINE_POSITIONS[li].x}%`;
            lineDiv.style.top  = `${LINE_POSITIONS[li].y}%`;
            let isFirst = true;
            items.forEach((item) => {
                if (typeof item === 'number') {
                    let tokStr = TOKENS[item];
                    if (isFirst && tokStr.startsWith(' ')) {
                        tokStr = tokStr.substring(1);
                    }
                    const span = document.createElement('span');
                    span.className = 'token';
                    span.textContent = tokStr;
                    span.dataset.line = li;
                    lineDiv.appendChild(span);
                    tokenEls[item] = span;
                    isFirst = false;
                } else {
                    lineDiv.appendChild(document.createTextNode(item));
                    isFirst = false;
                }
            });
            composition.appendChild(lineDiv);
        });
    }

    const CYCLE_ROW   = NUM_LAYERS * N;
    const CYCLE_LAYER = NUM_LAYERS;
    const ROW_DURATION = 1.5;
    let MODE = 'row';

    function computeLayerSummaries(att) {
        const sums = att.map(matrix => {
            const cols = new Array(N).fill(0);
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    cols[j] += matrix[i][j];
                }
            }
            return cols;
        });
        let globalMax = 0;
        for (const layer of sums) {
            for (let j = 1; j < N; j++) {
                if (layer[j] > globalMax) globalMax = layer[j];
            }
        }
        if (globalMax > 0) {
            for (const layer of sums) {
                for (let j = 0; j < N; j++) layer[j] /= globalMax;
            }
        }
        return sums;
    }
    let LAYER_SUMMARIES = computeLayerSummaries(ATTENTION);

    function getCycle() {
        return MODE === 'row' ? CYCLE_ROW : CYCLE_LAYER;
    }

    function rowAt(k) {
        const cycle = getCycle();
        k = ((k % cycle) + cycle) % cycle;
        if (MODE === 'row') {
            const layer = Math.floor(k / N);
            const row = k % N;
            return ATTENTION[layer][row];
        }
        return LAYER_SUMMARIES[k];
    }

    function weightVector(t) {
        const cycle = getCycle();
        t = ((t % cycle) + cycle) % cycle;
        const i = Math.floor(t);
        const f = t - i;
        const rowA = rowAt(i);
        const rowB = (i + 1 >= cycle) ? rowA : rowAt(i + 1);
        const v = new Array(N);
        for (let j = 0; j < N; j++) {
            const a = rowA ? (rowA[j] || 0) : 0;
            const b = rowB ? (rowB[j] || 0) : 0;
            v[j] = a * (1 - f) + b * f;
        }
        return v;
    }

    const indicatorEl = document.getElementById('indicator');
    function updateIndicator(tt) {
        if (!indicatorEl) return;
        const cycle = getCycle();
        const norm = ((tt % cycle) + cycle) % cycle;
        const i = Math.min(Math.round(norm), cycle - 1);
        if (MODE === 'row') {
            const layer = Math.floor(i / N);
            const row = i % N;
            const w = weightVector(tt);
            let maxIdx = 0, maxVal = -1;
            for (let j = 1; j < N; j++) {
                if (w[j] > maxVal) { maxVal = w[j]; maxIdx = j; }
            }
            const tok = (maxIdx === 0 || maxVal <= 0) ? 'BOS' : (TOKENS[maxIdx] || '').trim();
            indicatorEl.textContent = `LAYER ${layer} / ROW ${row} / ${tok}`;
        } else {
            indicatorEl.textContent = `LAYER ${i}`;
        }
    }

    function applyAt(t, mult = 1) {
        const w = weightVector(t);
        for (let j = 0; j < N; j++) {
            const el = tokenEls[j];
            if (!el) continue;
            const lineIdx = parseInt(el.dataset.line, 10);
            const lineScale = LINE_SCALES[lineIdx] || 1;
            const clamped = Math.max(0, Math.min(1, w[j] * mult));
            const t_factor = Math.sqrt(clamped);
            const size = BASE_SIZE_VH + t_factor * (MAX_SIZE_VH - BASE_SIZE_VH) * lineScale;
            el.style.fontSize = `${size}vh`;
        }
        updateIndicator(t);
    }

    function applyNeutral() {
        for (let j = 0; j < N; j++) {
            const el = tokenEls[j];
            if (!el) continue;
            el.style.fontSize = `${BASE_SIZE_VH}vh`;
        }
        updateIndicator(0);
    }

    let t = 0;
    let playing = false;
    let lastFrameTime = 0;
    let warmupEndTime = 0;
    const WARMUP_S = 0.8;

    function tick(now) {
        if (!playing) return;
        if (now < warmupEndTime) {
            const remaining = warmupEndTime - now;
            const f = 1 - remaining / (WARMUP_S * 1000);
            applyAt(0, f);
            lastFrameTime = now;
            requestAnimationFrame(tick);
            return;
        }
        const dt = (now - lastFrameTime) / 1000;
        lastFrameTime = now;
        t = (t + dt / ROW_DURATION) % getCycle();
        applyAt(t);
        requestAnimationFrame(tick);
    }

    document.getElementById('playBtn').addEventListener('click', () => {
        if (playing) return;
        playing = true;
        lastFrameTime = performance.now();
        requestAnimationFrame(tick);
    });
    document.getElementById('pauseBtn').addEventListener('click', () => {
        playing = false;
    });
    document.getElementById('rowBtn').addEventListener('click', () => {
        MODE = 'row';
        t = 0;
        warmupEndTime = performance.now() + WARMUP_S * 1000;
        applyAt(0, 0);
        if (!playing) {
            playing = true;
            lastFrameTime = performance.now();
            requestAnimationFrame(tick);
        }
    });
    document.getElementById('layerBtn').addEventListener('click', () => {
        MODE = 'layer';
        t = 0;
        warmupEndTime = performance.now() + WARMUP_S * 1000;
        applyAt(0, 0);
        if (!playing) {
            playing = true;
            lastFrameTime = performance.now();
            requestAnimationFrame(tick);
        }
    });

    const revealBtn = document.getElementById('revealBtn');
    const showAll = () => document.body.classList.add('all-revealed');
    const hideAll = () => document.body.classList.remove('all-revealed');
    revealBtn.addEventListener('mousedown',  showAll);
    revealBtn.addEventListener('mouseup',    hideAll);
    revealBtn.addEventListener('mouseleave', hideAll);
    revealBtn.addEventListener('touchstart', (e) => { e.preventDefault(); showAll(); }, { passive: false });
    revealBtn.addEventListener('touchend',   hideAll);
    revealBtn.addEventListener('touchcancel', hideAll);

    buildPage();
    applyNeutral();

    Promise.all(
        Array.from({ length: NUM_LAYERS }, (_, layer) => attention(POEM_TEXT, layer))
    ).then(jsonArr => {
        const matrices = jsonArr.map(json => {
            const payload = json.attention_matrix ?? json.attention ?? json.attentions ?? json.heads ?? json;
            if (!Array.isArray(payload)) return null;
            if (Array.isArray(payload[0]) && Array.isArray(payload[0][0])) {
                return averageHeads(payload);
            } else if (Array.isArray(payload[0]) && typeof payload[0][0] === 'number') {
                return payload;
            }
            return null;
        });
        if (matrices.some(m => !m || m.length !== N)) return;
        ATTENTION = matrices;
        LAYER_SUMMARIES = computeLayerSummaries(ATTENTION);
        applyAt(t);
    }).catch(() => {});
})();
