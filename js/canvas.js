import { state, SCALE } from './state.js';

export function initCanvas(w, h) {
  state.canvasW = w;
  state.canvasH = h;
  const fc = state.fabricCanvas;
  fc.setWidth(w * SCALE);
  fc.setHeight(h * SCALE);
  fc.setZoom(SCALE);
  document.getElementById('canvas-wrapper').style.width  = (w * SCALE) + 'px';
  document.getElementById('canvas-wrapper').style.height = (h * SCALE) + 'px';
  fc.renderAll();
}

export function setupCanvasEvents(onSelect, onDeselect) {
  const fc = state.fabricCanvas;
  fc.on('selection:created', e => {
    const obj = e.selected?.[0];
    if (!obj || obj._isBg) { onDeselect(); return; }
    state.selectedObj = obj;
    onSelect(obj);
  });
  fc.on('selection:updated', e => {
    const obj = e.selected?.[0];
    if (!obj || obj._isBg) { onDeselect(); return; }
    state.selectedObj = obj;
    onSelect(obj);
  });
  fc.on('selection:cleared', () => {
    state.selectedObj = null;
    onDeselect();
  });
  fc.on('object:modified', () => {
    if (state.selectedObj) onSelect(state.selectedObj);
  });
}

export function setupExport() {
  document.getElementById('btnPng').addEventListener('click', () => exportCanvas('png'));
  document.getElementById('btnJpg').addEventListener('click', () => exportCanvas('jpg'));
}

function exportCanvas(format) {
  const fc = state.fabricCanvas;
  fc.discardActiveObject();
  fc.renderAll();

  const dataURL = fc.toDataURL({
    format: format === 'jpg' ? 'jpeg' : 'png',
    quality: 0.95,
    multiplier: 1 / SCALE,
  });

  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `photo-wall.${format}`;
  a.click();
}

export function setupSizeControls() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('inW').value = btn.dataset.w;
      document.getElementById('inH').value = btn.dataset.h;
    });
  });

  document.getElementById('btnApplySize').addEventListener('click', () => {
    const w = parseInt(document.getElementById('inW').value);
    const h = parseInt(document.getElementById('inH').value);
    if (w >= 100 && h >= 100) {
      initCanvas(w, h);
      // 背景图片跟随重新适配
      import('./background.js').then(m => m.repositionBg());
    }
  });
}
