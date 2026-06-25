import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

function copyBibleQuiz() {
  return {
    name: 'copy-bible-quiz',
    closeBundle() {
      const files = ['host.html', 'player.html', 'solo.html']
      const destDir = resolve(__dirname, 'dist/bible-quiz')
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
      files.forEach(f => {
        const src = resolve(__dirname, `public/bible-quiz/${f}`)
        const dest = resolve(__dirname, `dist/bible-quiz/${f}`)
        if (existsSync(src)) copyFileSync(src, dest)
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), copyBibleQuiz()],
})
