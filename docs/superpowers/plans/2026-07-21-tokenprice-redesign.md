# TokenPrice 页面美化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将单文件 HTML 页面重构为 Vite 多文件架构，并应用深色专业风视觉设计

**Architecture:** fetch-prices.js 改为只输出 JSON 数据到 `src/data/models.json`，由 Vite 打包的 `src/main.js` 读取并渲染页面。GitHub Actions 流程变为 fetch → vite build → deploy。

**Tech Stack:** Node.js 20+, Vite 6, vanilla JS (no framework)

## Global Constraints

- 所有样式写在 `src/style.css`，不引入 CSS 框架
- 所有 JS 逻辑写在 `src/main.js`，使用 ES module
- 页面必须完全自包含，无外部 CDN 依赖
- 保持与 GitHub Pages 兼容，输出到 `dist/`
- 深色主题配色：背景 `#0a0a14`，卡片 `#141420`，表格行 `#1a1a28`，主文本 `#e8e8f0`

---

### Task 1: 更新 package.json 并安装 Vite

**Files:**
- Modify: `package.json`
- Create: `vite.config.js`

**Interfaces:**
- Consumes: 无
- Produces: `vite.config.js`，Vite 构建配置

- [ ] **Step 1: 更新 package.json**

```json
{
  "name": "ai-token-prices",
  "version": "1.0.0",
  "description": "AI 模型价格对比 - Token 价格、上下文窗口对比",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "node src/fetch-prices.js && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

- [ ] **Step 3: 安装依赖**

```bash
npm install
```

- [ ] **Step 4: 提交**

```bash
git add package.json vite.config.js package-lock.json
git commit -m "build: add Vite config and dependency"
```

---

### Task 2: 重写 fetch-prices.js — 只输出 JSON

**Files:**
- Modify: `src/fetch-prices.js`

**Interfaces:**
- Consumes: OpenRouter API `https://openrouter.ai/api/v1/models`
- Produces: `src/data/models.json` — 清洗后的模型数据数组

- [ ] **Step 1: 重写 fetch-prices.js**

删除所有 HTML 生成代码，改为只写 JSON 文件：

```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PLATFORM_MAP = {
  'openai': 'OpenAI',
  'google': 'Google',
  'anthropic': 'Anthropic',
  'meta': 'Meta',
  'mistral': 'Mistral',
  'cohere': 'Cohere',
  'deepseek': 'DeepSeek',
  'qwen': '阿里云',
  'alibaba': '阿里云',
  'glm': '智谱AI',
  'zhipu': '智谱AI',
  'minimax': 'MiniMax',
  'kimi': 'Kimi',
  'moonshot': 'Kimi',
  'doubao': '字节跳动',
  'bytedance': '字节跳动',
  'baidu': '百度',
  'ernie': '百度',
  'yi': '零一万物',
  '01-ai': '零一万物',
  'stepfun': '阶跃星辰',
  'sensechat': '商汤',
  'sensetime': '商汤',
  'xai': 'xAI',
  'perplexity': 'Perplexity',
  'reka': 'Reka',
  'ai21': 'AI21',
  'amazon': 'AWS',
  'nvidia': 'NVIDIA',
  'meituan': '美团',
  'inflection': 'Inflection',
  'microsoft': '微软',
  'phi': '微软',
  'hunyuan': '腾讯',
  'tencent': '腾讯',
  'openrouter': 'OpenRouter',
};

function guessPlatform(modelId) {
  const lower = modelId.toLowerCase();
  for (const [key, label] of Object.entries(PLATFORM_MAP)) {
    if (lower.startsWith(key)) return label;
  }
  const parts = modelId.split('/');
  return parts[0] || '其他';
}

function formatPrice(priceStr) {
  if (!priceStr) return '-';
  const num = parseFloat(priceStr);
  if (isNaN(num)) return '-';
  return (num * 1000000).toFixed(4);
}

function formatDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getModalityText(modality) {
  if (!modality) return 'text';
  if (modality === 'text->text') return 'text';
  if (modality.includes('image')) return '多模态';
  if (modality.includes('audio')) return '多模态';
  return 'text';
}

async function fetchModels() {
  const resp = await fetch('https://openrouter.ai/api/v1/models');
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  return json.data || [];
}

async function main() {
  console.log('Fetching models from OpenRouter...');
  const models = await fetchModels();
  console.log(`Fetched ${models.length} models`);

  const data = models
    .filter(m => m.pricing && m.pricing.prompt)
    .map(m => ({
      id: m.id,
      name: m.name || m.id,
      platform: guessPlatform(m.id),
      inputPrice: formatPrice(m.pricing.prompt),
      outputPrice: formatPrice(m.pricing.completion),
      avg: (() => {
        const i = parseFloat(formatPrice(m.pricing.prompt));
        const o = parseFloat(formatPrice(m.pricing.completion));
        return isNaN(i) || isNaN(o) ? '0.0000' : ((i + o) / 2).toFixed(4);
      })(),
      contextLength: m.context_length || 0,
      contextLabel: (() => {
        const ctx = m.context_length || 0;
        return ctx >= 1000000 ? `${(ctx / 1000000).toFixed(1)}M`
          : ctx >= 1000 ? `${(ctx / 1000).toFixed(0)}K`
          : String(ctx);
      })(),
      created: m.created || 0,
      createdLabel: formatDate(m.created),
      modality: getModalityText(m.architecture?.modality),
    }))
    .sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg));

  const outDir = path.resolve(__dirname, 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'models.json'), JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Written ${data.length} models to src/data/models.json`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: 测试运行**

