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
