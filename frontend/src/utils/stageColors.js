/**
 * Maps construction stage IDs to colors.
 * Matches the architecture.md color spec + design guide update.
 */

// Base stage colors (used for 3D model, accents)
export const STAGE_COLORS = {
  not_captured:  '#4B5563',
  not_started:   '#4B5563',
  unclear:       '#4B5563',

  // Amber — delivered / early
  delivered:         '#F59E0B',
  materials_on_site: '#F59E0B',

  // Blue — in progress
  placed:             '#3B82F6',
  braced:             '#3B82F6',
  connected:          '#3B82F6',
  rough_in_started:   '#3B82F6',
  rough_in_complete:  '#3B82F6',
  pressure_tested:    '#3B82F6',
  duct_installed:     '#3B82F6',
  branches_complete:  '#3B82F6',
  balanced:           '#3B82F6',
  framed:             '#3B82F6',
  insulated:          '#3B82F6',
  drywalled:          '#3B82F6',
  taped_mudded:       '#3B82F6',

  // Green — done
  inspected: '#10B981',
  complete:  '#10B981',
  painted:   '#10B981',

  // Red — flagged
  flagged: '#EF4444',
}

// Lighter text colors for badges (brighter than the base)
export const STAGE_TEXT_COLORS = {
  not_captured:  '#6B7280',
  not_started:   '#6B7280',
  unclear:       '#6B7280',

  delivered:         '#FBBF24',
  materials_on_site: '#FBBF24',

  placed:             '#60A5FA',
  braced:             '#60A5FA',
  connected:          '#60A5FA',
  rough_in_started:   '#60A5FA',
  rough_in_complete:  '#60A5FA',
  pressure_tested:    '#60A5FA',
  duct_installed:     '#60A5FA',
  branches_complete:  '#60A5FA',
  balanced:           '#60A5FA',
  framed:             '#60A5FA',
  insulated:          '#60A5FA',
  drywalled:          '#60A5FA',
  taped_mudded:       '#60A5FA',

  inspected: '#34D399',
  complete:  '#34D399',
  painted:   '#34D399',

  flagged: '#F87171',
}

export function getStageColor(stage) {
  return STAGE_COLORS[stage] ?? '#4B5563'
}

export function getStageTextColor(stage) {
  return STAGE_TEXT_COLORS[stage] ?? '#6B7280'
}

export const CONFIDENCE_META = {
  high:   { label: 'High',   color: '#34D399' },
  medium: { label: 'Medium', color: '#FBBF24' },
  low:    { label: 'Low',    color: '#F87171' },
  none:   { label: 'None',   color: '#475569' },
}
