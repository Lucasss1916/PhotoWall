import { state } from './state.js';
import { shadowColorHex } from './utils.js';

// ── Clip Path（形状 + 边缘裁剪合并）──────────────────────────
export function applyClipPath(img) {
  const w     = img.width;
  const h     = img.height;
  const shape = img._shape || 'rect';
  const crop  = img._crop  || { t: 0, r: 0, b: 0, l: 0 };

  const cL = w * (crop.l / 100);
  const cR = w * (crop.r / 100);
  const cT = h * (crop.t / 100);
  const cB = h * (crop.b / 100);

  const cw = w - cL - cR;
  const ch = h - cT - cB;
  const ox = cL + cw / 2 - w / 2;
  const oy = cT + ch / 2 - h / 2;

  const noCrop = cL === 0 && cR === 0 && cT === 0 && cB === 0;

  switch (shape) {
    case 'rect':
      img.clipPath = noCrop ? null : new fabric.Rect({
        width: cw, height: ch,
        left: ox, top: oy,
        originX: 'center', originY: 'center',
      });
      break;

    case 'rounded': {
      const rx = Math.min(cw, ch) * 0.12;
      img.clipPath = new fabric.Rect({
        width: cw, height: ch, rx, ry: rx,
        left: ox, top: oy,
        originX: 'center', originY: 'center',
      });
      break;
    }

    case 'circle':
      img.clipPath = new fabric.Circle({
        radius: Math.min(cw, ch) / 2,
        left: ox, top: oy,
        originX: 'center', originY: 'center',
      });
      break;

    case 'heart': {
      const clip = makeHeartClip(cw, ch);
      clip.set({ left: ox, top: oy });
      img.clipPath = clip;
      break;
    }
  }
}

function makeHeartClip(w, h) {
  const s = Math.min(w, h) * 0.45;
  const d = `M 0 ${s} L ${-s*.95} ${s*.1} C ${-s} ${-s*.5} ${-s*.7} ${-s} ${-s*.3} ${-s} C ${-s*.1} ${-s} 0 ${-s*.5} 0 ${-s*.35} C 0 ${-s*.5} ${s*.1} ${-s} ${s*.3} ${-s} C ${s*.7} ${-s} ${s} ${-s*.5} ${s*.95} ${s*.1} Z`;
  return new fabric.Path(d, { originX: 'center', originY: 'center' });
}

// ── Shape buttons ─────────────────────────────────────────────
export function setupShapeButtons() {
  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const obj = state.selectedObj;
      if (!obj) return;
      document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      obj._shape = btn.dataset.shape;
      applyClipPath(obj);
      state.fabricCanvas.renderAll();
    });
  });
}

// ── Edge crop sliders ─────────────────────────────────────────
export function setupCropSliders() {
  ['t', 'r', 'b', 'l'].forEach(side => {
    const el    = document.getElementById('crop' + side.toUpperCase());
    const valEl = document.getElementById('crop' + side.toUpperCase() + 'Val');
    el.addEventListener('input', () => {
      valEl.textContent = el.value + '%';
      const obj = state.selectedObj;
      if (!obj) return;
      if (!obj._crop) obj._crop = { t: 0, r: 0, b: 0, l: 0 };
      obj._crop[side] = parseInt(el.value);
      applyClipPath(obj);
      state.fabricCanvas.renderAll();
    });
  });

  document.getElementById('btnResetCrop').addEventListener('click', () => {
    const obj = state.selectedObj;
    if (!obj) return;
    obj._crop = { t: 0, r: 0, b: 0, l: 0 };
    ['T', 'R', 'B', 'L'].forEach(s => {
      document.getElementById('crop' + s).value = 0;
      document.getElementById('crop' + s + 'Val').textContent = '0%';
    });
    applyClipPath(obj);
    state.fabricCanvas.renderAll();
  });
}

// ── Border ────────────────────────────────────────────────────
export function setupBorder() {
  function apply() {
    const obj = state.selectedObj;
    if (!obj) return;
    obj.set({
      stroke: document.getElementById('borderColor').value,
      strokeWidth: parseInt(document.getElementById('borderWidth').value) || 0,
      paintFirst: 'fill',
    });
    state.fabricCanvas.renderAll();
  }
  document.getElementById('borderColor').addEventListener('input', apply);
  document.getElementById('borderWidth').addEventListener('input', apply);
}

// ── Shadow ────────────────────────────────────────────────────
export function setupShadow() {
  function apply() {
    const obj = state.selectedObj;
    if (!obj) return;
    const on = document.getElementById('shadowOn').checked;
    obj.set('shadow', on ? new fabric.Shadow({
      color:   document.getElementById('shadowColor').value,
      blur:    parseInt(document.getElementById('shadowBlur').value),
      offsetX: parseInt(document.getElementById('shadowOffX').value),
      offsetY: parseInt(document.getElementById('shadowOffY').value),
    }) : null);
    state.fabricCanvas.renderAll();
  }

  document.getElementById('shadowOn').addEventListener('change', apply);
  document.getElementById('shadowColor').addEventListener('input', apply);
  ['shadowBlur', 'shadowOffX', 'shadowOffY'].forEach(id => {
    const el    = document.getElementById(id);
    const valEl = document.getElementById(id + 'Val');
    el.addEventListener('input', () => { valEl.textContent = el.value; apply(); });
  });
}

// ── Filter ────────────────────────────────────────────────────
export function setupFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const obj = state.selectedObj;
      if (!obj) return;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      obj._filter = btn.dataset.filter;
      applyFilter(obj, btn.dataset.filter);
      state.fabricCanvas.renderAll();
    });
  });
}

