import { state, MAX_SCALE } from './state.js';

// 根据画布区域可用空间计算合适的预览缩放
function computeScale(w, h) {
  const area = document.getElementById('canvas-area');
  // clientWidth/clientHeight 含 padding，需扣除真实 padding（移动端底部留给 Tab 栏）
  const cs = getComputedStyle(area);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop)  + parseFloat(cs.paddingBottom);
  // 再留一点边距，避免画布贴边
  const availW = Math.max(80, area.clientWidth  - padX - 24);
  const availH = Math.max(80, area.clientHeight - padY - 24);
  const fit = Math.min(availW / w, availH / h);
  // 不超过上限（小画布不放大过头），也不小到看不清
  return Math.max(0.05, Math.min(fit, MAX_SCALE));
}

export function initCanvas(w, h) {
  state.canvasW = w;
  state.canvasH = h;
  const scale = computeScale(w, h);
  state.scale = scale;
  const fc = state.fabricCanvas;
  fc.setWidth(w * scale);
  fc.setHeight(h * scale);
  fc.setZoom(scale);
  document.getElementById('canvas-wrapper').style.width  = (w * scale) + 'px';
  document.getElementById('canvas-wrapper').style.height = (h * scale) + 'px';
  fc.renderAll();
}

// 容器尺寸变化（横竖屏、窗口缩放、抽屉开合）时重算预览缩放
export function setupResize() {
  let timer = null;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(() => initCanvas(state.canvasW, state.canvasH), 120);
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
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
    multiplier: 1 / state.scale,
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
