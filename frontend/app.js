let currentText = '';
let currentTokens = [];
let selectedIndices = new Set();

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function updateTraceButton() {
  const btn = document.getElementById('trace-btn');
  if (!btn) return;
  btn.style.display = selectedIndices.size >= 1 ? 'inline-block' : 'none';
}

document.getElementById('tokenize-btn').addEventListener('click', async function () {
  const text = document.getElementById('text-input').value;
  const data = await tokenize(text);
  console.log(data);
 
  currentText = text;
  currentTokens = data.tokens;
  selectedIndices.clear();
 
  const container = document.getElementById('screen-tokens');
  container.innerHTML = '';
 
  data.tokens.forEach(function (token, index) {
    const span = document.createElement('span');
    span.className = 'token-chip';
    span.textContent = token.token_str;
    if (token.token_str === '<|endoftext|>') {
    span.classList.add('token-bos');
    } else {
      span.addEventListener('click', function () {
        if (span.classList.contains('selected')) {
          span.classList.remove('selected');
          selectedIndices.delete(index);
        } else {
          if (selectedIndices.size >= 3) return; // max 3
          span.classList.add('selected');
          selectedIndices.add(index);
        }
        updateTraceButton();
      });
    }
    container.appendChild(span)
  });

  const traceBtn = document.createElement('button');
  traceBtn.id = 'trace-btn';
  traceBtn.textContent = 'Trace';
  traceBtn.style.display = 'none';
  traceBtn.addEventListener('click', function () {
    showScreen('screen-trace');
  });
  container.appendChild(traceBtn);
 
  updateTraceButton();
  showScreen('screen-tokens');
});

async function tokenize(text) {
  try {
    const res = await fetch('http://localhost:5001/tokenize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return res.json();
  } catch {
    const res = await fetch('../examples/example1_tokenize.json');
    return res.json();
  }
}
