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
        discovery: resolve(__dirname, 'discovery/index.html'),
        cabin: resolve(__dirname, 'cabin/index.html'),
        cloud: resolve(__dirname, 'cloud/index.html'),
        book: resolve(__dirname, 'book/index.html')
      }
    }
  }
})
