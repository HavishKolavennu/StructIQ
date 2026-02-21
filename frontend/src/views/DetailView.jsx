import { useState, useRef } from 'react'
import Layout from '../components/Layout'
import StageBadge from '../components/StageBadge'
import ConfidenceIndicator from '../components/ConfidenceIndicator'
import { getStageColor } from '../utils/stageColors'

const hexToRgba = (hex, a) => {
  if (!hex || hex.length < 7) return `rgba(0,0,0,${a})`
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

const ALL_STAGES = [
  { id: 'not_started',       label: 'Not Started' },
  { id: 'delivered',         label: 'Delivered' },
  { id: 'materials_on_site', label: 'Materials On Site' },
  { id: 'placed',            label: 'Placed' },
  { id: 'braced',            label: 'Braced' },
  { id: 'framed',            label: 'Framed' },
  { id: 'insulated',         label: 'Insulated' },
  { id: 'rough_in_started',  label: 'Rough-In Started' },
  { id: 'duct_installed',    label: 'Duct Installed' },
  { id: 'rough_in_complete', label: 'Rough-In Complete' },
  { id: 'branches_complete', label: 'Branches Complete' },
  { id: 'drywalled',         label: 'Drywalled' },
  { id: 'connected',         label: 'Connected' },
  { id: 'pressure_tested',   label: 'Pressure Tested' },
  { id: 'balanced',          label: 'Air Balanced' },
  { id: 'taped_mudded',      label: 'Taped & Mudded' },
  { id: 'painted',           label: 'Painted' },
  { id: 'inspected',         label: 'Inspected' },
  { id: 'complete',          label: 'Complete' },
]

// ── FrameCard ──────────────────────────────────────────────────────────────────
function FrameCard({ fe }) {
  const [imgError, setImgError] = useState(false)
  const stageColor = getStageColor(fe.vlm_stage_assessment)

  return (
    <div style={{
      background:   'rgba(255,255,255,0.03)',
      border:       '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      overflow:     'hidden',
      transition:   'border-color 0.15s, transform 0.15s',
    }}>
      {/* Thumbnail */}
      <div style={{
        height:         130,
        background:     '#0a0c10',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        position:       'relative',
        overflow:       'hidden',
      }}>
        {!imgError ? (
          <img
            src={fe.frame_path}
            alt={fe.frame_id}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <FramePlaceholder frameId={fe.frame_id} />
        )}
        {/* Frame ID badge */}
        <div style={{
          position:     'absolute',
          bottom:       6, left: 6,
          background:   'rgba(10,12,16,0.85)',
          backdropFilter: 'blur(6px)',
          border:       '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4,
          padding:      '2px 7px',
          color:        '#94A3B8',
          fontSize:     10,
          fontFamily:   'JetBrains Mono, monospace',
          fontWeight:   400,
        }}>
          {fe.frame_id}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          color:         '#6366F1',
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom:  6,
        }}>
          AI Observation
        </div>
        <p style={{
          color:        '#94A3B8',
          fontSize:     12,
          lineHeight:   1.65,
          margin:       0,
          marginBottom: 10,
        }}>
          {fe.vlm_observation}
        </p>
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          paddingTop:     8,
          borderTop:      '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ color: '#475569', fontSize: 11 }}>Assessment</span>
          <StageBadge
            stage={fe.vlm_stage_assessment}
            label={fe.vlm_stage_assessment?.replace(/_/g, ' ')}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}

function FramePlaceholder({ frameId }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 8, color: '#334155',
    }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="5" fill="rgba(255,255,255,0.03)"/>
        <path d="M6 20l5-5 4 4 3-3 4 4" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="10" cy="10" r="2" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
      </svg>
      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{frameId}</span>
    </div>
  )
}

// ── FrameGallery ───────────────────────────────────────────────────────────────
function FrameGallery({ frames }) {
  if (!frames || frames.length === 0) {
    return (
      <div style={{
        background:   'rgba(255,255,255,0.02)',
        border:       '1px dashed rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding:      '28px 20px',
        textAlign:    'center',
        color:        '#374151',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8, filter: 'grayscale(1)' }}>🎞</div>
        <div style={{ fontSize: 13 }}>Element not visible in any captured frame</div>
      </div>
    )
  }

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
      gap:                 12,
    }}>
      {frames.map(fe => <FrameCard key={fe.frame_id} fe={fe} />)}
    </div>
  )
}

