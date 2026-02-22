/**
 * StructIQ API client.
 * Uses relative /api paths — Vite proxy forwards to backend.
 */

const API_BASE = '/api'

export async function uploadVideo(file, opts = {}) {
  const formData = new FormData()
  formData.append('video', file)
  formData.append('demo_mode', String(Boolean(opts.demoMode)))

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Upload failed: ${res.status}`)
  }

  return res.json()
}

export async function getStatus(jobId) {
  const res = await fetch(`${API_BASE}/status/${jobId}`)
  if (!res.ok) throw new Error(`Status failed: ${res.status}`)
  return res.json()
}

export async function getResults(jobId) {
  const res = await fetch(`${API_BASE}/results/${jobId}`)
  if (!res.ok) throw new Error(`Results failed: ${res.status}`)
  return res.json()
}
