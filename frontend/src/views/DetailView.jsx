import { useState } from 'react'
import Layout from '../components/Layout'
import StageBadge from '../components/StageBadge'
import ConfidenceIndicator from '../components/ConfidenceIndicator'
import { getStageColor } from '../utils/stageColors'

const hexToRgba = (hex, a) => {
  if (!hex || hex.length < 7) return `rgba(0,0,0,${a})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

const ALL_STAGES = [
  { id: 'not_started', label: 'Not Started' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'materials_on_site', label: 'Materials On Site' },
  { id: 'placed', label: 'Placed' },
  { id: 'braced', label: 'Braced' },
  { id: 'framed', label: 'Framed' },
  { id: 'insulated', label: 'Insulated' },
  { id: 'rough_in_started', label: 'Rough-In Started' },
  { id: 'duct_installed', label: 'Duct Installed' },
  { id: 'rough_in_complete', label: 'Rough-In Complete' },
  { id: 'branches_complete', label: 'Branches Complete' },
  { id: 'drywalled', label: 'Drywalled' },
  { id: 'connected', label: 'Connected' },
  { id: 'pressure_tested', label: 'Pressure Tested' },
  { id: 'balanced', label: 'Air Balanced' },
  { id: 'taped_mudded', label: 'Taped & Mudded' },
  { id: 'painted', label: 'Painted' },
  { id: 'inspected', label: 'Inspected' },
  { id: 'complete', label: 'Complete' },
]

// ── FrameCard ──────────────────────────────────────────────────────────────────
function FrameCard({ fe }) {
  const [imgError, setImgError] = useState(false)
  const stageColor = getStageColor(fe.vlm_stage_assessment)

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)',
    }}>
      <div style={{
        height: 130,
        background: 'var(--bg-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
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
        <div style={{
          position: 'absolute',
          bottom: 8, left: 8,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6,
          padding: '4px 8px',
          color: 'var(--text-muted)',
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 500,
        }}>
          {fe.frame_id}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{
          color: 'var(--accent)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          AI Observation
        </div>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 12,
          lineHeight: 1.6,
          margin: 0,
          marginBottom: 12,
        }}>
          {fe.vlm_observation}
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Assessment</span>
          <StageBadge stage={fe.vlm_stage_assessment} label={fe.vlm_stage_assessment?.replace(/_/g, ' ')} size="sm" />
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
      gap: 8, color: 'var(--text-muted)',
    }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="5" fill="var(--border-subtle)" />
        <path d="M6 20l5-5 4 4 3-3 4 4" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="10" r="2" stroke="var(--border)" strokeWidth="1.5" />
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
        background: 'var(--bg-subtle)',
        border: '1px dashed var(--border)',
        borderRadius: 10,
        padding: '32px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ marginBottom: 10, opacity: 0.5 }}>
          <rect x="2" y="6" width="24" height="16" rx="3" stroke="var(--text-muted)" strokeWidth="1.8"/>
          <path d="M2 10h4M22 10h4M2 18h4M22 18h4" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="14" cy="14" r="3" stroke="var(--text-muted)" strokeWidth="1.8"/>
        </svg>
        <div style={{ fontSize: 13 }}>Element not visible in any captured frame</div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
      gap: 14,
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
      <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}>PM Override</span>
      {open ? (
        <>
          <select
            defaultValue={element.stage}
            onChange={e => { onOverride(e.target.value); setOpen(false) }}
            autoFocus
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 12,
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
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
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15,
            }}
          >
            ✕
          </button>
        </>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-ghost" style={{ padding: '4px 12px', fontSize: 11 }}>
          Change
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
    <div style={{ marginBottom: 8 }}>
      <button
        className="elem-row"
        onClick={onClick}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: selected ? `linear-gradient(135deg, ${hexToRgba(stageColor, 0.06)} 0%, var(--bg-subtle) 100%)` : 'var(--bg-surface)',
          border: `1px solid ${selected ? hexToRgba(stageColor, 0.35) : 'var(--border-subtle)'}`,
          borderRadius: 10,
          padding: '14px 18px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: selected ? '0 1px 3px 0 rgba(0,0,0,0.04)' : 'none',
        }}
      >
        {selected && (
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: 3,
            background: stageColor,
            borderRadius: '10px 0 0 10px',
          }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingLeft: selected ? 8 : 0 }}>
          <span style={{
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: 14,
            flex: 1,
            minWidth: 100,
            letterSpacing: '-0.01em',
          }}>
            {element.name}
          </span>

          <StageBadge stage={effectiveStage} label={effectiveLabel} size="sm" />
          <ConfidenceIndicator confidence={element.confidence} />

          {element.conflicting && !element._override && (
            <span style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: 'var(--stage-delivered)',
              borderRadius: 5,
              fontSize: 10,
              padding: '2px 8px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}>
            CONFLICT
          </span>
          )}

          {element._override && (
            <span style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: 'var(--accent)',
              borderRadius: 5,
              fontSize: 10,
              padding: '2px 8px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}>
            PM OVERRIDE
          </span>
          )}

          <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
            {element.frame_evidence?.length > 0 ? `${element.frame_evidence.length}f` : '—'}
          </span>

          <span style={{ color: 'var(--border)', fontSize: 16 }}>
            {selected ? '▾' : '›'}
          </span>
        </div>
      </button>

      {selected && (
        <div style={{
          border: `1px solid ${hexToRgba(stageColor, 0.2)}`,
          borderRadius: 10,
          padding: 18,
          marginTop: 6,
          background: `linear-gradient(135deg, ${hexToRgba(stageColor, 0.04)} 0%, var(--bg-subtle) 100%)`,
          animation: 'fadeIn 0.15s ease-out',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
            }}>
              <span>Frame Evidence</span>
              <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                {element.frame_evidence?.length ?? 0}
              </span>
            </div>
            <OverrideControls element={element} onOverride={stage => onOverride(element.id, stage)} />
          </div>

          {element.conflicting && !element._override && (
            <div style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.18)',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--stage-delivered)',
              fontSize: 12,
              marginBottom: 16,
              lineHeight: 1.5,
            }}>
              AI assessments conflicted across frames. The most frequent stage is shown.
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

  const handleElementClick = id =>
    setSelectedElementId(prev => prev === id ? null : id)

  return (
    <Layout
      zoneLabel={results?.zone_label}
      processedAt={results?.processed_at}
      headerRight={
        <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Dashboard
        </button>
      }
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Work package header */}
        <div style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '20px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: -30, left: 0,
            width: 300, height: 120,
            background: `radial-gradient(ellipse, ${hexToRgba(wpStageColor, 0.06)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>
                Work Package
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
                <h2 style={{
                  color: 'var(--text-primary)',
                  fontSize: 22,
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '-0.03em',
                  fontFamily: 'Archivo, DM Sans, system-ui, sans-serif',
                }}>
                  {workPackage?.name}
                </h2>
                <StageBadge
                  stage={workPackage?.overall_stage}
                  label={workPackage?.overall_stage?.replace(/_/g, ' ')}
                />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
                {workPackage?.owner}
                {' · '}
                <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                  {completeCount}/{elements.length}
                </span>
                {' '}elements complete
              </div>
            </div>

            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="27" fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="27"
                  fill="none"
                  stroke={wpStageColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 27}`}
                  strokeDashoffset={`${2 * Math.PI * 27 * (1 - pct / 100)}`}
                  style={{
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span className="mono" style={{
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}>
                  {pct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Element list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px', background: 'var(--bg-primary)' }}>
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Elements · Click to expand frame evidence
          </div>

          {elements.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 48 }}>
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
