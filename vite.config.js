import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-xlsx-files',
      apply: 'build',
      enforce: 'post',
      generateBundle() {
        const srcDir = path.join(process.cwd(), 'node_modules', 'xlsx', 'dist');
        const distDir = path.join(process.cwd(), 'dist');

        const filesToCopy = [
          'xlsx.core.min.js',
          'xlsx.full.min.js',
          'xlsx.mini.min.js',
          'cpexcel.js'
        ];

        filesToCopy.forEach(file => {
          const src = path.join(srcDir, file);
          const dest = path.join(distDir, file);
          
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
          }
        });
      }
    }
  ],
});
