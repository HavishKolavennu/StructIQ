import { CONFIDENCE_COLORS } from '../../utils/stage'

export default function ConfidenceIndicator({ confidence = 'none' }) {
  const normalized = String(confidence).toLowerCase()
  const cls = CONFIDENCE_COLORS[normalized] || CONFIDENCE_COLORS.none
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${cls}`}>
      {normalized}
    </span>
  )
}
