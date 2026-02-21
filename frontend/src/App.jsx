import { useState } from 'react'
import UploadView    from './views/UploadView'
import DashboardView from './views/DashboardView'
import DetailView    from './views/DetailView'
import { MOCK_RESULTS } from './mockData'

/**
 * App — top-level view router.
 *
 * upload → dashboard → detail → back to dashboard
 * All views render against MOCK_RESULTS until Chunk 8 wires real API calls.
 */
export default function App() {
  const [view,       setView]       = useState('upload')
  const [results,    setResults]    = useState(null)
  const [selectedWp, setSelectedWp] = useState(null)

  const handleUploadComplete = () => {
    setResults(MOCK_RESULTS)
    setView('dashboard')
  }

  const handleSelectWorkPackage = (wp) => {
    setSelectedWp(wp)
    setView('detail')
  }

  const handleBackToDashboard = () => {
    setSelectedWp(null)
    setView('dashboard')
  }

  const handleNewUpload = () => {
    setResults(null)
    setSelectedWp(null)
    setView('upload')
  }

  return (
    <>
      {view === 'upload' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <UploadView onComplete={handleUploadComplete} />
        </div>
      )}

      {view === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.25s ease', height: '100vh' }}>
          <DashboardView
            results={results}
            onSelectWorkPackage={handleSelectWorkPackage}
            onNewUpload={handleNewUpload}
          />
        </div>
      )}

      {view === 'detail' && selectedWp && (
        <div style={{ animation: 'slideUp 0.25s ease', height: '100vh' }}>
          <DetailView
            workPackage={selectedWp}
            results={results}
            onBack={handleBackToDashboard}
          />
        </div>
      )}
    </>
  )
}
