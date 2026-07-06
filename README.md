# 照片墙生成器 (Photo Wall Generator)

一个纯前端的照片墙合成工具，将多张照片合理摆放到自定义背景上，支持丰富的排版与效果调整，导出高分辨率成品图。无需安装、无需后端，所有处理都在浏览器本地完成。

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Lucasss1916/PhotoWall)

## 功能特性

### 画布
- **尺寸预设**：手机壁纸 (1080×1920)、桌面壁纸 (1920×1080)、正方形 (1080×1080)、A4 海报 (2480×3508)、2K (2560×1440)、4K (3840×2160)
- **自定义尺寸**：任意宽高
- 预览缩放显示，导出时还原原始分辨率

### 背景
- 背景色选取
- 背景图片上传（cover 模式自动填满）
- 通过图片 URL 加载背景图
- 更换画布尺寸后背景图自动适配

### 照片
- 多文件选择 + 拖拽上传，数量不限
- 实时数量角标

### 排版模式
- **手动**：自由拖拽、缩放、旋转
- **网格**：自动均匀分格排列，永不覆盖
- **散落**：随机位置 + 轻微旋转；照片较少时自动避免重叠，数量增多时按比例允许覆盖

### 单张照片效果
- **形状裁剪**：矩形 / 圆角 / 圆形 / 心形
- **边缘裁剪**：上下左右独立裁剪
- **边框**：颜色 + 粗细
- **阴影**：模糊 / 偏移 / 颜色
- **滤镜**：原图 / 黑白 / 复古 / 暖色 / 冷色 / 胶片
- **不透明度 / 旋转**：滑块调整
- **效果同步**：一键将当前照片的所有效果应用到其他所有照片
- **复制 / 删除**：支持 Delete/Backspace 快捷键

### 导出
- 导出 PNG / JPG，输出原始分辨率成品图

## 技术栈

- 纯 HTML + CSS + 原生 ES Module（无构建步骤）
- [Fabric.js 5.3.1](http://fabricjs.com/) 负责画布编辑与合成

## 项目结构

```
.
├── index.html              页面骨架
├── css/
│   └── styles.css          全局样式
└── js/
    ├── state.js            全局共享状态
    ├── utils.js            通用工具函数
    ├── canvas.js           画布初始化、尺寸、导出
    ├── background.js       背景管理
    ├── photos.js           照片上传与增删
    ├── layout.js           排版算法（含防覆盖）
    ├── effects.js          形状/裁剪/边框/阴影/滤镜/效果同步
    └── main.js             入口，组合所有模块
```

## 本地运行

ES Module 需要通过 HTTP 服务运行（不能直接用 `file://` 打开）：

```bash
python3 -m http.server 8741
# 浏览器访问 http://localhost:8741
```

## 部署到 Cloudflare Pages

点击上方的 **Deploy to Cloudflare Pages** 按钮可一键 fork 并部署。也可按以下方式手动部署。

### 方式一：Git 自动部署（推荐）

连接后每次 `git push` 到 `main` 分支都会自动重新部署。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → 左侧 **Workers & Pages**
2. **Create application** → **Pages** → **Connect to Git**
3. 首次需授权 GitHub，选择授权本仓库
4. 选中仓库 → **Begin setup**
5. 按下表填写构建配置（纯静态站，无需构建）：

   | 字段 | 值 |
   |------|-----|
   | Production branch | `main` |
   | Framework preset | `None` |
   | Build command | *（留空）* |
   | Build output directory | `/` |

6. **Save and Deploy**，完成后得到 `<project>.pages.dev` 链接

### 方式二：拖拽上传

1. Cloudflare Dashboard → Workers & Pages → Pages
2. **Create a project** → **Direct Upload**
3. 上传整个项目文件夹

### 方式三：Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name photo-wall
```

## License

MIT
