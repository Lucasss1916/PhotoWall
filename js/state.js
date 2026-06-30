// 全局共享状态
// 画布预览缩放上限：小画布不会被放得过大；实际缩放按容器可用空间动态计算
export const MAX_SCALE = 0.6;

export const state = {
  canvasW: 1920,
  canvasH: 1080,
  scale: 0.35,        // 当前预览缩放，由 canvas.js 动态计算
  layoutMode: 'manual',
  selectedObj: null,
  bgImageObj: null,
  photoObjects: [],   // 所有照片 fabric 对象
  fabricCanvas: null, // 由 canvas.js 初始化后写入
};
