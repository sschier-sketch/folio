import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function copyDirSafe(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    try {
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDirSafe(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch {
      // skip locked or inaccessible files
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'safe-copy-public',
      apply: 'build',
      closeBundle() {
        copyDirSafe('public', 'dist');
      },
    },
  ],
  build: {
    target: 'es2022',
    copyPublicDir: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
