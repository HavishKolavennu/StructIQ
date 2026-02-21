import StageBadge from '../shared/StageBadge'

export default function WorkPackageCard({ workPackage, onClick, index = 0 }) {
  const completeCount = workPackage.elements.filter(
    (e) => e.stage === 'complete' || e.stage === 'inspected'
  ).length
  const totalCount = workPackage.elements.length
  const elementSummary = `${completeCount} of ${totalCount} elements complete`

  return (
    <button
      type="button"
      onClick={() => onClick(workPackage)}
      style={{ animationDelay: `${index * 0.05}s` }}
      className="
        w-full text-left rounded-xl p-6
        holo-card
        transition-all duration-300 animate-slide-up opacity-0 [animation-fill-mode:forwards]
        hover:shadow-card-hover hover:-translate-y-1
        focus:outline-none focus:ring-2 focus:ring-accent/40
      "
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-text-primary text-lg truncate tracking-wide">{workPackage.name}</h3>
          <p className="text-text-secondary mt-1">{workPackage.owner}</p>
          <p className="text-text-muted text-sm mt-1 font-mono">{elementSummary}</p>
        </div>
        <div className="flex-shrink-0">
          <StageBadge stage={workPackage.overall_stage} size="default" />
        </div>
      </div>
    </button>
  )
}
