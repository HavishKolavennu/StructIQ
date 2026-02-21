import { getStageColor, getStageTextColor } from '../utils/stageColors'

/**
 * StageBadge — tinted pill showing construction stage.
 * Design: base color at 12% bg opacity, 20% border, bright text, dot accent.
 *
 * Props:
 *   stage  — stage id string
 *   label  — human-readable label
 *   size   — "sm" | "md" (default "md")
 */
export default function StageBadge({ stage, label, size = 'md' }) {
  const base  = getStageColor(stage)
  const text  = getStageTextColor(stage)

  // Convert hex to rgba without importing a library
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1,3), 16)
    const g = parseInt(hex.slice(3,5), 16)
    const b = parseInt(hex.slice(5,7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const bg     = hexToRgba(base, 0.12)
  const border = hexToRgba(base, 0.22)

  const padding  = size === 'sm' ? '3px 8px'   : '4px 11px'
  const fontSize = size === 'sm' ? 11           : 12
  const dotSize  = size === 'sm' ? 5            : 6

  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           5,
      background:    bg,
      border:        `1px solid ${border}`,
      color:         text,
      borderRadius:  6,
      padding,
      fontSize,
      fontWeight:    600,
      letterSpacing: '0.02em',
      whiteSpace:    'nowrap',
      fontFamily:    'DM Sans, system-ui, sans-serif',
    }}>
      <span style={{
        width:        dotSize,
        height:       dotSize,
        borderRadius: '50%',
        background:   base,
        flexShrink:   0,
      }} />
      {label || stage}
    </span>
  )
}
