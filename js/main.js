import { state, SCALE } from './state.js';
import { initCanvas, setupCanvasEvents, setupExport, setupSizeControls } from './canvas.js';
import { setupBackground } from './background.js';
import { setupPhotoUpload, deleteSelected, updatePhotoCount } from './photos.js';
import { setupLayout } from './layout.js';
import {
  setupShapeButtons, setupCropSliders,
  setupBorder, setupShadow, setupFilter,
  setupOpacityRotation, setupSyncEffects, syncRightPanel,
} from './effects.js';

// ── 1. 初始化 Fabric Canvas ───────────────────────────────────
state.fabricCanvas = new fabric.Canvas('c', {
  selection: true,
  preserveObjectStacking: true,
});
state.fabricCanvas.backgroundColor = '#1a1a2e';
initCanvas(1920, 1080);

// ── 2. 右侧面板显示/隐藏 ──────────────────────────────────────
function showPhotoPanel(obj) {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('photo-opts').style.display  = 'block';
  syncRightPanel(obj);
}

function hidePhotoPanel() {
  document.getElementById('empty-state').style.display = 'flex';
  document.getElementById('photo-opts').style.display  = 'none';
}

// ── 3. Canvas 选中事件 ────────────────────────────────────────
setupCanvasEvents(showPhotoPanel, hidePhotoPanel);

// ── 4. 各功能模块初始化 ───────────────────────────────────────
setupSizeControls();
setupBackground();
setupPhotoUpload();
setupLayout();
setupShapeButtons();
setupCropSliders();
setupBorder();
setupShadow();
setupFilter();
setupOpacityRotation();
setupSyncEffects();
setupExport();

// ── 5. 复制照片 ───────────────────────────────────────────────
document.getElementById('btnDuplicate').addEventListener('click', () => {
  const obj = state.selectedObj;
  if (!obj) return;
  obj.clone(cloned => {
    cloned.set({
      left:    obj.left + 20,
      top:     obj.top  + 20,
      _shape:  obj._shape,
      _filter: obj._filter,
      _crop:   obj._crop ? { ...obj._crop } : { t: 0, r: 0, b: 0, l: 0 },
    });
    const finish = () => {
      state.fabricCanvas.add(cloned);
      state.photoObjects.push(cloned);
      state.fabricCanvas.setActiveObject(cloned);
      state.fabricCanvas.renderAll();
      updatePhotoCount();
    };
    if (obj.clipPath) {
      obj.clipPath.clone(cp => { cloned.clipPath = cp; finish(); });
    } else {
      finish();
    }
  });
});

// ── 6. 删除照片 ───────────────────────────────────────────────
document.getElementById('btnDelete').addEventListener('click', deleteSelected);

document.addEventListener('keydown', e => {
  if ((e.key === 'Delete' || e.key === 'Backspace') &&
      !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    deleteSelected();
  }
});
