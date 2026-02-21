import { getStageColor, getStageTextColor } from '../utils/stageColors'

/**
 * StageBadge — tinted pill showing construction stage.
 * Light theme: subtle bg, colored border, colored text.
 */
export default function StageBadge({ stage, label, size = 'md' }) {
  const base = getStageColor(stage)
  const text = getStageTextColor(stage)

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const bg = hexToRgba(base, 0.1)
  const border = hexToRgba(base, 0.25)

  const padding = size === 'sm' ? '4px 10px' : '5px 12px'
  const fontSize = size === 'sm' ? 11 : 12
  const dotSize = size === 'sm' ? 5 : 6

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        borderRadius: 6,
        padding,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: base,
          flexShrink: 0,
        }}
      />
      {label || stage}
    </span>
  )
}
