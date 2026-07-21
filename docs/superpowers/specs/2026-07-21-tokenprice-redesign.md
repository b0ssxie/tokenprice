# AI Token Price 页面美化设计文档

## 1. 项目架构变更

将当前单文件 HTML（Node 脚本直接生成完整 HTML）改为 **Vite 多文件架构**：

```
tokenprice/
├── index.html              # Vite 入口
├── package.json            # 加 vite 依赖
├── vite.config.js          # Vite 配置
├── src/
│   ├── main.js             # JS 入口（筛选、排序、渲染逻辑）
│   ├── style.css           # 所有样式（暗色主题）
│   ├── data/
│   │   └── models.json     # fetch-prices.js 生成的静态数据
│   └── fetch-prices.js     # 改为只输出 JSON 到 src/data/models.json
├── public/                 # 静态资源（favicon 等）
└── .github/workflows/
    └── deploy.yml          # 更新：先 fetch 再 vite build → upload Pages
```

### 构建流程

1. `node src/fetch-prices.js` 从 OpenRouter 拉数据 → 写入 `src/data/models.json`
2. Vite 打包 `index.html` + `src/` → 输出到 `dist/`
3. GitHub Actions：`npm run build`（内部执行 fetch + vite build）→ deploy Pages

## 2. 视觉设计

### 整体风格：A. 深色专业风

- **头部**：深蓝渐变 `#0f0f1a` → `#1a1a2e`
- **页面背景**：`#0a0a14`（深黑底）
- **卡片/表格区**：`#141420`（暗色卡片）
- **表格行**：`#1a1a28`，交替行 `#1e1e30`
- **主文本**：`#e8e8f0`
- **次要文本**：`#8888a0`
- **强调色**：`#667eea`（蓝紫），用于排序箭头、hover 态、链接
- **品牌标签**：各自品牌色暗色适配版

### 头部区域

- 大标题 + 副标题 + 数据来源标注
- 3 个统计小卡片：最低价模型 / 最多上下文 / 模型总数（含详细文字）
- Tab 导航：[所有模型] [热门模型] [套餐对比]（仅 UI 框架，后续可扩展）

### 筛选栏

- 三个下拉选择器：平台、上下文、排序
- 搜索输入框（placeholder: "搜索模型名称或 ID..."）
- 右侧统计文字：当前筛选后的模型数量

### 数据表格

| 列名 | 说明 | 对齐 | 样式 |
|------|------|------|------|
| 模型 | 模型名称 | 左 | 加粗 |
| 平台 | 平台名 badge | 左 | 品牌色圆角标签 |
| 输入价/百万 | 输入价格 | 右 | 等宽字体 |
| 输出价/百万 | 输出价格 | 右 | 等宽字体 |
| 均价/百万 | 平均价格 | 右 | 加粗，按区间着色 |
| 上下文 | 上下文长度 | 右 | tabular-nums |
| 模态 | 模态类型 | 中 | text=灰字, 多模态=橙标 |
| 发布 | 发布日期 | 中 | 灰色小字 |

**价格着色规则**：均价 < $1 → 绿色，$1–$10 → 白色，> $10 → 橙红色

### 动效与微交互

- 表格行 fade-in 加载动画（逐行错开 50ms）
- 筛选/排序时行过渡动画（transition 0.2s）
- 行 hover：背景变 `#252540` + 轻微 `box-shadow` 上浮
- 排序箭头切换时旋转动画
- 搜索 300ms debounce
- 平台标签 hover `scale(1.05)`
- 统计卡片 count-up 数字动画

### 响应式断点

- **桌面**（>1024px）：全宽表格，完整 8 列
- **平板**（768-1024px）：隐藏"发布"列，筛选栏换行
- **手机**（<768px）：表格横向滚动，头部缩小，筛选栏纵向堆叠

## 3. 技术实现

### 数据流

```
OpenRouter API → fetch-prices.js → src/data/models.json (静态 JSON)
                                         ↓
                              main.js 读取 → 筛选/排序/渲染
```

### fetch-prices.js 改动

- 移除 HTML 生成逻辑
- 只抓取数据 + 数据清洗 + 写入 `src/data/models.json`
- 保留平台映射、价格格式化等工具函数

### main.js 改动

- 从之前的内嵌 script 提取为独立文件
- 使用 ES module，import models.json
- 保留全部筛选/排序/搜索逻辑
- 增加动效处理

### style.css 内容

- 暗色主题 CSS 变量
- 布局（grid/flex）
- 表格样式（含斑马纹、hover）
- 动效（@keyframes、transition）
- 响应式媒体查询
- 自定义滚动条样式（暗色适配）

## 4. GitHub Actions 更新

```yaml
jobs:
  build:
    steps:
      - checkout
      - setup-node
      - npm ci
      - node src/fetch-prices.js    # 生成 src/data/models.json
      - npm run build               # vite build
      - upload-pages-artifact
```

## 5. 不在此次范围内的功能

- Tab 导航的"热门模型"和"套餐对比"页面（仅 UI 框架，无实际页面）
- 价格走势图 / 历史对比
- 模型详情弹窗 / 侧边栏
