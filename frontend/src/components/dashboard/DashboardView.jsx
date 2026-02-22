import { useState } from 'react'
import DashboardHeader from './DashboardHeader'
import WorkPackageList from './WorkPackageList'
import ThreeViewer from '../ThreeViewer'

export default function DashboardView({ results, onSelectWorkPackage, onSelectElement }) {
  const workPackages = results?.work_packages ?? []
  const summary = results?.summary
  const zoneLabel = results?.zone_label
  const detectedZones = results?.detected_zones ?? []
  const [fullscreen, setFullscreen] = useState(false)

  const expandIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V3h4"/><path d="M21 7V3h-4"/>
      <path d="M3 17v4h4"/><path d="M21 17v4h-4"/>
    </svg>
  )
  const collapseIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
      <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
    </svg>
  )

  const ViewerPanel = fullscreen ? (
    <div className="fixed inset-0 z-[200]">
      <ThreeViewer workPackages={workPackages} onElementSelect={onSelectElement} />
      <button
        type="button"
        onClick={() => setFullscreen(false)}
        title="Exit fullscreen"
        className="absolute bottom-5 right-5 z-10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
          bg-white/90 backdrop-blur-sm border border-accent/20 text-text-secondary shadow-md
          hover:text-text-primary hover:bg-white transition-colors"
      >
        {collapseIcon}
        <span>Exit fullscreen</span>
      </button>
    </div>
  ) : (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-accent/10 bg-accent/[0.03] flex items-center justify-between flex-shrink-0">
        <div>
          <p className="font-display text-text-secondary font-semibold text-sm tracking-wide">Reference 3D Model</p>
          <p className="text-text-muted text-xs mt-1 font-mono">Default demo visualization</p>
        </div>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          title="Fullscreen"
          className="ml-4 flex-shrink-0 rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-accent/10 transition-colors"
        >
          {expandIcon}
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ThreeViewer workPackages={workPackages} onElementSelect={onSelectElement} />
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-10 min-w-0">
        <DashboardHeader summary={summary} zoneLabel={zoneLabel} detectedZones={detectedZones} />
        <WorkPackageList workPackages={workPackages} onSelectWorkPackage={onSelectWorkPackage} />
      </div>

      <div className="w-[42%] min-w-[360px] border-l border-accent/10 bg-accent/[0.02]">
        {ViewerPanel}
      </div>
    </div>
  )
}
