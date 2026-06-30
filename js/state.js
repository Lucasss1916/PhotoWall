// 全局共享状态
export const SCALE = 0.35;

export const state = {
  canvasW: 1920,
  canvasH: 1080,
  layoutMode: 'manual',
  selectedObj: null,
  bgImageObj: null,
  photoObjects: [],   // 所有照片 fabric 对象
  fabricCanvas: null, // 由 canvas.js 初始化后写入
};
