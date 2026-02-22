import { useState } from 'react'
import StageBadge from '../shared/StageBadge'
import ConfidenceIndicator from '../shared/ConfidenceIndicator'
import ElementRow from '../detail/ElementRow'

const TRADE_COLORS = {
  'Structural':         'text-amber-700  bg-amber-50   border-amber-200',
  'Plumbing':           'text-blue-700   bg-blue-50    border-blue-200',
  'HVAC':               'text-cyan-700   bg-cyan-50    border-cyan-200',
  'MEP Coordination':   'text-purple-700 bg-purple-50  border-purple-200',
  'MEP':                'text-purple-700 bg-purple-50  border-purple-200',
  'Quality Control':    'text-green-700  bg-green-50   border-green-200',
  'Finishes':           'text-rose-700   bg-rose-50    border-rose-200',
  'General Conditions': 'text-gray-600   bg-gray-50    border-gray-200',
}

export default function WeeklyScheduleView({ workPackages, onSelectWorkPackage }) {
  const [selectedWeek, setSelectedWeek] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  // Group by week
  const byWeek = workPackages.reduce((acc, wp) => {
    const w = wp.week ?? 1
    if (!acc[w]) acc[w] = []
    acc[w].push(wp)
    return acc
  }, {})

  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b)
  const visibleWeeks = selectedWeek === 'all' ? weeks : [Number(selectedWeek)]

  return (
    <div>
      {/* Week filter */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-xs font-mono text-text-muted uppercase tracking-widest">Jump to</span>
        <select
          value={selectedWeek}
          onChange={e => { setSelectedWeek(e.target.value); setExpandedId(null) }}
          className="rounded-lg border border-accent/20 bg-surface px-3 py-1.5 text-sm font-mono text-text-secondary
            focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
        >
          <option value="all">All Weeks</option>
          {weeks.map(w => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      </div>

      {/* Weekly sections */}
      <div className="space-y-10">
        {visibleWeeks.map(week => (
          <section key={week}>
            <h3 className="text-xs font-mono text-accent/80 uppercase tracking-widest mb-4">
              Week {week}
            </h3>
            <div className="space-y-3">
              {byWeek[week].map((wp, i) => (
                <WeeklyTaskCard
                  key={wp.id}
                  workPackage={wp}
                  isExpanded={expandedId === wp.id}
                  onToggle={() => setExpandedId(expandedId === wp.id ? null : wp.id)}
                  onOpenDetail={() => onSelectWorkPackage(wp)}
                  animationDelay={i * 0.05}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function WeeklyTaskCard({ workPackage, isExpanded, onToggle, onOpenDetail, animationDelay }) {
  const [selectedElement, setSelectedElement] = useState(workPackage.elements?.[0] ?? null)
  const tradeClass = TRADE_COLORS[workPackage.trade_category] ?? 'text-gray-600 bg-gray-50 border-gray-200'

  return (
    <div
      style={{ animationDelay: `${animationDelay}s` }}
      className={`
        rounded-xl transition-all duration-200 animate-slide-up opacity-0 [animation-fill-mode:forwards]
        ${isExpanded ? 'ring-1 ring-accent/30 shadow-card-hover' : ''}
        holo-card
      `}
    >
      {/* ── Collapsed header — always visible ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-3 focus:outline-none"
      >
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-text-primary tracking-wide truncate">
            {workPackage.name}
          </div>
          {workPackage.description && (
            <div className="text-xs text-text-muted mt-0.5 font-mono truncate">
              {workPackage.description}
            </div>
          )}
        </div>

        {/* Trade chip */}
        {workPackage.trade_category && (
          <span className={`hidden sm:inline-flex flex-shrink-0 text-xs font-mono px-2 py-0.5 rounded border ${tradeClass}`}>
            {workPackage.trade_category}
          </span>
        )}

        {/* Stage badge */}
        <StageBadge stage={workPackage.overall_stage} size="sm" />
      </button>

      {/* ── Expanded detail ── */}
      {isExpanded && (
        <div className="border-t border-accent/10 px-5 pb-5 pt-4 space-y-5">

          {/* Trade + owner row */}
          <div className="flex items-center gap-3 flex-wrap">
            {workPackage.trade_category && (
              <span className={`text-xs font-mono px-2.5 py-1 rounded-md border ${tradeClass}`}>
                {workPackage.trade_category}
              </span>
            )}
            <span className="text-xs text-text-muted font-mono">{workPackage.owner}</span>
          </div>

          {workPackage.elements?.length > 0 ? (
            <>
              {/* Elements list */}
              <div>
                <h4 className="text-xs font-mono text-accent/70 uppercase tracking-widest mb-3">Elements</h4>
                <div className="space-y-2">
                  {workPackage.elements.map(el => (
                    <ElementRow
                      key={el.id}
                      element={el}
                      isSelected={selectedElement?.id === el.id}
                      onSelect={setSelectedElement}
                    />
                  ))}
                </div>
              </div>

              {/* Frame evidence for selected element */}
              {selectedElement && (
                <div>
                  <h4 className="text-xs font-mono text-accent/70 uppercase tracking-widest mb-3">
                    Frame Evidence
                    <span className="ml-1.5 normal-case text-text-primary font-sans font-medium">
                      — {selectedElement.name}
                    </span>
                  </h4>

                  {selectedElement.frame_evidence?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedElement.frame_evidence.map(f => (
                        <div
                          key={f.frame_id}
                          className="rounded-lg bg-surface border border-accent/10 px-4 py-3"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-mono text-text-muted">{f.frame_id}</span>
                            <span className="text-xs font-mono text-accent/70 uppercase tracking-wider">
                              {f.vlm_stage_assessment?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">{f.vlm_observation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted font-mono italic">
                      No frame evidence captured for this element.
                    </p>
                  )}
                </div>
              )}

              {/* Open full detail */}
              <button
                type="button"
                onClick={onOpenDetail}
                className="text-xs font-mono text-accent hover:text-accent/70 transition-colors"
              >
                Open full detail view →
              </button>
            </>
          ) : (
            <p className="text-sm text-text-muted font-mono">No elements captured yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
