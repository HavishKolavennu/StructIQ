/**
 * Layout — clean, sticky header for StructIQ.
 * White-dominant, construction amber accent.
 *
 * Props:
 *   zoneLabel   — e.g. "Floor 3"
 *   processedAt — ISO date string
 *   children    — page content
 *   headerRight — JSX for right side of header
 */
export default function Layout({ zoneLabel, processedAt, children, headerRight }) {
  const timestamp = processedAt
    ? new Date(processedAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  const breadcrumb = [
    zoneLabel,
    timestamp ? `Analyzed ${timestamp}` : null,
  ].filter(Boolean).join('  ·  ')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          height: 56,
          flexShrink: 0,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          zIndex: 100,
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="0" y="10" width="7" height="10" rx="1.5" fill="var(--accent)" />
            <rect x="7" y="5" width="6" height="15" rx="1.5" fill="var(--accent-muted)" />
            <rect x="13" y="0" width="7" height="20" rx="1.5" fill="#FDE68A" />
          </svg>
          <span
            style={{
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '-0.02em',
              fontFamily: 'Archivo, DM Sans, system-ui, sans-serif',
            }}
          >
            Struct<span style={{ color: 'var(--accent)' }}>IQ</span>
          </span>
        </div>

        {/* Divider */}
        <span style={{ color: 'var(--border)', fontSize: 14 }}>|</span>

        {/* Breadcrumb */}
        {breadcrumb && (
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: 13,
              fontFamily: 'DM Sans, system-ui, sans-serif',
              fontWeight: 500,
            }}
          >
            {breadcrumb}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {headerRight}
      </header>

      {/* ── Content ── */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}