```bash
node src/fetch-prices.js
```

Expected: 在 `src/data/models.json` 生成模型数据，文件可读。

- [ ] **Step 3: 提交**

```bash
git add src/fetch-prices.js src/data/models.json
git commit -m "refactor: fetch-prices.js 改为输出 JSON"
```

---

### Task 3: 创建 index.html（Vite 入口）

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `src/main.js` (ES module)
- Produces: Vite 入口页面

- [ ] **Step 1: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 模型价格对比 - Token 价格、上下文窗口对比</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>">
</head>
<body>
<div id="app">
  <header class="hero">
    <div class="hero-content">
      <h1>AI 模型比价</h1>
      <p class="hero-subtitle">对比 Token 价格 · 上下文窗口 · 模型能力</p>
      <p class="hero-meta">数据来源: <a href="https://openrouter.ai" target="_blank">OpenRouter</a> · 每日更新</p>
    </div>
  </header>

  <section class="stats-row" id="statsRow">
    <div class="stat-card" id="statCheapest">
      <div class="stat-value">--</div>
      <div class="stat-label">最低价模型</div>
      <div class="stat-detail" id="statCheapestDetail"></div>
    </div>
    <div class="stat-card" id="statMaxCtx">
      <div class="stat-value">--</div>
      <div class="stat-label">最多上下文</div>
      <div class="stat-detail" id="statMaxCtxDetail"></div>
    </div>
    <div class="stat-card" id="statCount">
      <div class="stat-value" id="statCountValue">0</div>
      <div class="stat-label">模型总数</div>
      <div class="stat-detail">每日更新</div>
    </div>
  </section>

  <nav class="tabs">
    <button class="tab active" data-tab="all">所有模型</button>
    <button class="tab" data-tab="popular">热门</button>
    <button class="tab" data-tab="plans">套餐对比</button>
  </nav>

  <div class="controls">
    <div class="control-group">
      <select id="filterPlatform">
        <option value="全部">平台: 全部</option>
      </select>
      <select id="filterContext">
        <option value="0">上下文: 不限</option>
        <option value="8192">8K+</option>
        <option value="16384">16K+</option>
        <option value="32768">32K+</option>
        <option value="65536">64K+</option>
        <option value="131072">128K+</option>
        <option value="1048576">1M+</option>
      </select>
      <select id="sortBy">
        <option value="avg">排序: 均价 ↑</option>
        <option value="avg-desc">均价 ↓</option>
        <option value="contextLength">上下文 ↑</option>
        <option value="contextLength-desc">上下文 ↓</option>
        <option value="name">名称 A-Z</option>
        <option value="name-desc">名称 Z-A</option>
        <option value="created">最新</option>
        <option value="created-desc">最旧</option>
      </select>
      <input type="search" id="search" placeholder="搜索模型名称或 ID...">
    </div>
    <span class="stats-badge" id="statsBadge">0 个模型</span>
  </div>

  <div class="table-wrap">
    <table id="modelTable">
      <thead>
        <tr>
          <th data-sort="name">模型 <span class="sort-arrow">▼</span></th>
          <th data-sort="platform">平台 <span class="sort-arrow">▼</span></th>
          <th data-sort="inputPrice" class="num">输入价/百万 <span class="sort-arrow">▼</span></th>
          <th data-sort="outputPrice" class="num">输出价/百万 <span class="sort-arrow">▼</span></th>
          <th data-sort="avg" class="num sorted">均价/百万 <span class="sort-arrow">▲</span></th>
          <th data-sort="contextLength" class="num">上下文 <span class="sort-arrow">▼</span></th>
          <th data-sort="modality" class="center">模态 <span class="sort-arrow">▼</span></th>
          <th data-sort="created" class="center">发布 <span class="sort-arrow">▼</span></th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <footer>
    <p>Data from <a href="https://openrouter.ai" target="_blank">OpenRouter</a> · 每日自动更新</p>
  </footer>
