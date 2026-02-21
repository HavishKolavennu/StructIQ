export default function Layout({ children, zoneLabel, processedAt, summary }) {
  return (
    <div className="mx-auto min-h-screen max-w-[1400px] p-4 md:p-6 lg:p-8 text-textPrimary">
      <header className="mb-5 rounded-xl border border-border bg-surface/80 px-4 py-3 shadow-panel backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">StructIQ</h1>
            <p className="text-sm text-textSecondary">Construction progress intelligence</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-textSecondary">
            <span>Zone: {zoneLabel || '-'}</span>
            <span>Updated: {processedAt ? new Date(processedAt).toLocaleString() : '-'}</span>
            <span>Total WPs: {summary?.total_work_packages ?? '-'}</span>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
