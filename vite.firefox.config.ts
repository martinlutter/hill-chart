import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Firefox build: plain Vite (no @crxjs — Firefox MV2 uses different structure)
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-firefox',
    rollupOptions: {
      input: {
        'content/index': resolve(__dirname, 'src/content/index.ts'),
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        format: 'iife',
        // Each entry must be self-contained for Firefox MV2 content scripts
        inlineDynamicImports: false,
      },
    },
  },
})
