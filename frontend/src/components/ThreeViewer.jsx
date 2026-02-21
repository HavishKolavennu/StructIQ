import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { getStageColor } from '../utils/stageColors'
import ElementPopup from './ElementPopup'

// Preload so there's no delay when the component first mounts
useGLTF.preload('/models/reference.glb')

// ---------------------------------------------------------------------------
// Flatten work_packages array → map of element_id → element object
// ---------------------------------------------------------------------------
function buildElementMap(workPackages = []) {
  const map = {}
  for (const wp of workPackages) {
    for (const elem of wp.elements ?? []) {
      map[elem.id] = elem
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// The 3D model — loads GLB, applies stage colors, handles clicks
// ---------------------------------------------------------------------------
function BuildingModel({ elementMap, selectedId, onSelect }) {
  const { scene } = useGLTF('/models/reference.glb')

  // Clone once so we don't mutate the cached scene from useGLTF
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Re-apply materials whenever element data or selection changes
  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (!obj.isMesh) return

      const elem       = elementMap[obj.name]
      const color      = getStageColor(elem?.stage)
      const isSelected = obj.name === selectedId

      obj.material = new THREE.MeshStandardMaterial({
        color:            new THREE.Color(color),
        emissive:         isSelected ? new THREE.Color(color) : new THREE.Color(0, 0, 0),
        emissiveIntensity: isSelected ? 0.28 : 0,
        roughness:        0.65,
        metalness:        0.2,
      })
    })
  }, [clonedScene, elementMap, selectedId])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (e.object?.isMesh && e.object.name) {
      onSelect(e.object.name)
    }
  }, [onSelect])

  return <primitive object={clonedScene} onClick={handleClick} />
}

// ---------------------------------------------------------------------------
// Stage legend overlay (3.6)
// ---------------------------------------------------------------------------
const LEGEND_ITEMS = [
  { color: '#10B981', label: 'Complete / Inspected' },
  { color: '#3B82F6', label: 'In Progress' },
  { color: '#F59E0B', label: 'Delivered' },
  { color: '#EF4444', label: 'Flagged' },
  { color: '#6B7280', label: 'Not Started / Unknown' },
]

function StageLegend() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: 16,
      background: '#1A1D27',
      border: '1px solid #2A2D37',
      borderRadius: 10,
      padding: '10px 14px',
      zIndex: 10,
    }}>
      <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
        Stage Legend
      </div>
      {LEGEND_ITEMS.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------
function LoadingOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#9CA3AF', fontSize: 14,
    }}>
      Loading 3D model…
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * ThreeViewer — 3D reference model viewer.
 *
 * Props:
 *   workPackages    — array from GET /api/results (or mock data).
 *                     Shape: [{ id, name, elements: [{ id, name, type, stage, ... }] }]
 *   onElementSelect — called with element_id when user clicks a mesh or "View Evidence"
 */
export default function ThreeViewer({ workPackages = [], onElementSelect }) {
  const [selectedId, setSelectedId] = useState(null)

  const elementMap = useMemo(() => buildElementMap(workPackages), [workPackages])

  const handleSelect = useCallback((name) => {
    // Toggle off if clicking the same element twice
    setSelectedId(prev => prev === name ? null : name)
    onElementSelect?.(name)
  }, [onElementSelect])

  const selectedElement = selectedId ? elementMap[selectedId] : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0F1117' }}>
      <Canvas
        camera={{ position: [14, 9, 14], fov: 50, near: 0.1, far: 200 }}
        onPointerMissed={() => setSelectedId(null)}
        style={{ background: '#0F1117' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[10, 15, 8]}  intensity={1.3} />
        <directionalLight position={[-6,  6, -6]} intensity={0.4} />

        {/* Model */}
        <Suspense fallback={null}>
          <BuildingModel
            elementMap={elementMap}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </Suspense>

        {/* Camera controls — orbit, zoom, pan */}
        <OrbitControls
          makeDefault
          target={[0, 1.75, 0]}
          minDistance={3}
          maxDistance={60}
        />
      </Canvas>

      {/* Legend */}
      <StageLegend />

      {/* Loading indicator while GLB loads */}
      <Suspense fallback={<LoadingOverlay />} />

      {/* Element popup */}
      {selectedId && selectedElement && (
        <ElementPopup
          element={selectedElement}
          onClose={() => setSelectedId(null)}
          onViewEvidence={() => onElementSelect?.(selectedId)}
        />
      )}

      {/* "Click an element" hint when nothing selected */}
      {!selectedId && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1A1D27',
          border: '1px solid #2A2D37',
          borderRadius: 8,
          padding: '6px 14px',
          color: '#9CA3AF',
          fontSize: 13,
          pointerEvents: 'none',
        }}>
          Click any element to inspect
        </div>
      )}
    </div>
  )
}
