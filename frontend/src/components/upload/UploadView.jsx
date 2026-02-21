import { useState } from 'react'
import VideoUploader from './VideoUploader'
import ZoneSelector from './ZoneSelector'
import ProcessingStatus from './ProcessingStatus'

export default function UploadView({ onComplete, useMockData = true }) {
  const [file, setFile] = useState(null)
  const [zoneId, setZoneId] = useState('')
  const [jobId, setJobId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const handleUpload = async () => {
    if (!useMockData && (!file || !zoneId)) return
    const effectiveZone = useMockData ? (zoneId || 'floor_3') : zoneId
    if (!effectiveZone) return
    setUploadError(null)
    setUploading(true)
    if (useMockData) {
      setZoneId(effectiveZone)
      setJobId('mock-job-001')
      setUploading(false)
      return
    }
    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('zone_id', effectiveZone)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? 'Upload failed')
      setJobId(data.job_id)
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleProcessingComplete = () => onComplete?.(jobId)

  if (jobId) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-20 animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-6 tracking-wide">Processing your video</h2>
        <ProcessingStatus jobId={jobId} onComplete={handleProcessingComplete} useMock={useMockData} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-20 animate-fade-in">
      <div className="mb-14">
        <h1 className="font-display text-4xl font-bold tracking-wider text-text-primary mb-4">
          Upload walkthrough video
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed max-w-xl">
          Select a zone and upload footage from your construction site. We'll extract frames, analyze progress, and show verifiable results.
        </p>
      </div>
      <div className="space-y-6">
        <VideoUploader onFileSelect={setFile} selectedFile={file} disabled={uploading} />
        <ZoneSelector value={zoneId} onChange={setZoneId} disabled={uploading} />
        {uploadError && (
          <div className="rounded-xl border border-stage-red/40 bg-stage-red/10 p-4 text-stage-red text-sm font-mono">
            {uploadError}
          </div>
        )}
        <button
          type="button"
          onClick={handleUpload}
          disabled={!zoneId || (!useMockData && !file) || uploading}
          className="
            w-full rounded-xl px-6 py-4 font-display font-bold tracking-wider text-background
            bg-accent hover:bg-accent-dim
            shadow-neon-sm hover:shadow-neon
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
          "
        >
          {uploading ? 'Uploading...' : 'Upload and analyze'}
        </button>
      </div>
    </div>
  )
}
