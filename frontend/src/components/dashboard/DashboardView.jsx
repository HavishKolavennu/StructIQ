import DashboardHeader from './DashboardHeader'
import WorkPackageList from './WorkPackageList'
import ThreeViewer from '../ThreeViewer'

export default function DashboardView({ results, onSelectWorkPackage }) {
  const workPackages = results?.work_packages ?? []
  const summary = results?.summary
  const zoneLabel = results?.zone_label
  const detectedZones = results?.detected_zones ?? []

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-10 min-w-0">
        <DashboardHeader summary={summary} zoneLabel={zoneLabel} detectedZones={detectedZones} />
        <WorkPackageList workPackages={workPackages} onSelectWorkPackage={onSelectWorkPackage} />
      </div>

      <div className="w-[42%] min-w-[360px] border-l border-accent/10 bg-accent/[0.02]">
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-accent/10 bg-accent/[0.03]">
            <p className="font-display text-text-secondary font-semibold text-sm tracking-wide">Reference 3D Model</p>
            <p className="text-text-muted text-xs mt-1 font-mono">Default demo visualization (Chunk 3 interaction optional)</p>
          </div>
          <div className="flex-1 min-h-0">
            <ThreeViewer workPackages={workPackages} />
          </div>
        </div>
      </div>
    </div>
  )
}
