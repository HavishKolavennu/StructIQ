import { useState } from 'react'
import { uploadVideo, getResults } from '../../api'
import VideoUploader from './VideoUploader'
import ProcessingStatus from './ProcessingStatus'

export default function UploadView({ onComplete }) {
  const [file, setFile] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const handleUpload = async () => {
    if (!file) return
    setUploadError(null)
    setUploading(true)

    try {
      const data = await uploadVideo(file, { demoMode })
      setJobId(data.job_id)
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed')
      setUploading(false)
    }
  }

  const handleProcessingComplete = async () => {
    if (!jobId) return
    try {
      const results = await getResults(jobId)
      onComplete?.(results)
    } catch (err) {
      setUploadError(err.message ?? 'Failed to load results')
      setUploading(false)
      setJobId(null)
    }
  }

  const handleDemoResults = () => {
    onComplete?.(null, { useDemo: true })
  }

  if (jobId) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-20 animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-6 tracking-wide">Processing your video</h2>
        <ProcessingStatus jobId={jobId} onComplete={handleProcessingComplete} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-20 animate-fade-in">
      <div className="mb-14">
        <h1 className="font-display text-4xl font-bold tracking-wider text-text-primary mb-4">Upload walkthrough video</h1>
        <p className="text-text-secondary text-lg leading-relaxed max-w-xl">
          Upload walkthrough footage only. StructIQ detects zones from QR codes and analyzes each zone automatically.
        </p>
      </div>

      <div className="space-y-6">
        <VideoUploader onFileSelect={setFile} selectedFile={file} disabled={uploading} />

        <label className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            disabled={uploading}
          />
          <span>
            <span className="font-semibold text-text-primary">Demo mode fallback</span>
            <span className="block mt-1 font-mono text-xs">
              If no QR codes are detected, continue with a single Demo Zone instead of failing.
            </span>
          </span>
        </label>

        {uploadError && (
          <div className="rounded-xl border border-stage-red/40 bg-stage-red/10 p-4 text-stage-red text-sm font-mono">
            {uploadError}
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
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

        <button
          type="button"
          onClick={handleDemoResults}
          className="w-full rounded-xl border border-accent/30 bg-accent/5 px-6 py-3 font-mono text-accent hover:bg-accent/10 transition-all"
        >
          View demo results {'>'}
        </button>
      </div>
    </div>
  )
}
