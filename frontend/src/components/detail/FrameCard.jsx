import { useState } from 'react'

function FrameFallback({ frameId }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted">
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16l4-4a3 3 0 014 0l5 5m2-2l1-1a3 3 0 014 0l1 1M3 6h18M7 6V4m10 2V4" />
      </svg>
      <p className="text-xs font-mono">Frame {frameId}</p>
    </div>
  )
}

export default function FrameCard({ evidence }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="holo-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-accent/30">
      <div className="aspect-video bg-surface-elevated relative overflow-hidden">
        {!imgError ? (
          <img
            src={evidence.frame_path}
            alt={`Frame ${evidence.frame_id}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <FrameFallback frameId={evidence.frame_id} />
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-mono text-accent/80 mb-3">{evidence.frame_id}</p>
        <p className="text-sm text-text-primary leading-relaxed">{evidence.vlm_observation}</p>
        <p className="text-xs text-stage-blue font-mono mt-3 uppercase tracking-wider">
          Stage: {evidence.vlm_stage_assessment?.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  )
}
