import { useState, useRef, useCallback } from 'react'
import Layout from '../components/Layout'
import { MOCK_STATUS_STEPS } from '../mockData'

const ZONES = [
  { id: 'floor_1', label: 'Floor 1' },
  { id: 'floor_2', label: 'Floor 2' },
  { id: 'floor_3', label: 'Floor 3' },
  { id: 'floor_4', label: 'Floor 4' },
  { id: 'basement', label: 'Basement' },
]

// ── VideoUploader ──────────────────────────────────────────────────────────────
function VideoUploader({ file, onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('video/')) onFile(dropped)
  }, [onFile])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    setDragging(e.type === 'dragover')
  }, [])

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
        accept="video/*"
        style={{ display: 'none' }}
        onChange={e => onFile(e.target.files[0])}
      />

      {file ? (
        <>
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 14px',
              borderRadius: 12,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--stage-complete)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>
            {file.name}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB · Click to replace
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 18px',
              borderRadius: 12,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16v-2a4 4 0 014-4h8M4 8V6a2 2 0 012-2h2M4 8v8a2 2 0 002 2h12a2 2 0 002-2V8" />
              <path d="M12 12h8v8" />
            </svg>
          </div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
            Drop site walkthrough video here
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>click to browse</span>
            {' '}— MP4, MOV, AVI
          </div>
        </>
      )}
    </div>
  )
}

// ── ZoneSelector ───────────────────────────────────────────────────────────────
function ZoneSelector({ value, onChange }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          color: 'var(--text-muted)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Construction Zone
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          fontSize: 14,
          fontWeight: 500,
          padding: '12px 40px 12px 14px',
          cursor: 'pointer',
          appearance: 'none',
          fontFamily: 'DM Sans, sans-serif',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          transition: 'border-color 0.2s',
        }}
      >
        {ZONES.map(z => (
          <option key={z.id} value={z.id} style={{ background: 'var(--bg-surface)' }}>
            {z.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── ProcessingStatus ───────────────────────────────────────────────────────────
function ProcessingStatus({ stepIndex }) {
  const step = MOCK_STATUS_STEPS[stepIndex] ?? MOCK_STATUS_STEPS[0]
  const isComplete = step.step === 'complete'

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '22px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        {isComplete ? (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.12)',
              border: '1.5px solid var(--stage-complete)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="var(--stage-complete)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div
            style={{
              width: 24,
              height: 24,
              flexShrink: 0,
              borderRadius: '50%',
              border: '2px solid var(--accent)',
              borderTopColor: 'transparent',
              animation: 'spin 0.9s linear infinite',
            }}
          />
        )}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
          {step.label}
        </span>
      </div>

      <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div
          style={{
            height: '100%',
            width: `${step.progress}%`,
            borderRadius: 3,
            background: isComplete
              ? 'linear-gradient(90deg, var(--stage-complete), #34D399)'
              : 'linear-gradient(90deg, var(--accent), var(--accent-muted))',
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {MOCK_STATUS_STEPS.map((s, i) => (
          <div
            key={s.step}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < stepIndex ? 'var(--accent)' : i === stepIndex ? 'var(--accent-muted)' : 'var(--border-subtle)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── UploadView ─────────────────────────────────────────────────────────────────
export default function UploadView({ onComplete }) {
  const [file, setFile] = useState(null)
  const [zone, setZone] = useState('floor_3')
  const [uploading, setUploading] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState(null)

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file.')
      return
    }
    setError(null)
    setUploading(true)
    for (let i = 0; i < MOCK_STATUS_STEPS.length; i++) {
      setStepIndex(i)
      await new Promise(r => setTimeout(r, 900))
    }
    setTimeout(() => onComplete({ zone_id: zone }), 500)
  }

  return (
    <Layout>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* Subtle blueprint-style grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(var(--border-subtle) 1px, transparent 1px),
              linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        <div style={{ width: '100%', maxWidth: 540, position: 'relative', zIndex: 1 }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 14,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.18)',
                marginBottom: 20,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="0" y="16" width="10" height="16" rx="2" fill="var(--accent)" />
                <rect x="10" y="8" width="12" height="24" rx="2" fill="var(--accent-muted)" />
                <rect x="22" y="0" width="10" height="32" rx="2" fill="#FDE68A" />
              </svg>
            </div>
            <h1
              style={{
                color: 'var(--text-primary)',
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                margin: '0 0 12px',
                fontFamily: 'Archivo, DM Sans, system-ui, sans-serif',
                lineHeight: 1.15,
              }}
            >
              Construction progress,<br />
              <span style={{ color: 'var(--accent)' }}>intelligently tracked</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0, lineHeight: 1.6, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              Upload a site walkthrough video for AI-powered analysis of beams, pipes, ducts, and walls.
            </p>
          </div>

          {/* Upload card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)',
            }}
          >
            {!uploading ? (
              <>
                <VideoUploader file={file} onFile={setFile} />
                <ZoneSelector value={zone} onChange={setZone} />

                {error && (
                  <div
                    style={{
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: '#DC2626',
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    fontSize: 15,
                  }}
                >
                  {file ? 'Analyze Site Video' : 'Select a video to continue'}
                </button>

                <button
                  onClick={() => onComplete({ zone_id: zone })}
                  className="btn-ghost"
                  style={{ width: '100%', padding: '12px 0', textAlign: 'center' }}
                >
                  View demo results →
                </button>
              </>
            ) : (
              <ProcessingStatus stepIndex={stepIndex} />
            )}
          </div>

          {/* Feature chips */}
          {!uploading && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 24,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {['AI Frame Analysis', 'Stage Detection', 'Frame Evidence', '3D Model'].map(f => (
                <span
                  key={f}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 20,
                    padding: '6px 14px',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
