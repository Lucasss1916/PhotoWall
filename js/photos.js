import { state } from './state.js';
import { rand, setupUploadZone } from './utils.js';

export function updatePhotoCount() {
  const alive = state.photoObjects.filter(o => state.fabricCanvas.getObjects().includes(o));
  document.getElementById('photoCount').textContent = alive.length;
}

function addPhoto(file) {
  const url = URL.createObjectURL(file);
  fabric.Image.fromURL(url, img => {
    const maxSide = state.canvasW * 0.22;
    const sc = Math.min(maxSide / img.width, maxSide / img.height, 1);
    img.set({
      scaleX: sc, scaleY: sc,
      left: rand(state.canvasW * 0.05, state.canvasW * 0.75),
      top:  rand(state.canvasH * 0.05, state.canvasH * 0.75),
      _shape: 'rect',
      _filter: 'none',
      _crop: { t: 0, r: 0, b: 0, l: 0 },
    });
    state.fabricCanvas.add(img);
    state.photoObjects.push(img);
    state.fabricCanvas.setActiveObject(img);
    state.fabricCanvas.renderAll();
    updatePhotoCount();
  });
}

export function setupPhotoUpload() {
  setupUploadZone('photoUploadZone', 'photoFile', files => {
    Array.from(files).forEach(addPhoto);
  });
}

// 删除选中照片。onCleared 回调用于让 UI 切回空状态
// （discardActiveObject 在 Fabric 5.x 程序化调用时不触发 selection:cleared 事件）
export function deleteSelected(onCleared) {
  const obj = state.selectedObj;
  if (!obj) return;
  const idx = state.photoObjects.indexOf(obj);
  if (idx !== -1) state.photoObjects.splice(idx, 1);
  state.fabricCanvas.remove(obj);
  state.fabricCanvas.discardActiveObject();
  state.fabricCanvas.renderAll();
  state.selectedObj = null;       // 清除死引用
  updatePhotoCount();
  if (typeof onCleared === 'function') onCleared();
}
