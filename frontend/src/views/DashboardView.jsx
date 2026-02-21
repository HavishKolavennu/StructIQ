import StageBadge from '../components/Shared/StageBadge'

function wpProgress(elements) {
  const completeCount = elements.filter((e) => e.stage === 'complete' || e.stage === 'inspected').length
  return `${completeCount} of ${elements.length} elements complete`
}

export default function DashboardView({ results, onOpenDetail }) {
  return (
    <section className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 rounded-xl border border-border bg-surface/80 p-4 shadow-panel">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Work Packages</h2>
          <span className="text-xs text-textSecondary">Grouped by zone</span>
        </div>

        <div className="soft-scroll max-h-[68vh] space-y-3 overflow-auto pr-1">
          {results.work_packages.map((wp) => (
            <button
              key={wp.id}
              onClick={() => onOpenDetail(wp.id)}
              className="w-full rounded-lg border border-border bg-bg/60 p-4 text-left transition hover:border-brand/50 hover:bg-bg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-base font-semibold">{wp.name}</div>
                  <div className="text-xs text-textSecondary">Owner: {wp.owner}</div>
                </div>
                <StageBadge stage={wp.overall_stage} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-textSecondary">
                <span>{wpProgress(wp.elements)}</span>
                <span>Zone: {wp.zone}</span>
                <span>Updated: {new Date(results.processed_at).toLocaleTimeString()}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 rounded-xl border border-border bg-surface/80 p-4 shadow-panel">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-textSecondary">ThreeViewer Placeholder</h3>
        <div className="mt-3 grid h-[68vh] place-items-center rounded-lg border border-dashed border-border bg-bg/60 text-center text-sm text-textSecondary">
          Chunk 3 integration area
        </div>
      </div>
    </section>
  )
}
