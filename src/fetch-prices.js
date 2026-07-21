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
    .filter(m => m.pricing && m.pricing.prompt && parseFloat(m.pricing.prompt) >= 0 && parseFloat(m.pricing.completion) >= 0)
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
