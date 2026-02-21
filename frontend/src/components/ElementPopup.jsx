import { getStageColor, getStageTextColor, CONFIDENCE_META } from '../utils/stageColors'

/**
 * ElementPopup — floats over the 3D viewer when a mesh is clicked.
 *
 * Props:
 *   element        — element object from analysis results
 *   onClose        — called when × is clicked
 *   onViewEvidence — called when "View Evidence" is clicked (triggers navigation)
 */
export default function ElementPopup({ element, onClose, onViewEvidence }) {
  const baseColor = getStageColor(element.stage)
  const textColor = getStageTextColor(element.stage)
  const confMeta  = CONFIDENCE_META[element.confidence] ?? CONFIDENCE_META.none

  const hexToRgba = (hex, a) => {
    if (!hex || hex.length < 7) return `rgba(0,0,0,${a})`
    const r = parseInt(hex.slice(1,3), 16)
    const g = parseInt(hex.slice(3,5), 16)
    const b = parseInt(hex.slice(5,7), 16)
    return `rgba(${r},${g},${b},${a})`
  }

  const frameCount = element.frame_evidence?.length ?? 0

  return (
    <div style={{
      position:       'absolute',
      top:            12,
      right:          12,
      width:          260,
      background:     'rgba(13,15,22,0.92)',
      backdropFilter: 'blur(16px)',
      border:         `1px solid ${hexToRgba(baseColor, 0.25)}`,
      borderRadius:   12,
      padding:        '16px 18px',
      color:          '#F1F5F9',
      boxShadow:      `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
      zIndex:         20,
      fontFamily:     'DM Sans, system-ui, sans-serif',
      animation:      'fadeIn 0.15s ease-out',
    }}>

      {/* Coloured top accent strip */}
      <div style={{
        position:     'absolute',
        top:          0, left: 0, right: 0,
        height:       2,
        borderRadius: '12px 12px 0 0',
        background:   `linear-gradient(90deg, ${baseColor}, ${hexToRgba(baseColor, 0.3)})`,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{
            fontSize:      10,
            color:         '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight:    700,
            marginBottom:  3,
          }}>
            {element.type}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
            {element.name}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background:  'rgba(255,255,255,0.06)',
            border:      '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color:       '#64748B',
            cursor:      'pointer',
            fontSize:    14,
            lineHeight:  1,
            padding:     '3px 7px',
            transition:  'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#94A3B8' }}
          onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.color = '#64748B' }}
        >
          ×
        </button>
      </div>

      {/* Stage badge */}
      <div style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          6,
        background:   hexToRgba(baseColor, 0.12),
        border:       `1px solid ${hexToRgba(baseColor, 0.25)}`,
        color:        textColor,
        borderRadius: 6,
        padding:      '4px 10px',
        fontSize:     12,
        fontWeight:   600,
        letterSpacing:'0.02em',
        marginBottom: 12,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: baseColor, flexShrink: 0 }} />
        {element.stage_label || element.stage?.replace(/_/g, ' ')}
      </div>

      {/* Confidence row */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        justifyContent:'space-between',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ color: '#475569', fontSize: 11 }}>Confidence</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Signal bars */}
          <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {[1,2,3].map(i => {
              const filled = element.confidence === 'high' ? 3 : element.confidence === 'medium' ? 2 : element.confidence === 'low' ? 1 : 0
              return (
                <span key={i} style={{
                  display:      'block',
                  width:        3,
                  height:       3 + i * 3,
                  borderRadius: 1.5,
                  background:   i <= filled ? confMeta.color : 'rgba(255,255,255,0.1)',
                }} />
              )
            })}
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize:   11,
            fontWeight: 600,
            color:      confMeta.color,
          }}>
            {confMeta.label}
          </span>
        </div>
      </div>

      {/* Conflict warning */}
      {element.conflicting && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          7,
          background:   'rgba(245,158,11,0.08)',
          border:       '1px solid rgba(245,158,11,0.2)',
          borderRadius: 6,
          padding:      '6px 10px',
          color:        '#FBBF24',
          fontSize:     11,
          marginBottom: 8,
        }}>
          ⚠ Conflicting assessments across frames
        </div>
      )}

      {/* Frame count */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        justifyContent:'space-between',
        marginBottom: frameCount > 0 ? 12 : 0,
      }}>
        <span style={{ color: '#475569', fontSize: 11 }}>Frame evidence</span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize:   11,
          fontWeight: 600,
          color:      frameCount > 0 ? '#94A3B8' : '#374151',
        }}>
          {frameCount > 0 ? `${frameCount} frame${frameCount > 1 ? 's' : ''}` : 'None'}
        </span>
      </div>

      {/* View Evidence CTA */}
      {frameCount > 0 && (
        <button
          onClick={onViewEvidence}
          style={{
            width:         '100%',
            background:    `linear-gradient(135deg, ${baseColor}CC, ${baseColor}99)`,
            color:         '#fff',
            border:        'none',
            borderRadius:  8,
            padding:       '9px 0',
            cursor:        'pointer',
            fontWeight:    700,
            fontSize:      13,
            fontFamily:    'DM Sans, sans-serif',
            letterSpacing: '-0.01em',
            boxShadow:     `0 4px 12px ${hexToRgba(baseColor, 0.35)}`,
            transition:    'opacity 0.15s',
          }}
          onMouseEnter={e => e.target.style.opacity = '0.88'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          View Frame Evidence →
        </button>
      )}
    </div>
  )
}
