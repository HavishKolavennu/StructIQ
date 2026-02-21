import { useMemo, useRef, useState } from 'react'
import Layout from './components/Shared/Layout'
import { mockResults } from './mockData'
import UploadView from './views/UploadView'
import DashboardView from './views/DashboardView'
import DetailView from './views/DetailView'

export default function App() {
  const [currentView, setCurrentView] = useState('upload')
  const [results, setResults] = useState(mockResults)
  const [selectedWorkPackageId, setSelectedWorkPackageId] = useState(mockResults.work_packages[0]?.id || null)
  const scrollRef = useRef(0)

  const selectedWorkPackage = useMemo(
    () => results.work_packages.find((wp) => wp.id === selectedWorkPackageId) || results.work_packages[0],
    [results.work_packages, selectedWorkPackageId]
  )

  function openDetail(workPackageId) {
    scrollRef.current = window.scrollY
    setSelectedWorkPackageId(workPackageId)
    setCurrentView('detail')
  }

  function backToDashboard() {
    setCurrentView('dashboard')
    requestAnimationFrame(() => window.scrollTo({ top: scrollRef.current, behavior: 'auto' }))
  }

  function handleUploadComplete(newResults) {
    setResults(newResults)
    setSelectedWorkPackageId(newResults.work_packages[0]?.id || null)
    setCurrentView('dashboard')
  }

  return (
    <Layout zoneLabel={results.zone_label} processedAt={results.processed_at} summary={results.summary}>
      {currentView === 'upload' && <UploadView onComplete={handleUploadComplete} />}
      {currentView === 'dashboard' && <DashboardView results={results} onOpenDetail={openDetail} />}
      {currentView === 'detail' && selectedWorkPackage && <DetailView workPackage={selectedWorkPackage} onBack={backToDashboard} />}

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <button onClick={() => setCurrentView('upload')} className="rounded border border-border px-2 py-1 text-textSecondary hover:text-textPrimary">UploadView</button>
        <button onClick={() => setCurrentView('dashboard')} className="rounded border border-border px-2 py-1 text-textSecondary hover:text-textPrimary">DashboardView</button>
        <button onClick={() => setCurrentView('detail')} className="rounded border border-border px-2 py-1 text-textSecondary hover:text-textPrimary">DetailView</button>
      </div>
    </Layout>
  )
}
