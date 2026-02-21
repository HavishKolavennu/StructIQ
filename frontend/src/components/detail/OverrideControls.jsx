const STAGE_OPTIONS = [
  { id: 'not_started', label: 'Not Started' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'placed', label: 'Placed' },
  { id: 'braced', label: 'Braced' },
  { id: 'connected', label: 'Connected' },
  { id: 'inspected', label: 'Inspected' },
  { id: 'complete', label: 'Complete' },
  { id: 'not_captured', label: 'Not Captured' },
]

export default function OverrideControls({ element, overrideValue, onOverride }) {
  const value = overrideValue ?? element?.stage ?? ''
  if (!element) return null
  return (
    <div className="holo-card rounded-xl p-5">
      <label className="block text-sm font-mono text-text-secondary mb-3 uppercase tracking-wider">
        Override stage for {element.name}
      </label>
      <select
        value={value}
        onChange={(e) => onOverride?.(element, e.target.value || null)}
        className="
          w-full rounded-lg border border-accent/20 bg-surface px-4 py-3
          font-mono text-text-primary
          focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none
        "
      >
        <option value="">Use AI assessment</option>
        {STAGE_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