</div>
<script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: 提交**

```bash
git add index.html
git commit -m "feat: 创建 Vite 入口 index.html"
```

---

### Task 4: 创建 style.css — 完整暗色主题

**Files:**
- Create: `src/style.css`

**Interfaces:**
- Consumes: 无
- Produces: 所有页面样式，在 `src/main.js` 中 import

- [ ] **Step 1: 编写 style.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-page: #0a0a14;
  --bg-card: #141420;
  --bg-row: #1a1a28;
  --bg-row-alt: #1e1e30;
  --bg-row-hover: #252540;
  --bg-input: #1e1e30;
  --bg-header: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  --border: #2a2a40;
  --border-light: #1e1e30;
  --text-primary: #e8e8f0;
  --text-secondary: #8888a0;
  --text-muted: #606080;
  --accent: #667eea;
  --accent-hover: #7b93f5;
  --green: #4ade80;
  --orange: #fb923c;
  --red: #f87171;
  --radius: 10px;
  --radius-sm: 6px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  background: var(--bg-page);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
}

#app { max-width: 1440px; margin: 0 auto; padding: 20px; }

/* Hero */
.hero {
  background: var(--bg-header);
  border-radius: 14px;
  padding: 36px 32px;
  margin-bottom: 20px;
  text-align: center;
}
.hero h1 { font-size: 30px; font-weight: 700; margin-bottom: 6px; }
.hero-subtitle { font-size: 15px; color: var(--text-secondary); }
.hero-meta { font-size: 12px; color: var(--text-muted); margin-top: 8px; }
.hero-meta a { color: var(--accent); text-decoration: none; }
.hero-meta a:hover { text-decoration: underline; }

