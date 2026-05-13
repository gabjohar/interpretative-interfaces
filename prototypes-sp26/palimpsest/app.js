const { useState, useRef, useEffect, useCallback, useMemo } = React;

const N_LAYERS = 12;  // GPT-2 small has 12 layers

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
        const res = await fetch('../backend/examples/manuscript_tokenize.json');

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
        const res = await fetch('../backend/examples/manuscript_predict.json');

        return res.json();
    }
}


const PRESETS = {
    manuscript: { label: 'Old Manuscript', text: 'The old manuscript, scraped and rewritten across centuries by hands whose names are no longer legible, still reveals, beneath its surface, the faint traces of a' },
    sun: { label: 'Sun, Moon, and You', text: 'I love three things in this world: sun, moon and you. Sun for morning, moon for' },
    hidden: { label: 'Hidden Layers', text: 'Beneath the surface of a generated word lies a succession of hidden layers, each rewriting the last, shaping the signal step by step until it resolves into the next token, drawn as the most likely continuation of an unfolding' },
    life: { label: 'Life Is a Book',  text: 'Life is like a book. When you open it, it becomes a story; when you close it, it becomes a faded' },
    roses: { label: 'On the Path', text: 'At the edge of the forest, the traveler paused, knowing that every step forward would leave other futures behind, and that the story would continue along a path that might become' },
};

const N_NOTE_PAGES = 3;

const cx = (...xs) => xs.filter(Boolean).join(' ');

function ScraperCursor({ x, y, active }) {
  return (
    <div
      className={cx('cursor-scraper', active && 'active')}
      style={{ left: x, top: y }}
    >
      <svg viewBox="0 0 70 70">
        <defs>
          <linearGradient id="wood-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#4e331a"/>
            <stop offset="45%" stopColor="#3a2411"/>
            <stop offset="100%" stopColor="#1e1208"/>
          </linearGradient>
          <linearGradient id="blade-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#5a5e5f"/>
            <stop offset="40%" stopColor="#7a7e7f"/>
            <stop offset="70%" stopColor="#4a4d4e"/>
            <stop offset="100%" stopColor="#2a2c2d"/>
          </linearGradient>
          <linearGradient id="edge-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#b8bcbd"/>
            <stop offset="100%" stopColor="#4a4d4e"/>
          </linearGradient>
          <linearGradient id="ferrule-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#6b5220"/>
            <stop offset="50%" stopColor="#4a3714"/>
            <stop offset="100%" stopColor="#2a1e08"/>
          </linearGradient>
        </defs>
        {/* wooden handle */}
        <path
          d="M36 38 L66 48 Q 69.5 49 68.8 52 L 68 55 Q 67.2 57.5 63.5 56.8 L 34 48 Z"
          fill="url(#wood-grad)" stroke="#120a03" strokeWidth="0.6"
        />
        <ellipse cx="67.5" cy="52.5" rx="2.2" ry="3.8" fill="#1e1208" stroke="#0d0602" strokeWidth="0.4"/>
        <ellipse cx="67" cy="51.5" rx="0.4" ry="1.2" fill="#3a2411" opacity="0.7"/>
        <path d="M38 41.5 L63 49" stroke="#1a0f05" strokeWidth="0.3" opacity="0.8"/>
        <path d="M38 44.5 L63 52" stroke="#1a0f05" strokeWidth="0.3" opacity="0.7"/>
        <path d="M38 46.5 L63 54" stroke="#1a0f05" strokeWidth="0.28" opacity="0.55"/>
        <path d="M38 43.2 L63 50.3" stroke="#2a1810" strokeWidth="0.22" opacity="0.5"/>
        <path d="M48 43 l 3 0.6" stroke="#0d0602" strokeWidth="0.25" opacity="0.6"/>
        <path d="M56 51 l 2 0.4" stroke="#0d0602" strokeWidth="0.25" opacity="0.5"/>
        <path d="M31 36 L37 37 L37 49 L32 48 Z" fill="url(#ferrule-grad)" stroke="#1a0f05" strokeWidth="0.4"/>
        <path d="M31 38.5 L37 39.5" stroke="#2a1e08" strokeWidth="0.3"/>
        <path d="M31 42 L37 43" stroke="#2a1e08" strokeWidth="0.3"/>
        <path d="M31 45.5 L37 46.5" stroke="#2a1e08" strokeWidth="0.3"/>
        <path
          d="M32 36 Q 20 28 10 18 Q 6 14 3 10 Q 2 8 4 8 Q 16 12 26 22 Q 31 28 33 36 Z"
          fill="url(#blade-grad)" stroke="#0d0602" strokeWidth="0.55"
        />
        <path d="M4 9 Q 16 13 26 23 Q 30 27 32 33"
          stroke="url(#edge-grad)" strokeWidth="0.4" fill="none" opacity="0.6"/>
        <path d="M32 36 Q 22 30 14 22 Q 8 16 4 10"
          stroke="#1a1c1d" strokeWidth="0.5" fill="none" opacity="0.7"/>
        <path d="M14 16 q 2 -1 3 1" stroke="#3a2c1a" strokeWidth="0.35" fill="none" opacity="0.55"/>
        <path d="M22 24 q 1 -2 2 0" stroke="#3a2c1a" strokeWidth="0.3" fill="none" opacity="0.45"/>
        <path d="M10 14 l 0.7 -0.5" stroke="#1a1c1d" strokeWidth="0.28"/>
        <path d="M17 19 l 0.7 -0.5" stroke="#1a1c1d" strokeWidth="0.28"/>
        <path d="M24 26 l 0.6 -0.4" stroke="#1a1c1d" strokeWidth="0.25"/>
        <circle cx="4" cy="11" r="0.55" fill="#9e8048" opacity="0.55"/>
        <circle cx="2.6" cy="12.7" r="0.4" fill="#9e8048" opacity="0.4"/>
        <circle cx="5.3" cy="8.4" r="0.3" fill="#b8a06a" opacity="0.45"/>
      </svg>
      <div className="scrape-ring" />
    </div>
  );
}

// ============================================================
// =                   Quill pen cursor                       =
// ============================================================
function PenCursor({ x, y }) {
  return (
    <div className="cursor-pen" style={{ left: x, top: y }}>
      <svg viewBox="0 0 72 72">
        <defs>
          <linearGradient id="feather-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#bdb39a"/>
            <stop offset="45%" stopColor="#8d8269"/>
            <stop offset="100%" stopColor="#4a4332"/>
          </linearGradient>
          <linearGradient id="feather-shadow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#6a6150"/>
            <stop offset="100%" stopColor="#2a2518"/>
          </linearGradient>
          <linearGradient id="nib-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#1a1008"/>
            <stop offset="100%" stopColor="#000000"/>
          </linearGradient>
          <linearGradient id="ink-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#3a1e08"/>
            <stop offset="100%" stopColor="#120804"/>
          </linearGradient>
        </defs>

        <path
          d="M60 2
             Q 66 6 68 14
             Q 68 22 60 30
             Q 48 40 30 52
             Q 22 58 16 62
             L 10 58
             Q 20 42 30 32
             Q 44 16 54 8
             Q 58 4 60 2 Z"
          fill="url(#feather-grad)"
          stroke="#231c12"
          strokeWidth="0.5"
          opacity="0.96"
        />

        <path
          d="M10 58 Q 20 44 30 34 Q 42 20 50 12"
          fill="none" stroke="url(#feather-shadow)" strokeWidth="2.5" opacity="0.55"
        />

        <path
          d="M58 6 Q 62 10 63 16 Q 60 24 50 32 Q 36 44 20 56"
          fill="none" stroke="#c8bea3" strokeWidth="0.35" opacity="0.4"
        />

        <g stroke="#3a3121" strokeWidth="0.3" opacity="0.72" fill="none">
          <path d="M58 6  L 62 4"/>
          <path d="M54 10 L 62 8"/>
          <path d="M50 14 L 61 12"/>
          <path d="M46 18 L 60 16"/>
          <path d="M42 22 L 58 20"/>
          <path d="M38 26 L 55 24"/>
          <path d="M34 30 L 52 29"/>
          <path d="M30 34 L 48 33"/>
          <path d="M26 38 L 44 38"/>
          <path d="M22 42 L 40 42"/>
          <path d="M18 47 L 35 47"/>
          <path d="M16 53 L 30 52"/>
        </g>

        <g stroke="#4a4332" strokeWidth="0.26" opacity="0.5" fill="none">
          <path d="M56 12 L 51 16"/>
          <path d="M48 20 L 42 24"/>
          <path d="M40 28 L 33 32"/>
          <path d="M30 38 L 23 42"/>
          <path d="M22 48 L 16 52"/>
        </g>

        <path d="M38 26 L 56 23" stroke="#1e1810" strokeWidth="0.22" opacity="0.4"/>
        <path d="M26 38 L 43 36" stroke="#1e1810" strokeWidth="0.22" opacity="0.4"/>

        <path
          d="M60 3 Q 48 18 30 36 Q 18 48 10 58"
          stroke="#1a1208" strokeWidth="1.4" fill="none" strokeLinecap="round"
        />

        <path
          d="M58 6 Q 48 18 32 36 Q 20 48 12 57"
          stroke="#8d8269" strokeWidth="0.22" fill="none" opacity="0.4"
        />

        <path d="M10 58 L 14 54 L 16 56 L 12 60 Z" fill="#231c12" stroke="#0d0602" strokeWidth="0.4"/>
        <path d="M10.5 58.5 L 15 54" stroke="#4a3a1e" strokeWidth="0.25"/>

        <path
          d="M12 60 Q 10 62 8 64 Q 6 66 3.5 68 L 2 66 Q 4 62 8 58 Z"
          fill="url(#nib-grad)" stroke="#000" strokeWidth="0.3"
        />

        <path d="M9 60.5 Q 6 64 3.5 67" stroke="#3a241a" strokeWidth="0.32" fill="none"/>

        <circle cx="3.2" cy="67.3" r="0.5" fill="#0d0602"/>

        <ellipse cx="3.5" cy="69.2" rx="1" ry="1.3" fill="url(#ink-grad)"/>
        <ellipse cx="3.3" cy="68.8" rx="0.3" ry="0.4" fill="#4a2a10" opacity="0.7"/>
      </svg>
    </div>
  );
}

