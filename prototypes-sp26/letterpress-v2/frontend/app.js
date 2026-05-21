(() => {
    'use strict';

    const PRESET_SENTENCE = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
    const ALTERNATES      = ['dog', 'rat', 'bat', 'ran', 'slept', 'hat', 'a'];
    const POOL_WORDS      = [...PRESET_SENTENCE, ...ALTERNATES];

    const LAYERS = [
        { intensity: 0.22, bleed: 'faint',  impression: 0.30 },
        { intensity: 0.42, bleed: 'faint',  impression: 0.45 },
        { intensity: 0.55, bleed: 'mild',   impression: 0.55 },
        { intensity: 0.70, bleed: 'mild',   impression: 0.65 },
        { intensity: 0.82, bleed: 'medium', impression: 0.75 },
        { intensity: 0.90, bleed: 'heavy',  impression: 0.82 },
        { intensity: 0.92, bleed: 'heavy',  impression: 0.84 },
        { intensity: 0.88, bleed: 'medium', impression: 0.78 },
        { intensity: 0.85, bleed: 'medium', impression: 0.72 },
        { intensity: 0.86, bleed: 'mild',   impression: 0.68 },
        { intensity: 0.90, bleed: 'mild',   impression: 0.65 },
        { intensity: 0.94, bleed: 'mild',   impression: 0.62 },
    ];
    const N_LAYERS = LAYERS.length;

    const $ = (id) => document.getElementById(id);
    const rand = (a, b) => a + Math.random() * (b - a);

    const state = {
        composed: [],
        stickLocked: false,
        pressed: false,
        layers: LAYERS,
        rawDiffs: []
    };


    async function accumulatedResidualChange(text) {
        const res = await fetch('http://localhost:5001/accumulated_residual_change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        return res.json();
    }

    function mapMagnitudesToLayers(magnitudes) {
        if (!Array.isArray(magnitudes) || magnitudes.length !== N_LAYERS) {
            return LAYERS;
        }

        const logged = magnitudes.map(x => Math.log1p(x));

        const min = Math.min(...logged);
        const max = Math.max(...logged);
        const range = max - min || 1;

        return logged.map(val => {
            const norm = (val - min) / range;
            const bleedNorm = 1 - norm;

            const intensity  = 0.10 + norm * 0.90;
            const impression = 0.20 + norm * 0.80;

            let bleed;
            if      (bleedNorm < 0.12) bleed = 'trace';
            else if (bleedNorm < 0.35) bleed = 'faint';
            else if (bleedNorm < 0.58) bleed = 'mild';
            else if (bleedNorm < 0.78) bleed = 'medium';
            else                       bleed = 'heavy';

            return { intensity, bleed, impression };
        });
    }

    const tokenPool      = $('tokenPool');
    const stickTray      = $('stickTray');
    const composingStick = $('composingStick');
    const leverBtn       = $('leverBtn');
    const bed            = $('bed');
    const lockedType     = $('lockedType');
    const paperStack     = $('paperStack');

    function buildToken(word, idx) {
        const tok = document.createElement('div');
        tok.className = 'token';
        tok.dataset.word = word;
        tok.dataset.id = `t${idx}`;
        tok.draggable = true;
        for (const ch of word) {
            const img = document.createElement('img');
            img.className = 'letter-sort';
            img.src = (ch === ch.toUpperCase() && ch !== ch.toLowerCase())
                ? `assets/processed/Capital ${ch}.jpg`
                : `assets/processed/${ch}.jpg`;
            img.alt = ch;
            img.draggable = false;
            tok.appendChild(img);
        }
        return tok;
    }

    function buildPool() {
        const cols = 5;
        const cellW = 100 / cols;
        const rowH  = 56;
        POOL_WORDS.forEach((word, i) => {
            const tok = buildToken(word, i);
            const col = i % cols;
            const row = Math.floor(i / cols);
            const tilt = rand(-7, 7);
            tok.style.left = `${col * cellW + rand(-2, 4)}%`;
            tok.style.top  = `${row * rowH + rand(-4, 6)}px`;
            tok.style.setProperty('--tilt-hover', `${tilt - 1}deg`);
            tok.style.setProperty('--tilt-drag', `${tilt - 3}deg`);
            tok.style.transform = `rotate(${tilt}deg)`;
            attachDrag(tok);
            tokenPool.appendChild(tok);
        });
    }

    function attachDrag(tok) {
        tok.addEventListener('dragstart', (e) => {
            if (state.stickLocked) return;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tok.dataset.id);
            tok.classList.add('is-dragging');
        });
        tok.addEventListener('dragend', () => tok.classList.remove('is-dragging'));
        tok.addEventListener('click', () => {
            if (tok.parentElement === stickTray) returnToPool(tok);
        });
    }

    composingStick.addEventListener('dragover', (e) => {
        if (state.stickLocked) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    composingStick.addEventListener('drop', (e) => {
        if (state.stickLocked) return;
        e.preventDefault();
        e.stopPropagation();
        const id = e.dataTransfer.getData('text/plain');
        if (id && id.startsWith('stick-')) return;
        const original = tokenPool.querySelector(`[data-id="${id}"]`);
        if (!original) return;
        if (original.classList.contains('is-placed')) return;
        placeInStick(original);
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    });
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (!id || !id.startsWith('stick-')) return;
        const srcId = id.slice('stick-'.length);
        const clone = stickTray.querySelector(`[data-source-id="${srcId}"]`);
        if (clone) returnToPool(clone);
    });

    function placeInStick(originalTok) {
        if (state.composed.length >= 6) {
            return;
        }

        originalTok.classList.add('is-placed');
        const clone = buildToken(originalTok.dataset.word, 'c' + Date.now() + Math.random());
        clone.dataset.sourceId = originalTok.dataset.id;
        clone.style.position = 'relative';
        clone.style.left = '';
        clone.style.top = '';
        clone.style.transform = '';
        clone.title = 'click or drag out to return';
        clone.addEventListener('click', () => {
            if (state.stickLocked) return;
            returnToPool(clone);
        });

        clone.draggable = true;
        clone.addEventListener('dragstart', (e) => {
            if (state.stickLocked) { e.preventDefault(); return; }
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'stick-' + clone.dataset.sourceId);
            clone.classList.add('is-dragging');
        });
        clone.addEventListener('dragend', () => clone.classList.remove('is-dragging'));

        stickTray.appendChild(clone);
        state.composed.push({ word: originalTok.dataset.word, sourceId: originalTok.dataset.id });
        updateLeverState();
    }

    function returnToPool(stickTok) {
        const srcId = stickTok.dataset.sourceId;
        const original = tokenPool.querySelector(`[data-id="${srcId}"]`);
        if (original) original.classList.remove('is-placed');
        const idx = state.composed.findIndex(c => c.sourceId === srcId);
        if (idx !== -1) state.composed.splice(idx, 1);
        stickTok.remove();
        updateLeverState();
    }

    function updateLeverState() {
        const ready = state.composed.length >= 1 && !state.pressed;
        leverBtn.disabled = !ready;
    }

    leverBtn.addEventListener('click', () => {
        if (state.pressed || state.composed.length < 1) return;
        runPress();
    });

    function runPress() {
        state.pressed = true;
        leverBtn.disabled = true;
        const composedWords = state.composed.map(c => c.word);

        const layersPromise = accumulatedResidualChange(composedWords.join(' '))
            .then(json => {
                if (json && Array.isArray(json.diffs)) {
                    state.rawDiffs = json.diffs;
                    return mapMagnitudesToLayers(json.diffs);
                }
                return LAYERS;
            })
            .catch(() => LAYERS);

        leverBtn.classList.add('is-pulling');

        setTimeout(() => {
            composingStick.classList.add('is-locking');
            composingStick.classList.add('is-locked');
            state.stickLocked = true;
        }, 600);

        setTimeout(() => {
            buildLockedType(composedWords);
            requestAnimationFrame(() => lockedType.classList.add('is-shown'));
        }, 900);

        setTimeout(async () => {
            bed.classList.add('is-pressing');
            state.layers = await layersPromise;
            buildPaperStack(composedWords);
        }, 2400);


        setTimeout(() => {
            leverBtn.classList.remove('is-pulling');
            leverBtn.classList.add('is-released');
        }, 2700);
        setTimeout(() => {
            bed.classList.remove('is-pressing');
            leverBtn.classList.remove('is-released');
        }, 3500);
    }

    function buildLockedType(composedWords) {
        lockedType.innerHTML = '';

        PRESET_SENTENCE.forEach((slotWord, i) => {
            const chosenWord = composedWords[i];

            const tok = chosenWord
                ? buildToken(chosenWord, 'lt' + i)
                : buildToken(slotWord, 'ph' + i);

            tok.draggable = false;
            tok.style.cursor = 'default';
            tok.style.position = 'static';
            tok.style.transform = '';
            tok.style.filter = 'none';

            if (!chosenWord) {
                tok.classList.add('is-placeholder');
            }

            lockedType.appendChild(tok);
        });
    }

    function buildPaperStack(composedWords) {
        paperStack.innerHTML = '';
        paperStack.classList.add('is-active');

        for (let i = N_LAYERS - 1; i >= 0; i--) {
            const sheet = buildSheet(i, composedWords);
            paperStack.appendChild(sheet);
        }
    }

    function buildSheet(layerIdx, composedWords) {
        const sheet = document.createElement('div');
        sheet.className = 'sheet';
        sheet.dataset.layer = layerIdx;

        const drift = rand(-1.4, 1.4);
        const offX  = rand(-3, 3);
        const offY  = rand(-2, 2);
        sheet.style.zIndex = N_LAYERS - layerIdx;
        sheet.style.transform = `translate(${offX}px, ${offY}px) rotate(${drift}deg)`;

        const flipper = document.createElement('div');
        flipper.className = 'sheet-flipper';

        const back = document.createElement('div');
        back.className = 'sheet-face sheet-face--back';

        const front = document.createElement('div');
        front.className = 'sheet-face sheet-face--front';
        front.appendChild(buildImprint(composedWords, layerIdx));

        const cap = document.createElement('span');
        cap.className = 'sheet-caption';
        cap.textContent = `ℓ${String(layerIdx).padStart(2, '0')} · ‖Δ‖ ${state.rawDiffs[layerIdx].toFixed(2)}`;
        front.appendChild(cap);

        flipper.appendChild(back);
        flipper.appendChild(front);
        sheet.appendChild(flipper);

        sheet.addEventListener('click', () => onSheetClick(sheet));
        return sheet;
    }

    function buildImprint(composedWords, layerIdx) {
        const sig = state.layers[layerIdx];
        const imprint = document.createElement('div');
        imprint.className = `imprint bleed-${sig.bleed}`;
        imprint.style.setProperty('--ink-alpha', sig.intensity);
        imprint.style.setProperty('--imp', sig.impression);

        const lines = readLockedTypeLines();

        lines.forEach(lineWords => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'imprint-line';
            lineWords.forEach(word => {
                const wrap = document.createElement('span');
                wrap.className = 'imprint-word';
                Array.from(word).forEach(ch => {
                    const span = document.createElement('span');
                    span.className = 'ch';
                    span.style.setProperty('--jx', `${rand(-0.4, 0.4)}px`);
                    span.style.setProperty('--jy', `${rand(-0.3, 0.3)}px`);
                    span.style.setProperty('--rot', `${rand(-0.8, 0.8)}deg`);
                    span.textContent = ch;
                    wrap.appendChild(span);
                });
                lineDiv.appendChild(wrap);
            });
            imprint.appendChild(lineDiv);
        });
        return imprint;
    }


    function readLockedTypeLines() {
        const lines = [];
        let currentLine = null;
        let currentTop = null;
        Array.from(lockedType.children).forEach(tok => {
            const top = tok.offsetTop;
            if (currentTop === null || Math.abs(top - currentTop) > 5) {
                currentLine = [];
                lines.push(currentLine);
                currentTop = top;
            }
            if (!tok.classList.contains('is-placeholder')) {
                currentLine.push(tok.dataset.word);
            }
        });
        return lines.filter(line => line.length > 0);
    }

    function onSheetClick(sheet) {
        if (sheet.classList.contains('is-revealed')) return;
        const top = topSheet();
        if (sheet !== top) return;

        sheet.classList.add('is-revealed');
        const maxZ = Math.max(...Array.from(paperStack.querySelectorAll('.sheet'))
            .map(s => parseInt(s.style.zIndex || '0', 10)));
        sheet.style.zIndex = maxZ + 1;
        sheet.style.pointerEvents = 'none';
    }

    function topSheet() {

        let best = null, bestZ = -Infinity;
        paperStack.querySelectorAll('.sheet').forEach(s => {
            if (s.classList.contains('is-revealed')) return;
            const z = parseInt(s.style.zIndex || '0', 10);
            if (z > bestZ) { bestZ = z; best = s; }
        });
        return best;
    }

    buildPool();
    updateLeverState();
})();
