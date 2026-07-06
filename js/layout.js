import { state } from './state.js';
import { rand } from './utils.js';
import { applyPolishedPhotoStyles } from './photo-style.js';

// 超过此数量后开始允许覆盖
const OVERLAP_THRESHOLD = 12;
// 最大允许覆盖比例（相对于较小那张照片面积）
const MAX_OVERLAP = 0.35;
const SCATTER_ANCHORS = [
  { x: 0.5, y: 0.5 },
  { x: 0.25, y: 0.28 },
  { x: 0.76, y: 0.3 },
  { x: 0.28, y: 0.72 },
  { x: 0.73, y: 0.7 },
  { x: 0.48, y: 0.22 },
  { x: 0.5, y: 0.78 },
  { x: 0.16, y: 0.5 },
  { x: 0.84, y: 0.5 },
];
const SCATTER_ANGLES = [-5, 4, -8, 7, -3, 6, -6, 3, 8, -4];

function allowedOverlapRatio(n) {
  if (n <= 3) return 0.18;
  if (n <= 8) return 0.14;
  if (n <= OVERLAP_THRESHOLD) return 0.1;
  const excess = n - OVERLAP_THRESHOLD;
  return Math.min(MAX_OVERLAP, (excess / OVERLAP_THRESHOLD) * MAX_OVERLAP);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

function findPositionNearAnchor(sw, sh, placed, maxOverlapRatio, anchor, maxTries = 70) {
  const { canvasW, canvasH } = state;
  const margin = Math.min(canvasW, canvasH) * 0.03;
  const minX = sw / 2 + margin;
  const maxX = canvasW - sw / 2 - margin;
  const minY = sh / 2 + margin;
  const maxY = canvasH - sh / 2 - margin;
  const jitterX = canvasW * 0.12;
  const jitterY = canvasH * 0.12;

  let best = null;
  let bestScore = Infinity;

  for (let t = 0; t < maxTries; t++) {
    const cx = clamp(canvasW * anchor.x + rand(-jitterX, jitterX), minX, maxX);
    const cy = clamp(canvasH * anchor.y + rand(-jitterY, jitterY), minY, maxY);
    const box = { x: cx - sw / 2, y: cy - sh / 2, w: sw, h: sh };
    const myArea = sw * sh;

    let maxRatio = 0;
    for (const placedBox of placed) {
      const overlapArea = intersectArea(box, placedBox);
      const ratio = overlapArea / Math.min(myArea, placedBox.w * placedBox.h);
      if (ratio > maxRatio) maxRatio = ratio;
    }

    const anchorDistance = Math.hypot(cx - canvasW * anchor.x, cy - canvasH * anchor.y);
    const score = maxRatio * 100000 + anchorDistance;
    if (maxRatio <= maxOverlapRatio) return { x: cx, y: cy };
    if (score < bestScore) { bestScore = score; best = { x: cx, y: cy }; }
  }

  return best || findPosition(sw, sh, placed, maxOverlapRatio);
}

function bestGridShape(count) {
  const targetRatio = state.canvasW / state.canvasH;
  let best = { cols: count, rows: 1, score: Infinity };

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const ratio = cols / rows;
    const emptyCells = cols * rows - count;
    const score = Math.abs(ratio - targetRatio) + emptyCells * 0.08;
    if (score < best.score) best = { cols, rows, score };
  }

  return best;
}

function applyGrid(photos) {
  const { canvasW, canvasH } = state;
  const n    = photos.length;
  const { cols, rows } = bestGridShape(n);
  const gap = Math.min(canvasW, canvasH) * 0.035;
  const marginX = canvasW * 0.055;
  const marginY = canvasH * 0.07;
  const cellW = (canvasW - marginX * 2 - gap * (cols - 1)) / cols;
  const cellH = (canvasH - marginY * 2 - gap * (rows - 1)) / rows;

  applyPolishedPhotoStyles(photos, { forceShape: true });

  photos.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const sc  = Math.min(cellW / img.width, cellH / img.height) * 0.9;
    img.set({
      scaleX: sc, scaleY: sc,
      left: marginX + col * (cellW + gap) + cellW / 2,
      top:  marginY + row * (cellH + gap) + cellH / 2,
      originX: 'center', originY: 'center',
      angle: 0,
    });
    img.setCoords();
  });
}

function applyScatter(photos) {
  const { canvasW, canvasH } = state;
  const n = photos.length;
  const overlapRatio = allowedOverlapRatio(n);
  const baseSize = Math.min(canvasW, canvasH) * (n <= 3 ? 0.36 : n <= 8 ? 0.29 : 0.23);
  const placed = [];

  applyPolishedPhotoStyles(photos, { forceShape: true });

  photos.forEach((img, index) => {
    const isHero = index === 0 && n > 2;
    const sizeVar = isHero ? 1.28 : rand(0.82, 1.08);
    const targetSize = Math.min(baseSize * sizeVar, canvasW * 0.42, canvasH * 0.5);
    const sc = Math.min(targetSize / img.width, targetSize / img.height);
    const sw = img.width  * sc;
    const sh = img.height * sc;
    const anchor = SCATTER_ANCHORS[index % SCATTER_ANCHORS.length];

    const { x, y } = findPositionNearAnchor(sw, sh, placed, overlapRatio, anchor);
    placed.push({ x: x - sw / 2, y: y - sh / 2, w: sw, h: sh });

    img.set({
      scaleX: sc, scaleY: sc,
      left: x, top: y,
      angle: n === 1 ? 0 : SCATTER_ANGLES[index % SCATTER_ANGLES.length] + rand(-1.5, 1.5),
      originX: 'center', originY: 'center',
    });
    img.setCoords();
    bringPhotoToFront(img);
  });
}

function bringPhotoToFront(photo) {
  if (typeof state.fabricCanvas.bringToFront === 'function') {
    state.fabricCanvas.bringToFront(photo);
    return;
  }
  if (typeof state.fabricCanvas.moveTo === 'function') {
    state.fabricCanvas.moveTo(photo, state.fabricCanvas.getObjects().length - 1);
  }
}

function currentPhotos() {
  return state.photoObjects.filter(o => state.fabricCanvas.getObjects().includes(o));
}

function activateLayoutMode(mode) {
  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  state.layoutMode = mode;
}

function renderLayout(photos) {
  state.fabricCanvas.discardActiveObject();
  photos.forEach(photo => photo.setCoords());
  state.fabricCanvas.renderAll();
}

export function setupLayout() {
  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activateLayoutMode(btn.dataset.mode);
    });
  });

  document.getElementById('btnApplyLayout').addEventListener('click', () => {
    const photos = currentPhotos();
    if (!photos.length || state.layoutMode === 'manual') return;

    if (state.layoutMode === 'grid')    applyGrid(photos);
    if (state.layoutMode === 'scatter') applyScatter(photos);
    renderLayout(photos);
  });

  document.getElementById('btnBeautifyLayout').addEventListener('click', () => {
    const photos = currentPhotos();
    if (!photos.length) return;
    activateLayoutMode('scatter');
    applyScatter(photos);
    renderLayout(photos);
  });
}
