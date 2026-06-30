import { state } from './state.js';
import { initCanvas, setupCanvasEvents, setupExport, setupSizeControls, setupResize } from './canvas.js';
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
// 注意：选中/修改照片只更新面板内容，不自动弹出移动端抽屉，
// 否则缩放、拖动照片时抽屉会弹出并用遮罩挡住画布。
// 移动端由用户主动点击底部「编辑」Tab 查看编辑选项。
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
setupResize();
setupMobileDrawers();

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
function handleDelete() {
  deleteSelected(() => {
    hidePhotoPanel();
    if (isMobile()) closeDrawer();   // 删完关掉编辑抽屉
  });
}

document.getElementById('btnDelete').addEventListener('click', handleDelete);

document.addEventListener('keydown', e => {
  if ((e.key === 'Delete' || e.key === 'Backspace') &&
      !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    handleDelete();
  }
});

// ── 7. 移动端底部抽屉 ─────────────────────────────────────────
function isMobile() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function openDrawer(which) {
  document.body.classList.remove('drawer-left', 'drawer-right');
  document.body.classList.add('drawer-' + which);
  document.getElementById('tabLeft').classList.toggle('active', which === 'left');
  document.getElementById('tabRight').classList.toggle('active', which === 'right');
}

function closeDrawer() {
  document.body.classList.remove('drawer-left', 'drawer-right');
  document.getElementById('tabLeft').classList.remove('active');
  document.getElementById('tabRight').classList.remove('active');
}

function setupMobileDrawers() {
  const tabLeft  = document.getElementById('tabLeft');
  const tabRight = document.getElementById('tabRight');
  const backdrop = document.getElementById('drawerBackdrop');

  // 点击标签：已打开则收起，否则打开对应抽屉
  tabLeft.addEventListener('click', () => {
    document.body.classList.contains('drawer-left') ? closeDrawer() : openDrawer('left');
  });
  tabRight.addEventListener('click', () => {
    document.body.classList.contains('drawer-right') ? closeDrawer() : openDrawer('right');
  });
  backdrop.addEventListener('click', closeDrawer);

  // 抽屉里每个面板顶部的关闭按钮
  document.querySelectorAll('.drawer-close').forEach(btn => {
    btn.addEventListener('click', closeDrawer);
  });
}
