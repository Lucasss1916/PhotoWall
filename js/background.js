import { state } from './state.js';
import { setupUploadZone } from './utils.js';

const BACKGROUND_PRESETS = [
  {
    name: '雾林',
    src: 'assets/backgrounds/misty-forest-slope.jpg',
  },
  {
    name: '草丘',
    src: 'assets/backgrounds/green-hill-sky.jpg',
  },
  {
    name: '星山',
    src: 'assets/backgrounds/starry-mountain.jpg',
  },
  {
    name: '森林',
    src: 'assets/backgrounds/deep-forest-path.jpg',
  },
  {
    name: '海边',
    src: 'assets/backgrounds/soft-beach-sunset.jpg',
  },
  {
    name: '山湖',
    src: 'assets/backgrounds/alpine-lake-valley.jpg',
  },
  {
    name: '草地',
    src: 'assets/backgrounds/golden-meadow.jpg',
  },
  {
    name: '竖星空',
    src: 'assets/backgrounds/vertical-starry-tree.jpg',
  },
  {
    name: '纸纹',
    src: 'assets/backgrounds/product-inspired/paper-texture.jpg',
  },
  {
    name: '渐变',
    src: 'assets/backgrounds/product-inspired/pastel-gradient.jpg',
  },
  {
    name: '灰墙',
    src: 'assets/backgrounds/product-inspired/gray-concrete-wall.jpg',
  },
  {
    name: '大理石',
    src: 'assets/backgrounds/product-inspired/marble-surface.jpg',
  },
  {
    name: '散景',
    src: 'assets/backgrounds/product-inspired/golden-bokeh.jpg',
  },
  {
    name: '布纹',
    src: 'assets/backgrounds/product-inspired/soft-fabric.jpg',
  },
  {
    name: '海报墙',
    src: 'assets/backgrounds/product-inspired/poster-wall.jpg',
  },
  {
    name: '幕布',
    src: 'assets/backgrounds/product-inspired/red-curtain.jpg',
  },
];

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
  loadBgImage(url, () => URL.revokeObjectURL(url));
}

function loadBgImage(src, onLoad) {
  fabric.Image.fromURL(src, img => {
    if (!img) return;
    if (state.bgImageObj) state.fabricCanvas.remove(state.bgImageObj);
    state.bgImageObj = img;
    fitBgImage(img);
    state.fabricCanvas.insertAt(img, 0);
    state.fabricCanvas.renderAll();
    if (onLoad) onLoad();
  });
}

function clearActivePreset() {
  document.querySelectorAll('.background-preset-btn').forEach(btn => {
    btn.classList.remove('active');
  });
}

function setupBackgroundPresets() {
  const grid = document.getElementById('bgPresetGrid');
  grid.innerHTML = BACKGROUND_PRESETS.map(preset => `
    <button
      class="background-preset-btn"
      type="button"
      data-bg-src="${preset.src}"
      aria-label="使用${preset.name}背景"
      style="background-image:url('${preset.src}')"
    >
      <span>${preset.name}</span>
    </button>
  `).join('');

  grid.querySelectorAll('.background-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      clearActivePreset();
      btn.classList.add('active');
      loadBgImage(btn.dataset.bgSrc);
    });
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
    if (!files[0]) return;
    clearActivePreset();
    loadBgFile(files[0]);
  });

  setupBackgroundPresets();

  document.getElementById('btnRemoveBg').addEventListener('click', () => {
    clearActivePreset();
    if (state.bgImageObj) {
      state.fabricCanvas.remove(state.bgImageObj);
      state.bgImageObj = null;
      state.fabricCanvas.renderAll();
    }
  });
}
