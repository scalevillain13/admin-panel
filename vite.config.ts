import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Для GitHub Pages: при рефреше или прямом переходе по /admin-panel/... сервер отдаёт 404.html.
// Копируем index.html в 404.html, чтобы SPA загружалась и роутер открыл нужную страницу.
function copyIndexTo404() {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist')
      const indexPath = path.join(outDir, 'index.html')
      const notFoundPath = path.join(outDir, '404.html')
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyIndexTo404()],
  base: process.env.BASE_PATH || '/admin-panel/',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
