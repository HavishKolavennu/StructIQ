import { useState } from 'react'
import Layout from '../components/Layout'
import StageBadge from '../components/StageBadge'
import ThreeViewer from '../components/ThreeViewer'
import { getStageColor, STAGE_COLORS } from '../utils/stageColors'

// ── Helpers ────────────────────────────────────────────────────────────────────
const hexToRgba = (hex, a) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ── SummaryStrip ───────────────────────────────────────────────────────────────
function SummaryStrip({ results }) {
  const summary = results?.summary ?? {}
  const breakdown = summary.stages_breakdown ?? {}
  const doneCount = (breakdown.complete ?? 0) + (breakdown.inspected ?? 0)
  const total = summary.total_elements ?? 0
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  const legendItems = [
    { label: 'Complete', count: doneCount, color: 'var(--stage-complete)' },
    { label: 'In Progress', count: breakdown.in_progress ?? 0, color: '#3B82F6' },
    { label: 'Not Started', count: breakdown.not_started ?? 0, color: 'var(--text-muted)' },
    { label: 'Not Captured', count: breakdown.not_captured ?? 0, color: 'var(--stage-delivered)', warn: true },
  ]

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '18px 28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          color: 'var(--text-muted)',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        <span className="mono">{summary.total_work_packages ?? 0} work packages</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span className="mono">{total} elements</span>
        {results?.zone_label && (
          <>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                color: 'var(--accent)',
                borderRadius: 6,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {results.zone_label}
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <div
          style={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            background: 'var(--border-subtle)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 4,
              background: pct === 100
                ? 'linear-gradient(90deg, var(--stage-complete), #34D399)'
                : 'linear-gradient(90deg, var(--accent), var(--accent-muted))',
              transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
        <span
          className="mono"
          style={{
            color: pct === 100 ? 'var(--stage-complete)' : 'var(--text-primary)',
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.04em',
            minWidth: 52,
            textAlign: 'right',
            lineHeight: 1,
          }}
        >
          {pct}
          <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>%</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {legendItems.map(item => (
          <span
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span className="mono" style={{ color: item.count > 0 ? item.color : 'var(--text-muted)', fontWeight: 600 }}>
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
  const elements = wp.elements ?? []
  const completeCount = elements.filter(e => e.stage === 'complete' || e.stage === 'inspected').length
  const uncaptured = elements.filter(e => e.stage === 'not_captured').length
  const stageColor = getStageColor(wp.overall_stage)
  const progressPct = elements.length ? (completeCount / elements.length) * 100 : 0
  const isInProgress = !['complete', 'inspected', 'not_started', 'not_captured'].includes(wp.overall_stage)

  const stageLabel = wp.elements?.find(e => e.stage === wp.overall_stage)?.stage_label
    ?? wp.overall_stage?.replace(/_/g, ' ')

  return (
    <button className={`wp-card${selected ? ' selected' : ''}`} onClick={onClick}>
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: stageColor,
        borderRadius: '10px 0 0 10px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '-0.01em',
            }}>
              {wp.name}
            </span>
            <StageBadge stage={wp.overall_stage} label={stageLabel} size="sm" />
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10, fontWeight: 500 }}>
            {wp.owner}
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{
              height: 5,
              borderRadius: 3,
              background: 'var(--border-subtle)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div
                className={isInProgress && progressPct > 0 ? 'shimmer-bar' : ''}
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  borderRadius: 3,
                  background: progressPct === 100
                    ? 'linear-gradient(90deg, var(--stage-complete), #34D399)'
                    : `linear-gradient(90deg, ${stageColor}, ${hexToRgba(stageColor, 0.7)})`,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{completeCount}</span>
              /{elements.length} complete
            </span>

            {uncaptured > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.18)',
                color: 'var(--stage-delivered)',
                fontSize: 11,
                fontWeight: 500,
              }}>
                ⚠ {uncaptured} not captured
              </span>
            )}
          </div>
        </div>

        <span style={{ color: 'var(--border)', fontSize: 18, flexShrink: 0, marginTop: 3 }}>›</span>
      </div>
    </button>
  )
}

// ── Zone group header ──────────────────────────────────────────────────────────
function ZoneHeader({ label, count }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
      marginTop: 8,
    }}>
      <span style={{
        color: 'var(--accent)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: 'Archivo, DM Sans, sans-serif',
      }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
        {count} package{count !== 1 ? 's' : ''}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  )
}

// ── Stage legend overlay for 3D viewer ────────────────────────────────────────
function ViewerLegend() {
  const items = [
    { label: 'Complete / Inspected', color: 'var(--stage-complete)' },
    { label: 'In Progress', color: '#3B82F6' },
    { label: 'Delivered / On Site', color: 'var(--stage-delivered)' },
    { label: 'Not Started', color: 'var(--text-muted)' },
  ]

  return (
    <div style={{
      position: 'absolute',
      bottom: 14,
      left: 14,
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '12px 16px',
      zIndex: 10,
      minWidth: 180,
      boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 8,
      }}>
        Stage Legend
      </div>
      {items.map(item => (
        <div key={item.label} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-secondary)',
          fontSize: 12,
          padding: '3px 0',
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

  const byZone = wps.reduce((acc, wp) => {
    const z = wp.zone ?? 'unknown'
    ;(acc[z] = acc[z] ?? []).push(wp)
    return acc
  }, {})

  const zoneLabel = z => z.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const handleCardClick = wp => {
    setSelectedWpId(wp.id)
    onSelectWorkPackage(wp)
  }

  return (
    <Layout
      zoneLabel={results?.zone_label}
      processedAt={results?.processed_at}
      headerRight={
        <button className="btn-ghost" onClick={onNewUpload}>
          + New Upload
        </button>
      }
    >
      <SummaryStrip results={results} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT — Work Package List */}
        <div style={{
          width: '60%',
          overflow: 'auto',
          padding: '20px 24px 24px 28px',
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)',
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
          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-surface)',
          }}>
            <span style={{
              color: 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              3D Site Model
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 2 }}>
              <span style={{
                display: 'inline-block',
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--stage-complete)',
                animation: 'pulse-live 2s infinite',
              }} />
              <span style={{
                color: 'var(--stage-complete)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}>
                Live
              </span>
            </span>
          </div>

          <div style={{ flex: 1, position: 'relative', background: 'var(--bg-subtle)' }}>
            <ThreeViewer
              workPackages={wps}
              showLegend={false}
              onElementSelect={elementId => {
                const wp = wps.find(w => w.elements?.some(e => e.id === elementId))
                if (wp) {
                  setSelectedWpId(wp.id)
                  onSelectWorkPackage(wp)
                }
              }}
            />
            <ViewerLegend />
          </div>
        </div>
      </div>
    </Layout>
  )
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 280,
      color: 'var(--text-muted)',
      textAlign: 'center',
      gap: 12,
    }}>
      <div style={{ fontSize: 44, opacity: 0.6 }}>📋</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-secondary)' }}>No analysis results yet</div>
      <div style={{ fontSize: 13 }}>Upload a site walkthrough video to get started</div>
    </div>
  )
}
