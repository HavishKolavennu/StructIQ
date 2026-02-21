import { STAGE_COLORS, stageToLabel } from '../../utils/stage'

export default function StageBadge({ stage, label, className = '' }) {
  const cls = STAGE_COLORS[stage] || STAGE_COLORS.not_started
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls} ${className}`}>
      {label || stageToLabel(stage)}
    </span>
  )
}
