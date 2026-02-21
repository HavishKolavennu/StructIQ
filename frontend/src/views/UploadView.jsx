import { useRef, useState } from 'react'

const ZONES = [
  { id: 'floor_1', label: 'Floor 1' },
  { id: 'floor_2', label: 'Floor 2' },
  { id: 'floor_3', label: 'Floor 3' }
]

export default function UploadView({ onComplete }) {
  const inputRef = useRef(null)
  const [zoneId, setZoneId] = useState('floor_3')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState({ phase: 'idle', detail: '' })

  async function startUpload() {
    if (!file) return
    setStatus({ phase: 'uploading', detail: 'Uploading video...' })

    try {
      const fd = new FormData()
      fd.append('video', file)
      fd.append('zone_id', zoneId)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { job_id: jobId } = await uploadRes.json()
      setStatus({ phase: 'processing', detail: 'Processing started...' })

      const interval = setInterval(async () => {
        const s = await fetch(`/api/status/${jobId}`)
        const body = await s.json()
        setStatus({ phase: body.status, detail: body.progress_detail || body.current_step || '' })

        if (body.status === 'complete') {
          clearInterval(interval)
          const r = await fetch(`/api/results/${jobId}`)
          const results = await r.json()
          onComplete(results, jobId)
        }

        if (body.status === 'error') {
          clearInterval(interval)
        }
      }, 1500)
    } catch {
      setStatus({ phase: 'error', detail: 'Upload failed. Check backend status.' })
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface/80 p-6 shadow-panel">
      <h2 className="text-xl font-semibold">Upload Walkthrough Video</h2>
      <p className="mt-1 text-sm text-textSecondary">Upload by zone, then wait for frame selection and analysis.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-dashed border-border bg-bg/70 p-8 text-left hover:border-brand/60"
        >
          <div className="text-sm font-medium">VideoUploader</div>
          <div className="mt-1 text-xs text-textSecondary">{file ? file.name : 'Click to choose video file'}</div>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </button>

        <div className="rounded-xl border border-border bg-bg/70 p-4">
          <label className="text-xs uppercase text-textSecondary">ZoneSelector</label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2"
          >
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>{z.label}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={!file || status.phase === 'processing' || status.phase === 'uploading'}
            onClick={startUpload}
            className="mt-4 w-full rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Upload and Analyze
          </button>

          <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-xs text-textSecondary">
            <div className="font-medium text-textPrimary">ProcessingStatus</div>
            <div className="mt-1">{status.detail || 'Idle'}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
