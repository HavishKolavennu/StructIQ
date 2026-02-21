import { getStageColor, CONFIDENCE_META } from '../utils/stageColors'

/**
 * ElementPopup — appears on the right side of the 3D viewer when a mesh is clicked.
 *
 * Props:
 *   element       — the element object from analysis results (id, name, type, stage, etc.)
 *   onClose       — called when the × button is clicked
 *   onViewEvidence — called when "View Evidence" is clicked
 */
export default function ElementPopup({ element, onClose, onViewEvidence }) {
  const stageColor  = getStageColor(element.stage)
  const confMeta    = CONFIDENCE_META[element.confidence] ?? CONFIDENCE_META.none

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      width: 270,
      background: '#1A1D27',
      border: '1px solid #2A2D37',
      borderRadius: 12,
      padding: 18,
      color: '#F9FAFB',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            {element.type}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 3 }}>
            {element.name}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#9CA3AF',
            cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Stage badge */}
      <div style={{
        marginTop: 14,
        display: 'inline-block',
        background: stageColor + '22',
        border: `1px solid ${stageColor}`,
        color: stageColor,
        borderRadius: 6,
        padding: '4px 12px',
        fontSize: 13,
        fontWeight: 500,
      }}>
        {element.stage_label || element.stage}
      </div>

      {/* Confidence */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#9CA3AF', fontSize: 12 }}>Confidence:</span>
        <span style={{ color: confMeta.color, fontSize: 12, fontWeight: 600 }}>
          {confMeta.label}
        </span>
      </div>

      {/* Conflict warning */}
      {element.conflicting && (
        <div style={{
          marginTop: 10,
          background: '#F59E0B18',
          border: '1px solid #F59E0B44',
          borderRadius: 6,
          padding: '6px 10px',
          color: '#F59E0B',
          fontSize: 12,
        }}>
          ⚠ Conflicting assessments across frames
        </div>
      )}

      {/* Frame evidence count */}
      <div style={{ marginTop: 10, color: '#9CA3AF', fontSize: 12 }}>
        {element.frame_evidence?.length > 0
          ? `Observed in ${element.frame_evidence.length} frame${element.frame_evidence.length > 1 ? 's' : ''}`
          : 'Not observed in any frame'}
      </div>

      {/* View evidence button */}
      {element.frame_evidence?.length > 0 && onViewEvidence && (
        <button
          onClick={onViewEvidence}
          style={{
            marginTop: 14,
            width: '100%',
            background: '#6366F1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 0',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          View Evidence →
        </button>
      )}
    </div>
  )
}
