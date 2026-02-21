import { useEffect, useState } from 'react'

const STEP_LABELS = {
  frame_extraction: 'Extracting frames from video...',
  frame_selection: 'Selecting best frames...',
  vlm_analysis: 'Analyzing frames with AI...',
  assembling_results: 'Assembling results...',
}

export default function ProcessingStatus({ jobId, onComplete, useMock = false }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!jobId) return
    if (useMock) {
      const steps = [
        { current_step: 'frame_extraction', progress_detail: 'Extracting frames...' },
        { current_step: 'frame_selection', progress_detail: 'Selecting best frames...' },
        { current_step: 'vlm_analysis', progress_detail: 'Analyzing frame 12 of 23...' },
        { current_step: 'assembling_results', progress_detail: 'Assembling results...' },
      ]
      let i = 0
      const iv = setInterval(() => {
        setStatus({ status: i < steps.length ? 'processing' : 'complete', ...steps[Math.min(i, steps.length - 1)], selected_frame_count: 23 })
        i++
        if (i > steps.length) { clearInterval(iv); onComplete?.() }
      }, 1200)
      return () => clearInterval(iv)
    }
    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`)
        const data = await res.json()
        setStatus(data)
        if (data.status === 'complete') onComplete?.()
        else if (data.status === 'error') setError(data.error_message ?? 'Processing failed')
      } catch (err) { setError(err.message ?? 'Failed to fetch status') }
    }
    const iv = setInterval(poll, 1500)
    poll()
    return () => clearInterval(iv)
  }, [jobId, onComplete, useMock])

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
  return (
    <div className="holo-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-5">
        <div className="h-8 w-8 flex-shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <div>
          <p className="font-display font-semibold text-text-primary text-lg tracking-wide">{stepLabel}</p>
          {status.selected_frame_count && (
            <p className="text-sm text-accent mt-1 font-mono">{status.selected_frame_count} frames selected</p>
          )}
        </div>
      </div>
    </div>
  )
}
