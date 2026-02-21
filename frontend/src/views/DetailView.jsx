import { useMemo, useState } from 'react'
import StageBadge from '../components/Shared/StageBadge'
import ConfidenceIndicator from '../components/Shared/ConfidenceIndicator'

const OVERRIDE_OPTIONS = [
  'not_started',
  'delivered',
  'placed',
  'connected',
  'inspected',
  'complete',
  'not_captured'
]

export default function DetailView({ workPackage, onBack }) {
  const [selectedElementId, setSelectedElementId] = useState(workPackage.elements[0]?.id || null)
  const [overrides, setOverrides] = useState({})

  const selectedElement = useMemo(
    () => workPackage.elements.find((e) => e.id === selectedElementId) || workPackage.elements[0],
    [workPackage.elements, selectedElementId]
  )

  function effectiveStage(element) {
    return overrides[element.id] || element.stage
  }

  return (
    <section className="rounded-xl border border-border bg-surface/80 p-5 shadow-panel">
      <button onClick={onBack} className="mb-4 text-sm text-brand hover:underline">← Back to Dashboard</button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{workPackage.name}</h2>
          <p className="text-sm text-textSecondary">Owner: {workPackage.owner}</p>
        </div>
        <StageBadge stage={workPackage.overall_stage} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-lg border border-border bg-bg/55 p-3">
          <h3 className="mb-3 text-sm font-semibold text-textSecondary">ElementList</h3>
          <div className="space-y-2">
            {workPackage.elements.map((element) => (
              <button
                key={element.id}
                onClick={() => setSelectedElementId(element.id)}
                className={`w-full rounded-md border p-3 text-left ${selectedElementId === element.id ? 'border-brand/70 bg-brand/10' : 'border-border bg-surface'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{element.name}</span>
                  <StageBadge stage={effectiveStage(element)} className="text-[10px]" />
                </div>
                <div className="mt-2">
                  <ConfidenceIndicator confidence={element.confidence} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-bg/55 p-3">
            <h3 className="mb-2 text-sm font-semibold text-textSecondary">FrameGallery</h3>
            {selectedElement?.frame_evidence?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedElement.frame_evidence.map((frame) => (
                  <article key={frame.frame_id} className="rounded-md border border-border bg-surface p-3">
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs text-textSecondary">
                      <span>{frame.frame_id}</span>
                      <StageBadge stage={frame.vlm_stage_assessment} className="text-[10px]" />
                    </div>
                    <p className="text-sm leading-relaxed text-textSecondary">{frame.vlm_observation}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface p-4 text-sm text-textSecondary">
                No evidence frames for this element.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-bg/55 p-3">
            <h3 className="mb-2 text-sm font-semibold text-textSecondary">OverrideControls</h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-textSecondary">Adjust stage for {selectedElement?.name}:</span>
              <select
                value={effectiveStage(selectedElement)}
                onChange={(e) => setOverrides((prev) => ({ ...prev, [selectedElement.id]: e.target.value }))}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                {OVERRIDE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
