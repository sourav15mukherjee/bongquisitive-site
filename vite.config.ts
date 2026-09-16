import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));

export default defineConfig({
  build: {
    target: 'es2022',
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((p) => [p.replace('.html', ''), resolve(root, p)]),
      ),
    },
  },
});
