import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/tokenprice/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
