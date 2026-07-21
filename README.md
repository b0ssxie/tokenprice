# AI Token Price

一份精心维护的 AI 模型价格参照表。每日自动从 OpenRouter 同步数据，涵盖 300+ 模型的价格、上下文窗口与模态信息。

## 特性

- **实时数据** — 每日 UTC 0:00 自动抓取 OpenRouter API，确保定价信息最新
- **多维筛选** — 按平台、上下文窗口过滤，全文搜索，多维度排序
- **热门模型** — 精选头部模型的快速筛选入口
- **供应商参考** — 国内主流 AI 平台月费套餐速览
- **响应式布局** — 桌面到移动端的自适配体验

## 技术栈

- **Vite** — 现代化前端构建工具
- **JavaScript** — 原生 ES Module，零框架依赖
- **GitHub Actions** — CI/CD 自动构建部署
- **GitHub Pages** — 静态托管

## 目录结构

```
src/
├── fetch-prices.js      # 数据抓取脚本，输出 JSON
├── main.js              # 前端交互逻辑（筛选/排序/渲染）
├── style.css            # 暗色主题样式
└── data/
    ├── models.json      # 模型价格数据（自动生成）
    └── plans.json       # 供应商套餐信息
```

## 开发

```bash
npm install          # 安装依赖
npm run dev          # 本地开发服务器
npm run build        # 构建生产版本
```

## 数据来源

- 模型价格数据：[OpenRouter](https://openrouter.ai/)
- 供应商套餐参考：各平台官网公开信息

## 许可

MIT
