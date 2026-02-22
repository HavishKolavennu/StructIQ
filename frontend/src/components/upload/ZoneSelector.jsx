export default function ZoneSelector({ value, onChange, disabled }) {
  const zones = [
    { id: 'floor_1', label: 'Floor 1' },
    { id: 'floor_2', label: 'Floor 2' },
    { id: 'floor_3', label: 'Floor 3' },
  ]
  return (
    <div>
      <label htmlFor="zone-select" className="block text-sm font-medium text-text-secondary mb-3 font-mono uppercase tracking-wider">
        Zone
      </label>
      <select
        id="zone-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="
          w-full rounded-xl border border-accent/20 bg-surface px-5 py-3.5
          font-mono text-text-primary
          focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none
          transition-all duration-200
          disabled:opacity-60
        "
      >
        <option value="">Select zone...</option>
        {zones.map((z) => (
          <option key={z.id} value={z.id}>{z.label}</option>
        ))}
      </select>
    </div>
  )
}
