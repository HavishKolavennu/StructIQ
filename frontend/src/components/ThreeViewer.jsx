import { Suspense, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { getStageColor } from '../utils/stageColors'
import ElementPopup from './ElementPopup'

useGLTF.preload('/models/reference.glb')

// ---------------------------------------------------------------------------
// Flatten work_packages → element_id → element object
// Also map "name_mesh" → element for Blender export edge case
// ---------------------------------------------------------------------------
function buildElementMap(workPackages = []) {
  const map = {}
  for (const wp of workPackages) {
    for (const elem of wp.elements ?? []) {
      map[elem.id] = elem
      // Blender sometimes suffixes mesh data names with _mesh
      map[`${elem.id}_mesh`] = elem
    }
  }
  return map
}

// Normalise a node name to its element id (strips _mesh suffix if present)
function normaliseId(name = '') {
  return name.endsWith('_mesh') ? name.slice(0, -5) : name
}

// ---------------------------------------------------------------------------
// 3D model — loads GLB, applies stage colours, handles clicks
// ---------------------------------------------------------------------------
function BuildingModel({ elementMap, selectedId, onSelect }) {
  const { scene } = useGLTF('/models/reference.glb')

  // Clone once so we never mutate the cached scene
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Re-apply materials whenever element data or selection changes.
  // IMPORTANT: only dispose materials WE created (tagged .userData.sq = true).
  // Original GLB materials are shared with the useGLTF cache — disposing them
  // would corrupt the cache and turn every mesh black.
  useEffect(() => {
    const toDispose = []

    clonedScene.traverse((obj) => {
      if (!obj.isMesh) return

      // Dispose only our previously-created materials
      if (obj.material?.userData?.sq) toDispose.push(obj.material)

      const normId     = normaliseId(obj.name)
      const elem       = elementMap[normId] ?? elementMap[obj.name]
      const isSelected = normId === selectedId || obj.name === selectedId

      // ── Classify this mesh ──────────────────────────────────────────────
      const isWall = normId.startsWith('wall_')
      const isBackground = normId.startsWith('floor_') || normId.startsWith('column_')

      // Light theme: floor/columns use warm gray; walls + tracked elements use stage color
      const color = isBackground ? '#B8B2A8' : getStageColor(elem?.stage)

      // ── Build material ──────────────────────────────────────────────────
      let opacity     = 1.0
      let transparent = false
      let depthWrite  = true
      let side        = THREE.FrontSide
      let emissiveInt = isSelected ? 0.5 : 0
      let roughness   = 0.5
      let metalness   = 0.2

      if (isBackground) {
        // Light theme: subtle warm gray floor/columns
        opacity     = 0.15
        transparent = true
        depthWrite  = false
        side        = THREE.DoubleSide
        emissiveInt = 0
      } else if (isWall) {
        // Light theme: ghost walls — warm gray, low opacity
        opacity     = 0.22
        transparent = true
        depthWrite  = false
        side        = THREE.DoubleSide
        emissiveInt = isSelected ? 0.2 : 0.02
        roughness   = 0.8
        metalness   = 0.0
      } else {
        // Interior tracked elements — fully opaque, bright, clearly readable
        // Boost emissive so stage colour is vivid even in shadowed areas
        emissiveInt = isSelected ? 0.55 : 0.28
        roughness   = 0.45
        metalness   = 0.15
      }

      const mat = new THREE.MeshStandardMaterial({
        color:             new THREE.Color(color),
        emissive:          new THREE.Color(color),
        emissiveIntensity: emissiveInt,
        roughness,
        metalness,
        transparent,
        opacity,
        depthWrite,
        side,
      })
      mat.userData.sq = true
      obj.material = mat
    })

    return () => toDispose.forEach(m => m.dispose())
  }, [clonedScene, elementMap, selectedId])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    const mesh = e.object
    if (mesh?.isMesh && mesh.name) {
      // Normalise in case of _mesh suffix
      onSelect(normaliseId(mesh.name))
    }
  }, [onSelect])

  return <primitive object={clonedScene} onClick={handleClick} />
}

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------
function LoadingOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 12,
      color: 'var(--text-muted)',
      fontSize: 13,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{
        width: 28, height: 28,
        border: '2px solid rgba(245,158,11,0.25)',
        borderTopColor: '#F59E0B',
        borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }} />
      Loading 3D model…
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ThreeViewer component
//
// Props:
//   workPackages    — array from GET /api/results (or mock data)
//   onElementSelect — called with element_id ONLY when user clicks "View Evidence"
//                     (NOT on every mesh click — that just shows the popup)
//   showLegend      — whether to render the internal legend overlay (default false,
//                     since DashboardView provides its own ViewerLegend)
// ---------------------------------------------------------------------------
export default function ThreeViewer({ workPackages = [], onElementSelect, showLegend = false }) {
  const [selectedId, setSelectedId] = useState(null)
  const orbitRef = useRef()

  const elementMap = useMemo(() => buildElementMap(workPackages), [workPackages])

  // Mesh click: show the popup only. Do NOT call onElementSelect here.
  // onElementSelect is reserved for "View Evidence" (explicit navigation intent).
  const handleMeshClick = useCallback((id) => {
    setSelectedId(prev => prev === id ? null : id)
  }, [])

  // "View Evidence" in the popup: close popup then navigate
  const handleViewEvidence = useCallback(() => {
    if (selectedId) {
      onElementSelect?.(selectedId)
      setSelectedId(null)
    }
  }, [selectedId, onElementSelect])

  const selectedElement = selectedId ? (elementMap[selectedId] ?? elementMap[`${selectedId}_mesh`]) : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg-subtle)' }}>
      <Canvas
        camera={{ position: [14, 9, 14], fov: 48, near: 0.1, far: 200 }}
        onPointerMissed={() => setSelectedId(null)}
        style={{ background: 'transparent' }}
        gl={{ alpha: false }}
      >
        {/* Scene background — cream to match light theme */}
        <color attach="background" args={['#F5F2EB']} />
        {/* ── Lighting ────────────────────────────────────────────────────
            Brighter ambient for light theme; point + directionals for depth. */}
        <ambientLight intensity={1.4} />

        {/* Interior point light — sits in the middle of the bay at mid-height
            so beams / pipes / ducts glowing from inside the wall envelope */}
        <pointLight position={[0, 2.5, 0]} intensity={3.0} distance={20} decay={1.5} />

        {/* Rim lights from four horizontal directions */}
        <directionalLight position={[ 12,  8,  8]} intensity={0.9} />
        <directionalLight position={[-12,  8, -8]} intensity={0.7} />
        <directionalLight position={[  0,  8, 14]} intensity={0.6} />
        <directionalLight position={[  0,  8,-14]} intensity={0.6} />

        {/* Top-down + bottom-up fill so no face goes pitch black */}
        <directionalLight position={[0,  20, 0]} intensity={0.5} />
        <directionalLight position={[0, -10, 0]} intensity={0.4} />

        {/* Model */}
        <Suspense fallback={null}>
          <BuildingModel
            elementMap={elementMap}
            selectedId={selectedId}
            onSelect={handleMeshClick}
          />
        </Suspense>

        {/* Camera controls */}
        <OrbitControls
          ref={orbitRef}
          makeDefault
          target={[0, 1.75, 0]}
          minDistance={3}
          maxDistance={60}
          autoRotate={!selectedId}
          autoRotateSpeed={0.4}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {/* GLB loading spinner */}
      <Suspense fallback={<LoadingOverlay />} />

      {/* Hint when nothing is selected */}
      {!selectedId && (
        <div style={{
          position:      'absolute',
          top:           12,
          left:          '50%',
          transform:     'translateX(-50%)',
          background:    'rgba(255,253,249,0.95)',
          backdropFilter:'blur(8px)',
          border:        '1px solid var(--border)',
          borderRadius:  8,
          padding:       '6px 16px',
          color:         'var(--text-muted)',
          fontSize:      11,
          fontWeight:    500,
          fontFamily:    'DM Sans, sans-serif',
          whiteSpace:    'nowrap',
          pointerEvents: 'none',
          letterSpacing: '0.01em',
          boxShadow:     '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          Click an element to inspect
        </div>
      )}

      {/* Element popup — appears on mesh click, disappears on close or View Evidence */}
      {selectedId && selectedElement && (
        <ElementPopup
          element={selectedElement}
          onClose={() => setSelectedId(null)}
          onViewEvidence={handleViewEvidence}
        />
      )}

      {/* Optional internal legend (hidden when DashboardView provides its own) */}
      {showLegend && <InternalLegend />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internal legend (only used when showLegend=true)
// ---------------------------------------------------------------------------
const LEGEND_ITEMS = [
  { color: '#10B981', label: 'Complete / Inspected' },
  { color: '#3B82F6', label: 'In Progress'          },
  { color: '#F59E0B', label: 'Delivered / On Site'  },
  { color: '#4B5563', label: 'Not Started / Unknown' },
  { color: '#EF4444', label: 'Flagged'              },
]

function InternalLegend() {
  return (
    <div style={{
      position:       'absolute',
      bottom:         12, left: 12,
      background:     'rgba(255,253,249,0.95)',
      backdropFilter: 'blur(10px)',
      border:         '1px solid var(--border)',
      borderRadius:   10,
      padding:        '12px 16px',
      zIndex:         10,
      boxShadow:      '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        color:         'var(--text-muted)',
        fontSize:      10,
        fontWeight:    700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom:  8,
      }}>
        Stage Legend
      </div>
      {LEGEND_ITEMS.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
