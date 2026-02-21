export default function ConfidenceIndicator({ confidence }) {
  const config = {
    high: { label: 'High', className: 'text-stage-green', dot: 'bg-stage-green shadow-[0_0_8px_rgba(0,230,118,0.5)]' },
    medium: { label: 'Medium', className: 'text-stage-amber', dot: 'bg-stage-amber' },
    low: { label: 'Low', className: 'text-stage-amber', dot: 'bg-stage-amber' },
    none: { label: 'None', className: 'text-stage-gray', dot: 'bg-stage-gray' },
  }
  const { label, className, dot } = config[confidence] ?? config.none
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-mono ${className}`} title={`Confidence: ${label}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span>{label}</span>
    </span>
  )
}