/* Stats row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
  text-align: center;
}
.stat-value {
  font-size: 22px; font-weight: 700; color: var(--accent);
  margin-bottom: 2px;
}
.stat-label { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.stat-detail { font-size: 11px; color: var(--text-secondary); }

/* Tabs */
.tabs {
  display: flex; gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
  padding-bottom: 8px;
}
.tab {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 6px 18px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.tab:hover { color: var(--text-primary); background: var(--bg-card); }
.tab.active {
  color: white;
  background: var(--accent);
}

/* Controls */
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin-bottom: 12px;
}
.control-group {
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
}
.control-group select,
.control-group input[type="search"] {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  padding: 7px 12px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.control-group select:hover,
.control-group input[type="search"]:hover {
  border-color: var(--accent);
}
.control-group select:focus,
.control-group input[type="search"]:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}
.control-group input[type="search"] { min-width: 220px; flex: 1; }
.control-group select { cursor: pointer; }
.stats-badge {
  font-size: 12px; color: var(--text-muted); white-space: nowrap;
  margin-left: 12px;
}

/* Table */
.table-wrap {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow-x: auto;
}
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th {
  background: var(--bg-row);
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
  transition: background 0.15s;
}
th:hover { background: var(--bg-row-hover); }
th.num { text-align: right; }
th.center { text-align: center; }
th .sort-arrow { margin-left: 4px; opacity: 0.3; font-size: 10px; }
th .sort-arrow.active { opacity: 1; color: var(--accent); }

td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
  transition: background 0.2s;
}
tbody tr { background: var(--bg-row); }
tbody tr:nth-child(even) { background: var(--bg-row-alt); }
tbody tr:hover td { background: var(--bg-row-hover); }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
td.center { text-align: center; }

