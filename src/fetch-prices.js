import fs from 'fs';
import path from 'path';

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

function buildHtml(models) {
  const rows = models
    .filter(m => m.pricing && m.pricing.prompt)
    .map(m => {
      const inputPrice = formatPrice(m.pricing.prompt);
      const outputPrice = formatPrice(m.pricing.completion);
      const avg = inputPrice !== '-' && outputPrice !== '-'
        ? ((parseFloat(inputPrice) + parseFloat(outputPrice)) / 2).toFixed(4)
        : '-';
      const platform = guessPlatform(m.id);
      const ctx = m.context_length || 0;
      const ctxLabel = ctx >= 1000000 ? `${(ctx / 1000000).toFixed(1)}M`
        : ctx >= 1000 ? `${(ctx / 1000).toFixed(0)}K`
        : String(ctx);
      return {
        id: m.id,
        name: m.name || m.id,
        platform,
        inputPrice,
        outputPrice,
        avg,
        contextLength: ctx,
        contextLabel: ctxLabel,
        created: m.created || 0,
        createdLabel: formatDate(m.created),
        modality: getModalityText(m.architecture?.modality),
      };
    })
    .sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg));

  const jsonData = JSON.stringify(rows);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 模型价格对比 - Token 价格、上下文窗口对比</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f5f5f5;
    color: #1a1a2e;
    line-height: 1.6;
  }
  .container { max-width: 1400px; margin: 0 auto; padding: 20px; }

  /* Header */
  header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 20px;
    text-align: center;
    border-radius: 16px;
    margin-bottom: 24px;
  }
  header h1 { font-size: 32px; margin-bottom: 8px; font-weight: 700; }
  header p { font-size: 16px; opacity: 0.9; }
  header .subtitle { font-size: 14px; opacity: 0.7; margin-top: 8px; }

  /* Plans */
  .plans { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .plan {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    display: flex; flex-direction: column;
  }
  .plan.featured {
    border: 2px solid #667eea;
    position: relative;
  }
  .plan.featured::before {
    content: '推荐';
    position: absolute;
    top: -10px; right: 16px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 2px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  .plan-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .plan-price { font-size: 14px; color: #666; margin-bottom: 12px; }
  .plan-price strong { font-size: 22px; color: #1a1a2e; }
  .plan-models { font-size: 13px; color: #555; margin-bottom: 8px; flex: 1; }
  .plan-extra { font-size: 13px; color: #888; margin-bottom: 12px; }
  .plan-link {
    display: inline-block;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 8px 20px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    transition: opacity 0.2s;
  }
  .plan-link:hover { opacity: 0.85; }

  /* Controls */
  .controls {
    display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
    background: white; padding: 16px 20px; border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 16px;
  }
  .controls select, .controls input {
    padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px;
    font-size: 14px; background: white; color: #333;
  }
  .controls input[type="search"] { flex: 1; min-width: 200px; }
  .controls label { font-size: 14px; color: #555; white-space: nowrap; }
  .stats { font-size: 13px; color: #888; margin-left: auto; }

  /* Table */
  .table-wrap {
    background: white; border-radius: 12px; overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th {
    background: #f8f9fa; padding: 12px 16px; text-align: left;
    font-weight: 600; color: #555; border-bottom: 2px solid #eee;
    cursor: pointer; user-select: none; white-space: nowrap;
  }
  th:hover { background: #eef0f5; }
  th .sort-arrow { margin-left: 4px; opacity: 0.4; }
  th .sort-arrow.active { opacity: 1; color: #667eea; }
  td {
    padding: 10px 16px; border-bottom: 1px solid #f0f0f0; color: #333;
  }
  tr:hover td { background: #f8f9ff; }
  .platform-badge {
    display: inline-block; padding: 2px 10px; border-radius: 20px;
    font-size: 12px; font-weight: 500;
  }
  .tag-text { background: #e8f5e9; color: #2e7d32; }
  .tag-vision { background: #fff3e0; color: #e65100; }
  .ctx-cell { font-variant-numeric: tabular-nums; }
  .price-up { color: #d32f2f; }
  .price-down { color: #2e7d32; }

  @media (max-width: 768px) {
    .plans { grid-template-columns: 1fr; }
    .controls { flex-direction: column; align-items: stretch; }
    .controls input[type="search"] { min-width: auto; }
    .stats { margin-left: 0; text-align: right; }
    th, td { padding: 8px 10px; font-size: 12px; }
    header h1 { font-size: 24px; }
  }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🤖 AI 模型比价</h1>
    <p>对比 Token 价格、上下文窗口与模型能力</p>
    <div class="subtitle">数据来源: <a href="https://openrouter.ai" style="color:white;text-decoration:underline">OpenRouter</a> · 每日更新</div>
  </header>

  <div class="plans">
    <div class="plan featured">
      <div class="plan-name">⚡ OpenCode Go</div>
      <div class="plan-price"><strong>$10</strong>/月 · $5/首月</div>
      <div class="plan-models">
        可用模型 (12+): GLM-5.1, Kimi K2.6, MiMo V2.5-Pro, Qwen3.6 Plus, MiniMax M2.7, DeepSeek V4 Pro, DeepSeek V4 Flash 等
      </div>
      <div class="plan-extra">额度: 慷慨额度 · 可充值 · 任意 Agent</div>
      <a class="plan-link" href="https://opencode.ai/go?ref=X1E3T8TFJZ">试用 Go →</a>
    </div>
    <div class="plan">
      <div class="plan-name">🧠 智谱AI</div>
      <div class="plan-price"><strong>¥49</strong>/月 · ¥46.55/首月</div>
      <div class="plan-models">GLM-5.1, GLM-5-Turbo</div>
      <div class="plan-extra">月请求: 24,000 次 · 5h限制: 1,200 次</div>
      <a class="plan-link" href="https://open.bigmodel.cn">查看 →</a>
    </div>
    <div class="plan">
      <div class="plan-name">💠 MiniMax</div>
      <div class="plan-price"><strong>¥29</strong>/月 · ¥26.1/首月</div>
      <div class="plan-models">MiniMax-M2.7, MiniMax-M2.5</div>
      <div class="plan-extra">月请求: 24,000 次 · 5h限制: 600 次</div>
      <a class="plan-link" href="https://www.minimaxi.com">查看 →</a>
    </div>
    <div class="plan">
      <div class="plan-name">🔥 讯飞·星火</div>
      <div class="plan-price"><strong>¥39</strong>/月</div>
      <div class="plan-models">GLM-5.1, Qwen-3.5-Plus, MiniMax-M2.5, Kimi-K2.5, DeepSeek-V3.2</div>
      <div class="plan-extra">月请求: 18,000 次 · 5h限制: 1,200 次</div>
      <a class="plan-link" href="https://xinghuo.xfyun.cn">查看 →</a>
    </div>
    <div class="plan">
      <div class="plan-name">🌙 Kimi</div>
      <div class="plan-price"><strong>¥49</strong>/月</div>
      <div class="plan-models">Kimi-K2.6, Kimi-K2.5, Kimi-K2</div>
      <div class="plan-extra">月请求: 未公开 · Agent 4 倍速</div>
      <a class="plan-link" href="https://kimi.moonshot.cn">查看 →</a>
    </div>
    <div class="plan">
      <div class="plan-name">📦 字节·方舟</div>
      <div class="plan-price"><strong>¥40</strong>/月 · ¥36/首月</div>
      <div class="plan-models">Doubao-Seed-2.0, MiniMax-M2.7, Kimi-K2.6, GLM-5.1, DeepSeek-V3.2</div>
      <div class="plan-extra">月请求: 18,000 次 · 已开始限购</div>
      <a class="plan-link" href="https://console.volcengine.com/ark">查看 →</a>
    </div>
  </div>

  <div class="controls">
    <label>平台: <select id="filterPlatform">
      <option value="全部">全部</option>
    </select></label>
    <label>上下文:
      <select id="filterContext">
        <option value="0">不限</option>
        <option value="8192">8K+</option>
        <option value="16384">16K+</option>
        <option value="32768">32K+</option>
        <option value="65536">64K+</option>
        <option value="131072">128K+</option>
        <option value="1048576">1M+</option>
      </select>
    </label>
    <label>排序:
      <select id="sortBy">
        <option value="avg">均价 ↑</option>
        <option value="avg-desc">均价 ↓</option>
        <option value="context">上下文 ↑</option>
        <option value="context-desc">上下文 ↓</option>
        <option value="name">名称 A-Z</option>
        <option value="name-desc">名称 Z-A</option>
        <option value="created">最新</option>
        <option value="created-desc">最旧</option>
      </select>
    </label>
    <input type="search" id="search" placeholder="搜索模型名称...">
    <div class="stats" id="stats"></div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th data-sort="name">模型 <span class="sort-arrow">▼</span></th>
          <th data-sort="platform">平台 <span class="sort-arrow">▼</span></th>
          <th data-sort="inputPrice">输入价/百万 <span class="sort-arrow">▼</span></th>
          <th data-sort="outputPrice">输出价/百万 <span class="sort-arrow">▼</span></th>
          <th data-sort="avg" class="sorted">均价/百万 <span class="sort-arrow active">▼</span></th>
          <th data-sort="contextLength">上下文 <span class="sort-arrow">▼</span></th>
          <th data-sort="created">发布 <span class="sort-arrow">▼</span></th>
          <th data-sort="modality">模态 <span class="sort-arrow">▼</span></th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <footer style="text-align:center;padding:24px;color:#999;font-size:13px;">
    Data from <a href="https://openrouter.ai">OpenRouter</a> ·
    <a href="https://github.com/whyyoume/Internet_my">GitHub</a> ·
    每日自动更新
  </footer>
</div>

<script>
const MODELS = ${jsonData};

// Init filter options
const platforms = [...new Set(MODELS.map(m => m.platform))].sort();
const sel = document.getElementById('filterPlatform');
platforms.forEach(p => {
  const opt = document.createElement('option');
  opt.value = p;
  opt.textContent = p;
  sel.appendChild(opt);
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

  document.getElementById('stats').textContent = \`\${filtered.length} 个模型\`;

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = filtered.map(m => \`
    <tr>
      <td>\${m.name}</td>
      <td><span class="platform-badge tag-text">\${m.platform}</span></td>
      <td>\${m.inputPrice}</td>
      <td>\${m.outputPrice}</td>
      <td><strong>\${m.avg}</strong></td>
      <td class="ctx-cell">\${m.contextLabel}</td>
      <td>\${m.createdLabel}</td>
      <td>\${m.modality === '多模态' ? '<span class="platform-badge tag-vision">多模态</span>' : 'text'}</td>
    </tr>
  \`).join('');

  // Update sort arrows
  document.querySelectorAll('th .sort-arrow').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('th[data-sort]').forEach(th => {
    if (th.dataset.sort === state.sortBy) {
      th.querySelector('.sort-arrow').classList.add('active');
      th.querySelector('.sort-arrow').textContent = state.sortDir === 'asc' ? '▲' : '▼';
    } else {
      th.querySelector('.sort-arrow').textContent = '▼';
    }
  });
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
document.getElementById('search').addEventListener('input', e => {
  state.search = e.target.value;
  render();
});
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
    // Sync dropdown
    const dd = document.getElementById('sortBy');
    const optVal = state.sortDir === 'asc' ? state.sortBy : state.sortBy + '-desc';
    if ([...dd.options].some(o => o.value === optVal)) dd.value = optVal;
    render();
  });
});

render();
</script>
</body>
</html>`;
}

async function main() {
  console.log('Fetching models from OpenRouter...');
  const models = await fetchModels();
  console.log(`Fetched ${models.length} models`);

  const html = buildHtml(models);
  const outDir = process.argv[2] || 'dist';
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
  console.log(`Written to ${path.join(outDir, 'index.html')}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
