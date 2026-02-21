import WorkPackageCard from './WorkPackageCard'

export default function WorkPackageList({ workPackages, onSelectWorkPackage }) {
  if (!workPackages?.length) {
    return (
      <div className="holo-card rounded-2xl p-16 text-center">
        <p className="text-text-secondary">No work packages in this zone.</p>
        <p className="text-text-muted text-sm mt-2 font-mono">Upload a video to analyze progress.</p>
      </div>
    )
  }
  const byZone = workPackages.reduce((acc, wp) => {
    const zone = wp.zone ?? 'unknown'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(wp)
    return acc
  }, {})
  const zoneLabels = { floor_1: 'Floor 1', floor_2: 'Floor 2', floor_3: 'Floor 3' }
  let cardIndex = 0
  return (
    <div className="space-y-10">
      {Object.entries(byZone).map(([zoneId, packages]) => (
        <div key={zoneId}>
          <h3 className="text-xs font-mono text-accent/80 uppercase tracking-widest mb-4">
            {zoneLabels[zoneId] ?? zoneId}
          </h3>
          <div className="space-y-4">
            {packages.map((wp) => (
              <WorkPackageCard
                key={wp.id}
                workPackage={wp}
                onClick={onSelectWorkPackage}
                index={cardIndex++}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
