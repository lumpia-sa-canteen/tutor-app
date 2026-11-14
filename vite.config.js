/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import searchHandler from './api/gemini/search.js'

// While developing, this runs the same file that Vercel runs online (api/gemini/search.js)
function geminiSearchDev() {
  return {
    name: 'gemini-search-dev',
    configureServer(server) {
      server.middlewares.use('/api/gemini/search', (req, res) => {
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
        })
        req.on('end', () => {
          try {
            req.body = raw ? JSON.parse(raw) : {}
          } catch {
            req.body = {}
          }
          searchHandler(req, res)
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  // lets the search function read the key from .env.local while developing
  if (env.AI_API_KEY && !process.env.AI_API_KEY) process.env.AI_API_KEY = env.AI_API_KEY

  return {
    plugins: [react(), geminiSearchDev()],
    server: {
      host: true,   // lets other computers on your network open the site
      proxy: {
        // Gemini
        '/api/ai': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai/, '/v1beta/openai'),
          headers: { Authorization: `Bearer ${env.AI_API_KEY}` },
        },
      },
    },
  }
})