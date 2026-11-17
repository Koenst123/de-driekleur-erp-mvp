import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        website: fileURLToPath(new URL('./website.html', import.meta.url)),
      },
    },
  },
  test: { include: ['tests/**/*.test.js'] },
});
