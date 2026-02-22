/**
 * Mock results object matching GET /api/results/{job_id} contract.
 * Structured as a 10-week schedule for Floor 3.
 */

export const MOCK_RESULTS = {
  job_id: 'demo_job_001',
  zone_id: 'floor_3',
  zone_label: 'Floor 3',
  detected_zones: ['Floor 3 - Bay A', 'Floor 3 - Bay B'],
  processed_at: '2026-02-21T10:30:00.000Z',
  summary: {
    total_work_packages: 17,
    total_elements: 32,
    stages_breakdown: {
      complete:          3,
      inspected:         1,
      in_progress:       3,
      materials_on_site: 4,
      rough_in_started:  1,
      duct_installed:    1,
      placed:            1,
      connected:         1,
      framed:            1,
      drywalled:         1,
      not_started:       11,
      not_captured:      2,
      flagged:           0,
    },
    failed_frames: [],
  },
  selection_metadata: { selected_count: 18, failed_frame_count: 0 },

  work_packages: [

    // ── Week 1 ──────────────────────────────────────────────────────────────────
    {
      id: 'wp_material_delivery',
      week: 1,
      name: 'Material Delivery – Structural Steel',
      description: 'Deliver beams and structural materials to Floor 3 staging area',
      trade_category: 'Structural',
      zone: 'floor_3',
      owner: "Joe's Structural LLC",
      overall_stage: 'materials_on_site',
      elements: [
        {
          id: 'steel_beams_w12',
          name: 'Steel Beams (W12×26)',
          type: 'material',
          stage: 'materials_on_site',
          stage_label: 'Materials On Site',
          confidence: 'high',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_004',
              frame_path: '/api/frames/demo_job_001/frame_004',
              vlm_observation: 'Bundled W12×26 beams visible in Floor 3 staging area. Delivery tags attached. No damage observed.',
              vlm_stage_assessment: 'materials_on_site',
            },
          ],
        },
        {
          id: 'anchor_bolt_sets',
          name: 'Anchor Bolt Hardware',
          type: 'material',
          stage: 'materials_on_site',
          stage_label: 'Materials On Site',
          confidence: 'high',
          conflicting: false,
          frame_evidence: [],
        },
      ],
    },
    {
      id: 'wp_layout_verification',
      week: 1,
      name: 'Layout Verification',
      description: 'Verify beam layout and anchor points per BIM model',
      trade_category: 'Structural',
      zone: 'floor_3',
      owner: "Joe's Structural LLC",
      overall_stage: 'in_progress',
      elements: [
        {
          id: 'anchor_point_c2',
          name: 'Anchor Point C2',
          type: 'anchor',
          stage: 'in_progress',
          stage_label: 'In Progress',
          confidence: 'medium',
          conflicting: false,
          frame_evidence: [
            {
              frame_id: 'frame_007',
              frame_path: '/api/frames/demo_job_001/frame_007',
              vlm_observation: 'Surveyor visible at column C2. Layout marks on slab. Measurements in progress.',
              vlm_stage_assessment: 'in_progress',
            },
          ],
        },
        {
          id: 'anchor_point_c4',
          name: 'Anchor Point C4',
          type: 'anchor',
          stage: 'not_started',
          stage_label: 'Not Started',
          confidence: 'none',
          conflicting: false,
          frame_evidence: [],
        },
      ],
    },

    // ── Week 2 ──────────────────────────────────────────────────────────────────
    {
      id: 'wp_beam_placement',
      week: 2,
      name: 'Beam Placement',
      description: 'Install primary structural beams for Floor 3',
      trade_category: 'Structural',
      zone: 'floor_3',
      owner: "Joe's Structural LLC",
      overall_stage: 'in_progress',
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
    {
      id: 'wp_beam_connection',
      week: 2,
      name: 'Beam Connection & Welding',
      description: 'Bolt/weld beam connections and secure framing',
      trade_category: 'Structural',
      zone: 'floor_3',
      owner: "Joe's Structural LLC",
      overall_stage: 'not_started',
      elements: [
        { id: 'conn_central', name: 'Central Beam Connections', type: 'connection', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
        { id: 'conn_left',    name: 'Left Beam Connections',    type: 'connection', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },

    // ── Week 3 ──────────────────────────────────────────────────────────────────
    {
      id: 'wp_structural_inspection',
      week: 3,
      name: 'Structural Inspection',
      description: 'Inspection of installed beams and connections',
      trade_category: 'Structural',
      zone: 'floor_3',
      owner: "Joe's Structural LLC",
      overall_stage: 'not_started',
      elements: [
        { id: 'insp_beams',       name: 'Beam Inspection',       type: 'inspection', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
        { id: 'insp_connections', name: 'Connection Inspection',  type: 'inspection', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },

    // ── Week 4 ──────────────────────────────────────────────────────────────────
    {
      id: 'wp_plumbing_roughin',
      week: 4,
      name: 'Plumbing Rough-In Start',
      description: 'Install primary plumbing lines and vertical stacks',
      trade_category: 'Plumbing',
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
              vlm_observation: '4" PVC drain stack with green inspection sticker at eye level. Stack penetrates floor slab through fire-rated sleeve.',
              vlm_stage_assessment: 'inspected',
            },
          ],
        },
      ],
    },
    {
      id: 'wp_hvac_routing',
      week: 4,
      name: 'HVAC Duct Routing Layout',
      description: 'Mark duct routes and ceiling penetrations',
      trade_category: 'HVAC',
      zone: 'floor_3',
      owner: 'CoolAir Systems',
      overall_stage: 'not_started',
      elements: [
        { id: 'duct_route_north', name: 'North Duct Route', type: 'layout', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
        { id: 'duct_route_south', name: 'South Duct Route', type: 'layout', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },

    // ── Week 5 ──────────────────────────────────────────────────────────────────
    {
      id: 'wp_hvac_main',
      week: 5,
      name: 'HVAC Duct Installation',
      description: 'Install main duct trunks and branch ducts',
      trade_category: 'HVAC',
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
              vlm_observation: '20×12 rectangular main trunk duct suspended at ceiling. All seams taped. Hangers at 48" intervals. AHU connection visible at north end.',
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
    {
      id: 'wp_plumbing_branches',
      week: 5,
      name: 'Plumbing Branch Lines',
      description: 'Install secondary plumbing distribution lines',
      trade_category: 'Plumbing',
      zone: 'floor_3',
      owner: 'Allied Mechanical',
      overall_stage: 'not_started',
      elements: [
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
        { id: 'pipe_branch_3', name: 'Branch Line 3', type: 'pipe', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },

    // ── Week 6 ──────────────────────────────────────────────────────────────────
    {
      id: 'wp_mep_coordination',
      week: 6,
      name: 'MEP Coordination Review',
      description: 'Resolve conflicts between plumbing, ductwork, and structural elements',
      trade_category: 'MEP Coordination',
      zone: 'floor_3',
      owner: 'Site Superintendent',
      overall_stage: 'not_started',
      elements: [
        { id: 'mep_conflict_1', name: 'Duct–Pipe Conflict Zone A',    type: 'coordination', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
        { id: 'mep_conflict_2', name: 'Structural–HVAC Clearance',    type: 'coordination', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },
    {
      id: 'wp_qr_verification',
      week: 6,
      name: 'QR-Based Element Verification',
      description: 'Scan QR tags to confirm installed elements match BIM IDs',
      trade_category: 'Quality Control',
      zone: 'floor_3',
      owner: 'QC Team',
      overall_stage: 'not_started',
      elements: [
        { id: 'qr_structural', name: 'Structural Elements Scan', type: 'qr_scan', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
        { id: 'qr_mep',        name: 'MEP Elements Scan',        type: 'qr_scan', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },

    // ── Week 7 ──────────────────────────────────────────────────────────────────
    {
      id: 'wp_wall_framing',
      week: 7,
      name: 'Wall Framing',
      description: 'Frame interior partition walls on Floor 3',
      trade_category: 'Finishes',
      zone: 'floor_3',
      owner: 'Interior Build Co',
      overall_stage: 'framed',
      elements: [
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
        { id: 'wall_west', name: 'West Wall', type: 'wall', stage: 'not_captured', stage_label: 'Not Captured', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },
    {
      id: 'wp_wall_inspection',
      week: 7,
      name: 'Wall Rough Inspection',
      description: 'Inspect framed walls before drywall installation',
      trade_category: 'Finishes',
      zone: 'floor_3',
      owner: 'Interior Build Co',
      overall_stage: 'not_started',
      elements: [
        { id: 'insp_wall_east', name: 'East Wall Inspection', type: 'inspection', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
        { id: 'insp_wall_west', name: 'West Wall Inspection', type: 'inspection', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },

    // ── Week 8 ──────────────────────────────────────────────────────────────────
    {
      id: 'wp_wall_finishes',
      week: 8,
      name: 'Drywall Installation',
      description: 'Install drywall on framed partitions',
      trade_category: 'Finishes',
      zone: 'floor_3',
      owner: 'Interior Build Co',
      overall_stage: 'drywalled',
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
      ],
    },
    {
      id: 'wp_final_mep',
      week: 8,
      name: 'Final MEP Tie-Ins',
      description: 'Complete plumbing and HVAC final connections',
      trade_category: 'MEP',
      zone: 'floor_3',
      owner: 'Allied Mechanical',
      overall_stage: 'not_started',
      elements: [
        { id: 'mep_plumbing_final', name: 'Plumbing Final Connections', type: 'pipe', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
        { id: 'mep_hvac_final',    name: 'HVAC Final Connections',     type: 'duct', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },

    // ── Week 9 ──────────────────────────────────────────────────────────────────
    {
      id: 'wp_punch_walk',
      week: 9,
      name: 'Punch Walk – Structural & MEP',
      description: 'Identify and document incomplete or defective work',
      trade_category: 'Quality Control',
      zone: 'floor_3',
      owner: 'QC Team',
      overall_stage: 'not_started',
      elements: [
        { id: 'punch_structural', name: 'Structural Punch Items', type: 'punch', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
        { id: 'punch_mep',        name: 'MEP Punch Items',        type: 'punch', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },

    // ── Week 10 ─────────────────────────────────────────────────────────────────
    {
      id: 'wp_floor3_completion',
      week: 10,
      name: 'Floor 3 Package Completion',
      description: 'Confirm all packages complete and ready for next trade handoff',
      trade_category: 'General Conditions',
      zone: 'floor_3',
      owner: 'Site Superintendent',
      overall_stage: 'not_started',
      elements: [
        { id: 'pkg_sign_off', name: 'Package Sign-Off', type: 'documentation', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
        { id: 'pkg_handoff',  name: 'Trade Handoff',    type: 'documentation', stage: 'not_started', stage_label: 'Not Started', confidence: 'none', conflicting: false, frame_evidence: [] },
      ],
    },
  ],
}

/** Mock job status responses — used by ProcessingStatus component */
export const MOCK_STATUS_STEPS = [
  { step: 'uploading',          label: 'Uploading video...',               progress: 10 },
  { step: 'frame_extraction',   label: 'Extracting frames...',             progress: 25 },
  { step: 'frame_selection',    label: 'Selecting key frames...',          progress: 45 },
  { step: 'vlm_analysis',       label: 'Running AI analysis on frames...', progress: 70 },
  { step: 'assembling_results', label: 'Assembling results...',            progress: 90 },
  { step: 'complete',           label: 'Analysis complete!',               progress: 100 },
]