/* Platform badges */
.platform-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.platform-badge.openai { background: #1a3a2a; color: #4ade80; }
.platform-badge.anthropic { background: #3a1a1a; color: #f87171; }
.platform-badge.google { background: #1a2a3a; color: #60a5fa; }
.platform-badge.deepseek { background: #1a2a3a; color: #38bdf8; }
.platform-badge.meta { background: #2a2a3a; color: #a78bfa; }
.platform-badge.mistral { background: #2a1a3a; color: #c084fc; }
.platform-badge.cohere { background: #1a2a2a; color: #34d399; }
.platform-badge.xai { background: #2a2a1a; color: #fbbf24; }
.platform-badge.perplexity { background: #2a1a2a; color: #f472b6; }
.platform-badge.阿里云 { background: #1a2a3a; color: #93c5fd; }
.platform-badge.智谱AI { background: #1a2a3a; color: #818cf8; }
.platform-badge.MiniMax { background: #1a2a3a; color: #67e8f9; }
.platform-badge.Kimi { background: #2a1a2a; color: #f0abfc; }
.platform-badge.字节跳动 { background: #1a2a3a; color: #7dd3fc; }
.platform-badge.百度 { background: #1a2a3a; color: #93c5fd; }
.platform-badge.其他 { background: var(--bg-input); color: var(--text-secondary); }
.platform-badge.aws { background: #1a2a2a; color: #f97316; }

/* Price colors */
.price-low { color: var(--green); }
.price-mid { color: var(--text-primary); }
.price-high { color: var(--orange); }

/* Modality badge */
.modality-text { color: var(--text-muted); font-size: 12px; }
.modality-vision {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 20px;
  font-size: 11px;
  background: #3a2a1a;
  color: var(--orange);
}

/* Footer */
footer {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 12px;
}
footer a { color: var(--accent); text-decoration: none; }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-page); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* Responsive */
@media (max-width: 1024px) {
  th:nth-child(8), td:nth-child(8) { display: none; }
  .controls { flex-direction: column; align-items: stretch; }
  .control-group { flex-wrap: wrap; }
  .control-group input[type="search"] { min-width: auto; }
  .stats-badge { margin-left: 0; margin-top: 8px; text-align: right; }
}
@media (max-width: 768px) {
  #app { padding: 12px; }
  .hero { padding: 24px 16px; }
  .hero h1 { font-size: 22px; }
  .stats-row { grid-template-columns: 1fr; gap: 8px; }
  th:nth-child(3), td:nth-child(3),
  th:nth-child(4), td:nth-child(4),
  th:nth-child(7), td:nth-child(7) { display: none; }
  .table-wrap { margin: 0 -12px; border-radius: 0; }
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes countUp {
  from { opacity: 0; }
  to { opacity: 1; }
}
.fade-row { animation: fadeInUp 0.3s ease both; }
```

- [ ] **Step 2: 提交**

```bash
git add src/style.css
git commit -m "feat: 完整暗色主题样式"
```

---

### Task 5: 创建 main.js — 筛选/排序/渲染逻辑

**Files:**
- Create: `src/main.js`

**Interfaces:**
- Consumes: `src/data/models.json`（静态 import），`src/style.css`
- Produces: 页面渲染、交互逻辑

- [ ] **Step 1: 创建 src/main.js**

```js
import './style.css';
import modelsData from './data/models.json';

const MODELS = modelsData;

function priceClass(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  if (n < 1) return 'price-low';
  if (n <= 10) return 'price-mid';
  return 'price-high';
}

function getPlatformClass(platform) {
  const cls = platform.toLowerCase().replace(/\s+/g, '').replace(/·/g, '');
  return `platform-badge ${cls}`;
}

// Stats cards
function updateStats(filtered) {
  if (filtered.length === 0) {
    document.getElementById('statCheapest').querySelector('.stat-value').textContent = '--';
    document.getElementById('statMaxCtx').querySelector('.stat-value').textContent = '--';
    document.getElementById('statCountValue').textContent = '0';
    return;
  }
  const sorted = [...filtered].sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg));
  const cheapest = sorted[0];
  document.getElementById('statCheapest').querySelector('.stat-value').textContent = `$${cheapest.avg}`;
  document.getElementById('statCheapestDetail').textContent = `${cheapest.name} · ${cheapest.platform}`;

  const maxCtx = [...filtered].sort((a, b) => b.contextLength - a.contextLength)[0];
  document.getElementById('statMaxCtx').querySelector('.stat-value').textContent = maxCtx.contextLabel;
  document.getElementById('statMaxCtxDetail').textContent = `${maxCtx.name} · ${maxCtx.platform}`;

  const countEl = document.getElementById('statCountValue');
  countEl.textContent = String(filtered.length);
}

// Init filter platform options
const platforms = [...new Set(MODELS.map(m => m.platform))].sort();
const platformSelect = document.getElementById('filterPlatform');
platforms.forEach(p => {
  const opt = document.createElement('option');
  opt.value = p;
  opt.textContent = p;
  platformSelect.appendChild(opt);
});

const state = {
  filterPlatform: '全部',
  filterContext: 0,
  search: '',
  sortBy: 'avg',
  sortDir: 'asc',
};

function render() {
  let filtered = [...MODELS];

  if (state.filterPlatform !== '全部') {
    filtered = filtered.filter(m => m.platform === state.filterPlatform);
  }
  if (state.filterContext > 0) {
    filtered = filtered.filter(m => m.contextLength >= state.filterContext);
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    filtered = filtered.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }

  filtered.sort((a, b) => {
    let cmp = 0;
    switch (state.sortBy) {
      case 'avg': cmp = parseFloat(a.avg) - parseFloat(b.avg); break;
      case 'inputPrice': cmp = parseFloat(a.inputPrice) - parseFloat(b.inputPrice); break;
      case 'outputPrice': cmp = parseFloat(a.outputPrice) - parseFloat(b.outputPrice); break;
      case 'contextLength': cmp = a.contextLength - b.contextLength; break;
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'platform': cmp = a.platform.localeCompare(b.platform); break;
      case 'created': cmp = a.created - b.created; break;
      case 'modality': cmp = a.modality.localeCompare(b.modality); break;
    }
    return state.sortDir === 'asc' ? cmp : -cmp;
  });

  document.getElementById('statsBadge').textContent = `${filtered.length} 个模型`;
  updateStats(filtered);

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = filtered.map((m, i) => {
    const avgClass = priceClass(m.avg);
    const platformClass = getPlatformClass(m.platform);
    const modalityHtml = m.modality === '多模态'
      ? `<span class="modality-vision">多模态</span>`
      : `<span class="modality-text">text</span>`;
    return `<tr class="fade-row" style="animation-delay:${i * 0.03}s">
      <td><strong>${m.name}</strong></td>
      <td><span class="${platformClass}">${m.platform}</span></td>
      <td class="num ${priceClass(m.inputPrice)}">$${m.inputPrice}</td>
      <td class="num ${priceClass(m.outputPrice)}">$${m.outputPrice}</td>
      <td class="num ${avgClass}"><strong>$${m.avg}</strong></td>
      <td class="num">${m.contextLabel}</td>
      <td class="center">${modalityHtml}</td>
      <td class="center" style="color:var(--text-muted);font-size:12px;">${m.createdLabel}</td>
    </tr>`;
  }).join('');

  // Update sort arrows
  document.querySelectorAll('th .sort-arrow').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('th[data-sort]').forEach(th => {
    if (th.dataset.sort === state.sortBy) {
      const arrow = th.querySelector('.sort-arrow');
      arrow.classList.add('active');
      arrow.textContent = state.sortDir === 'asc' ? '▲' : '▼';
    }
  });
}

// Debounce helper
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Event listeners
document.getElementById('filterPlatform').addEventListener('change', e => {
  state.filterPlatform = e.target.value;
  render();
});
document.getElementById('filterContext').addEventListener('change', e => {
  state.filterContext = parseInt(e.target.value);
  render();
});
document.getElementById('search').addEventListener('input', debounce(e => {
  state.search = e.target.value;
  render();
}, 300));
document.getElementById('sortBy').addEventListener('change', e => {
  const v = e.target.value;
  const parts = v.split('-');
  state.sortBy = parts[0];
  state.sortDir = parts[1] === 'desc' ? 'desc' : 'asc';
  render();
});

// Column header click sorting
document.querySelectorAll('th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortBy === key) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortBy = key;
      state.sortDir = 'asc';
    }
    const dd = document.getElementById('sortBy');
    const optVal = state.sortDir === 'asc' ? state.sortBy : state.sortBy + '-desc';
    if ([...dd.options].some(o => o.value === optVal)) dd.value = optVal;
    render();
  });
});

render();
```

- [ ] **Step 2: 提交**

```bash
git add src/main.js
git commit -m "feat: 筛选/排序/渲染逻辑 + 暗色主题集成"
```

---

### Task 6: 更新 GitHub Actions workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: 构建命令改为 `npm run build`（内部执行 fetch + vite build）
- Produces: Pages 部署

- [ ] **Step 1: 更新 deploy.yml**

```yaml
name: 每日更新价格并部署到 Pages

on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: 安装依赖
        run: npm ci
      - name: 抓取数据并构建
        run: npm run build
      - name: 上传 Pages 产物
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: 部署到 GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 提交**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: 更新 workflow 适应 Vite 构建"
```

---

### Task 7: 本地测试构建

- [ ] **Step 1: 运行完整构建**

```bash
npm run build
```

Expected: `dist/index.html` 生成，`dist/assets/index-xxx.js` 和 `dist/assets/index-xxx.css` 生成。

- [ ] **Step 2: 预览验证**

```bash
npx vite preview
```

手动打开浏览器检查页面是否正常渲染、筛选排序功能可用、暗色主题正确。

- [ ] **Step 3: 提交最终修改**

```bash
git add -A
git commit -m "chore: 更新 dist 产物"
```

---

### Task 8: 推送到 GitHub 并触发部署

- [ ] **Step 1: 推送**

```bash
git push origin master
```

- [ ] **Step 2: 触发工作流验证**

```bash
gh workflow run deploy.yml
```
