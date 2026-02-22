/**
 * Neon stage badge with futuristic styling.
 */
export default function StageBadge({ stage, stageLabel, size = 'default' }) {
  const stageColors = {
    complete: 'bg-stage-green/20 text-stage-green border-stage-green/40',
    inspected: 'bg-stage-green/20 text-stage-green border-stage-green/40',
    connected: 'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    placed: 'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    braced: 'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    rough_in_complete: 'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    rough_in_started: 'bg-stage-amber/20 text-stage-amber border-stage-amber/40',
    delivered: 'bg-stage-amber/20 text-stage-amber border-stage-amber/40',
    materials_on_site: 'bg-stage-amber/20 text-stage-amber border-stage-amber/40',
    duct_installed: 'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    branches_complete: 'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    pressure_tested: 'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    balanced: 'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    in_progress: 'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    not_started: 'bg-stage-gray/20 text-stage-gray border-stage-gray/40',
    not_captured: 'bg-stage-gray/20 text-stage-gray border-stage-gray/40',
    unclear: 'bg-stage-gray/20 text-stage-gray border-stage-gray/40',
    flagged: 'bg-stage-red/20 text-stage-red border-stage-red/40',
    framed:      'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    drywalled:   'bg-stage-blue/20 text-stage-blue border-stage-blue/40',
    delivered:   'bg-stage-amber/20 text-stage-amber border-stage-amber/40',
  }

  const colorClass = stageColors[stage] ?? 'bg-stage-gray/20 text-stage-gray border-stage-gray/40'

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs font-mono',
    default: 'px-3 py-1.5 text-sm font-mono',
    lg: 'px-4 py-2 text-base font-mono font-medium',
  }

  const SHORT_LABELS = {
    rough_in_complete:  'Rough In ✓',
    rough_in_started:   'Rough In',
    materials_on_site:  'On Site',
    branches_complete:  'Branched',
    pressure_tested:    'Tested',
    duct_installed:     'Installed',
    not_captured:       'Unknown',
    not_started:        'Not Started',
    in_progress:        'In Progress',
    framed:             'Framed',
    drywalled:          'Drywalled',
    delivered:          'Delivered',
  }
  const label = stageLabel ?? SHORT_LABELS[stage] ?? stage?.replace(/_/g, ' ') ?? 'Unknown'

  return (
    <span
      className={`inline-flex items-center rounded-md border ${colorClass} ${sizeClasses[size]} uppercase tracking-wider`}
    >
      {label}
    </span>
  )
}
