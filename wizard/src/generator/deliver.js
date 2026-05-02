/**
 * Deliver generated files to the user.
 *
 * Mode A — ZIP download (browser-only, no host project needed).
 * Mode B — POST to `/__dashboard_kit/api/generate`, served by the Vite dev
 *   server middleware (see vite.config.js). The server writes the files to
 *   process.cwd(), which is the host Laravel project root when launched via
 *   `php artisan dashboard:scaffold`.
 *
 * The wizard probes Mode B first; falls back to Mode A on 404 or network error.
 */

import JSZip from 'jszip'

export async function downloadZip(files, name = 'dashboard-scaffold') {
  const zip = new JSZip()
  for (const f of files) zip.file(f.path, f.content)
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function probeHostMode() {
  try {
    const res = await fetch('/__dashboard_kit/api/ping', { method: 'GET' })
    return res.ok
  } catch (_) {
    return false
  }
}

export async function postToHost(payload) {
  const res = await fetch('/__dashboard_kit/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Host write failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function loadExistingConfig() {
  try {
    const res = await fetch('/__dashboard_kit/api/config', { method: 'GET' })
    if (!res.ok) return null
    return await res.json()
  } catch (_) {
    return null
  }
}