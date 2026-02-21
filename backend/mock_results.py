"""Mock results payload used while pipeline modules are still integrating."""

from __future__ import annotations

from datetime import datetime, timezone


def build_mock_results(job_id: str, zone_id: str) -> dict:
    zone_label = zone_id.replace('_', ' ').title()

    return {
        'job_id': job_id,
        'zone_id': zone_id,
        'zone_label': zone_label,
        'processed_at': datetime.now(timezone.utc).isoformat(),
        'summary': {
            'total_work_packages': 2,
            'total_elements': 5,
            'stages_breakdown': {
                'complete': 1,
                'in_progress': 2,
                'not_started': 1,
                'not_captured': 1,
            },
        },
        'work_packages': [
            {
                'id': 'wp_beam_layout',
                'name': 'Beam Layout',
                'zone': zone_id,
                'owner': "Joe's Structural LLC",
                'overall_stage': 'placed',
                'elements': [
                    {
                        'id': 'beam_central_1',
                        'name': 'Central Beam',
                        'type': 'beam',
                        'stage': 'connected',
                        'stage_label': 'Connected — permanent connections made',
                        'confidence': 'high',
                        'frame_evidence': [
                            {
                                'frame_id': 'frame_004.jpg',
                                'frame_path': f'/api/frames/{job_id}/frame_004.jpg',
                                'vlm_observation': 'Steel I-beam visible with bolted end connections.',
                                'vlm_stage_assessment': 'connected',
                            }
                        ],
                    },
                    {
                        'id': 'beam_left_1',
                        'name': 'Left Beam',
                        'type': 'beam',
                        'stage': 'placed',
                        'stage_label': 'Placed — in position, not yet connected',
                        'confidence': 'medium',
                        'frame_evidence': [],
                    },
                    {
                        'id': 'beam_right_1',
                        'name': 'Right Beam',
                        'type': 'beam',
                        'stage': 'not_captured',
                        'stage_label': 'Not visible in uploaded footage',
                        'confidence': 'none',
                        'frame_evidence': [],
                    },
                ],
            },
            {
                'id': 'wp_plumbing_roughin',
                'name': 'Plumbing Rough-In',
                'zone': zone_id,
                'owner': 'Allied Mechanical',
                'overall_stage': 'rough_in_started',
                'elements': [
                    {
                        'id': 'pipe_main_supply',
                        'name': 'Main Supply Line',
                        'type': 'pipe',
                        'stage': 'rough_in_started',
                        'stage_label': 'Rough-In Started',
                        'confidence': 'medium',
                        'frame_evidence': [],
                    },
                    {
                        'id': 'pipe_branch_1',
                        'name': 'Branch Line 1',
                        'type': 'pipe',
                        'stage': 'complete',
                        'stage_label': 'Complete',
                        'confidence': 'high',
                        'frame_evidence': [],
                    },
                ],
            },
        ],
        'selection_metadata': {
            'total_candidates': 120,
            'selected_count': 25,
            'selection_criteria': {
                'sharpness_weight': 0.4,
                'contrast_weight': 0.15,
                'edge_density_weight': 0.15,
                'diversity_threshold_ssim': 0.85,
            },
        },
    }
