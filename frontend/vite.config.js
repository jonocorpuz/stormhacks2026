import { neon } from '@neondatabase/serverless'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { createBoardsApi, neonBoardsDb } from '../server/boards.js'
import { extract } from '../server/extract.js'

const sendJson = (res, status, payload) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

const readJson = async (req) => {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw ? JSON.parse(raw) : undefined
}

// Dev-only stand-in for a backend: POST /api/extract -> Gemini -> item drafts
function extractApi(env) {
  return {
    name: 'extract-api',
    configureServer(server) {
      server.middlewares.use('/api/extract', async (req, res) => {
        const send = (status, payload) => sendJson(res, status, payload)

        if (req.method !== 'POST') return send(405, { ok: false, error: 'Method not allowed' })

        try {
          const result = await extract((await readJson(req)) ?? {}, env)
          send(result.ok ? 200 : 502, result)
        } catch (err) {
          send(500, { ok: false, error: err.message })
        }
      })
    },
  }
}

// Dev-only: /api/boards -> server/boards.js -> Neon (DATABASE_URL from repo-root .env.local)
function boardsApi(env) {
  const handle = createBoardsApi(env.DATABASE_URL ? neonBoardsDb(neon(env.DATABASE_URL)) : null)
  return {
    name: 'boards-api',
    configureServer(server) {
      server.middlewares.use('/api/boards', async (req, res) => {
        try {
          const body = req.method === 'PUT' ? await readJson(req) : undefined
          const result = await handle({
            method: req.method,
            path: req.url.split('?')[0],
            email: req.headers['x-user-email'],
            body,
          })
          sendJson(res, result.status, result.json)
        } catch (err) {
          sendJson(res, 500, { ok: false, error: err.message })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix loads non-VITE_ vars too; they stay server-side and never reach the bundle
  // Repo root too: `neon link` writes DATABASE_URL to ../.env.local
  const env = { ...loadEnv(mode, '..', ''), ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return {
    plugins: [react(), extractApi(env), boardsApi(env)],
  }
})
