import { state } from './state.js';
import { applyClipPath } from './effects.js';

const FRAME_COLOR = '#fffaf2';
const SHADOW_COLOR = 'rgba(2, 8, 23, 0.38)';
const SHADOW_DEPTHS = [
  { blur: 42, offsetX: 0, offsetY: 22 },
  { blur: 32, offsetX: 0, offsetY: 16 },
  { blur: 24, offsetX: 0, offsetY: 12 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function visualUnit() {
  return Math.min(state.canvasW, state.canvasH);
}

function scaled(value) {
  return Math.round(value * visualUnit() / 1080);
}

function frameWidth() {
  return clamp(scaled(14), 8, 28);
}

function photoShadow(depth) {
  const preset = SHADOW_DEPTHS[depth % SHADOW_DEPTHS.length];
  return new fabric.Shadow({
    color: SHADOW_COLOR,
    blur: clamp(scaled(preset.blur), 18, 72),
    offsetX: scaled(preset.offsetX),
    offsetY: clamp(scaled(preset.offsetY), 8, 36),
  });
}

export function applyPolishedPhotoStyle(img, options = {}) {
  const { depth = 0, forceShape = false } = options;
  if (forceShape || !img._shape) img._shape = 'rect';
  if (!img._crop) img._crop = { t: 0, r: 0, b: 0, l: 0 };

  img.set({
    stroke: FRAME_COLOR,
    strokeWidth: frameWidth(),
    strokeUniform: true,
    paintFirst: 'fill',
    shadow: photoShadow(depth),
  });
  applyClipPath(img);
}

export function applyPolishedPhotoStyles(photos, options = {}) {
  photos.forEach((photo, index) => {
    applyPolishedPhotoStyle(photo, { ...options, depth: index });
  });
}
