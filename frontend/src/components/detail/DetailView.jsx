import { useState } from 'react'
import StageBadge from '../shared/StageBadge'
import ElementRow from './ElementRow'
import FrameGallery from './FrameGallery'
import OverrideControls from './OverrideControls'

export default function DetailView({ workPackage, onBack }) {
  const [selectedElement, setSelectedElement] = useState(workPackage?.elements?.[0] ?? null)
  const [overrides, setOverrides] = useState({})

  const getElementWithOverride = (el) => {
    const override = overrides[el.id]
    if (!override) return el
    return { ...el, stage: override, stage_label: override.replace(/_/g, ' ') }
  }

  const handleOverride = (element, stage) => {
    if (!stage) {
      setOverrides((prev) => { const next = { ...prev }; delete next[element.id]; return next })
    } else {
      setOverrides((prev) => ({ ...prev, [element.id]: stage }))
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-10 py-12 animate-fade-in">
      <div className="mb-12">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary tracking-wider">{workPackage?.name}</h1>
            <p className="text-text-secondary mt-1">{workPackage?.owner}</p>
          </div>
          <StageBadge stage={workPackage?.overall_stage} stageLabel={workPackage?.overall_stage?.replace(/_/g, ' ')} size="lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-5">
          <h2 className="text-xs font-mono text-accent/80 uppercase tracking-widest">Elements</h2>
          <div className="space-y-3">
            {workPackage?.elements?.map((el) => (
              <ElementRow
                key={el.id}
                element={getElementWithOverride(el)}
                isSelected={selectedElement?.id === el.id}
                onSelect={setSelectedElement}
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xs font-mono text-accent/80 uppercase tracking-widest mb-5">
              Frame evidence
              {selectedElement && <span className="ml-2 font-normal text-text-primary">— {selectedElement.name}</span>}
            </h2>
            <FrameGallery frameEvidence={selectedElement?.frame_evidence ?? []} />
          </div>
          {selectedElement && (
            <OverrideControls element={selectedElement} overrideValue={overrides[selectedElement.id]} onOverride={handleOverride} />
          )}
        </div>
      </div>
    </div>
  )
}
