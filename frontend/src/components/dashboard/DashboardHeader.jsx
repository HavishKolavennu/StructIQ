export default function DashboardHeader({ summary, zoneLabel, detectedZones = [] }) {
  const complete = (summary?.stages_breakdown?.complete ?? 0) + (summary?.stages_breakdown?.inspected ?? 0)
  const total = summary?.total_elements ?? 0
  const progressText = total > 0 ? `${complete} of ${total} elements complete` : '—'
  const progressPct = total > 0 ? Math.round((complete / total) * 100) : 0

  return (
    <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary tracking-wider">Weekly Schedule</h2>
        <p className="text-text-secondary mt-1 font-mono">{progressText}</p>
        {total > 0 && (
          <div className="mt-4 h-1 w-56 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-700"
              style={{ width: `${progressPct}%`, boxShadow: '0 0 20px rgba(245,158,11,0.35)' }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap text-sm">
        <span className="text-text-muted font-mono">{summary?.total_work_packages ?? 0} work packages</span>
        {zoneLabel && (
          <span className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 font-mono text-accent text-xs">
            {zoneLabel}
          </span>
        )}
        {detectedZones.map((zone) => (
          <span key={zone} className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-1.5 font-mono text-accent text-xs">
            {zone}
          </span>
        ))}
      </div>
    </div>
  )
}
