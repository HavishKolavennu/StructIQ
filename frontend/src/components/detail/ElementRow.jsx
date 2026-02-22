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
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <h4 className="font-display font-semibold text-text-primary tracking-wide truncate">{element.name}</h4>
          <ConfidenceIndicator confidence={element.confidence} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-text-muted font-mono truncate">{element.type}</p>
          <StageBadge stage={element.stage} stageLabel={element.stage_label} size="sm" />
        </div>
      </div>
    </div>
  )
}
