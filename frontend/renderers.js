// =======================================================
// Polly – Renderer Functions
// Responsible for drawing content INSIDE each plane
// Used by Trace view and Attention view
// =======================================================



// =======================================================
// TRACE VIEW
// Draw trajectory dots based on x,y positions
// =======================================================

export function renderDots(layer, positions, tokenColors) {

  const content = document.getElementById(`plane-content-${layer}`);
  if (!content) return;

  // clear previous dots
  content.innerHTML = "";

  positions.forEach(({ tokenIdx, x, y, opacity }) => {

    const dot = document.createElement("div");

    dot.className = "trajectory-dot";

    // convert normalized coordinates to percentage
    dot.style.left = `${x * 100}%`;
    dot.style.top = `${y * 100}%`;

    // token color
    if (tokenColors && tokenColors[tokenIdx]) {
      dot.style.background = tokenColors[tokenIdx];
    }

    // opacity for fading trajectory
    if (opacity !== undefined) {
      dot.style.opacity = opacity;
    }

    content.appendChild(dot);
  });

}



// =======================================================
// ATTENTION VIEW
// Render attention heatmap grid
// =======================================================

export function renderHeatmap(layer, matrix) {

  const content = document.getElementById(`plane-content-${layer}`);
  if (!content) return;

  // clear previous grid
  content.innerHTML = "";

  const n = matrix.length;

  const grid = document.createElement("div");
  grid.className = "heatmap-grid";

  // dynamic grid size
  grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${n}, 1fr)`;

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {

      const cell = document.createElement("div");
      cell.className = "heatmap-cell";

      // attention intensity
      cell.style.opacity = value;

      // tooltip (optional but very helpful)
      cell.title = `token ${i} → token ${j}\nattention: ${value.toFixed(3)}`;

      grid.appendChild(cell);

    });
  });

  content.appendChild(grid);

}