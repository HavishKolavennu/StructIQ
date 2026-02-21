/**
 * Maps construction stage IDs to hex colors.
 * Matches the color spec in architecture.md → 3D Reference Model Specification.
 */
export const STAGE_COLORS = {
  // Not tracked / unknown
  not_captured: '#6B7280',
  not_started:  '#6B7280',
  unclear:      '#6B7280',

  // Delivered / early (amber)
  delivered:         '#F59E0B',
  materials_on_site: '#F59E0B',

  // In progress (blue)
  placed:             '#3B82F6',
  braced:             '#3B82F6',
  connected:          '#3B82F6',
  rough_in_started:   '#3B82F6',
  rough_in_complete:  '#3B82F6',
  pressure_tested:    '#3B82F6',
  duct_installed:     '#3B82F6',
  branches_complete:  '#3B82F6',
  balanced:           '#3B82F6',

  // Complete / inspected (green)
  inspected: '#10B981',
  complete:  '#10B981',

  // Flagged (red) — used manually if needed
  flagged: '#EF4444',
}

export function getStageColor(stage) {
  return STAGE_COLORS[stage] ?? '#6B7280'
}

export const CONFIDENCE_META = {
  high:   { label: 'High',   color: '#10B981' },
  medium: { label: 'Medium', color: '#F59E0B' },
  low:    { label: 'Low',    color: '#EF4444' },
  none:   { label: 'None',   color: '#6B7280' },
}
