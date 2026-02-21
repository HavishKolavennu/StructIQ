import { useState } from 'react'
import Layout from '../components/Layout'
import StageBadge from '../components/StageBadge'
import ThreeViewer from '../components/ThreeViewer'
import { getStageColor, STAGE_COLORS } from '../utils/stageColors'

// ── Helpers ────────────────────────────────────────────────────────────────────
const hexToRgba = (hex, a) => {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

// ── SummaryStrip ───────────────────────────────────────────────────────────────
function SummaryStrip({ results }) {
  const summary   = results?.summary ?? {}
  const breakdown = summary.stages_breakdown ?? {}
  const doneCount = (breakdown.complete ?? 0) + (breakdown.inspected ?? 0)
  const total     = summary.total_elements ?? 0
  const pct       = total ? Math.round((doneCount / total) * 100) : 0

  const legendItems = [
    { label: 'Complete',     count: doneCount,                   color: '#10B981' },
    { label: 'In Progress',  count: breakdown.in_progress ?? 0,  color: '#3B82F6' },
    { label: 'Not Started',  count: breakdown.not_started ?? 0,  color: '#4B5563' },
    { label: 'Not Captured', count: breakdown.not_captured ?? 0, color: '#F59E0B', warn: true },
  ]

  return (
    <div style={{
      background:   'rgba(13,15,22,0.8)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding:      '14px 24px',
    }}>
      {/* Top info line */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        8,
        marginBottom: 12,
        color:      '#475569',
        fontSize:   12,
        fontWeight: 500,
      }}>
        <span className="mono" style={{ color: '#64748B' }}>
          {summary.total_work_packages ?? 0} work packages
        </span>
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
        <span className="mono" style={{ color: '#64748B' }}>
          {total} elements
        </span>
        {results?.zone_label && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
            <span style={{
              background:   'rgba(99,102,241,0.1)',
              border:       '1px solid rgba(99,102,241,0.2)',
              color:        '#818CF8',
              borderRadius: 5,
              padding:      '1px 8px',
              fontSize:     11,
              fontWeight:   600,
            }}>
              {results.zone_label}
            </span>
          </>
        )}
      </div>

      {/* Progress bar row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        {/* Track */}
        <div style={{
          flex:         1,
          height:       8,
          borderRadius: 4,
          background:   'rgba(255,255,255,0.06)',
          overflow:     'hidden',
          position:     'relative',
        }}>
          <div style={{
            height:       '100%',
            width:        `${pct}%`,
            borderRadius: 4,
            background:   pct === 100
              ? 'linear-gradient(90deg, #10B981, #34D399)'
              : 'linear-gradient(90deg, #6366F1, #10B981)',
            boxShadow:    pct > 0 ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
            transition:   'width 0.9s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>

        {/* Percentage */}
        <span className="mono" style={{
          color:         pct === 100 ? '#34D399' : '#F1F5F9',
          fontSize:      26,
          fontWeight:    600,
          letterSpacing: '-0.04em',
          minWidth:      56,
          textAlign:     'right',
          lineHeight:    1,
        }}>
          {pct}<span style={{ fontSize: 14, color: '#475569', fontWeight: 400 }}>%</span>
        </span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {legendItems.map(item => (
          <span key={item.label} style={{
            display:    'flex',
            alignItems: 'center',
            gap:        6,
            fontSize:   12,
            color:      '#64748B',
          }}>
            <span style={{
              width:        7,
              height:       7,
              borderRadius: '50%',
              background:   item.color,
              flexShrink:   0,
              boxShadow:    item.count > 0 ? `0 0 5px ${hexToRgba(item.color, 0.5)}` : 'none',
            }} />
            <span className="mono" style={{ color: item.count > 0 ? item.color : '#374151', fontWeight: 600 }}>
              {item.count}
            </span>
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── WorkPackageCard ────────────────────────────────────────────────────────────
function WorkPackageCard({ wp, selected, onClick }) {
  const elements      = wp.elements ?? []
  const completeCount = elements.filter(e => e.stage === 'complete' || e.stage === 'inspected').length
  const uncaptured    = elements.filter(e => e.stage === 'not_captured').length
  const stageColor    = getStageColor(wp.overall_stage)
  const progressPct   = elements.length ? (completeCount / elements.length) * 100 : 0
  const isInProgress  = !['complete','inspected','not_started','not_captured'].includes(wp.overall_stage)

  const stageLabel = wp.elements?.find(e => e.stage === wp.overall_stage)?.stage_label
    ?? wp.overall_stage?.replace(/_/g, ' ')

  const typeIcon = { beam: '🏗', pipe: '🔧', duct: '💨', wall: '🧱' }[elements[0]?.type] ?? '📦'

  return (
    <button className={`wp-card${selected ? ' selected' : ''}`} onClick={onClick}>

      {/* Left accent bar (colored by stage) */}
      <div style={{
        position:     'absolute',
        left:         0, top: 0, bottom: 0,
        width:        3,
        background:   stageColor,
        borderRadius: '12px 0 0 12px',
        boxShadow:    `0 0 8px ${hexToRgba(stageColor, 0.4)}`,
      }} />

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{typeIcon}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badge */}
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         10,
            marginBottom: 5,
            flexWrap:    'wrap',
          }}>
            <span style={{
              color:         '#F1F5F9',
              fontWeight:    700,
              fontSize:      15,
              letterSpacing: '-0.01em',
            }}>
              {wp.name}
            </span>
            <StageBadge stage={wp.overall_stage} label={stageLabel} size="sm" />
          </div>

          {/* Owner */}
          <div style={{ color: '#475569', fontSize: 12, marginBottom: 10, fontWeight: 500 }}>
            {wp.owner}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 6 }}>
            <div style={{
              height:       5,
              borderRadius: 3,
              background:   'rgba(255,255,255,0.06)',
              overflow:     'hidden',
              position:     'relative',
            }}>
              <div
                className={isInProgress && progressPct > 0 ? 'shimmer-bar' : ''}
                style={{
                  height:     '100%',
                  width:      `${progressPct}%`,
                  borderRadius: 3,
                  background: progressPct === 100
                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                    : `linear-gradient(90deg, ${stageColor}, ${hexToRgba(stageColor, 0.7)})`,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  position:   'relative',
                  overflow:   'hidden',
                }}
              />
            </div>
          </div>

          {/* Count + capture warning */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="mono" style={{ color: '#64748B', fontSize: 12 }}>
              <span style={{ color: '#94A3B8', fontWeight: 600 }}>{completeCount}</span>
              /{elements.length} complete
            </span>

            {uncaptured > 0 && (
              <span style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          5,
                padding:      '2px 8px',
                borderRadius: 4,
                background:   'rgba(245,158,11,0.08)',
                border:       '1px solid rgba(245,158,11,0.18)',
                color:        '#F59E0B',
                fontSize:     11,
                fontWeight:   500,
              }}>
                ⚠ {uncaptured} not captured
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <span style={{ color: '#334155', fontSize: 18, flexShrink: 0, marginTop: 3 }}>›</span>
      </div>
    </button>
  )
}

// ── Zone group header ──────────────────────────────────────────────────────────
function ZoneHeader({ label, count }) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          10,
      marginBottom: 10,
      marginTop:    6,
    }}>
      <span style={{
        color:         '#6366F1',
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily:    'DM Sans, sans-serif',
      }}>
        {label}
      </span>
      <span style={{ color: '#334155', fontSize: 11 }}>
        {count} package{count !== 1 ? 's' : ''}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

