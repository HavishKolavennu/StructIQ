export const mockResults = {
  job_id: 'job_demo_floor3',
  zone_id: 'floor_3',
  zone_label: 'Floor 3',
  processed_at: '2026-02-22T14:30:00Z',
  summary: {
    total_work_packages: 4,
    total_elements: 12,
    stages_breakdown: {
      complete: 3,
      in_progress: 5,
      not_started: 2,
      not_captured: 2
    }
  },
  work_packages: [
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
          frame_evidence: [
            {
              frame_id: 'frame_004.jpg',
              frame_path: '/api/frames/job_demo_floor3/frame_004.jpg',
              vlm_observation: 'Steel I-beam spans the bay and both column joints show bolt heads.',
              vlm_stage_assessment: 'connected'
            },
            {
              frame_id: 'frame_012.jpg',
              frame_path: '/api/frames/job_demo_floor3/frame_012.jpg',
              vlm_observation: 'Opposite angle confirms end connections and no temporary bracing.',
              vlm_stage_assessment: 'connected'
            }
          ]
        },
        {
          id: 'beam_left_1',
          name: 'Left Beam',
          type: 'beam',
          stage: 'placed',
          stage_label: 'Placed — in position, not yet connected',
          confidence: 'medium',
          frame_evidence: [
            {
              frame_id: 'frame_017.jpg',
              frame_path: '/api/frames/job_demo_floor3/frame_017.jpg',
              vlm_observation: 'Beam is seated on supports with temporary bracing still installed.',
              vlm_stage_assessment: 'placed'
            }
          ]
        },
        {
          id: 'beam_right_1',
          name: 'Right Beam',
          type: 'beam',
          stage: 'not_captured',
          stage_label: 'Not visible in uploaded footage',
          confidence: 'none',
          frame_evidence: []
        }
      ]
    },
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
          stage: 'rough_in_complete',
          stage_label: 'Rough-In Complete',
          confidence: 'high',
          frame_evidence: [
            {
              frame_id: 'frame_006.jpg',
              frame_path: '/api/frames/job_demo_floor3/frame_006.jpg',
              vlm_observation: 'Main run is fully installed with couplers at each branch point.',
              vlm_stage_assessment: 'rough_in_complete'
            }
          ]
        },
        {
          id: 'pipe_branch_1',
          name: 'Branch Line 1',
          type: 'pipe',
          stage: 'rough_in_started',
          stage_label: 'Rough-In Started',
          confidence: 'medium',
          frame_evidence: [
            {
              frame_id: 'frame_008.jpg',
              frame_path: '/api/frames/job_demo_floor3/frame_008.jpg',
              vlm_observation: 'Partial branch section installed; final tie-in not visible.',
              vlm_stage_assessment: 'rough_in_started'
            }
          ]
        },
        {
          id: 'pipe_branch_2',
          name: 'Branch Line 2',
          type: 'pipe',
          stage: 'not_started',
          stage_label: 'Not Started',
          confidence: 'low',
          frame_evidence: []
        },
        {
          id: 'pipe_drain_stack',
          name: 'Drain Stack',
          type: 'pipe',
          stage: 'pressure_tested',
          stage_label: 'Pressure Tested',
          confidence: 'medium',
          frame_evidence: [
            {
              frame_id: 'frame_015.jpg',
              frame_path: '/api/frames/job_demo_floor3/frame_015.jpg',
              vlm_observation: 'Gauge and test cap visible on stack line section.',
              vlm_stage_assessment: 'pressure_tested'
            }
          ]
        }
      ]
    },
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
          frame_evidence: [
            {
              frame_id: 'frame_010.jpg',
              frame_path: '/api/frames/job_demo_floor3/frame_010.jpg',
              vlm_observation: 'Main trunk run hung and connected along bay centerline.',
              vlm_stage_assessment: 'duct_installed'
            }
          ]
        },
        {
          id: 'duct_branch_north',
          name: 'North Branch',
          type: 'duct',
          stage: 'not_started',
          stage_label: 'Not Started',
          confidence: 'none',
          frame_evidence: []
        },
        {
          id: 'duct_branch_south',
          name: 'South Branch',
          type: 'duct',
          stage: 'materials_on_site',
          stage_label: 'Materials On Site',
          confidence: 'low',
          frame_evidence: [
            {
              frame_id: 'frame_022.jpg',
              frame_path: '/api/frames/job_demo_floor3/frame_022.jpg',
              vlm_observation: 'Duct sections are staged near install location but not hung.',
              vlm_stage_assessment: 'materials_on_site'
            }
          ]
        }
      ]
    },
    {
      id: 'wp_wall_framing',
      name: 'Wall Framing',
      zone: 'floor_3',
      owner: 'Northline Interiors',
      overall_stage: 'not_captured',
      elements: [
        {
          id: 'wall_north',
          name: 'North Wall',
          type: 'wall',
          stage: 'complete',
          stage_label: 'Complete',
          confidence: 'high',
          frame_evidence: [
            {
              frame_id: 'frame_019.jpg',
              frame_path: '/api/frames/job_demo_floor3/frame_019.jpg',
              vlm_observation: 'Metal studs, sheathing, and finishing complete on north wall section.',
              vlm_stage_assessment: 'complete'
            }
          ]
        },
        {
          id: 'wall_south',
          name: 'South Wall',
          type: 'wall',
          stage: 'not_captured',
          stage_label: 'Not visible in uploaded footage',
          confidence: 'none',
          frame_evidence: []
        }
      ]
    }
  ],
  selection_metadata: {
    total_candidates: 587,
    selected_count: 23,
    selection_criteria: {
      sharpness_weight: 0.4,
      contrast_weight: 0.15,
      edge_density_weight: 0.15,
      diversity_threshold_ssim: 0.85
    }
  }
}