// ── OverrideControls ───────────────────────────────────────────────────────────
function OverrideControls({ element, onOverride }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#475569', fontSize: 11, fontWeight: 500 }}>PM Override</span>
      {open ? (
        <>
          <select
            defaultValue={element.stage}
            onChange={e => { onOverride(e.target.value); setOpen(false) }}
            autoFocus
            style={{
              background:   '#0a0c10',
              border:       '1px solid rgba(99,102,241,0.5)',
              borderRadius: 6,
              color:        '#F1F5F9',
              fontSize:     12,
              padding:      '4px 10px',
              cursor:       'pointer',
              fontFamily:   'DM Sans, sans-serif',
            }}
          >
            {ALL_STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none', border: 'none',
              color: '#475569', cursor: 'pointer', fontSize: 15,
            }}
          >✕</button>
        </>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="ghost-btn"
          style={{ padding: '3px 10px', fontSize: 11 }}
        >
          Change ✎
        </button>
      )}
    </div>
  )
}

// ── ElementRow ─────────────────────────────────────────────────────────────────
function ElementRow({ element, selected, onClick, onOverride }) {
  const effectiveStage = element._override ?? element.stage
  const effectiveLabel = element._override
    ? ALL_STAGES.find(s => s.id === element._override)?.label
    : element.stage_label ?? effectiveStage?.replace(/_/g, ' ')

  const stageColor = getStageColor(effectiveStage)

  return (
    <div style={{ marginBottom: 6 }}>
      {/* Row button */}
      <button
        className="elem-row"
        onClick={onClick}
        style={{
          display:      'block',
          width:        '100%',
          textAlign:    'left',
          background:   selected
            ? `linear-gradient(135deg, ${hexToRgba(stageColor,0.06)} 0%, rgba(255,255,255,0.02) 100%)`
            : 'rgba(255,255,255,0.02)',
          border:       `1px solid ${selected ? hexToRgba(stageColor,0.3) : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 10,
          padding:      '13px 16px',
          cursor:       'pointer',
          position:     'relative',
          overflow:     'hidden',
        }}
      >
        {/* Left accent (visible only when selected) */}
        {selected && (
          <div style={{
            position:   'absolute',
            left: 0, top: 0, bottom: 0,
            width:      3,
            background: stageColor,
            borderRadius: '10px 0 0 10px',
          }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap', paddingLeft: selected ? 6 : 0 }}>
          <span style={{ fontSize: 17, width: 22, textAlign: 'center', flexShrink: 0 }}>
            {{ beam: '🏗', pipe: '🔧', duct: '💨', wall: '🧱' }[element.type] ?? '📦'}
          </span>

          <span style={{
            color:         '#F1F5F9',
            fontWeight:    600,
            fontSize:      14,
            flex:          1,
            minWidth:      100,
            letterSpacing: '-0.01em',
          }}>
            {element.name}
          </span>

          <StageBadge stage={effectiveStage} label={effectiveLabel} size="sm" />

          <ConfidenceIndicator confidence={element.confidence} />

          {element.conflicting && !element._override && (
            <span style={{
              background:   'rgba(245,158,11,0.1)',
              border:       '1px solid rgba(245,158,11,0.25)',
              color:        '#FBBF24',
              borderRadius: 5,
              fontSize:     10,
              padding:      '2px 7px',
              fontWeight:   700,
              letterSpacing: '0.04em',
            }}>
              CONFLICT
            </span>
          )}

          {element._override && (
            <span style={{
              background:   'rgba(99,102,241,0.12)',
              border:       '1px solid rgba(99,102,241,0.25)',
              color:        '#818CF8',
              borderRadius: 5,
              fontSize:     10,
              padding:      '2px 7px',
              fontWeight:   700,
              letterSpacing: '0.04em',
            }}>
              PM OVERRIDE
            </span>
          )}

          <span className="mono" style={{ color: '#475569', fontSize: 11, whiteSpace: 'nowrap' }}>
            {element.frame_evidence?.length > 0
              ? `${element.frame_evidence.length}f`
              : '—'}
          </span>

          <span style={{ color: '#334155', fontSize: 16 }}>
            {selected ? '▾' : '›'}
          </span>
        </div>
      </button>

      {/* Expanded frame gallery */}
      {selected && (
        <div style={{
          border:       `1px solid ${hexToRgba(stageColor, 0.18)}`,
          borderRadius: 10,
          padding:      16,
          marginTop:    4,
          background:   `linear-gradient(135deg, ${hexToRgba(stageColor, 0.04)} 0%, rgba(255,255,255,0.01) 100%)`,
          animation:    'fadeIn 0.15s ease-out',
        }}>
          {/* Gallery header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginBottom:   14,
            flexWrap:       'wrap',
            gap:            8,
          }}>
            <div style={{
              display:       'flex',
              alignItems:    'center',
              gap:           8,
              color:         '#475569',
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
            }}>
              <span>Frame Evidence</span>
              <span className="mono" style={{ color: '#64748B' }}>
                {element.frame_evidence?.length ?? 0}
              </span>
            </div>
            <OverrideControls element={element} onOverride={stage => onOverride(element.id, stage)} />
          </div>

          {/* Conflict notice */}
          {element.conflicting && !element._override && (
            <div style={{
              background:   'rgba(245,158,11,0.07)',
              border:       '1px solid rgba(245,158,11,0.2)',
              borderRadius: 7,
              padding:      '8px 12px',
              color:        '#FBBF24',
              fontSize:     12,
              marginBottom: 14,
              lineHeight:   1.5,
            }}>
              ⚠ AI assessments conflicted across frames. The most frequent stage is shown.
              Review frames below and use PM Override to correct if needed.
            </div>
          )}

          <FrameGallery frames={element.frame_evidence} />
        </div>
      )}
    </div>
  )
}

// ── DetailView ─────────────────────────────────────────────────────────────────
export default function DetailView({ workPackage, results, onBack }) {
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [overrides, setOverrides] = useState({})

  const elements = (workPackage?.elements ?? []).map(e => ({
    ...e,
    _override: overrides[e.id] ?? null,
  }))

  const completeCount = elements.filter(e => {
    const s = e._override ?? e.stage
    return s === 'complete' || s === 'inspected'
  }).length

  const pct = elements.length ? Math.round((completeCount / elements.length) * 100) : 0
  const wpStageColor = getStageColor(workPackage?.overall_stage)

  const handleOverride = (elementId, stage) =>
    setOverrides(prev => ({ ...prev, [elementId]: stage }))

  const handleElementClick = (id) =>
    setSelectedElementId(prev => prev === id ? null : id)

  return (
    <Layout
      zoneLabel={results?.zone_label}
      processedAt={results?.processed_at}
      headerRight={
        <button className="ghost-btn" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Dashboard
        </button>
      }
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Work package header ── */}
        <div style={{
          background:   'rgba(13,15,22,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding:      '16px 24px',
          position:     'relative',
          overflow:     'hidden',
        }}>
          {/* Glow behind header */}
          <div style={{
            position:        'absolute',
            top:             -30, left:  0,
            width:           300, height: 120,
            background:      `radial-gradient(ellipse, ${hexToRgba(wpStageColor,0.08)} 0%, transparent 70%)`,
            pointerEvents:   'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                color:         '#475569',
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom:  5,
              }}>
                Work Package
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 5 }}>
                <h2 style={{
                  color:         '#F1F5F9',
                  fontSize:      22,
                  fontWeight:    800,
                  margin:        0,
                  letterSpacing: '-0.03em',
                }}>
                  {workPackage?.name}
                </h2>
                <StageBadge
                  stage={workPackage?.overall_stage}
                  label={workPackage?.overall_stage?.replace(/_/g, ' ')}
                />
              </div>
              <div style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                {workPackage?.owner}
                &nbsp;·&nbsp;
                <span className="mono" style={{ color: '#64748B' }}>
                  {completeCount}/{elements.length}
                </span>
                &nbsp;elements complete
              </div>
            </div>

            {/* Circular progress indicator */}
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
                <circle
                  cx="32" cy="32" r="27"
                  fill="none"
                  stroke={wpStageColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 27}`}
                  strokeDashoffset={`${2 * Math.PI * 27 * (1 - pct / 100)}`}
                  style={{
                    filter:     `drop-shadow(0 0 6px ${hexToRgba(wpStageColor, 0.5)})`,
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              </svg>
              <div style={{
                position:       'absolute',
                inset:          0,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
              }}>
                <span className="mono" style={{
                  color:         '#F1F5F9',
                  fontSize:      15,
                  fontWeight:    600,
                  letterSpacing: '-0.03em',
                  lineHeight:    1,
                }}>
                  {pct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Element list ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px' }}>
          <div style={{
            color:         '#475569',
            fontSize:      10,
            fontWeight:    700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom:  12,
          }}>
            Elements · Click to expand frame evidence
          </div>

          {elements.length === 0 ? (
            <div style={{ color: '#374151', textAlign: 'center', padding: 40 }}>
              No elements in this work package.
            </div>
          ) : (
            elements.map(elem => (
              <ElementRow
                key={elem.id}
                element={elem}
                selected={selectedElementId === elem.id}
                onClick={() => handleElementClick(elem.id)}
                onOverride={handleOverride}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
