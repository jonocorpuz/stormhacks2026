import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { extract } from './server/extract.js'

// Dev-only stand-in for a backend: POST /api/extract -> Gemini -> item drafts
function extractApi(env) {
  return {
    name: 'extract-api',
    configureServer(server) {
      server.middlewares.use('/api/extract', async (req, res) => {
        const send = (status, payload) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        }

        if (req.method !== 'POST') return send(405, { ok: false, error: 'Method not allowed' })

        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          const result = await extract(JSON.parse(raw || '{}'), env)
          send(result.ok ? 200 : 502, result)
        } catch (err) {
          send(500, { ok: false, error: err.message })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix loads non-VITE_ vars too; they stay server-side and never reach the bundle
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return {
    plugins: [react(), extractApi(env)],
  }
})
