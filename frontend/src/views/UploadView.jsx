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
        border:       `1.5px dashed ${dragging ? '#6366F1' : file ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12,
        padding:      '40px 28px',
        textAlign:    'center',
        cursor:       'pointer',
        background:   dragging
          ? 'rgba(99,102,241,0.06)'
          : file
            ? 'rgba(16,185,129,0.05)'
            : 'rgba(255,255,255,0.02)',
        transition:   'all 0.2s ease',
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
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎬</div>
          <div style={{ color: '#34D399', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
            {file.name}
          </div>
          <div style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB · Click to replace
          </div>
        </>
      ) : (
        <>
          <div style={{
            width:          48, height: 48,
            margin:         '0 auto 16px',
            borderRadius:   12,
            background:     'rgba(99,102,241,0.1)',
            border:         '1px solid rgba(99,102,241,0.2)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 16V8a2 2 0 012-2h6l5 5v5a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="#6366F1" strokeWidth="1.4" fill="none"/>
              <path d="M12 6v5h5" stroke="#6366F1" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M11 14v-3m0 0L9 13m2-2l2 2" stroke="#6366F1" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 15, marginBottom: 5 }}>
            Drop site walkthrough video here
          </div>
          <div style={{ color: '#475569', fontSize: 13 }}>
            or <span style={{ color: '#818CF8', fontWeight: 600 }}>click to browse</span>
            &nbsp;— MP4, MOV, AVI
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
      <label style={{
        display:       'block',
        color:         '#475569',
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom:  7,
      }}>
        Construction Zone
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width:              '100%',
          background:         'rgba(255,255,255,0.03)',
          border:             '1px solid rgba(255,255,255,0.1)',
          borderRadius:       9,
          color:              '#F1F5F9',
          fontSize:           14,
          fontWeight:         500,
          padding:            '11px 40px 11px 14px',
          cursor:             'pointer',
          appearance:         'none',
          fontFamily:         'DM Sans, sans-serif',
          backgroundImage:    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat:   'no-repeat',
          backgroundPosition: 'right 14px center',
          transition:         'border-color 0.15s',
        }}
      >
        {ZONES.map(z => (
          <option key={z.id} value={z.id} style={{ background: '#13151e' }}>
            {z.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── ProcessingStatus ───────────────────────────────────────────────────────────
function ProcessingStatus({ stepIndex }) {
  const step       = MOCK_STATUS_STEPS[stepIndex] ?? MOCK_STATUS_STEPS[0]
  const isComplete = step.step === 'complete'

  return (
    <div style={{
      background:   'rgba(255,255,255,0.02)',
      border:       '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding:      '20px 22px',
    }}>
      {/* Step + spinner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        {isComplete ? (
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(16,185,129,0.12)',
            border: '1.5px solid #10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 5.5l3 3 4-5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        ) : (
          <div style={{
            width: 22, height: 22, flexShrink: 0,
            borderRadius: '50%',
            border: '2px solid #6366F1',
            borderTopColor: 'transparent',
            animation: 'spin 0.9s linear infinite',
          }} />
        )}
        <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14 }}>
          {step.label}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{
          height:     '100%',
          width:      `${step.progress}%`,
          borderRadius: 3,
          background:   isComplete
            ? 'linear-gradient(90deg, #10B981, #34D399)'
            : 'linear-gradient(90deg, #6366F1, #818CF8)',
          boxShadow:    isComplete ? '0 0 10px rgba(16,185,129,0.4)' : '0 0 10px rgba(99,102,241,0.4)',
          transition:   'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 4 }}>
        {MOCK_STATUS_STEPS.map((s, i) => (
          <div key={s.step} style={{
            flex:         1,
            height:       3,
            borderRadius: 2,
            background:   i < stepIndex
              ? '#6366F1'
              : i === stepIndex
                ? '#818CF8'
                : 'rgba(255,255,255,0.06)',
            transition:   'background 0.3s',
          }} />
        ))}
      </div>
    </div>
  )
}

// ── UploadView ─────────────────────────────────────────────────────────────────
export default function UploadView({ onComplete }) {
  const [file,      setFile]      = useState(null)
  const [zone,      setZone]      = useState('floor_3')
  const [uploading, setUploading] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [error,     setError]     = useState(null)

  const handleUpload = async () => {
    if (!file) { setError('Please select a video file.'); return }
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
      <div style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        24,
        overflow:       'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 520 }}>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          60, height: 60,
              borderRadius:   15,
              background:     'rgba(99,102,241,0.1)',
              border:         '1px solid rgba(99,102,241,0.2)',
              marginBottom:   18,
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="0" y="14" width="9"  height="14" rx="2" fill="#6366F1"/>
                <rect x="9" y="8"  width="10" height="20" rx="2" fill="#818CF8"/>
                <rect x="19" y="0" width="9"  height="28" rx="2" fill="#A5B4FC"/>
              </svg>
            </div>
            <h1 style={{
              color:         '#F1F5F9',
              fontSize:      28,
              fontWeight:    800,
              letterSpacing: '-0.04em',
              margin:        '0 0 8px',
            }}>
              Struct<span style={{ color: '#818CF8' }}>IQ</span>
            </h1>
            <p style={{ color: '#475569', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Upload a site walkthrough video for AI-powered<br/>construction progress analysis
            </p>
          </div>

          {/* Upload card */}
          <div style={{
            background:   'rgba(255,255,255,0.025)',
            border:       '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding:      24,
            display:      'flex',
            flexDirection:'column',
            gap:          18,
          }}>
            {!uploading ? (
              <>
                <VideoUploader file={file} onFile={setFile} />
                <ZoneSelector value={zone} onChange={setZone} />

                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.08)',
                    border:     '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 7,
                    padding:    '9px 13px',
                    color:      '#F87171',
                    fontSize:   13,
                  }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file}
                  style={{
                    background:    file
                      ? 'linear-gradient(135deg, #6366F1, #4F46E5)'
                      : 'rgba(255,255,255,0.05)',
                    color:         file ? '#fff' : '#334155',
                    border:        file ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius:  10,
                    padding:       '13px 0',
                    fontSize:      14,
                    fontWeight:    700,
                    fontFamily:    'DM Sans, sans-serif',
                    cursor:        file ? 'pointer' : 'not-allowed',
                    letterSpacing: '-0.01em',
                    transition:    'all 0.2s ease',
                    boxShadow:     file ? '0 0 24px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  {file ? '⚡  Analyze Site Video' : 'Select a video to continue'}
                </button>

                {/* Demo skip */}
                <button
                  onClick={() => onComplete({ zone_id: zone })}
                  className="ghost-btn"
                  style={{ width: '100%', padding: '10px 0', textAlign: 'center' }}
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
            <div style={{
              display:        'flex',
              gap:            8,
              marginTop:      18,
              justifyContent: 'center',
              flexWrap:       'wrap',
            }}>
              {['AI Frame Analysis', 'Stage Detection', 'Frame Evidence', '3D Model'].map(f => (
                <span key={f} style={{
                  background:   'rgba(255,255,255,0.03)',
                  border:       '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding:      '3px 11px',
                  color:        '#475569',
                  fontSize:     11,
                  fontWeight:   500,
                }}>
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
