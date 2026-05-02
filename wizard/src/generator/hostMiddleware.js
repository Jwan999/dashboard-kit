/**
 * Vite dev-server middleware that exposes a tiny API:
 *
 *   GET  /__dashboard_kit/api/ping     -> { ok: true } so the wizard knows it can write.
 *   GET  /__dashboard_kit/api/config   -> contents of dashboard.config.json or 404.
 *   POST /__dashboard_kit/api/generate -> writes files into the host project root.
 *
 * "Host project root" = process.cwd(). This is the directory Laravel's Artisan
 * command was launched from, which the package handed off to `npm run dev`.
 *
 * Standalone mode (running the wizard from the package itself with no host
 * project) sets DASHBOARD_KIT_STANDALONE=1, which makes the middleware refuse
 * to write so the wizard falls back to ZIP download.
 */
import fs from 'node:fs'
import path from 'node:path'

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (c) => { data += c })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) }
      catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

function jsonResponse(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function safeJoin(root, rel) {
  // Defense against path traversal — the wizard is running on localhost, but
  // we still refuse to write outside the project root.
  const resolved = path.resolve(root, rel)
  const rootResolved = path.resolve(root)
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    throw new Error(`Refusing to write outside project root: ${rel}`)
  }
  return resolved
}

export function dashboardKitMiddleware() {
  const standalone = process.env.DASHBOARD_KIT_STANDALONE === '1'
  // Artisan launches Vite from inside wizard/ (so npm finds package.json) but
  // tells us the host Laravel project root via DASHBOARD_KIT_HOST_CWD. When
  // running the wizard standalone (e.g. `cd wizard && npm run dev`), the env
  // var is empty and we fall back to process.cwd() which will be wizard/ —
  // standalone mode refuses writes anyway.
  const projectRoot = process.env.DASHBOARD_KIT_HOST_CWD || process.cwd()

  return {
    name: 'dashboard-kit-host-bridge',
    configureServer(server) {
      server.middlewares.use('/__dashboard_kit/api/ping', (req, res) => {
        jsonResponse(res, 200, { ok: !standalone, standalone, cwd: projectRoot })
      })

      server.middlewares.use('/__dashboard_kit/api/config', (req, res) => {
        try {
          const p = path.join(projectRoot, 'dashboard.config.json')
          if (!fs.existsSync(p)) {
            jsonResponse(res, 404, { error: 'no config' })
            return
          }
          const raw = fs.readFileSync(p, 'utf8')
          jsonResponse(res, 200, JSON.parse(raw))
        } catch (e) {
          jsonResponse(res, 500, { error: String(e?.message || e) })
        }
      })

      server.middlewares.use('/__dashboard_kit/api/generate', async (req, res) => {
        if (req.method !== 'POST') {
          jsonResponse(res, 405, { error: 'POST only' })
          return
        }
        if (standalone) {
          jsonResponse(res, 423, { error: 'standalone mode — use ZIP download instead' })
          return
        }
        try {
          const body = await readBody(req)
          const files = Array.isArray(body.files) ? body.files : []
          const written = []
          for (const f of files) {
            const dest = safeJoin(projectRoot, f.path)
            fs.mkdirSync(path.dirname(dest), { recursive: true })
            fs.writeFileSync(dest, f.content, 'utf8')
            written.push(f.path)
          }
          jsonResponse(res, 200, {
            ok: true,
            wrote: written.length,
            cwd: projectRoot,
            files: written,
            steps: Array.isArray(body.steps) ? body.steps : [],
          })
        } catch (e) {
          jsonResponse(res, 500, { error: String(e?.message || e) })
        }
      })
    },
  }
}