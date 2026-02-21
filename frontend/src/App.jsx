import ThreeViewer from './components/ThreeViewer'

/**
 * Demo wrapper for Chunk 3 validation.
 * Uses mock analysis data that covers all stage colors so we can verify the viewer.
 * Will be replaced by the real dashboard layout in Chunk 5.
 */
const MOCK_WORK_PACKAGES = [
  {
    id: 'wp_beam_layout',
    name: 'Beam Layout',
    owner: "Joe's Structural LLC",
    elements: [
      {
        id: 'beam_central_1', name: 'Central Beam', type: 'beam',
        stage: 'connected', stage_label: 'Connected — bolted at both ends',
        confidence: 'high', conflicting: false,
        frame_evidence: [{ frame_id: 'frame_004' }, { frame_id: 'frame_012' }],
      },
      {
        id: 'beam_left_1', name: 'Left Beam', type: 'beam',
        stage: 'placed', stage_label: 'Placed — in position, not yet connected',
        confidence: 'medium', conflicting: false,
        frame_evidence: [{ frame_id: 'frame_017' }],
      },
      {
        id: 'beam_right_1', name: 'Right Beam', type: 'beam',
        stage: 'not_captured', stage_label: 'Not visible in uploaded footage',
        confidence: 'none', conflicting: false,
        frame_evidence: [],
      },
    ],
  },
  {
    id: 'wp_plumbing_roughin',
    name: 'Plumbing Rough-In',
    owner: 'Allied Mechanical',
    elements: [
      {
        id: 'pipe_main_supply', name: 'Main Supply Line', type: 'pipe',
        stage: 'complete', stage_label: 'Complete',
        confidence: 'high', conflicting: false,
        frame_evidence: [{ frame_id: 'frame_001' }, { frame_id: 'frame_008' }, { frame_id: 'frame_015' }],
      },
      {
        id: 'pipe_branch_1', name: 'Branch Line 1', type: 'pipe',
        stage: 'rough_in_started', stage_label: 'Rough-In Started',
        confidence: 'medium', conflicting: true,
        frame_evidence: [{ frame_id: 'frame_003' }, { frame_id: 'frame_009' }],
      },
      {
        id: 'pipe_branch_2', name: 'Branch Line 2', type: 'pipe',
        stage: 'materials_on_site', stage_label: 'Materials On Site',
        confidence: 'low', conflicting: false,
        frame_evidence: [{ frame_id: 'frame_006' }],
      },
      {
        id: 'pipe_drain_stack', name: 'Drain Stack', type: 'pipe',
        stage: 'inspected', stage_label: 'Inspected',
        confidence: 'high', conflicting: false,
        frame_evidence: [{ frame_id: 'frame_002' }, { frame_id: 'frame_011' }],
      },
    ],
  },
  {
    id: 'wp_hvac_main',
    name: 'HVAC Ductwork',
    owner: 'CoolAir Systems',
    elements: [
      {
        id: 'duct_hvac_main', name: 'Main Trunk Duct', type: 'duct',
        stage: 'duct_installed', stage_label: 'Duct Installed',
        confidence: 'high', conflicting: false,
        frame_evidence: [{ frame_id: 'frame_005' }, { frame_id: 'frame_013' }],
      },
      {
        id: 'duct_branch_north', name: 'North Branch', type: 'duct',
        stage: 'not_started', stage_label: 'Not Started',
        confidence: 'none', conflicting: false,
        frame_evidence: [],
      },
      {
        id: 'duct_branch_south', name: 'South Branch', type: 'duct',
        stage: 'delivered', stage_label: 'Materials On Site',
        confidence: 'low', conflicting: false,
        frame_evidence: [{ frame_id: 'frame_007' }],
      },
    ],
  },
]

export default function App() {
  const handleElementSelect = (elementId) => {
    console.log('Selected element:', elementId)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0F1117' }}>
      {/* Header bar */}
      <div style={{
        height: 48,
        background: '#1A1D27',
        borderBottom: '1px solid #2A2D37',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
      }}>
        <span style={{ color: '#6366F1', fontWeight: 700, fontSize: 16 }}>StructIQ</span>
        <span style={{ color: '#2A2D37' }}>|</span>
        <span style={{ color: '#9CA3AF', fontSize: 14 }}>Floor 3 — 3D Viewer (Chunk 3 Demo)</span>
      </div>

      {/* Viewer takes remaining height */}
      <div style={{ height: 'calc(100vh - 48px)' }}>
        <ThreeViewer
          workPackages={MOCK_WORK_PACKAGES}
          onElementSelect={handleElementSelect}
        />
      </div>
    </div>
  )
}
