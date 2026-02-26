import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, writeFileSync } from 'fs'

function copyFirefoxAssets(): Plugin {
  return {
    name: 'copy-firefox-assets',
    closeBundle() {
      // Copy manifest
      copyFileSync(
        resolve(__dirname, 'manifest.firefox.json'),
        resolve(__dirname, 'dist-firefox/manifest.json'),
      )
      // Background script is a no-op for Firefox MV2 (empty in MV3 source too)
      mkdirSync(resolve(__dirname, 'dist-firefox/background'), { recursive: true })
      writeFileSync(resolve(__dirname, 'dist-firefox/background/service-worker.js'), '')
    },
  }
}

// Firefox build: plain Vite (no @crxjs — Firefox MV2 uses different structure)
// Builds content script only as IIFE (IIFE requires a single entry point).
// Background script is empty and written directly by the plugin above.
export default defineConfig({
  plugins: [react(), copyFirefoxAssets()],
  build: {
    outDir: 'dist-firefox',
    rollupOptions: {
      input: {
        'content/index': resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        format: 'iife',
        name: 'hillchart',
        // Single entry — no code-splitting, IIFE is self-contained
        inlineDynamicImports: true,
      },
    },
  },
})
