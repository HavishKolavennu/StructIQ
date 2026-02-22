import { useState, useRef, useCallback } from 'react'
import Layout from '../components/Layout'
import { uploadVideo, getStatus, getResults } from '../api'

const STEP_PROGRESS = {
  frame_extraction: 15,
  qr_detection: 32,
  zone_segmentation: 48,
  frame_selection: 62,
  vlm_analysis: 82,
  assembling_results: 94,
  complete: 100,
  error: 0,
}

function stepTitle(step) {
  const labels = {
    frame_extraction: 'Extracting frames from video',
    qr_detection: 'Detecting zones from QR codes',
    zone_segmentation: 'Segmenting timeline by detected zone',
    frame_selection: 'Selecting best frames per zone',
    vlm_analysis: 'Analyzing selected frames with VLM',
    assembling_results: 'Assembling analysis results',
    complete: 'Processing complete',
  }
  return labels[step] || 'Processing'
}

function VideoUploader({ file, onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('video/'))
    if (dropped.length) onFile(dropped[0])
  }, [onFile])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    setDragging(e.type === 'dragover')
  }, [])

  const handleChange = useCallback((e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length) onFile(selected[0])
  }, [onFile])

  const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      style={{
        border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--stage-complete)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '44px 32px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging
          ? 'rgba(245,158,11,0.04)'
          : file
            ? 'rgba(16,185,129,0.04)'
            : 'var(--bg-subtle)',
        transition: 'all 0.2s ease',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/avi,video/mov,video/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {file ? (
        <>
          <div style={{ width: 48, height: 48, margin: '0 auto 14px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--stage-complete)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>Video selected</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{file.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{sizeMB} MB · Click to replace</div>
        </>
      ) : (
        <>
          <div style={{ width: 52, height: 52, margin: '0 auto 18px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Drop your site walkthrough video here</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>click to browse</span> — MP4, MOV, AVI</div>
        </>
      )}
    </div>
  )
}

function ProcessingStatus({ status }) {
  const isError = status?.status === 'error'
  const isComplete = status?.status === 'complete'
  const progress = STEP_PROGRESS[status?.current_step] ?? 35
  const zones = status?.detected_zones ?? []

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        {isError ? (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1.5px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#EF4444', fontSize: 14 }}>x</span>
          </div>
        ) : isComplete ? (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1.5px solid var(--stage-complete)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="var(--stage-complete)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div style={{ width: 24, height: 24, flexShrink: 0, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.9s linear infinite' }} />
        )}

        <div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{stepTitle(status?.current_step)}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{status?.progress_detail || 'Running pipeline...'}</div>
        </div>
      </div>

      <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: 3,
            background: isError
              ? '#EF4444'
              : isComplete
                ? 'linear-gradient(90deg, var(--stage-complete), #34D399)'
                : 'linear-gradient(90deg, var(--accent), var(--accent-muted))',
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      {zones.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {zones.map((zone) => (
            <span
              key={zone}
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                color: 'var(--accent)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {zone}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function UploadView({ onComplete }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file.')
      return
    }

    setError(null)
    setUploading(true)
    setStatus({ status: 'processing', current_step: 'frame_extraction', progress_detail: 'Uploading video...' })

    try {
      const { job_id } = await uploadVideo(file)

      const pollIntervalMs = 1200
      while (true) {
        const s = await getStatus(job_id)
        setStatus(s)

        if (s.status === 'complete') {
          const results = await getResults(job_id)
          onComplete(results)
          return
        }

        if (s.status === 'error') {
          setError(s.error_message || 'Analysis failed.')
          setUploading(false)
          return
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
      }
    } catch (err) {
      setError(err.message || 'Upload or analysis failed.')
      setUploading(false)
    }
  }

  const handleDemoResults = () => {
    onComplete(null, { useDemo: true })
  }

  return (
    <Layout>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, overflow: 'auto', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.6, pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 540, position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', marginBottom: 20 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="0" y="16" width="10" height="16" rx="2" fill="var(--accent)" />
                <rect x="10" y="8" width="12" height="24" rx="2" fill="var(--accent-muted)" />
                <rect x="22" y="0" width="10" height="32" rx="2" fill="#FDE68A" />
              </svg>
            </div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 12px', fontFamily: 'Archivo, DM Sans, system-ui, sans-serif', lineHeight: 1.15 }}>
              Construction progress,
              <br />
              <span style={{ color: 'var(--accent)' }}>automatically zoned via QR</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0, lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              Upload a walkthrough video. StructIQ detects zones from QR codes, analyzes each zone, and returns evidence-backed status updates.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            {!uploading ? (
              <>
                <VideoUploader file={file} onFile={setFile} />

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <button onClick={handleUpload} disabled={!file} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 15 }}>
                  {file ? 'Upload and analyze' : 'Select a video to continue'}
                </button>

                <button onClick={handleDemoResults} className="btn-ghost" style={{ width: '100%', padding: '12px 0', textAlign: 'center' }}>
                  View demo results {'>'}
                </button>
              </>
            ) : (
              <ProcessingStatus status={status} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
