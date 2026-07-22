import './style.css';
import modelsData from './data/models.json';

const USD_CNY = 7.2;
const MAJOR = new Set(['OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'Meta', 'Mistral', 'xAI', 'Cohere', 'Kimi', '智谱AI', 'MiniMax', '阿里云', '字节跳动']);
const NINETY_DAYS = 90 * 24 * 3600;
const now = Math.floor(Date.now() / 1000);

const POPULAR = [...modelsData]
  .filter(m => m.avg > 0 && MAJOR.has(m.platform) && m.created >= now - NINETY_DAYS)
  .sort((a, b) => b.created - a.created)
  .slice(0, 20);

let currency = 'USD';

function priceClass(val) {
  if (val < 1) return 'price-low';
  if (val <= 10) return 'price-mid';
  return 'price-high';
}

function fmtPrice(usd) {
  if (usd === 0) return currency === 'USD' ? '$0' : '¥0';
  const n = currency === 'USD' ? usd : usd * USD_CNY;
  const s = n < 0.01 ? n.toFixed(4) : n < 1 ? n.toFixed(3) : n.toFixed(2);
  const cleaned = s.replace(/\.?0+$/, '');
  return currency === 'USD' ? `$${cleaned}` : `¥${cleaned}`;
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
  const paid = filtered.filter(m => m.avg > 0);
  const pool = paid.length ? paid : filtered;
  const cheapest = [...pool].sort((a, b) => a.avg - b.avg)[0];
  document.getElementById('statCheapest').querySelector('.stat-value').textContent = fmtPrice(cheapest.avg);
  document.getElementById('statCheapestDetail').textContent = `${cheapest.name} · ${cheapest.platform}`;

  const maxCtx = [...filtered].sort((a, b) => b.contextLength - a.contextLength)[0];
  document.getElementById('statMaxCtx').querySelector('.stat-value').textContent = maxCtx.contextLabel;
  document.getElementById('statMaxCtxDetail').textContent = `${maxCtx.name} · ${maxCtx.platform}`;
  document.getElementById('statCountValue').textContent = String(filtered.length);
}

function sortData(data, sortBy, sortDir) {
  return [...data].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'avg':
      case 'inputPrice':
      case 'outputPrice':
        cmp = a[sortBy] - b[sortBy];
        break;
      case 'contextLength':
      case 'created':
        cmp = a[sortBy] - b[sortBy];
        break;
      case 'name':
      case 'platform':
      case 'modality':
        cmp = a[sortBy].localeCompare(b[sortBy]);
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

function renderTableBody(data, tbodyId, badgeId, sortBy, sortDir, showCreated) {
  const sorted = sortData(data, sortBy, sortDir);
  if (badgeId) document.getElementById(badgeId).textContent = `${sorted.length} 个模型`;

  const tbody = document.getElementById(tbodyId);
  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">无匹配模型</td></tr>`;
    return;
  }
  tbody.innerHTML = sorted.map((m, i) => {
    const delay = Math.min(i, 30) * 0.02;
    const modalityHtml = m.modality === '多模态'
      ? `<span class="modality-vision">多模态</span>`
      : `<span class="modality-text">text</span>`;
    return `<tr class="fade-row" style="animation-delay:${delay}s">
      <td><strong>${m.name}</strong></td>
      <td><span class="${getPlatformClass(m.platform)}">${m.platform}</span></td>
      <td class="num ${priceClass(m.inputPrice)}">${fmtPrice(m.inputPrice)}</td>
      <td class="num ${priceClass(m.outputPrice)}">${fmtPrice(m.outputPrice)}</td>
      <td class="num ${priceClass(m.avg)}"><strong>${fmtPrice(m.avg)}</strong></td>
      <td class="num">${m.contextLabel}</td>
      <td class="center">${modalityHtml}</td>
      ${showCreated ? `<td class="center created-cell">${m.createdLabel}</td>` : ''}
    </tr>`;
  }).join('');
}

function updateSortArrows(root, sortBy, sortDir) {
  root.querySelectorAll('th .sort-arrow').forEach(el => el.classList.remove('active'));
  root.querySelectorAll('th[data-sort]').forEach(th => {
    if (th.dataset.sort === sortBy) {
      const arrow = th.querySelector('.sort-arrow');
      arrow.classList.add('active');
      arrow.textContent = sortDir === 'asc' ? '▲' : '▼';
    }
  });
}

function updateCurrencyBtns() {
  document.querySelectorAll('.currency-btn').forEach(b => {
    b.textContent = currency;
  });
}

const platforms = [...new Set(modelsData.map(m => m.platform))].sort();
const platformSelect = document.getElementById('filterPlatform');
platforms.forEach(p => {
  const opt = document.createElement('option');
  opt.value = p;
  opt.textContent = p;
  platformSelect.appendChild(opt);
});

const allState = {
  filterPlatform: '全部',
  filterContext: 0,
  search: '',
  hideFree: true,
  sortBy: 'avg',
  sortDir: 'asc',
};

const popState = {
  filterContext: 0,
  sortBy: 'avg',
  sortDir: 'asc',
};

function renderAll() {
  let filtered = modelsData;
  if (allState.hideFree) filtered = filtered.filter(m => m.avg > 0);
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
  updateSortArrows(document.getElementById('tabAll'), allState.sortBy, allState.sortDir);
}

function renderPopular() {
  let filtered = POPULAR;
  if (popState.filterContext > 0) {
    filtered = filtered.filter(m => m.contextLength >= popState.filterContext);
  }
  renderTableBody(filtered, 'popularBody', 'popularStatsBadge', popState.sortBy, popState.sortDir, false);
  updateSortArrows(document.getElementById('tabPopular'), popState.sortBy, popState.sortDir);
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function bindSort(root, state, render) {
  root.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sortBy === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = key;
        state.sortDir = 'asc';
      }
      render();
    });
  });
}

function toggleCurrency() {
  currency = currency === 'USD' ? 'CNY' : 'USD';
  updateCurrencyBtns();
  renderAll();
  if (document.getElementById('tabPopular').style.display !== 'none') renderPopular();
}

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

document.getElementById('filterPlatform').addEventListener('change', e => {
  allState.filterPlatform = e.target.value;
  renderAll();
});
document.getElementById('filterContext').addEventListener('change', e => {
  allState.filterContext = parseInt(e.target.value);
  renderAll();
});
document.getElementById('hideFree').addEventListener('change', e => {
  allState.hideFree = e.target.checked;
  renderAll();
});
document.getElementById('search').addEventListener('input', debounce(e => {
  allState.search = e.target.value;
  renderAll();
}, 300));
document.getElementById('currencyBtn').addEventListener('click', toggleCurrency);
document.getElementById('popularCurrencyBtn').addEventListener('click', toggleCurrency);

document.getElementById('popularFilterContext').addEventListener('change', e => {
  popState.filterContext = parseInt(e.target.value);
  renderPopular();
});

bindSort(document.getElementById('tabAll'), allState, renderAll);
bindSort(document.getElementById('tabPopular'), popState, renderPopular);

updateCurrencyBtns();
renderAll();
