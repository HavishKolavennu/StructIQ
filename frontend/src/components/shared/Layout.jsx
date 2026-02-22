/**
 * Futuristic layout with neon accents and grid background.
 */
export default function Layout({ children, zoneLabel, processedAt, showBack, onNewUpload }) {
  return (
    <div className="min-h-screen future-bg flex flex-col">
      <header className="sticky top-0 z-50 border-b border-accent/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-8">
          <div className="flex items-center gap-8">
            {showBack && (
              <button
                type="button"
                onClick={showBack}
                className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-all hover:text-accent hover:bg-accent/5"
                aria-label="Go back"
              >
                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
            )}
            <a href="/" className="flex items-center gap-3 group">
              <span className="font-display text-xl font-bold tracking-wider text-text-primary group-hover:text-accent transition-colors">
                StructIQ
              </span>
              <span className="hidden text-sm text-text-muted sm:inline font-mono">
                / progress intelligence
              </span>
            </a>
          </div>
          <div className="flex items-center gap-8 text-sm">
            {onNewUpload && (
              <button
                type="button"
                onClick={onNewUpload}
                className="text-accent font-medium transition-colors hover:text-accent-dim"
              >
                New upload
              </button>
            )}
            {zoneLabel && (
              <span className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-1.5 font-mono text-accent text-xs">
                {zoneLabel}
              </span>
            )}
            {processedAt && (
              <span className="font-mono text-xs text-text-muted">
                {new Date(processedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
