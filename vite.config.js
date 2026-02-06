import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/giftsite/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cloudAscent: resolve(__dirname, 'concepts/cloud-ascent.html'),
        rainGlass: resolve(__dirname, 'concepts/rain-glass.html')
      }
    }
  }
})
