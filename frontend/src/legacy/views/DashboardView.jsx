import { useState } from 'react'
import Layout from '../components/Layout'
import StageBadge from '../components/StageBadge'
import { getStageColor } from '../utils/stageColors'

const hexToRgba = (hex, a) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function SummaryStrip({ results }) {
  const summary = results?.summary ?? {}
  const breakdown = summary.stages_breakdown ?? {}
  const doneCount = (breakdown.complete ?? 0) + (breakdown.inspected ?? 0)
  const total = summary.total_elements ?? 0
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  const detectedZones = results?.detected_zones ?? []

  const legendItems = [
    { label: 'Complete', count: doneCount, color: 'var(--stage-complete)' },
    { label: 'In Progress', count: breakdown.in_progress ?? 0, color: '#3B82F6' },
    { label: 'Not Started', count: breakdown.not_started ?? 0, color: 'var(--text-muted)' },
    { label: 'Not Captured', count: breakdown.not_captured ?? 0, color: 'var(--stage-delivered)' },
  ]

  return (
    <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', padding: '18px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, flexWrap: 'wrap' }}>
        <span className="mono">{summary.total_work_packages ?? 0} work packages</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span className="mono">{total} elements</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span className="mono">{detectedZones.length} zones detected</span>
      </div>

      {detectedZones.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {detectedZones.map((zone) => (
            <span key={zone} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--accent)', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600 }}>
              {zone}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--border-subtle)', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 4,
              background: pct === 100 ? 'linear-gradient(90deg, var(--stage-complete), #34D399)' : 'linear-gradient(90deg, var(--accent), var(--accent-muted))',
              transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
        <span className="mono" style={{ color: pct === 100 ? 'var(--stage-complete)' : 'var(--text-primary)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.04em', minWidth: 52, textAlign: 'right', lineHeight: 1 }}>
          {pct}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>%</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {legendItems.map((item) => (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span className="mono" style={{ color: item.count > 0 ? item.color : 'var(--text-muted)', fontWeight: 600 }}>{item.count}</span>
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function WorkPackageCard({ wp, selected, onClick }) {
  const elements = wp.elements ?? []
  const completeCount = elements.filter((e) => e.stage === 'complete' || e.stage === 'inspected').length
  const uncaptured = elements.filter((e) => e.stage === 'not_captured').length
  const conflicting = elements.filter((e) => e.conflicting).length
  const stageColor = getStageColor(wp.overall_stage)

  const stageLabel = wp.elements?.find((e) => e.stage === wp.overall_stage)?.stage_label
    ?? wp.overall_stage?.replace(/_/g, ' ')

  return (
    <button className={`wp-card${selected ? ' selected' : ''}`} onClick={onClick}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: stageColor, borderRadius: '10px 0 0 10px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>
          {wp.zone?.replace(/_/g, ' ') || 'zone'}
        </span>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.01em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {wp.name}
        </span>
        <StageBadge stage={wp.overall_stage} label={stageLabel} size="sm" />
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 12 }}>{wp.owner}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: stageColor, fontWeight: 700 }}>{completeCount}</span>
          {' / '}
          {elements.length} complete
        </span>

        {uncaptured > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 4, padding: '1px 7px' }}>
            {uncaptured} uncaptured
          </span>
        )}

        {conflicting > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 4, padding: '1px 7px' }}>
            {conflicting} conflict
          </span>
        )}

        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}>›</span>
      </div>
    </button>
  )
}

function ZoneHeader({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 8 }}>
      <span style={{ color: 'var(--accent)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Archivo, DM Sans, sans-serif' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{count} package{count !== 1 ? 's' : ''}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  )
}

export default function DashboardView({ results, onSelectWorkPackage, onNewUpload }) {
  const [selectedWpId, setSelectedWpId] = useState(null)
  const wps = results?.work_packages ?? []

  const byZone = wps.reduce((acc, wp) => {
    const z = wp.zone ?? 'unknown'
    ;(acc[z] = acc[z] ?? []).push(wp)
    return acc
  }, {})

  const zoneLabel = (z) => z.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const handleCardClick = (wp) => {
    setSelectedWpId(wp.id)
    onSelectWorkPackage(wp)
  }

  return (
    <Layout
      zoneLabel={results?.zone_label}
      processedAt={results?.processed_at}
      headerRight={<button className="btn-ghost" onClick={onNewUpload}>+ New Upload</button>}
    >
      <SummaryStrip results={results} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '60%', overflow: 'auto', padding: '20px 24px 24px 28px', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
          {wps.length === 0 ? (
            <EmptyState />
          ) : (
            Object.entries(byZone).map(([zone, packages]) => (
              <div key={zone} style={{ marginBottom: 8 }}>
                <ZoneHeader label={zoneLabel(zone)} count={packages.length} />
                {packages.map((wp) => (
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

        <div style={{ width: '40%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-subtle)', background: hexToRgba('#F59E0B', 0.02) }}>
          <div style={{ textAlign: 'center', maxWidth: 320, padding: 24 }}>
            <div style={{ width: 170, height: 170, borderRadius: 16, border: '2px dashed var(--border)', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
              <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)">
                <path d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>3D Viewer Placeholder</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Reserved for Chunk 3 integration. Dashboard status and evidence remain fully functional.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--text-muted)', textAlign: 'center', gap: 12 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" opacity="0.4">
        <rect x="8" y="6" width="28" height="34" rx="4" stroke="var(--text-muted)" strokeWidth="2" />
        <path d="M16 6v4h12V6" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 20h16M14 27h10" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-secondary)' }}>No analysis results yet</div>
      <div style={{ fontSize: 13 }}>Upload a site walkthrough video to get started</div>
    </div>
  )
}
