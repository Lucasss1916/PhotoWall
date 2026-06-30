import { state } from './state.js';
import { rand } from './utils.js';

// 超过此数量后开始允许覆盖
const OVERLAP_THRESHOLD = 12;
// 最大允许覆盖比例（相对于较小那张照片面积）
const MAX_OVERLAP = 0.35;

function allowedOverlapRatio(n) {
  if (n <= OVERLAP_THRESHOLD) return 0;
  const excess = n - OVERLAP_THRESHOLD;
  return Math.min(MAX_OVERLAP, (excess / OVERLAP_THRESHOLD) * MAX_OVERLAP);
}

function intersectArea(a, b) {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

function findPosition(sw, sh, placed, maxOverlapRatio, maxTries = 80) {
  const { canvasW, canvasH } = state;
  const margin = Math.min(canvasW, canvasH) * 0.02;
  const minX = sw / 2 + margin;
  const maxX = canvasW - sw / 2 - margin;
  const minY = sh / 2 + margin;
  const maxY = canvasH - sh / 2 - margin;

  if (maxX < minX || maxY < minY) {
    return { x: rand(sw / 2, canvasW - sw / 2), y: rand(sh / 2, canvasH - sh / 2) };
  }

  let best = null;
  let bestOverlap = Infinity;

  for (let t = 0; t < maxTries; t++) {
    const cx = rand(minX, maxX);
    const cy = rand(minY, maxY);
    const box = { x: cx - sw / 2, y: cy - sh / 2, w: sw, h: sh };
    const myArea = sw * sh;

    let maxRatio = 0;
    for (const p of placed) {
      const ia = intersectArea(box, p);
      if (ia > 0) {
        const ratio = ia / Math.min(myArea, p.w * p.h);
        if (ratio > maxRatio) maxRatio = ratio;
      }
    }

    if (maxRatio <= maxOverlapRatio) return { x: cx, y: cy };
    if (maxRatio < bestOverlap) { bestOverlap = maxRatio; best = { x: cx, y: cy }; }
  }

  return best || { x: rand(minX, maxX), y: rand(minY, maxY) };
}

function applyGrid(photos) {
  const { canvasW, canvasH } = state;
  const n    = photos.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const pad  = canvasW * 0.04;
  const cellW = (canvasW - pad * (cols + 1)) / cols;
  const cellH = (canvasH - pad * (rows + 1)) / rows;

  photos.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const sc  = Math.min(cellW / img.width, cellH / img.height) * 0.9;
    img.set({
      scaleX: sc, scaleY: sc,
      left: pad + col * (cellW + pad) + cellW / 2,
      top:  pad + row * (cellH + pad) + cellH / 2,
      originX: 'center', originY: 'center',
      angle: 0,
    });
    img.setCoords();
  });
}

function applyScatter(photos) {
  const { canvasW } = state;
  const n = photos.length;
  const overlapRatio = allowedOverlapRatio(n);
  const baseSize = canvasW * 0.18;
  const placed = [];

  photos.forEach(img => {
    const sizeVar = rand(0.75, 1.25);
    const sc = Math.min(baseSize * sizeVar / img.width, baseSize * sizeVar / img.height);
    const sw = img.width  * sc;
    const sh = img.height * sc;

    const { x, y } = findPosition(sw, sh, placed, overlapRatio);
    placed.push({ x: x - sw / 2, y: y - sh / 2, w: sw, h: sh });

    img.set({
      scaleX: sc, scaleY: sc,
      left: x, top: y,
      angle: rand(-15, 15),
      originX: 'center', originY: 'center',
    });
    img.setCoords();
  });
}

export function setupLayout() {
  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.layoutMode = btn.dataset.mode;
    });
  });

  document.getElementById('btnApplyLayout').addEventListener('click', () => {
    const photos = state.photoObjects.filter(o => state.fabricCanvas.getObjects().includes(o));
    if (!photos.length || state.layoutMode === 'manual') return;

    if (state.layoutMode === 'grid')    applyGrid(photos);
    if (state.layoutMode === 'scatter') applyScatter(photos);

    state.fabricCanvas.discardActiveObject();
    state.fabricCanvas.renderAll();
  });
}
