import { useState } from 'react'
import UploadView from './components/upload/UploadView'
import DashboardView from './components/dashboard/DashboardView'
import DetailView from './components/detail/DetailView'
import Layout from './components/shared/Layout'
import { MOCK_RESULTS } from './mockData'

export default function App() {
  const [view, setView] = useState('upload')
  const [results, setResults] = useState(null)
  const [selectedWp, setSelectedWp] = useState(null)
  const [selectedElementId, setSelectedElementId] = useState(null)

  const handleUploadComplete = (resultPayload, opts) => {
    setResults(opts?.useDemo ? MOCK_RESULTS : resultPayload)
    setView('dashboard')
  }

  const handleSelectWorkPackage = (wp) => {
    setSelectedElementId(null)
    setSelectedWp(wp)
    setView('detail')
  }

  const handleSelectElement = (elementId) => {
    const workPackages = results?.work_packages ?? []
    for (const wp of workPackages) {
      if (wp.elements?.some(el => el.id === elementId)) {
        setSelectedElementId(elementId)
        setSelectedWp(wp)
        setView('detail')
        return
      }
    }
  }

  const handleBackToDashboard = () => {
    setSelectedWp(null)
    setSelectedElementId(null)
    setView('dashboard')
  }

  const handleNewUpload = () => {
    setResults(null)
    setSelectedWp(null)
    setView('upload')
  }

  if (view === 'upload') {
    return (
      <Layout>
        <UploadView onComplete={handleUploadComplete} />
      </Layout>
    )
  }

  if (view === 'dashboard') {
    return (
      <Layout zoneLabel={results?.zone_label} processedAt={results?.processed_at} onNewUpload={handleNewUpload}>
        <DashboardView
          results={results}
          onSelectWorkPackage={handleSelectWorkPackage}
          onSelectElement={handleSelectElement}
        />
      </Layout>
    )
  }

  return (
    <Layout zoneLabel={results?.zone_label} processedAt={results?.processed_at} showBack={handleBackToDashboard} onNewUpload={handleNewUpload}>
      <DetailView workPackage={selectedWp} initialElementId={selectedElementId} onBack={handleBackToDashboard} />
    </Layout>
  )
}
