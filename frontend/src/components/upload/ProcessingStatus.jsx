import { useEffect, useState } from 'react'
import { getStatus } from '../../api'

const STEP_LABELS = {
  frame_extraction: 'Extracting frames from video...',
  qr_detection: 'Detecting zones from QR codes...',
  zone_segmentation: 'Segmenting timeline by detected zones...',
  frame_selection: 'Selecting best frames per zone...',
  vlm_analysis: 'Analyzing frames with AI...',
  assembling_results: 'Assembling results...',
  complete: 'Complete',
}

export default function ProcessingStatus({ jobId, onComplete }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [animatedProgress, setAnimatedProgress] = useState(8)
  const [dotCount, setDotCount] = useState(1)

  useEffect(() => {
    if (!jobId) return

    const poll = async () => {
      try {
        const data = await getStatus(jobId)
        setStatus(data)

        if (data.status === 'complete') {
          onComplete?.()
        } else if (data.status === 'error') {
          setError(data.error_message ?? 'Processing failed')
        }
      } catch (err) {
        setError(err.message ?? 'Failed to fetch status')
      }
    }

    const iv = setInterval(poll, 1200)
    poll()
    return () => clearInterval(iv)
  }, [jobId, onComplete])

  useEffect(() => {
    if (!status || status.status !== 'processing') return

    const iv = setInterval(() => {
      setAnimatedProgress((prev) => (prev >= 94 ? 24 : prev + 3))
      setDotCount((prev) => (prev % 3) + 1)
    }, 130)

    return () => clearInterval(iv)
  }, [status])

  if (error) {
    return (
      <div className="rounded-xl border border-stage-red/40 bg-stage-red/10 p-5 text-stage-red font-mono">
        <p className="font-semibold">Error</p>
        <p className="text-sm mt-1 opacity-90">{error}</p>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="flex items-center gap-4 text-text-secondary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="font-mono">Connecting...</span>
      </div>
    )
  }

  const stepLabel = STEP_LABELS[status.current_step] ?? status.progress_detail ?? status.current_step
  const detectedZones = status.detected_zones ?? []
  const dots = '.'.repeat(dotCount)

  return (
    <div className="holo-card rounded-2xl p-6 animate-fade-in space-y-4">
      <div className="h-2 overflow-hidden rounded-full bg-accent/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dim shimmer-bar transition-all duration-150"
          style={{ width: `${animatedProgress}%` }}
        />
      </div>

      <div className="flex items-center gap-5">
        <div className="h-8 w-8 flex-shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <div>
          <p className="font-display font-semibold text-text-primary text-lg tracking-wide">{stepLabel}{dots}</p>
          <p className="text-sm text-text-secondary mt-1 font-mono">{status.progress_detail}</p>
          {status.selected_frame_count > 0 && (
            <p className="text-sm text-accent mt-1 font-mono">{status.selected_frame_count} frames selected</p>
          )}
        </div>
      </div>

      {detectedZones.length > 0 && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest font-mono mb-2">Detected Zones</p>
          <div className="flex flex-wrap gap-2">
            {detectedZones.map((zone) => (
              <span key={zone} className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-mono text-accent">
                {zone}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