// =============================================================
// =                  Annotation component                     =
// =============================================================
function Annotation({ ann, onUpdate, onDelete, onCommit }) {
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const taRef = useRef(null);

  useEffect(() => {
    if (ann.editing && taRef.current) {
      taRef.current.focus();
      taRef.current.select?.();
    }
  }, [ann.editing]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      onUpdate({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, onUpdate]);

  const startDrag = (e) => {
    if (ann.editing) return;
    e.stopPropagation();
    dragStart.current = { x: e.clientX, y: e.clientY, ox: ann.x, oy: ann.y };
    setDragging(true);
  };

  return (
    <div
      className="annotation"
      style={{ left: ann.x, top: ann.y }}
      onMouseDown={startDrag}
      onClick={(e) => e.stopPropagation()}
    >
      {ann.editing ? (
        <textarea
          ref={taRef}
          className="ann-input"
          value={ann.text}
          rows={2}
          placeholder="write a gloss…"
          onChange={(e) => onUpdate({ text: e.target.value })}
          onBlur={() => onCommit()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onCommit(); }
            else if (e.key === 'Escape') onCommit();
          }}
        />
      ) : (
        <div
          className="ann-content"
          onDoubleClick={(e) => { e.stopPropagation(); onUpdate({ editing: true }); }}
          title="double-click to edit"
        >
          {ann.text || '(empty gloss — double-click to write)'}
          <button
            className="annotation-delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            onMouseDown={(e) => e.stopPropagation()}
            title="remove gloss"
          >×</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
//                     Palimpsest traces                      =
// ============================================================
function scribblePath(seed, length) {
  let x = 0, y = 0;
  let d = `M ${x} ${y}`;
  const n = Math.max(6, Math.floor(length / 22));
  for (let i = 0; i < n; i++) {
    const dx = 16 + Math.sin(seed + i * 1.1) * 5;
    const bulge = Math.sin(seed * 0.7 + i * 0.9) * 6;
    const nextY = y + Math.sin(seed + i * 0.6) * 1.2;
    d += ` q ${dx / 2} ${bulge} ${dx} ${nextY - y}`;
    x += dx;
    y = nextY;
    if (Math.random() < 0.18) {
      const gap = 5 + Math.random() * 8;
      x += gap;
      d += ` m ${gap} 0`;
    }
  }
  return d;
}
function PalimpsestTraces() {
  const lines = useMemo(() => {
    const L = [];
    for (let i = 0; i < 14; i++) {
      const len = 220 + (i % 4) * 60;
      L.push({
        d: scribblePath(i * 2.3, len),
        top: (i * 6.8 + (i % 3) * 1.1) + '%',
        left: ((i * 11) % 48) + '%',
        rot: (Math.sin(i * 1.3) * 2.2).toFixed(2),
        width: len,
        stroke: 0.5 + (i % 3) * 0.15,
        op: 0.42 + (i % 4) * 0.09,
      });
    }
    return L;
  }, []);
  return (
    <div className="palimpsest-traces" aria-hidden>
      {lines.map((l, i) => (
        <svg
          key={i}
          className="trace-line"
          style={{
            top: l.top, left: l.left,
            width: l.width, height: 18,
            transform: `rotate(${l.rot}deg)`,
            opacity: l.op,
          }}
          viewBox={`0 -8 ${l.width} 18`}
          preserveAspectRatio="none"
        >
          <path d={l.d} fill="none" stroke="#2e1706" strokeWidth={l.stroke} strokeLinecap="round"/>
        </svg>
      ))}
    </div>
  );
}

// ============================================================
// =                        Main app                          =
// ============================================================
function App() {
  const [presetKey, setPresetKey] = useState('manuscript');
  const [selectedTokenIdx, setSelectedTokenIdx] = useState(null);
  const [activeLayer, setActiveLayer] = useState(N_LAYERS - 1);
  const [tool, setTool] = useState('scraper');
  const [annotations, setAnnotations] = useState([]);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const [scraping, setScraping] = useState(false);

  const [slotToken, setSlotToken] = useState(null);
  const [slotScrapeProgress, setSlotScrapeProgress] = useState(0);
  const [slotMaskUrl, setSlotMaskUrl] = useState('');
  const [slotRevealUrl, setSlotRevealUrl] = useState('');
  const [marginPage, setMarginPage] = useState(0);
  const [notePages, setNotePages] = useState(() => Array(N_NOTE_PAGES).fill(''));
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [layerBanner, setLayerBanner] = useState(null);
  const [marginaliaActive, setMarginaliaActive] = useState(null);
  const [marginaliaHistory, setMarginaliaHistory] = useState([]);

  const scratchCanvasRef = useRef(null);
  const inkCanvasRef = useRef(null);
  const manuscriptRef = useRef(null);

  const isDraggingRef = useRef(false);
  const penPathRef = useRef({ active: false, last: null, totalDist: 0, downPos: null });
  const lastSlotScrapePosRef = useRef(null);
  const didAdvanceThisDragRef = useRef(false);
  const slotScrapeAreaRef = useRef(0);
  const didActSlotThisDragRef = useRef(false);
  const pendingSlotAdvanceRef = useRef(false);
  const slotMaskCanvasRef = useRef(null);
  const slotRevealCanvasRef = useRef(null);
  const slotRef = useRef(null);
  const advanceCooldownUntilRef = useRef(0);
  const danceStampRef = useRef(null);

  const preset = PRESETS[presetKey];
  const [predictData, setPredictData] = useState(null);
  const [bpeTokens, setBpeTokens] = useState(null);
  const getLayerPredictions = useCallback((layerIdx) => {
    const top = predictData?.predictions_by_layer?.[layerIdx]?.top_tokens || [];
    return {
      top1: (top[0]?.token || '').trim(),
      top2: (top[1]?.token || '').trim(),
      top3: (top[2]?.token || '').trim(),
    };
  }, [predictData]);


  const tokens = useMemo(() => {
    const raw = preset.text.match(/(\S+|\s+)/g) || [];
    return raw.map((t, i) => ({
      text: t,
      idx: i,
      isWord: /\S/.test(t),
    }));
  }, [preset.text]);


  const lastWordIdx = useMemo(() => {
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].isWord) return i;
    }
    return null;
  }, [tokens]);

  const lastBpeRange = useMemo(() => {
    if (!bpeTokens) return null;
    let pos = 0, last = null;
    for (const t of bpeTokens) {
      if (t.token_str === '<|endoftext|>') continue;
      const len = t.token_str.length;
      last = { start: pos, end: pos + len };
      pos += len;
    }
    return last;
  }, [bpeTokens]);

  useEffect(() => {
    setSelectedTokenIdx(lastWordIdx);
  }, [lastWordIdx, presetKey]);

  const selectedToken = lastBpeRange
    ? preset.text.slice(lastBpeRange.start, lastBpeRange.end).trim()
    : (selectedTokenIdx != null
        ? (tokens[selectedTokenIdx]?.text || '').replace(/[^\w’'\-]/g, '')
        : '');

  useEffect(() => {
    sizeOverlayCanvases();
    clearOverlay(scratchCanvasRef);
    clearOverlay(inkCanvasRef);
    window.addEventListener('resize', sizeOverlayCanvases);

    if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
      document.fonts.load('500 29px Caveat');
      document.fonts.load('700 33px Caveat');
      document.fonts.load('italic 700 18px "Cormorant Garamond"');
    }
    return () => window.removeEventListener('resize', sizeOverlayCanvases);

  }, []);

  function sizeOverlayCanvases() {
    const m = manuscriptRef.current;
    if (!m) return;
    const r = m.getBoundingClientRect();
    [scratchCanvasRef.current, inkCanvasRef.current].forEach(c => {
      if (!c) return;
      c.width = Math.floor(r.width);
      c.height = Math.floor(r.height);
    });
  }

  function clearOverlay(ref) {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
  }
  function dimScratch(ms, keepFraction = 0.4) {
    const c = scratchCanvasRef.current;
    if (!c) return;
    c.style.transition = `opacity ${ms}ms ease-out`;
    c.style.opacity = String(keepFraction);
    setTimeout(() => {
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - keepFraction})`;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.restore();
      c.style.transition = 'none';
      c.style.opacity = '1';
    }, ms);
  }

  function animateChalkScrape(pos, word, durationMs, stamp) {
    if (!pos) return;
    const manuEl = manuscriptRef.current;
    if (!manuEl) return;
    const wordLen = Array.from(word || '').length || 6;
    const sweepW = wordLen * 13 + 28;
    const sweepH = 30;
    const start = performance.now();
    const tick = () => {
      if (danceStampRef.current !== stamp) return;
      const elapsed = performance.now() - start;
      const progress = Math.min(1, elapsed / durationMs);
      const m = manuscriptRef.current;
      if (!m) return;
      const manuRect = m.getBoundingClientRect();
      const n = 1 + Math.floor(Math.random() * 2);
      const canvas = scratchCanvasRef.current;
      const ctx = canvas && canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        for (let i = 0; i < n; i++) {
          const jx = (Math.random() - 0.5) * sweepW;
          const jy = (Math.random() - 0.5) * sweepH;
          drawScratch(manuRect.left + pos.x + jx, manuRect.top + pos.y + jy);
        }
        ctx.restore();
      }
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function measureFractionErased(canvas, bbox) {
    if (!canvas || !bbox || bbox.w <= 0 || bbox.h <= 0) return 0;
    const ctx = canvas.getContext('2d');
    try {
      const data = ctx.getImageData(bbox.x, bbox.y, bbox.w, bbox.h).data;
      let sum = 0;
      for (let i = 3; i < data.length; i += 4) sum += data[i];
      const total = bbox.w * bbox.h * 255;
      if (total <= 0) return 0;
      return Math.max(0, Math.min(1, 1 - sum / total));
    } catch (e) { return 0; }
  }

  useEffect(() => {
    clearOverlay(scratchCanvasRef);
    clearOverlay(inkCanvasRef);
    setAnnotations([]);
    setSlotToken(null);
    setActiveLayer(N_LAYERS - 1);
    setLayerBanner(null);
    setMarginaliaActive(null);
    setMarginaliaHistory([]);
    danceStampRef.current = null;
    sizeOverlayCanvases();
  }, [presetKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadPredictions() {
        const tokenData = await tokenize(preset.text);
        if (cancelled || !tokenData || !tokenData.tokens?.length) {
            setPredictData(null);
            setBpeTokens(null);
            return;
        }

        setBpeTokens(tokenData.tokens);

        const tokenIndex = tokenData.tokens[tokenData.tokens.length - 1].index;
        const predictionData = await predict(preset.text, tokenIndex);
        if (cancelled) return;

        setPredictData(predictionData);
    }

    setPredictData(null);
    setBpeTokens(null);
    loadPredictions();

    return () => { cancelled = true; };
  }, [presetKey]);

  const loadPreset = (key) => {
    setPresetKey(key);
  };


  const drawScratch = (clientX, clientY) => {
    const canvas = scratchCanvasRef.current;
    const m = manuscriptRef.current;
    if (!canvas || !m) return;
    const rect = m.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const len = 4 + Math.random() * 16;
      const ox = (Math.random() - 0.5) * 14;
      const oy = (Math.random() - 0.5) * 14;
      const sx = x + ox - Math.cos(angle) * len / 2;
      const sy = y + oy - Math.sin(angle) * len / 2;
      const ex = x + ox + Math.cos(angle) * len / 2;
      const ey = y + oy + Math.sin(angle) * len / 2;
      ctx.strokeStyle = `rgba(255, 245, 214, ${0.22 + Math.random() * 0.24})`;
      ctx.lineWidth = 0.4 + Math.random() * 0.55;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    if (Math.random() < 0.35) {
      ctx.fillStyle = `rgba(255, 248, 222, ${0.25 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 12, 0.4 + Math.random() * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  };


  const drawInkSegment = (from, to) => {
    const canvas = inkCanvasRef.current;
    const m = manuscriptRef.current;
    if (!canvas || !m) return;
    const rect = m.getBoundingClientRect();
    const fx = from.x - rect.left;
    const fy = from.y - rect.top;
    const tx = to.x - rect.left;
    const ty = to.y - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    const dx = tx - fx, dy = ty - fy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const speed = Math.min(dist, 24);
    const baseWidth = 1.9;
    const width = Math.max(0.9, baseWidth - speed * 0.04 + (Math.random() - 0.5) * 0.25);
    const alpha = 0.78 - Math.min(0.25, speed * 0.005);
    ctx.strokeStyle = `rgba(35, 18, 6, ${alpha.toFixed(2)})`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    if (Math.random() < 0.03) {
      ctx.fillStyle = `rgba(40, 20, 8, 0.55)`;
      ctx.beginPath();
      ctx.arc(tx + (Math.random() - 0.5) * 1.5, ty + (Math.random() - 0.5) * 1.5, 0.7 + Math.random() * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  function ensureSlotCanvases() {
    const slot = slotRef.current;
    if (!slot) return false;
    const r = slot.getBoundingClientRect();
    const w = Math.max(60, Math.floor(r.width));
    const h = Math.max(22, Math.floor(r.height));
    const mc = slotMaskCanvasRef.current;
    const rc = slotRevealCanvasRef.current;
    if (!mc || !rc) return false;
    if (mc.width !== w || mc.height !== h) {
      mc.width = w; mc.height = h;
      const ctx = mc.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.fillRect(0, 0, w, h);
      setSlotMaskUrl(mc.toDataURL());
    }
    if (rc.width !== w || rc.height !== h) {
      rc.width = w; rc.height = h;
      const ctx = rc.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      setSlotRevealUrl(rc.toDataURL());
    }
    return true;
  }

  function resetSlotMasks() {
    const mc = slotMaskCanvasRef.current;
    const rc = slotRevealCanvasRef.current;
    if (mc) {
      const ctx = mc.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.fillRect(0, 0, mc.width, mc.height);
      setSlotMaskUrl(mc.toDataURL());
    }
    if (rc) {
      const ctx = rc.getContext('2d');
      ctx.clearRect(0, 0, rc.width, rc.height);
      setSlotRevealUrl(rc.toDataURL());
    }
    slotScrapeAreaRef.current = 0;
    setSlotScrapeProgress(0);
  }


  function isOverSlot(clientX, clientY) {
    const slot = slotRef.current;
    if (!slot) return false;
    const r = slot.getBoundingClientRect();
    return clientX >= r.left - 6 && clientX <= r.right + 6
        && clientY >= r.top - 6 && clientY <= r.bottom + 6;
  }

  const scrapeSlot = (clientX, clientY) => {
    if (performance.now() < advanceCooldownUntilRef.current) return 0;
    if (slotToken && slotToken.animIn) return 0;
    if (!ensureSlotCanvases()) return 0;
    const slot = slotRef.current;
    const rect = slot.getBoundingClientRect();
    const mc = slotMaskCanvasRef.current;
    const rc = slotRevealCanvasRef.current;
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const cX = sx * (mc.width / rect.width);
    const cY = sy * (mc.height / rect.height);

    const radius = Math.max(14, Math.min(mc.height, mc.width) * 0.55);

    const mctx = mc.getContext('2d');
    lastSlotScrapePosRef.current = { x: cX, y: cY };

    mctx.globalCompositeOperation = 'destination-out';
    const mg = mctx.createRadialGradient(cX, cY, 0, cX, cY, radius);
    mg.addColorStop(0, 'rgba(0,0,0,0.95)');
    mg.addColorStop(0.55, 'rgba(0,0,0,0.65)');
    mg.addColorStop(0.85, 'rgba(0,0,0,0.22)');
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    mctx.fillStyle = mg;
    mctx.beginPath();
    mctx.arc(cX, cY, radius, 0, Math.PI * 2);
    mctx.fill();
    setSlotMaskUrl(mc.toDataURL());

    const rctx = rc.getContext('2d');
    rctx.globalCompositeOperation = 'source-over';
    const rg = rctx.createRadialGradient(cX, cY, 0, cX, cY, radius);
    rg.addColorStop(0, 'rgba(255,255,255,0.95)');
    rg.addColorStop(0.55, 'rgba(255,255,255,0.65)');
    rg.addColorStop(0.85, 'rgba(255,255,255,0.22)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    rctx.fillStyle = rg;
    rctx.beginPath();
    rctx.arc(cX, cY, radius, 0, Math.PI * 2);
    rctx.fill();
    setSlotRevealUrl(rc.toDataURL());

    const frac = measureFractionErased(mc, { x: 0, y: 0, w: mc.width, h: mc.height });
    slotScrapeAreaRef.current = frac;
    setSlotScrapeProgress(frac);
    return frac;
  };

  const SLOT_ADVANCE_THRESHOLD = 0.55;

  function computeMarginaliaPositions(slotRect, manuRect, words, existingResidues) {
    const cx = slotRect.left - manuRect.left + slotRect.width / 2;
    const cy = slotRect.top  - manuRect.top  + slotRect.height / 2;
    const rand = (a, b) => a + Math.random() * (b - a);

    
    const measureCtx = computeMarginaliaPositions._measureCtx || (() => {
      const c = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      return c ? c.getContext('2d') : null;
    })();
    computeMarginaliaPositions._measureCtx = measureCtx;

    const estimateBox = (word, rank0 = false) => {
      const fontSpec = rank0
        ? '700 33px Caveat, cursive'
        : '500 29px Caveat, cursive';
      const labelSpec = 'italic 700 18px "Cormorant Garamond", serif';
      const w0 = word || '';
      let wordW, labelW;
      if (measureCtx) {
        measureCtx.font = fontSpec;
        wordW = measureCtx.measureText(w0).width;
        measureCtx.font = labelSpec;
        labelW = measureCtx.measureText(rank0 ? 'top 1 ' : 'top 2 ').width;
      } else {
        wordW = (w0.length || 6) * (rank0 ? 17 : 14);
        labelW = 54;
      }
      return { w: wordW + labelW + 16, h: rank0 ? 46 : 36 };
    };
    const PAD = 8;
    const MANU_PAD_X = 16;
    const minBoxX = MANU_PAD_X;
    const maxBoxX = Math.max(minBoxX + 100, manuRect.width - MANU_PAD_X);
    const overlaps = (a, b) => !(
      a.x + a.w + PAD < b.x ||
      b.x + b.w + PAD < a.x ||
      a.y + a.h + PAD < b.y ||
      b.y + b.h + PAD < a.y
    );


    const ZONES = {
      upper: { y0: -40, y1: -30, x0: -55, x1:  55 },
      near:  { y0:  26, y1:  38, x0: -55, x1:  55 },
      far:   { y0:  76, y1:  92, x0: -55, x1:  55 },
    };
    const top1Zone = Math.random() < 0.5 ? 'near' : 'far';
    const restPool = ['upper', top1Zone === 'near' ? 'far' : 'near'];
    if (Math.random() < 0.5) restPool.reverse();
    const zoneKeys = [top1Zone, restPool[0], restPool[1]];

    const placed = [];
    if (existingResidues && existingResidues.length) {
      existingResidues.forEach(r => {
        const { w, h } = estimateBox(r.word);
        placed.push({
          x: r.x - w / 2, y: r.y - h / 2, w, h,
          residue: true,
        });
      });
    }

    const newBoxes = [];
    ['t1', 't2', 't3'].forEach((key, i) => {
      const zone = ZONES[zoneKeys[i]];
      const word = (words && words[i]) || '';
      const { w, h } = estimateBox(word, i === 0);
      const x = cx + rand(zone.x0, zone.x1);
      const y = cy + rand(zone.y0, zone.y1);
      const box = {
        x: x - w / 2, y: y - h / 2, w, h,
        residue: false, key, angle: rand(-2, 2),
        zone,
      };
      box.x = Math.max(minBoxX, Math.min(maxBoxX - box.w, box.x));
      newBoxes.push(box);
      placed.push(box);
    });

    const PUSH = 2.5;
    const clampX = (box) => {
      if (box.residue) return;
      box.x = Math.max(minBoxX, Math.min(maxBoxX - box.w, box.x));
    };
    for (let iter = 0; iter < 300; iter++) {
      let moved = false;
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i], b = placed[j];
          if (!overlaps(a, b)) continue;
          const acx = a.x + a.w / 2;
          const bcx = b.x + b.w / 2;
          let dx = acx - bcx;
          if (Math.abs(dx) < 0.5) dx = Math.random() - 0.5;
          const sign = dx >= 0 ? 1 : -1;
          if (!a.residue && !b.residue) {
            a.x += sign * PUSH;
            b.x -= sign * PUSH;
          } else if (!a.residue) {
            a.x += sign * PUSH * 2;
          } else if (!b.residue) {
            b.x -= sign * PUSH * 2;
          }
          moved = true;
        }
      }
      placed.forEach(clampX);
      if (!moved) break;
    }


    const positions = {};
    newBoxes.forEach(nb => {
      positions[nb.key] = {
        x: nb.x + nb.w / 2,
        y: nb.y + nb.h / 2,
        angle: nb.angle,
      };
    });
    return positions;
  }

  const performSlotAdvance = () => {
    if (didActSlotThisDragRef.current) return;
    if (activeLayer <= 0) return;
    didActSlotThisDragRef.current = true;
    didAdvanceThisDragRef.current = true;
    const nextLayer = activeLayer - 1;
    const p = getLayerPredictions(nextLayer);
    const newTop1 = p.top1;
    const newTop2 = p.top2;
    const newTop3 = p.top3;
    if (!newTop1) return;
    const len = newTop1 ? Array.from(newTop1).length : 6;

    const PRE_ADVANCE_MS = 650;
    const maxLen = Math.max(
      Array.from(newTop1 || '').length,
      Array.from(newTop2 || '').length,
      Array.from(newTop3 || '').length
    );
    const MARG_WRITE_MS  = Math.max(680, maxLen * 85 + 340);
    const MARG_DWELL_MS  = 650;
    const MARG_ERASE_MS  = 620;
    const writeMs = 40 + len * 160 + 720;
    advanceCooldownUntilRef.current =
      performance.now() + PRE_ADVANCE_MS + MARG_WRITE_MS + MARG_DWELL_MS + MARG_ERASE_MS + writeMs;
    slotScrapeAreaRef.current = 0;
    setSlotScrapeProgress(0);
    lastSlotScrapePosRef.current = null;
  
    dimScratch(PRE_ADVANCE_MS);

    setTimeout(() => {
      const slotEl = slotRef.current;
      const manuEl = manuscriptRef.current;
      if (!slotEl || !manuEl || !newTop1) {
        setActiveLayer(nextLayer);
        if (newTop1) setSlotToken({ token: newTop1, layer: nextLayer, animIn: true });
        resetSlotMasks();
        setLayerBanner({ layer: nextLayer, from: activeLayer, token: newTop1 || '', stamp: performance.now() });
        return;
      }
   
      const existingResidues = [];
      marginaliaHistory.forEach(entry => {
        const futureAge = nextLayer - entry.layer;
        if (futureAge >= 0 && futureAge <= 2) {
          if (entry.top2 && entry.positions?.t2) {
            existingResidues.push({ word: entry.top2, x: entry.positions.t2.x, y: entry.positions.t2.y });
          }
          if (entry.top3 && entry.positions?.t3) {
            existingResidues.push({ word: entry.top3, x: entry.positions.t3.x, y: entry.positions.t3.y });
          }
        }
      });
      const positions = computeMarginaliaPositions(
        slotEl.getBoundingClientRect(),
        manuEl.getBoundingClientRect(),
        [newTop1, newTop2, newTop3],
        existingResidues
      );
      const stamp = performance.now();

      danceStampRef.current = stamp;
      setMarginaliaActive({
        predictions: { top1: newTop1, top2: newTop2 || '', top3: newTop3 || '' },
        positions,
        phase: 'writing',
        stamp,
        layer: nextLayer,
      });

      setTimeout(() => {
        if (danceStampRef.current !== stamp) return;
        setMarginaliaActive(m => (m && m.stamp === stamp ? { ...m, phase: 'dwelling' } : m));
      }, MARG_WRITE_MS);

      setTimeout(() => {
        if (danceStampRef.current !== stamp) return;
        setMarginaliaActive(m => (m && m.stamp === stamp ? { ...m, phase: 'erasing' } : m));
        animateChalkScrape(positions.t2, newTop2, MARG_ERASE_MS, stamp);
        animateChalkScrape(positions.t3, newTop3, MARG_ERASE_MS, stamp);
      }, MARG_WRITE_MS + MARG_DWELL_MS);

      setTimeout(() => {
        if (danceStampRef.current !== stamp) return;
        setMarginaliaHistory(h => {
          const cutoff = nextLayer - 2;
          const pruned = h.filter(e => e.layer >= cutoff);
          return [
            ...pruned,
            { layer: nextLayer, top2: newTop2 || '', top3: newTop3 || '', positions, stamp },
          ].slice(-6);
        });
        setMarginaliaActive(m => (m && m.stamp === stamp ? { ...m, phase: 'committing' } : m));
        setActiveLayer(nextLayer);
        setSlotToken({ token: newTop1, layer: nextLayer, animIn: true });
        setLayerBanner({ layer: nextLayer, from: activeLayer, token: newTop1, stamp });
        setTimeout(() => {
          if (danceStampRef.current !== stamp) return;
          setMarginaliaActive(m => (m && m.stamp === stamp ? null : m));
          danceStampRef.current = null;
        }, 460);
      }, MARG_WRITE_MS + MARG_DWELL_MS + MARG_ERASE_MS);
    }, PRE_ADVANCE_MS);
  };

  useEffect(() => {
    if (didActSlotThisDragRef.current) return;
    if (performance.now() < advanceCooldownUntilRef.current) return;
    if (slotScrapeProgress < SLOT_ADVANCE_THRESHOLD) return;
    if (activeLayer <= 0) return;
 
    pendingSlotAdvanceRef.current = true;
  }, [slotScrapeProgress, activeLayer]);

  useEffect(() => {
    if (!slotToken || !slotToken.animIn) return;
    const len = Array.from(slotToken.token || '').length;
    const drawMs = Math.max(780, len * 160);
    const duration = drawMs + 360 + 40;
    const t = setTimeout(() => {
      setSlotToken(s => s ? { ...s, animIn: false } : s);
    }, duration);
    return () => clearTimeout(t);
  }, [slotToken]);

  useEffect(() => {
    if (!layerBanner) return;
    const t = setTimeout(() => setLayerBanner(null), 2400);
    return () => clearTimeout(t);
  }, [layerBanner]);

  useEffect(() => {
    setMarginaliaHistory(h => {
      const cutoff = activeLayer - 2;
      const next = h.filter(e => e.layer >= cutoff && e.layer <= activeLayer);
      return next.length === h.length ? h : next;
    });
  }, [activeLayer]);

  useEffect(() => {
    const top1 = getLayerPredictions(N_LAYERS - 1).top1;
    if (top1) setSlotToken({ token: top1, layer: N_LAYERS - 1, animIn: true });
    else setSlotToken(null);

  }, [presetKey]);

  useEffect(() => {
    resetSlotMasks();
    const top1 = getLayerPredictions(activeLayer).top1;
    if (top1) {
      setSlotToken(s => {
        if (s && s.token === top1 && s.layer === activeLayer) return s;
        return { token: top1, layer: activeLayer, animIn: false };
      });
    }

  }, [activeLayer, predictData]);

  /* --------- handlers --------- */
  const onManuMouseMove = (e) => {
    setCursor({ x: e.clientX, y: e.clientY, visible: true });
    if (tool === 'scraper' && isDraggingRef.current) {
      if (isOverSlot(e.clientX, e.clientY)) {
        scrapeSlot(e.clientX, e.clientY);
        drawScratch(e.clientX, e.clientY);
      } else {
        drawScratch(e.clientX, e.clientY);
      }
    } else if (tool === 'gloss' && penPathRef.current.active) {
      const prev = penPathRef.current.last;
      const curr = { x: e.clientX, y: e.clientY };
      if (prev) {
        drawInkSegment(prev, curr);
        penPathRef.current.totalDist += Math.hypot(curr.x - prev.x, curr.y - prev.y);
      }
      penPathRef.current.last = curr;
    }
  };


  const commitPendingAdvance = () => {
    if (performance.now() < advanceCooldownUntilRef.current) {
      pendingSlotAdvanceRef.current = false;
      return;
    }
    if (pendingSlotAdvanceRef.current) {
      pendingSlotAdvanceRef.current = false;
      performSlotAdvance();
    }
  };

  const endDragSession = () => {
    isDraggingRef.current = false;
    setScraping(false);
    didAdvanceThisDragRef.current = false;
    didActSlotThisDragRef.current = false;
    pendingSlotAdvanceRef.current = false;
    slotScrapeAreaRef.current = 0;
    setSlotScrapeProgress(0);
    lastSlotScrapePosRef.current = null;
  };

  const onManuMouseLeave = () => {
    setCursor(c => ({ ...c, visible: false }));
    if (isDraggingRef.current) commitPendingAdvance();
    endDragSession();
    penPathRef.current.active = false;
    penPathRef.current.last = null;
  };

  const onManuMouseDown = (e) => {
    if (e.target.closest('.annotation') || e.target.closest('.tok')) return;
    if (tool === 'scraper') {
      isDraggingRef.current = true;
      setScraping(true);
      didAdvanceThisDragRef.current = false;
      didActSlotThisDragRef.current = false;
      pendingSlotAdvanceRef.current = false;
      slotScrapeAreaRef.current = 0;
      setSlotScrapeProgress(0);

      if (performance.now() < advanceCooldownUntilRef.current) return;
      if (slotToken && slotToken.animIn) return;
      if (isOverSlot(e.clientX, e.clientY)) {
        ensureSlotCanvases();
        scrapeSlot(e.clientX, e.clientY);
        drawScratch(e.clientX, e.clientY);
      } else {
        drawScratch(e.clientX, e.clientY);
      }
    } else if (tool === 'gloss') {
      if (e.target.closest('.token-slot')) return;
      penPathRef.current = {
        active: true,
        last: { x: e.clientX, y: e.clientY },
        totalDist: 0,
        downPos: { x: e.clientX, y: e.clientY },
      };
    }
  };

  const onManuMouseUp = (e) => {
    if (isDraggingRef.current) {
      commitPendingAdvance();
      endDragSession();
    }
    if (penPathRef.current.active) {
      const { totalDist, downPos } = penPathRef.current;
      penPathRef.current.active = false;
      penPathRef.current.last = null;
      if (totalDist < 6 && downPos) {
        addAnnotation(downPos.x, downPos.y);
      }
    }
  };

  const addAnnotation = (clientX, clientY) => {
    const m = manuscriptRef.current;
    if (!m) return;
    const rect = m.getBoundingClientRect();
    const x = clientX - rect.left - 10;
    const y = clientY - rect.top - 18;
    const id = Date.now() + Math.random();
    setAnnotations(prev => [
      ...prev,
      { id, x, y, text: '', editing: true, layerAt: activeLayer },
    ]);
  };

  const updateAnnotation = (id, patch) =>
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  const commitAnnotation = (id) => {
    setAnnotations(prev => prev
      .map(a => a.id === id ? { ...a, editing: false } : a)
      .filter(a => a.id !== id || a.text.trim() !== '')
    );
  };
  const deleteAnnotation = (id) =>
    setAnnotations(prev => prev.filter(a => a.id !== id));

  const renderBaseText = () => {
    let nodes;
    if (lastBpeRange) {
      const before = preset.text.slice(0, lastBpeRange.start);
      const full = preset.text.slice(lastBpeRange.start, lastBpeRange.end);
      const leadWs = (full.match(/^\s*/) || [''])[0];
      const body = full.slice(leadWs.length);
      nodes = [
        <span key="pre">{before}{leadWs}</span>,
        <span
          key="tok"
          className={cx('tok', 'selected')}
          title="last token — the model's predictions continue after this"
        >{body}</span>,
      ];
    } else {
      nodes = tokens.map((t, i) => {
        if (!t.isWord) return <span key={i}>{t.text}</span>;
        if (i !== lastWordIdx) return <span key={i}>{t.text}</span>;
        return (
          <span
            key={i}
            className={cx('tok', 'selected')}
            title="selected token — the model's predictions continue after this token"
          >{t.text}</span>
        );
      });
    }


    const underneathToken = (() => {
      if (activeLayer <= 0) return null;
      return getLayerPredictions(activeLayer - 1).top1 || null;
    })();

    nodes.push(
      <span key="__slot" className="token-slot-wrap">
        {'\u00A0'}
        <span
          className={cx('token-slot', slotToken && 'has-token')}
          ref={slotRef}
          onClick={(e) => e.stopPropagation()}
          title="scrape to peel back to the previous layer"
        >
          {underneathToken && (
            <span className="slot-under is-ghost" aria-hidden="true">
              {underneathToken}
            </span>
          )}
          {underneathToken && slotRevealUrl && (
            <span
              className="slot-under"
              style={{
                WebkitMaskImage: `url(${slotRevealUrl})`,
                maskImage: `url(${slotRevealUrl})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
              aria-hidden="true"
            >
              {underneathToken}
            </span>
          )}

          {slotToken ? (() => {
            const token = slotToken.token;
            const animating = !!slotToken.animIn;
            return (
              <span
                key={slotToken.layer + '-' + slotToken.token}
                className={cx('slot-current', animating && 'inking-in')}
                style={slotMaskUrl ? {
                  WebkitMaskImage: `url(${slotMaskUrl})`,
                  maskImage: `url(${slotMaskUrl})`,
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                } : {}}
                title={`layer ${String(slotToken.layer).padStart(2,'0')}`}
              >
                <span className="slot-text-slot">
                  <span className="slot-text-html">{token}</span>
                </span>
                <span className="slot-layer-tag">ℓ{String(slotToken.layer).padStart(2,'0')}</span>
              </span>
            );
          })() : (
            <span className="slot-empty">◌</span>
          )}
        </span>
      </span>
    );

    return nodes;
  };

  /* --------- marginalia pages --------- */
  const PAGES = useMemo(() => [
    { title: 'instructions', label: 'instructions' },
    { title: 'glosses', label: 'glosses made here' },
    ...Array.from({ length: N_NOTE_PAGES }, (_, i) => ({
      title: `folio ${['i','ii','iii','iv','v'][i] || (i+1)}`,
      label: `blank note page ${i + 1}`,
    })),
  ], []);

  const goPrev = () => setMarginPage(p => Math.max(0, p - 1));
  const goNext = () => setMarginPage(p => Math.min(PAGES.length - 1, p + 1));

  const updateNotePage = (i, value) =>
    setNotePages(prev => prev.map((n, j) => j === i ? value : n));

  /* --------- render --------- */
  return (
    <div className="app">
      <div className="toolbar">
        <div className="toolbar-title">
          <span className="toolbar-title-main">
            <span>Layer</span>
            <span className="toolbar-title-sep">·</span>
            <span>Palimpsest</span>
          </span>
          <span className="toolbar-title-sub">an interpretative interface</span>
        </div>

        <div className="toolbar-section">
          <span className="toolbar-label">passage</span>
          <div className={cx('preset-dropdown', presetDropdownOpen && 'open')}>
            <button
              type="button"
              className="preset-dropdown-trigger"
              aria-haspopup="listbox"
              aria-expanded={presetDropdownOpen}
              onClick={() => setPresetDropdownOpen(v => !v)}
            >
              <span className="preset-drop-glyph">❧</span>
              <span className="preset-drop-label">
                <span className="preset-drop-eyebrow">chosen passage</span>
                <span className="preset-drop-title">
                  {PRESETS[presetKey]?.label || 'select'}
                </span>
              </span>
              <span className="preset-drop-chevron" aria-hidden="true">
                <svg viewBox="0 0 12 8"><path d="M1 1 L6 7 L11 1"
                  stroke="currentColor" strokeWidth="1.3" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </button>
            {presetDropdownOpen && (
              <>
                <div
                  className="preset-dropdown-scrim"
                  onClick={() => setPresetDropdownOpen(false)}
                  aria-hidden="true"
                />
                <ul className="preset-dropdown-panel" role="listbox">
                  <li className="preset-drop-panel-title">choose a passage</li>
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <li
                      key={key}
                      role="option"
                      aria-selected={key === presetKey}
                      className={cx('preset-drop-item', key === presetKey && 'active')}
                      onClick={() => {
                        loadPreset(key);
                        setPresetDropdownOpen(false);
                      }}
                    >
                      <span className="preset-drop-item-glyph">
                        {key === presetKey ? '✦' : '❧'}
                      </span>
                      <span className="preset-drop-item-body">
                        <span className="preset-drop-item-label">{p.label}</span>
                        <span className="preset-drop-item-preview">
                          {(p.text || '').slice(0, 56)}
                          {(p.text || '').length > 56 ? '…' : ''}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="divider" />

        <div className="toolbar-section">
          <button
            className={cx('tool-btn', tool === 'scraper' && 'active')}
            onClick={() => setTool('scraper')}
            title="drag across the last token to scrape its ink away"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 14 L22 16 L22 18 L15 17 Z" fill="rgba(200,170,100,0.3)"/>
              <path d="M14 14 L2 4 L4 2 L16 14 Z" fill="rgba(220,225,225,0.25)"/>
              <path d="M2 4 L14 14"/>
              <path d="M4 2 L16 14"/>
              <rect x="12" y="13" width="3" height="4" transform="rotate(-40 13 14)" fill="rgba(200,170,100,0.45)"/>
            </svg>
            <span className="tool-btn-rule" aria-hidden="true" />
            Scraper
          </button>
          <button
            className={cx('tool-btn', tool === 'gloss' && 'active')}
            onClick={() => setTool('gloss')}
            title="click to annotate; drag to write over parchment"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 2 Q 23 4 22 7 L 10 19 L 5 21 L 7 16 Z" fill="rgba(220,200,145,0.3)"/>
              <path d="M18 4 L22 8"/>
              <path d="M7 16 L5 21 L10 19"/>
              <path d="M9 18 L2 22" strokeWidth="0.6" opacity="0.7"/>
            </svg>
            <span className="tool-btn-rule" aria-hidden="true" />
            Quill pen
          </button>
        </div>

        <div className="divider" />

        <div className="layer-control">
          <span className="toolbar-label">layer</span>
          <input
            type="range" min="0" max={N_LAYERS - 1}
            className="layer-slider"
            value={activeLayer}
            onChange={e => {
              danceStampRef.current = null;
              setMarginaliaActive(null);
              setActiveLayer(parseInt(e.target.value, 10));
            }}
          />
          <span
            key={`readout-${activeLayer}`}
            className="layer-indicator pulse"
          >
            {String(activeLayer).padStart(2, '0')}
            <small> / {String(N_LAYERS - 1).padStart(2, '0')}</small>
          </span>
        </div>
      </div>

      <div className="manuscript-wrap">
        <div className="manuscript-frame">
          <div
            className={cx(
              'manuscript',
              tool === 'scraper' && 'scraper-active',
              tool === 'gloss' && 'gloss-active',
            )}
            ref={manuscriptRef}
            onMouseMove={onManuMouseMove}
            onMouseLeave={onManuMouseLeave}
            onMouseDown={onManuMouseDown}
            onMouseUp={onManuMouseUp}
          >
            <PalimpsestTraces />

            <div className="torn-fibers" aria-hidden="true">
              <svg viewBox="0 0 1000 1400" preserveAspectRatio="none">
                <defs>
                  <filter id="fiberBlur" x="-5%" y="-5%" width="110%" height="110%">
                    <feGaussianBlur stdDeviation="0.4" />
                  </filter>
                  <linearGradient id="fiberTan" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="rgba(60,36,14,0.9)" />
                    <stop offset="0.5" stopColor="rgba(120,88,40,0.55)" />
                    <stop offset="1" stopColor="rgba(60,36,14,0)" />
                  </linearGradient>
                </defs>
                <g filter="url(#fiberBlur)" stroke="url(#fiberTan)" strokeWidth="0.55" fill="none" opacity="0.9">

                  <path d="M 12 20  q 3 -10 6 2 q 4 -6 2 6" />
                  <path d="M 46 14  q 2 -8 5 1 q 4 -5 3 5" />
                  <path d="M 88 10  q 3 -6 6 2" />
                  <path d="M 138 22 q 2 -12 6 0 q 4 -4 2 4" />
                  <path d="M 184 14 q 2 -10 5 2" />
                  <path d="M 236 20 q 3 -14 7 2 q 2 -3 1 6" />
                  <path d="M 290 10 q 3 -10 7 4" />
                  <path d="M 348 24 q 2 -14 6 0 q 3 -4 0 6" />
                  <path d="M 404 12 q 2 -8 4 2" />
                  <path d="M 466 18 q 4 -18 8 0 q 3 -6 1 6" />
                  <path d="M 528 10 q 3 -10 7 4" />
                  <path d="M 586 22 q 2 -14 6 2" />
                  <path d="M 648 16 q 2 -8 5 0" />
                  <path d="M 710 10 q 3 -10 6 2" />
                  <path d="M 768 20 q 2 -12 6 0 q 2 -4 0 6" />
                  <path d="M 828 12 q 2 -8 4 2" />
                  <path d="M 886 18 q 3 -12 6 2" />
                  <path d="M 938 10 q 2 -8 5 2" />
                  <path d="M 986 70  q 10 2 -2 5" />
                  <path d="M 980 140 q 12 3 -2 6 q 6 4 -4 3" />
                  <path d="M 986 220 q 10 2 -3 5" />
                  <path d="M 984 310 q 14 3 -2 7" />
                  <path d="M 982 400 q 10 2 -3 4" />
                  <path d="M 960 566 q 14 1 18 10 q -10 4 -20 -2" />
                  <path d="M 985 640 q 10 2 -2 5" />
                  <path d="M 982 720 q 12 3 -3 6" />
                  <path d="M 986 800 q 10 2 -2 5" />
                  <path d="M 982 880 q 14 3 -3 6" />
                  <path d="M 985 960 q 10 2 -2 5" />
                  <path d="M 982 1040 q 12 3 -2 6" />
                  <path d="M 985 1120 q 10 2 -3 4" />
                  <path d="M 982 1200 q 12 3 -2 6" />
                  <path d="M 940 1384 q -2 10 -5 -2 q -3 6 -1 -6" />
                  <path d="M 880 1390 q -2 12 -6 0 q -3 6 -1 -6" />
                  <path d="M 820 1378 q -2 10 -5 -2" />
                  <path d="M 760 1390 q -3 14 -7 -2" />
                  <path d="M 700 1380 q -2 10 -5 -2" />
                  <path d="M 640 1394 q -3 16 -7 0 q -2 5 0 -6" />
                  <path d="M 580 1376 q -2 10 -5 -2" />
                  <path d="M 520 1390 q -3 14 -7 -2" />
                  <path d="M 460 1384 q -2 12 -6 0" />
                  <path d="M 400 1394 q -3 16 -7 -2 q -2 6 0 -7" />
                  <path d="M 340 1384 q -2 10 -5 -2" />
                  <path d="M 280 1392 q -3 14 -7 0" />
                  <path d="M 220 1382 q -2 10 -5 -2" />
                  <path d="M 160 1394 q -3 16 -7 -2" />
                  <path d="M 100 1384 q -2 12 -5 -2" />
                  <path d="M 50  1390 q -3 10 -6 -2" />
                  <path d="M 14 80  q -10 2 2 5" />
                  <path d="M 18 160 q -12 3 2 6 q -6 4 4 3" />
                  <path d="M 14 240 q -10 2 3 5" />
                  <path d="M 16 330 q -14 3 2 7" />
                  <path d="M 18 420 q -10 2 3 4" />
                  <path d="M 40 580 q -16 2 -20 10 q 10 4 22 -2" />
                  <path d="M 15 660 q -10 2 2 5" />
                  <path d="M 18 740 q -12 3 3 6" />
                  <path d="M 14 820 q -10 2 2 5" />
                  <path d="M 18 900 q -14 3 3 6" />
                  <path d="M 15 980 q -10 2 2 5" />
                  <path d="M 18 1060 q -12 3 2 6" />
                  <path d="M 15 1140 q -10 2 3 4" />
                  <path d="M 18 1220 q -12 3 2 6" />
                </g>
                <g opacity="0.52" fill="rgba(50,30,14,0.4)">
                  <path d="M 2 340 q 10 -4 16 8 q -6 10 -18 4 Z" />
                  <path d="M 978 560 q -14 -6 -20 6 q 6 12 22 2 Z" />
                  <path d="M 420 1388 q 10 -14 26 -4 q -6 12 -24 10 Z" />
                  <path d="M 100 18 q 14 -10 20 6 q -8 10 -22 2 Z" />
                  <path d="M 680 20 q 12 -8 22 4 q -6 10 -20 2 Z" />
                </g>
                <g stroke="rgba(70,46,22,0.10)" strokeWidth="0.4" fill="none">
                  <line x1="40" y1="180" x2="960" y2="176" />
                  <line x1="40" y1="320" x2="960" y2="318" />
                  <line x1="40" y1="460" x2="960" y2="458" />
                  <line x1="40" y1="600" x2="960" y2="598" />
                  <line x1="40" y1="740" x2="960" y2="742" />
                  <line x1="40" y1="880" x2="960" y2="878" />
                  <line x1="40" y1="1020" x2="960" y2="1022" />
                  <line x1="40" y1="1160" x2="960" y2="1158" />
                </g>
                <g stroke="rgba(70,46,22,0.07)" strokeWidth="0.35" fill="none">
                  <line x1="260" y1="40" x2="260" y2="1360" />
                  <line x1="500" y1="40" x2="500" y2="1360" />
                  <line x1="740" y1="40" x2="740" y2="1360" />
                </g>
              </svg>
            </div>

            <div className="ruling-lines" aria-hidden="true"></div>
            <div className="manuscript-flourish flourish-pentest" aria-hidden="true">
              <svg viewBox="0 0 120 60">
                <path d="M4 40 q 14 -30 28 -6 q 14 -24 30 -4 q 12 -20 26 -2"
                  stroke="rgba(80,40,16,0.55)" strokeWidth="1" fill="none"/>
                <path d="M6 50 q 10 -12 20 -4"
                  stroke="rgba(80,40,16,0.38)" strokeWidth="0.7" fill="none"/>
              </svg>
            </div>
            <div className="manuscript-flourish flourish-catchword" aria-hidden="true">
            </div>
            <div className="manuscript-flourish flourish-knot" aria-hidden="true">
              <svg viewBox="0 0 80 80">
                <path d="M40 10 C 12 10 12 38 40 38 C 68 38 68 66 40 66 C 12 66 12 38 40 38"
                  stroke="rgba(136,22,26,0.35)" strokeWidth="1" fill="none"/>
                <path d="M40 10 C 68 10 68 38 40 38 C 12 38 12 66 40 66"
                  stroke="rgba(176,139,42,0.4)" strokeWidth="1" fill="none"/>
                <circle cx="40" cy="38" r="2" fill="rgba(136,22,26,0.55)"/>
              </svg>
            </div>

            <div className="blot" style={{ top: 60, right: 80, width: 8, height: 8 }} />
            <div className="blot" style={{ top: 230, left: 54, width: 5, height: 5 }} />
            <div className="blot" style={{ bottom: 110, right: 130, width: 5, height: 4 }} />
            <div className="blot" style={{ bottom: 200, left: 78, width: 10, height: 7, transform: 'rotate(18deg)' }} />
            <div className="blot" style={{ top: 420, right: 200, width: 3, height: 3 }} />
            <div className="wormhole" style={{ top: '36%', right: '18%', width: 5, height: 7, transform: 'rotate(14deg)' }} />
            <div className="wormhole" style={{ top: '64%', left: '22%', width: 4, height: 5 }} />
            <div className="wormhole" style={{ top: '52%', left: '54%', width: 3, height: 4 }} />

            <svg className="illumination" viewBox="0 0 78 78">
              <path d="M4 74 Q 4 4 74 4" stroke="#88161a" strokeWidth="1" fill="none" opacity="0.75"/>
              <path d="M10 74 Q 10 10 74 10" stroke="#88161a" strokeWidth="0.55" fill="none" opacity="0.55"/>
              <circle cx="9" cy="69" r="3.2" fill="#b08b2a" stroke="#5a0d10" strokeWidth="0.45"/>
              <circle cx="9" cy="69" r="1.3" fill="#d9b453"/>
              <path d="M11 67 Q 30 48 54 24 Q 62 16 70 8" stroke="#b08b2a" strokeWidth="0.7" fill="none" opacity="0.72"/>
              <path d="M28 50 q -6 -3 -3 -9 q 6 3 3 9 Z" fill="#6b7a1f" opacity="0.72" stroke="#3a4a0a" strokeWidth="0.3"/>
              <path d="M44 34 q -3 -7 2 -9 q 3 7 -2 9 Z" fill="#6b7a1f" opacity="0.72" stroke="#3a4a0a" strokeWidth="0.3"/>
              <path d="M60 18 q -7 -2 -5 -8 q 7 2 5 8 Z" fill="#88161a" opacity="0.75" stroke="#5a0d10" strokeWidth="0.3"/>
              <circle cx="22" cy="58" r="0.9" fill="#d9b453"/>
              <circle cx="36" cy="42" r="0.9" fill="#d9b453"/>
              <circle cx="52" cy="26" r="0.9" fill="#d9b453"/>
              <path d="M6 36 q 4 -6 10 -2 q -4 6 -10 2 Z" fill="#88161a" opacity="0.45" stroke="#5a0d10" strokeWidth="0.25"/>
              <path d="M44 66 q 6 -4 2 -10 q -6 4 -2 10 Z" fill="#6b7a1f" opacity="0.55" stroke="#3a4a0a" strokeWidth="0.25"/>
            </svg>
            <svg className="illumination-br" viewBox="0 0 70 70">
              <path d="M4 66 Q 4 4 66 4" stroke="#88161a" strokeWidth="0.8" fill="none" opacity="0.55"/>
              <circle cx="9" cy="61" r="2.5" fill="#b08b2a" opacity="0.7"/>
              <path d="M11 59 Q 30 40 62 8" stroke="#b08b2a" strokeWidth="0.55" fill="none" opacity="0.55"/>
              <path d="M26 44 q -5 -3 -3 -8 q 5 3 3 8 Z" fill="#6b7a1f" opacity="0.55" stroke="#3a4a0a" strokeWidth="0.25"/>
            </svg>

            <div className="folio-mark">
              layer {String(activeLayer + 1).padStart(2, '0')} of xij
            </div>

            {layerBanner && (
              <div className="layer-banner-wrap" aria-live="polite">
                <div key={layerBanner.stamp} className="layer-banner">
                  <span className="banner-layer">
                    layer&nbsp;<strong>ℓ{String(layerBanner.layer).padStart(2, '0')}</strong>
                    {typeof layerBanner.from === 'number' && (
                      <>
                        <span className="banner-arrow">←</span>
                        <span className="banner-from">ℓ{String(layerBanner.from).padStart(2, '0')}</span>
                      </>
                    )}
                  </span>
                  {layerBanner.token && <span className="banner-sep" />}
                  {layerBanner.token && (
                    <span className="banner-token">{layerBanner.token}</span>
                  )}
                </div>
              </div>
            )}

            <div className="base-text">{renderBaseText()}</div>
            <div className="marg-stage" aria-hidden="true">
              {marginaliaHistory.map(entry => {
                const age = activeLayer - entry.layer;
                if (age < 0 || age > 2) return null;
                const baseOpacity = age === 0 ? 0.26 : age === 1 ? 0.18 : 0.09;
                return (
                  <React.Fragment key={`hist-${entry.stamp}`}>
                    {entry.top2 && (
                      <span
                        className="marg-residue"
                        style={{
                          left: entry.positions.t2.x + 'px',
                          top:  entry.positions.t2.y + 'px',
                          transform: `translate(-50%, -50%) rotate(${entry.positions.t2.angle}deg)`,
                          opacity: baseOpacity,
                        }}
                      ><span className="marg-rank">top 2</span>{entry.top2}</span>
                    )}
                    {entry.top3 && (
                      <span
                        className="marg-residue"
                        style={{
                          left: entry.positions.t3.x + 'px',
                          top:  entry.positions.t3.y + 'px',
                          transform: `translate(-50%, -50%) rotate(${entry.positions.t3.angle}deg)`,
                          opacity: baseOpacity * 0.85,
                        }}
                      ><span className="marg-rank">top 3</span>{entry.top3}</span>
                    )}
                  </React.Fragment>
                );
              })}

              {marginaliaActive && (() => {
                const { predictions, positions, phase, stamp } = marginaliaActive;
                const stageFor = (rank) => {
                  if (phase === 'writing')  return 'is-writing';
                  if (phase === 'dwelling') return 'is-dwelling';
                  if (phase === 'erasing')  return rank === 1 ? 'is-settling' : 'is-erasing';
                  return 'is-transferring';
                };
                const renderNote = (rank, word, pos) => {
                  if (!word) return null;

                  if (phase === 'committing' && rank !== 1) return null;
                  const writing = phase === 'writing';
                  const len = Array.from(word).length;
                  const drawMs = Math.max(500, len * 85);
                  const fillMs = 280;
                  const rankGlyph = `top ${rank}`;
                  return (
                    <span
                      key={`t${rank}-${stamp}`}
                      className={`marg-note ${stageFor(rank)} ${rank === 1 ? 'is-top1' : ''}`}
                      style={{
                        left: pos.x + 'px',
                        top:  pos.y + 'px',
                        transform: `translate(-50%, -50%) rotate(${pos.angle}deg)`,
                      }}
                    >
                      <span className="marg-rank">{rankGlyph}</span>
                      <span className="marg-text-slot">
                        <span className={`marg-text-html ${writing ? 'is-animating' : ''}`}>{word}</span>
                        {writing && (
                          <svg className="marg-text-overlay drawing" aria-hidden="true" overflow="visible">
                            <text
                              x="0"
                              y="0.82em"
                              pathLength="100"
                              style={{
                                animationDuration: `${drawMs}ms, ${fillMs}ms`,
                                animationDelay: `0ms, ${Math.max(0, drawMs - 100)}ms`,
                              }}
                            >{word}</text>
                          </svg>
                        )}
                      </span>
                    </span>
                  );
                };
                return (
                  <>
                    {renderNote(1, predictions.top1, positions.t1)}
                    {renderNote(2, predictions.top2, positions.t2)}
                    {renderNote(3, predictions.top3, positions.t3)}
                  </>
                );
              })()}
            </div>


            <canvas ref={scratchCanvasRef} className="overlay-canvas scratch-canvas" />

            <canvas ref={inkCanvasRef} className="overlay-canvas ink-canvas" />

            {annotations.map(a => (
              <Annotation
                key={a.id}
                ann={a}
                onUpdate={(patch) => updateAnnotation(a.id, patch)}
                onCommit={() => commitAnnotation(a.id)}
                onDelete={() => deleteAnnotation(a.id)}
              />
            ))}

            <div className="manuscript-foot">
              layer {String(activeLayer).padStart(2, '0')} of xij · token ‘{selectedToken}’ · {annotations.length} {annotations.length === 1 ? 'gloss' : 'glosses'}
            </div>
          </div>
        </div>

        <aside className="marginalia">
          <div className="margin-nav">
            <button
              className="margin-nav-btn"
              onClick={goPrev}
              disabled={marginPage === 0}
              title="previous page"
            >‹</button>
            <div className="margin-title">{PAGES[marginPage].title}</div>
            <button
              className="margin-nav-btn"
              onClick={goNext}
              disabled={marginPage === PAGES.length - 1}
              title="next page"
            >›</button>
          </div>
          <div className="margin-page-indicator">
            page {marginPage + 1} of {PAGES.length} — {PAGES[marginPage].label}
          </div>

          <div className="margin-body">
            {marginPage === 0 && (
              <div className="instructions">
                <p>
                  This page shows a language model reading itself across twelve layers for the chosen token. At the end of the passage sits a <i>token slot</i> — the word the current layer would produce next, inked in red.
                </p>
                <p>
                  <span className="glyph">✢</span> <span className="tool-name">Scraper.</span> Drag across the token to scrape it. A sustained scrape moves the model back one layer and writes the previous layer’s prediction into the slot.
                </p>
                <p>
                  <span className="glyph">✢</span> <span className="tool-name">Layer slider.</span> Slide through the twelve layers. The slot reflects the selected layer’s prediction.
                </p>
                <p>
                  <span className="glyph">✢</span> <span className="tool-name">Gloss pen.</span> Click anywhere on the parchment to leave a marginal note or drag to write directly on the page.
                </p>
                <p>
                  <span className="glyph">✢</span> <span className="tool-name">Token.</span> The last token of the passage is selected. The slot shows the model’s prediction for the token that follows.
                </p>
                <hr />
                <p className="quiet">Loading a new passage begins a fresh parchment.</p>
              </div>
            )}

            {marginPage === 1 && (
              <div className="instructions">
                {annotations.length === 0 ? (
                  <p className="quiet">No glosses yet. Switch to the gloss pen and click anywhere on the parchment to leave a marginal note.</p>
                ) : (
                  <>
                    <div className="gloss-list-title">thy glosses</div>
                    {annotations.map(a => (
                      <div key={a.id} className="marginalia-note">
                        <span className="marginalia-layer">
                          written at layer {String(a.layerAt).padStart(2, '0')}
                        </span>
                        {a.text || <i style={{ opacity: 0.6 }}>(empty gloss)</i>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {marginPage >= 2 && (
              <div className="note-page">
                <textarea
                  className="note-page-textarea"
                  value={notePages[marginPage - 2] || ''}
                  onChange={(e) => updateNotePage(marginPage - 2, e.target.value)}
                  placeholder="…thy thoughts, in thine own hand."
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </aside>
      </div>

      <canvas ref={slotMaskCanvasRef} style={{ display: 'none' }} />
      <canvas ref={slotRevealCanvasRef} style={{ display: 'none' }} />

      {cursor.visible && tool === 'scraper' && (
        <ScraperCursor x={cursor.x} y={cursor.y} active={scraping} />
      )}
      {cursor.visible && tool === 'gloss' && (
        <PenCursor x={cursor.x} y={cursor.y} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);