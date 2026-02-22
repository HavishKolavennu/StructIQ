import StageBadge from '../shared/StageBadge'
import ConfidenceIndicator from '../shared/ConfidenceIndicator'

export default function ElementRow({ element, isSelected, onSelect }) {
  return (
    <div
      className={`
        rounded-xl p-4 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'bg-accent/15 border border-accent/40 shadow-neon-sm'
          : 'holo-card hover:border-accent/30'
        }
      `}
      onClick={() => onSelect(element)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(element)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="font-display font-semibold text-text-primary tracking-wide">{element.name}</h4>
          <p className="text-sm text-text-muted mt-0.5 font-mono">{element.type}</p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <ConfidenceIndicator confidence={element.confidence} />
          <StageBadge stage={element.stage} stageLabel={element.stage_label} size="default" />
        </div>
      </div>
    </div>
  )
}
