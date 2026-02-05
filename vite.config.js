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
        goldenHour: resolve(__dirname, 'concepts/golden-hour.html')
      }
    }
  }
})
