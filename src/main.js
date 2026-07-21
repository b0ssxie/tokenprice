import './style.css';
import modelsData from './data/models.json';

const POPULAR_IDS = [
  'openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/o3', 'openai/o4-mini',
  'anthropic/claude-sonnet-4', 'anthropic/claude-sonnet-4.5', 'anthropic/claude-sonnet-4.6',
  'google/gemini-2.5-pro', 'google/gemini-2.5-flash',
  'deepseek/deepseek-r1', 'deepseek/deepseek-chat',
  'mistralai/mistral-large-2512', 'mistralai/mistral-small-3.1-24b-instruct',
  'cohere/command-r-plus-08-2024', 'cohere/command-r-08-2024',
  'qwen/qwen-2.5-72b-instruct', 'meta-llama/llama-3.1-70b-instruct',
];

const POPULAR = modelsData.filter(m => POPULAR_IDS.includes(m.id));

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

function renderTableBody(data, tbodyId, badgeId, sortBy, sortDir, showCreated) {
  const sorted = [...data];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'avg': cmp = parseFloat(a.avg) - parseFloat(b.avg); break;
      case 'inputPrice': cmp = parseFloat(a.inputPrice) - parseFloat(b.inputPrice); break;
      case 'outputPrice': cmp = parseFloat(a.outputPrice) - parseFloat(b.outputPrice); break;
      case 'contextLength': cmp = a.contextLength - b.contextLength; break;
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'platform': cmp = a.platform.localeCompare(b.platform); break;
      case 'modality': cmp = a.modality.localeCompare(b.modality); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (badgeId) document.getElementById(badgeId).textContent = `${sorted.length} 个模型`;

  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = sorted.map((m, i) => {
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
      ${showCreated && m.createdLabel ? `<td class="center" style="color:var(--text-muted);font-size:12px;">${m.createdLabel}</td>` : ''}
    </tr>`;
  }).join('');
}

// Init platform options
const platforms = [...new Set(modelsData.map(m => m.platform))].sort();
const platformSelect = document.getElementById('filterPlatform');
platforms.forEach(p => {
  const opt = document.createElement('option');
  opt.value = p;
  opt.textContent = p;
  platformSelect.appendChild(opt);
});

// State: all models tab
const allState = {
  filterPlatform: '全部',
  filterContext: 0,
  search: '',
  sortBy: 'avg',
  sortDir: 'asc',
};

// State: popular tab
const popState = {
  filterContext: 0,
  sortBy: 'avg',
  sortDir: 'asc',
};

function renderAll() {
  let filtered = [...modelsData];
  if (allState.filterPlatform !== '全部') {
    filtered = filtered.filter(m => m.platform === allState.filterPlatform);
  }
  if (allState.filterContext > 0) {
    filtered = filtered.filter(m => m.contextLength >= allState.filterContext);
  }
  if (allState.search) {
    const q = allState.search.toLowerCase();
    filtered = filtered.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }
  document.getElementById('statsBadge').textContent = `${filtered.length} 个模型`;
  updateStats(filtered);
  renderTableBody(filtered, 'tableBody', null, allState.sortBy, allState.sortDir, true);

  document.querySelectorAll('#tabAll th .sort-arrow').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#tabAll th[data-sort]').forEach(th => {
    if (th.dataset.sort === allState.sortBy) {
      const arrow = th.querySelector('.sort-arrow');
      arrow.classList.add('active');
      arrow.textContent = allState.sortDir === 'asc' ? '▲' : '▼';
    }
  });
}

function renderPopular() {
  let filtered = [...POPULAR];
  if (popState.filterContext > 0) {
    filtered = filtered.filter(m => m.contextLength >= popState.filterContext);
  }
  renderTableBody(filtered, 'popularBody', 'popularStatsBadge', popState.sortBy, popState.sortDir, false);

  document.querySelectorAll('#tabPopular th .sort-arrow').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#tabPopular th[data-sort]').forEach(th => {
    if (th.dataset.sort === popState.sortBy) {
      const arrow = th.querySelector('.sort-arrow');
      arrow.classList.add('active');
      arrow.textContent = popState.sortDir === 'asc' ? '▲' : '▼';
    }
  });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Tab switching
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    const target = document.getElementById(`tab${btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)}`);
    if (target) target.style.display = '';
    if (btn.dataset.tab === 'popular') renderPopular();
  });
});

// All tab events
document.getElementById('filterPlatform').addEventListener('change', e => {
  allState.filterPlatform = e.target.value;
  renderAll();
});
document.getElementById('filterContext').addEventListener('change', e => {
  allState.filterContext = parseInt(e.target.value);
  renderAll();
});
document.getElementById('search').addEventListener('input', debounce(e => {
  allState.search = e.target.value;
  renderAll();
}, 300));
document.getElementById('sortBy').addEventListener('change', e => {
  const v = e.target.value;
  const parts = v.split('-');
  allState.sortBy = parts[0];
  allState.sortDir = parts[1] === 'desc' ? 'desc' : 'asc';
  renderAll();
});

// All tab column header click sorting
document.querySelectorAll('#tabAll th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (allState.sortBy === key) {
      allState.sortDir = allState.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      allState.sortBy = key;
      allState.sortDir = 'asc';
    }
    const dd = document.getElementById('sortBy');
    const optVal = allState.sortDir === 'asc' ? allState.sortBy : allState.sortBy + '-desc';
    if ([...dd.options].some(o => o.value === optVal)) dd.value = optVal;
    renderAll();
  });
});

// Popular tab events
document.getElementById('popularFilterContext').addEventListener('change', e => {
  popState.filterContext = parseInt(e.target.value);
  renderPopular();
});
document.getElementById('popularSortBy').addEventListener('change', e => {
  const v = e.target.value;
  const parts = v.split('-');
  popState.sortBy = parts[0];
  popState.sortDir = parts[1] === 'desc' ? 'desc' : 'asc';
  renderPopular();
});

// Popular tab column header click sorting
document.querySelectorAll('#tabPopular th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (popState.sortBy === key) {
      popState.sortDir = popState.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      popState.sortBy = key;
      popState.sortDir = 'asc';
    }
    const dd = document.getElementById('popularSortBy');
    const optVal = popState.sortDir === 'asc' ? popState.sortBy : popState.sortBy + '-desc';
    if ([...dd.options].some(o => o.value === optVal)) dd.value = optVal;
    renderPopular();
  });
});

renderAll();