// ── Stage legend overlay for 3D viewer ────────────────────────────────────────
function ViewerLegend() {
  const items = [
    { label: 'Complete / Inspected', color: '#10B981' },
    { label: 'In Progress',          color: '#3B82F6' },
    { label: 'Delivered / On Site',  color: '#F59E0B' },
    { label: 'Not Started',          color: '#4B5563' },
  ]

  return (
    <div style={{
      position:        'absolute',
      bottom:          12,
      left:            12,
      background:      'rgba(10,12,16,0.88)',
      backdropFilter:  'blur(10px)',
      border:          '1px solid rgba(255,255,255,0.08)',
      borderRadius:    8,
      padding:         '10px 14px',
      zIndex:          10,
      minWidth:        170,
    }}>
      <div style={{
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         '#475569',
        marginBottom:  7,
      }}>
        Stage Legend
      </div>
      {items.map(item => (
        <div key={item.label} style={{
          display:    'flex',
          alignItems: 'center',
          gap:        8,
          color:      '#64748B',
          fontSize:   11,
          padding:    '2px 0',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 2,
            background: item.color, flexShrink: 0,
          }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}

// ── DashboardView ──────────────────────────────────────────────────────────────
export default function DashboardView({ results, onSelectWorkPackage, onNewUpload }) {
  const [selectedWpId, setSelectedWpId] = useState(null)

  const wps = results?.work_packages ?? []

  // Group by zone
  const byZone = wps.reduce((acc, wp) => {
    const z = wp.zone ?? 'unknown'
    ;(acc[z] = acc[z] ?? []).push(wp)
    return acc
  }, {})

  const zoneLabel = z => z.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const handleCardClick = (wp) => {
    setSelectedWpId(wp.id)
    onSelectWorkPackage(wp)
  }

  return (
    <Layout
      zoneLabel={results?.zone_label}
      processedAt={results?.processed_at}
      headerRight={
        <button className="ghost-btn" onClick={onNewUpload}>
          + New Upload
        </button>
      }
    >
      {/* ── Summary strip ── */}
      <SummaryStrip results={results} />

      {/* ── Main 60/40 split ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — Work Package List */}
        <div style={{
          width:       '60%',
          overflow:    'auto',
          padding:     '18px 18px 18px 22px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>
          {wps.length === 0 ? (
            <EmptyState />
          ) : (
            Object.entries(byZone).map(([zone, packages]) => (
              <div key={zone} style={{ marginBottom: 8 }}>
                <ZoneHeader label={zoneLabel(zone)} count={packages.length} />
                {packages.map(wp => (
                  <WorkPackageCard
                    key={wp.id}
                    wp={wp}
                    selected={selectedWpId === wp.id}
                    onClick={() => handleCardClick(wp)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* RIGHT — 3D Viewer */}
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Viewer header */}
          <div style={{
            padding:      '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            background:   'rgba(13,15,22,0.6)',
          }}>
            <span style={{
              color:         '#475569',
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              3D Site Model
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 2 }}>
              <span className="live-dot" />
              <span style={{
                color:         '#10B981',
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}>
                Live
              </span>
            </span>
          </div>

          {/* Viewer body with grid background + legend */}
          <div className="viewer-grid" style={{ flex: 1, position: 'relative' }}>
            <ThreeViewer
              workPackages={wps}
              showLegend={false}
              onElementSelect={(elementId) => {
                // Only fires when user clicks "View Evidence" in the popup — navigate to detail
                const wp = wps.find(w => w.elements.some(e => e.id === elementId))
                if (wp) {
                  setSelectedWpId(wp.id)   // highlight the card
                  onSelectWorkPackage(wp)  // navigate to detail
                }
              }}
            />
            <ViewerLegend />

            {/* Vignette overlay */}
            <div style={{
              position:       'absolute',
              inset:          0,
              background:     'radial-gradient(ellipse at center, transparent 55%, rgba(10,12,16,0.55) 100%)',
              pointerEvents:  'none',
              zIndex:         5,
            }} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

function EmptyState() {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      height:         280,
      color:          '#374151',
      textAlign:      'center',
      gap:            12,
    }}>
      <div style={{ fontSize: 44 }}>📋</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#4B5563' }}>No analysis results yet</div>
      <div style={{ fontSize: 13, color: '#374151' }}>Upload a site walkthrough video to get started</div>
    </div>
  )
}
