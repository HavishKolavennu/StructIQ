/**
 * Layout — minimal dark shell with StructIQ header.
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

  // Build breadcrumb: "Floor 3 · Analyzed Feb 21, 5:30 AM"
  const breadcrumb = [
    zoneLabel,
    timestamp ? `Analyzed ${timestamp}` : null,
  ].filter(Boolean).join('  ·  ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0c10' }}>

      {/* ── Header ── */}
      <header style={{
        height:       52,
        flexShrink:   0,
        background:   'rgba(13,15,22,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display:      'flex',
        alignItems:   'center',
        padding:      '0 20px',
        gap:          14,
        zIndex:       100,
      }}>

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="0" y="9"  width="6" height="9"  rx="1.2" fill="#6366F1" />
            <rect x="6" y="5"  width="6" height="13" rx="1.2" fill="#818CF8" />
            <rect x="12" y="0" width="6" height="18" rx="1.2" fill="#A5B4FC" />
          </svg>
          <span style={{
            color:         '#F1F5F9',
            fontWeight:    700,
            fontSize:      15,
            letterSpacing: '-0.3px',
            fontFamily:    'DM Sans, system-ui, sans-serif',
          }}>
            Struct<span style={{ color: '#818CF8' }}>IQ</span>
          </span>
        </div>

        {/* Divider */}
        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 18 }}>|</span>

        {/* Breadcrumb */}
        {breadcrumb && (
          <span style={{
            color:      '#475569',
            fontSize:   12,
            fontFamily: 'DM Sans, system-ui, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}>
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
