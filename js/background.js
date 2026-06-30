import { state } from './state.js';
import { setupUploadZone } from './utils.js';

function fitBgImage(img) {
  const { canvasW, canvasH } = state;
  const sc = Math.max(canvasW / img.width, canvasH / img.height);
  img.set({
    scaleX: sc, scaleY: sc,
    left: canvasW / 2,
    top:  canvasH / 2,
    originX: 'center', originY: 'center',
    selectable: false, evented: false,
    _isBg: true,
  });
}

function loadBgFile(file) {
  const url = URL.createObjectURL(file);
  fabric.Image.fromURL(url, img => {
    if (state.bgImageObj) state.fabricCanvas.remove(state.bgImageObj);
    state.bgImageObj = img;
    fitBgImage(img);
    state.fabricCanvas.insertAt(img, 0);
    state.fabricCanvas.renderAll();
  });
}

export function repositionBg() {
  if (!state.bgImageObj) return;
  fitBgImage(state.bgImageObj);
  state.fabricCanvas.renderAll();
}

export function setupBackground() {
  document.getElementById('bgColor').addEventListener('input', e => {
    state.fabricCanvas.backgroundColor = e.target.value;
    state.fabricCanvas.renderAll();
  });

  setupUploadZone('bgUploadZone', 'bgFile', files => {
    if (files[0]) loadBgFile(files[0]);
  });

  document.getElementById('btnRemoveBg').addEventListener('click', () => {
    if (state.bgImageObj) {
      state.fabricCanvas.remove(state.bgImageObj);
      state.bgImageObj = null;
      state.fabricCanvas.renderAll();
    }
  });
}
