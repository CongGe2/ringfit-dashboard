import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages 部署时取消下一行注释，把 repo-name 换成你的仓库名
  // base: command === 'build' ? '/ringfit-dashboard/' : '/',
  server: { port: 3000 },
}));
