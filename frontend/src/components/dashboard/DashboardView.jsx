import DashboardHeader from './DashboardHeader'
import WorkPackageList from './WorkPackageList'

export default function DashboardView({ results, onSelectWorkPackage, onVisualizeProgress }) {
  const workPackages = results?.work_packages ?? []
  const summary = results?.summary
  const zoneLabel = results?.zone_label

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-10 min-w-0">
        <DashboardHeader summary={summary} zoneLabel={zoneLabel} />
        <WorkPackageList workPackages={workPackages} onSelectWorkPackage={onSelectWorkPackage} />
        <div className="mt-10">
          <button
            type="button"
            onClick={onVisualizeProgress}
            className="
              w-full rounded-xl px-6 py-4 font-display font-bold tracking-wider
              border-2 border-accent/40 bg-accent/5 text-accent
              hover:bg-accent/15 hover:border-accent/60 hover:shadow-neon-sm
              transition-all duration-300
            "
          >
            Visualize Progress →
          </button>
        </div>
      </div>
      <div className="w-[42%] min-w-[360px] flex items-center justify-center border-l border-accent/10 bg-accent/[0.02]">
        <div className="text-center p-12">
          <div className="w-56 h-56 mx-auto rounded-2xl border-2 border-dashed border-accent/20 flex items-center justify-center mb-8 bg-accent/5">
            <svg className="h-20 w-20 text-accent/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="font-display text-text-secondary font-semibold text-lg tracking-wide">3D Reference Model</p>
          <p className="text-text-muted text-sm mt-2 font-mono">Click &quot;Visualize Progress&quot; to view</p>
        </div>
      </div>
    </div>
  )
}
