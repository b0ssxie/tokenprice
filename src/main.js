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
