import { CONFIDENCE_META } from '../utils/stageColors'

/**
 * ConfidenceIndicator — 3-bar signal icon with label.
 *
 * Props:
 *   confidence — "high" | "medium" | "low" | "none"
 *   showLabel  — show text label (default true)
 */
export default function ConfidenceIndicator({ confidence, showLabel = true }) {
  const meta   = CONFIDENCE_META[confidence] ?? CONFIDENCE_META.none
  const filled = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : confidence === 'low' ? 1 : 0

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {/* Three-bar signal */}
      <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5 }}>
        {[1, 2, 3].map(i => (
          <span key={i} style={{
            display:      'block',
            width:        3.5,
            height:       4 + i * 4,
            borderRadius: 2,
            background:   i <= filled ? meta.color : 'rgba(255,255,255,0.1)',
            transition:   'background 0.2s',
          }} />
        ))}
      </span>

      {showLabel && (
        <span style={{
          fontSize:      11,
          fontWeight:    600,
          color:         meta.color,
          fontFamily:    'JetBrains Mono, monospace',
          letterSpacing: '0.02em',
        }}>
          {meta.label}
        </span>
      )}
    </span>
  )
}
