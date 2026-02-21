/**
 * Mock results object matching GET /api/results/{job_id} contract.
 * Import this anywhere during development — swap for real API calls in Chunk 8.
 *
 * Shape mirrors backend/pipeline/analyzer.py → _assemble_results()
 */

export const MOCK_RESULTS = {
  job_id: 'demo_job_001',
  zone_id: 'floor_3',
  zone_label: 'Floor 3',
  processed_at: '2026-02-21T10:30:00.000Z',
  summary: {
    total_work_packages: 4,
    total_elements: 14,
    stages_breakdown: {
      complete:      3,
      in_progress:   6,
      not_started:   1,
      not_captured:  3,
      inspected:     1,
    },
    failed_frames: [],
  },
  selection_metadata: {
    selected_count: 18,
    failed_frame_count: 0,
  },

  work_packages: [
    // ─── Beam Layout ────────────────────────────────────────────────────────────
    {
      id: 'wp_beam_layout',
      name: 'Beam Layout',
      zone: 'floor_3',
      owner: "Joe's Structural LLC",
      overall_stage: 'placed',
      elements: [
        {
          id: 'beam_central_1',
          name: 'Central Beam',
          type: 'beam',
          stage: 'connected',
          stage_label: 'Connected — permanent connections made',
          confidence: 'high',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_004',
              frame_path: '/api/frames/demo_job_001/frame_004',
              vlm_observation: 'Steel beam visible across columns C2–C4. Bolt heads clearly visible at both connection points. No temporary bracing present.',
              vlm_stage_assessment: 'connected',
            },
            {
              frame_id: 'frame_012',
              frame_path: '/api/frames/demo_job_001/frame_012',
              vlm_observation: 'Wide-angle confirms central beam fully seated and bolted. Inspection chalk mark visible on east connection flange.',
              vlm_stage_assessment: 'connected',
            },
            {
              frame_id: 'frame_017',
              frame_path: '/api/frames/demo_job_001/frame_017',
              vlm_observation: 'Close-up of beam midspan — no visible deflection or misalignment. Welded stiffener plates visible at 1/3 points.',
              vlm_stage_assessment: 'connected',
            },
          ],
        },
        {
          id: 'beam_left_1',
          name: 'Left Beam',
          type: 'beam',
          stage: 'placed',
          stage_label: 'Placed — in position, not yet connected',
          confidence: 'medium',
          conflicting: true,
          frame_evidence: [
            {
              frame_id: 'frame_006',
              frame_path: '/api/frames/demo_job_001/frame_006',
              vlm_observation: 'Left beam resting on column caps. Temporary timber shoring visible underneath west end. No bolt holes yet aligned.',
              vlm_stage_assessment: 'placed',
            },
            {
              frame_id: 'frame_014',
              frame_path: '/api/frames/demo_job_001/frame_014',
              vlm_observation: 'Beam in position but workers appear to be inserting bolts. Partial connection visible at east column — may be early "connected" stage.',
              vlm_stage_assessment: 'braced',
            },
          ],
        },
        {
          id: 'beam_right_1',
          name: 'Right Beam',
          type: 'beam',
          stage: 'not_captured',
          stage_label: 'Not visible in uploaded footage',
          confidence: 'none',
          conflicting: false,
          frame_evidence: [],
        },
      ],
    },

    // ─── Plumbing Rough-In ───────────────────────────────────────────────────────
    {
      id: 'wp_plumbing_roughin',
      name: 'Plumbing Rough-In',
      zone: 'floor_3',
      owner: 'Allied Mechanical',
      overall_stage: 'rough_in_started',
      elements: [
        {
          id: 'pipe_main_supply',
          name: 'Main Supply Line',
          type: 'pipe',
          stage: 'complete',
          stage_label: 'Complete',
          confidence: 'high',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_001',
              frame_path: '/api/frames/demo_job_001/frame_001',
              vlm_observation: 'Main 4" copper supply line fully hung with rigid hangers at 48" intervals. All joints soldered. Pressure test cap removed — system live.',
              vlm_stage_assessment: 'complete',
            },
            {
              frame_id: 'frame_008',
              frame_path: '/api/frames/demo_job_001/frame_008',
              vlm_observation: 'Downstream fixtures connected. Inspection sticker (green) visible on service valve. Line fully insulated.',
              vlm_stage_assessment: 'complete',
            },
            {
              frame_id: 'frame_015',
              frame_path: '/api/frames/demo_job_001/frame_015',
              vlm_observation: 'Full run visible. All hangers tight, no sag. Fire-rated sleeve through rated wall assembly visible and sealed.',
              vlm_stage_assessment: 'complete',
            },
          ],
        },
        {
          id: 'pipe_branch_1',
          name: 'Branch Line 1',
          type: 'pipe',
          stage: 'rough_in_started',
          stage_label: 'Rough-In Started',
          confidence: 'medium',
          conflicting: true,
          frame_evidence: [
            {
              frame_id: 'frame_003',
              frame_path: '/api/frames/demo_job_001/frame_003',
              vlm_observation: 'Two pipe segments hung on east wall. Hangers installed but branch run is clearly incomplete — open pipe end visible at column.',
              vlm_stage_assessment: 'rough_in_started',
            },
            {
              frame_id: 'frame_009',
              frame_path: '/api/frames/demo_job_001/frame_009',
              vlm_observation: 'Additional section visible at far end. Worker installing hanger. Appears closer to rough_in_complete but final elbow not yet connected.',
              vlm_stage_assessment: 'rough_in_complete',
            },
          ],
        },
        {
          id: 'pipe_branch_2',
          name: 'Branch Line 2',
          type: 'pipe',
          stage: 'materials_on_site',
          stage_label: 'Materials On Site',
          confidence: 'low',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_006',
              frame_path: '/api/frames/demo_job_001/frame_006',
              vlm_observation: 'Pipe sections stacked on floor near south wall. No hangers installed. Fittings in labelled boxes beside the material.',
              vlm_stage_assessment: 'materials_on_site',
            },
          ],
        },
        {
          id: 'pipe_drain_stack',
          name: 'Drain Stack',
          type: 'pipe',
          stage: 'inspected',
          stage_label: 'Inspected — inspection passed',
          confidence: 'high',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_002',
              frame_path: '/api/frames/demo_job_001/frame_002',
              vlm_observation: '4" PVC drain stack with green inspection sticker attached at eye level. Stack penetrates floor slab through fire-rated sleeve.',
              vlm_stage_assessment: 'inspected',
            },
            {
              frame_id: 'frame_011',
              frame_path: '/api/frames/demo_job_001/frame_011',
              vlm_observation: 'Drain stack cleanout plug visible and capped. Stack plumb within 1/4". Inspection documentation attached to pipe with cable tie.',
              vlm_stage_assessment: 'inspected',
            },
          ],
        },
      ],
    },

    // ─── HVAC Ductwork ───────────────────────────────────────────────────────────
    {
      id: 'wp_hvac_main',
      name: 'HVAC Ductwork',
      zone: 'floor_3',
      owner: 'CoolAir Systems',
      overall_stage: 'duct_installed',
      elements: [
        {
          id: 'duct_hvac_main',
          name: 'Main Trunk Duct',
          type: 'duct',
          stage: 'duct_installed',
          stage_label: 'Duct Installed',
          confidence: 'high',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_005',
              frame_path: '/api/frames/demo_job_001/frame_005',
              vlm_observation: '20x12 rectangular main trunk duct suspended at ceiling. All seams taped. Hangers at 48" intervals. AHU connection visible at north end.',
              vlm_stage_assessment: 'duct_installed',
            },
            {
              frame_id: 'frame_013',
              frame_path: '/api/frames/demo_job_001/frame_013',
              vlm_observation: 'Full length of main trunk visible. Branch take-offs cut and collars installed. Duct liner exposed at one open branch stub.',
              vlm_stage_assessment: 'duct_installed',
            },
          ],
        },
        {
          id: 'duct_branch_north',
          name: 'North Branch',
          type: 'duct',
          stage: 'not_started',
          stage_label: 'Not Started',
          confidence: 'none',
          conflicting: false,
          frame_evidence: [],
        },
        {
          id: 'duct_branch_south',
          name: 'South Branch',
          type: 'duct',
          stage: 'materials_on_site',
          stage_label: 'Materials On Site',
          confidence: 'low',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_007',
              frame_path: '/api/frames/demo_job_001/frame_007',
              vlm_observation: 'Spiral duct sections leaning against south wall near intended installation zone. Flex connectors and volume dampers in boxes.',
              vlm_stage_assessment: 'materials_on_site',
            },
          ],
        },
      ],
    },

    // ─── Wall Finishes ───────────────────────────────────────────────────────────
    {
      id: 'wp_wall_finishes',
      name: 'Wall Finishes',
      zone: 'floor_3',
      owner: 'Interior Build Co',
      overall_stage: 'framed',
      elements: [
        {
          id: 'wall_north',
          name: 'North Wall',
          type: 'wall',
          stage: 'drywalled',
          stage_label: 'Drywalled',
          confidence: 'high',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_010',
              frame_path: '/api/frames/demo_job_001/frame_010',
              vlm_observation: 'Full 5/8" Type X drywall attached to metal studs. Raw board visible, seams not yet taped. Electrical outlet boxes cut in.',
              vlm_stage_assessment: 'drywalled',
            },
          ],
        },
        {
          id: 'wall_south',
          name: 'South Wall',
          type: 'wall',
          stage: 'complete',
          stage_label: 'Complete',
          confidence: 'high',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_016',
              frame_path: '/api/frames/demo_job_001/frame_016',
              vlm_observation: 'South wall fully painted (two coats, white). Trim installed at base and ceiling. Outlets and switches faceplate-finished.',
              vlm_stage_assessment: 'complete',
            },
            {
              frame_id: 'frame_018',
              frame_path: '/api/frames/demo_job_001/frame_018',
              vlm_observation: 'Clean finished wall surface. No blemishes. Corner bead pristine. Final walk-through signage on wall.',
              vlm_stage_assessment: 'complete',
            },
          ],
        },
        {
          id: 'wall_east',
          name: 'East Wall',
          type: 'wall',
          stage: 'framed',
          stage_label: 'Framed',
          confidence: 'high',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_020',
              frame_path: '/api/frames/demo_job_001/frame_020',
              vlm_observation: 'Metal stud framing complete on east wall. 3-5/8" studs at 16" o.c. Top and bottom track fastened. No insulation or sheathing yet.',
              vlm_stage_assessment: 'framed',
            },
          ],
        },
        {
          id: 'wall_west',
          name: 'West Wall',
          type: 'wall',
          stage: 'not_captured',
          stage_label: 'Not visible in uploaded footage',
          confidence: 'none',
          conflicting: false,
          frame_evidence: [],
        },
      ],
    },
  ],
}

/** Mock job status responses — used by ProcessingStatus component */
export const MOCK_STATUS_STEPS = [
  { step: 'uploading',          label: 'Uploading video...',              progress: 10 },
  { step: 'frame_extraction',   label: 'Extracting frames...',            progress: 25 },
  { step: 'frame_selection',    label: 'Selecting key frames...',         progress: 45 },
  { step: 'vlm_analysis',       label: 'Running AI analysis on frames...', progress: 70 },
  { step: 'assembling_results', label: 'Assembling results...',           progress: 90 },
  { step: 'complete',           label: 'Analysis complete!',              progress: 100 },
]