export function applyFilter(img, name) {
  img.filters = [];
  switch (name) {
    case 'grayscale':
      img.filters.push(new fabric.Image.filters.Grayscale());
      break;
    case 'sepia':
      img.filters.push(new fabric.Image.filters.Sepia());
      break;
    case 'warm':
      img.filters.push(new fabric.Image.filters.ColorMatrix({
        matrix: [1.2,0,0,0,0.05, 0,1,0,0,0, 0,0,0.8,0,0, 0,0,0,1,0],
      }));
      break;
    case 'cool':
      img.filters.push(new fabric.Image.filters.ColorMatrix({
        matrix: [0.8,0,0,0,0, 0,1,0,0,0, 0,0,1.3,0,0.05, 0,0,0,1,0],
      }));
      break;
    case 'film':
      img.filters.push(new fabric.Image.filters.Sepia());
      img.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.15 }));
      img.filters.push(new fabric.Image.filters.Noise({ noise: 30 }));
      break;
  }
  img.applyFilters();
}

// ── Opacity & Rotation ────────────────────────────────────────
export function setupOpacityRotation() {
  document.getElementById('photoOpacity').addEventListener('input', e => {
    const obj = state.selectedObj;
    if (!obj) return;
    const v = parseInt(e.target.value);
    document.getElementById('opacityVal').textContent = v;
    obj.set('opacity', v / 100);
    state.fabricCanvas.renderAll();
  });

  document.getElementById('photoRotation').addEventListener('input', e => {
    const obj = state.selectedObj;
    if (!obj) return;
    const v = parseInt(e.target.value);
    document.getElementById('rotationVal').textContent = v + '°';
    obj.rotate(v);
    obj.setCoords();
    state.fabricCanvas.renderAll();
  });
}

// ── 将选中照片的效果同步到其他照片 ──────────────────────────────
// 同步的效果：形状、边缘裁剪、边框、阴影、滤镜、不透明度。
// 不同步：位置、尺寸、旋转角度（这些是每张照片的空间属性）。
export function applyEffectsToOthers(source) {
  const others = state.photoObjects.filter(
    o => o !== source && state.fabricCanvas.getObjects().includes(o)
  );

  others.forEach(target => {
    // 形状 + 边缘裁剪
    target._shape = source._shape || 'rect';
    target._crop  = source._crop ? { ...source._crop } : { t: 0, r: 0, b: 0, l: 0 };
    applyClipPath(target);

    // 边框
    target.set({
      stroke:      source.stroke || null,
      strokeWidth: source.strokeWidth || 0,
      paintFirst:  'fill',
    });

    // 阴影
    target.set('shadow', source.shadow ? new fabric.Shadow({
      color:   source.shadow.color,
      blur:    source.shadow.blur,
      offsetX: source.shadow.offsetX,
      offsetY: source.shadow.offsetY,
    }) : null);

    // 滤镜
    target._filter = source._filter || 'none';
    applyFilter(target, target._filter);

    // 不透明度
    target.set('opacity', source.opacity ?? 1);
  });

  state.fabricCanvas.renderAll();
  return others.length;
}

export function setupSyncEffects() {
  const btn  = document.getElementById('btnSyncEffects');
  const hint = document.getElementById('syncHint');
  btn.addEventListener('click', () => {
    const obj = state.selectedObj;
    if (!obj) return;
    const count = applyEffectsToOthers(obj);
    hint.textContent = count > 0
      ? `已同步到 ${count} 张照片`
      : '没有其他照片可同步';
    hint.style.opacity = '1';
    clearTimeout(btn._hintTimer);
    btn._hintTimer = setTimeout(() => { hint.style.opacity = '0'; }, 2200);
  });
}

// ── Right panel sync ──────────────────────────────────────────
export function syncRightPanel(obj) {
  // Shape
  document.querySelectorAll('.shape-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.shape === (obj._shape || 'rect'));
  });

  // Crop
  const crop = obj._crop || { t: 0, r: 0, b: 0, l: 0 };
  ['t', 'r', 'b', 'l'].forEach(side => {
    const v = crop[side] || 0;
    document.getElementById('crop' + side.toUpperCase()).value = v;
    document.getElementById('crop' + side.toUpperCase() + 'Val').textContent = v + '%';
  });

  // Border
  document.getElementById('borderColor').value = obj.stroke || '#ffffff';
  document.getElementById('borderWidth').value = obj.strokeWidth || 0;

  // Shadow
  const hasShadow = !!obj.shadow;
  document.getElementById('shadowOn').checked = hasShadow;
  if (hasShadow && obj.shadow) {
    document.getElementById('shadowColor').value   = shadowColorHex(obj.shadow.color);
    document.getElementById('shadowBlur').value    = obj.shadow.blur    || 15;
    document.getElementById('shadowBlurVal').textContent  = obj.shadow.blur    || 15;
    document.getElementById('shadowOffX').value    = obj.shadow.offsetX || 5;
    document.getElementById('shadowOffXVal').textContent  = obj.shadow.offsetX || 5;
    document.getElementById('shadowOffY').value    = obj.shadow.offsetY || 5;
    document.getElementById('shadowOffYVal').textContent  = obj.shadow.offsetY || 5;
  }

  // Filter
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === (obj._filter || 'none'));
  });

  // Opacity
  const opVal = Math.round((obj.opacity ?? 1) * 100);
  document.getElementById('photoOpacity').value  = opVal;
  document.getElementById('opacityVal').textContent = opVal;

  // Rotation
  const ang = Math.round(obj.angle || 0);
  document.getElementById('photoRotation').value  = ang;
  document.getElementById('rotationVal').textContent = ang + '°';
}
