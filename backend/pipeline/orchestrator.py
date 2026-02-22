"""Background pipeline orchestrator for Chunk 6.

This module intentionally uses mocked processing outputs so frontend integration can
proceed before the full Chunk 1 and Chunk 4 implementations are wired.
"""

from __future__ import annotations

import json
import shutil
import time
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

try:
    from ..config import FRAMES_DIR, RESULTS_DIR
except ImportError:
    from config import FRAMES_DIR, RESULTS_DIR

MOCK_ZONES = [
    {"zone_id": "floor_3_bay_a", "zone_label": "Floor 3 - Bay A", "work_packages": ["wp_beam_layout", "wp_plumbing_roughin"]},
    {"zone_id": "floor_3_bay_b", "zone_label": "Floor 3 - Bay B", "work_packages": ["wp_hvac_main", "wp_partition_walls"]},
]

MOCK_RESULTS_TEMPLATE = {
    "summary": {
        "total_work_packages": 4,
        "total_elements": 12,
        "stages_breakdown": {
            "complete": 3,
            "in_progress": 6,
            "not_started": 1,
            "not_captured": 2,
            "inspected": 0,
        },
    },
    "selection_metadata": {
        "total_candidates": 248,
        "selected_count": 26,
        "selection_criteria": {
            "sharpness_weight": 0.4,
            "contrast_weight": 0.15,
            "edge_density_weight": 0.15,
            "diversity_threshold_ssim": 0.85,
        },
    },
    "work_packages": [
        {
            "id": "wp_beam_layout",
            "name": "Beam Layout",
            "zone": "floor_3_bay_a",
            "owner": "Joe's Structural LLC",
            "overall_stage": "placed",
            "elements": [
                {
                    "id": "beam_central_1",
                    "name": "Central Beam",
                    "type": "beam",
                    "stage": "connected",
                    "stage_label": "Connected — permanent connections made",
                    "confidence": "high",
                    "conflicting": False,
                    "frame_evidence": [
                        {
                            "frame_id": "frame_004",
                            "frame_path": "{frame_base}/frame_004.jpg",
                            "vlm_observation": "Central beam seated and bolted at both supports.",
                            "vlm_stage_assessment": "connected",
                        }
                    ],
                },
                {
                    "id": "beam_left_1",
                    "name": "Left Beam",
                    "type": "beam",
                    "stage": "placed",
                    "stage_label": "Placed — in position, not yet connected",
                    "confidence": "medium",
                    "conflicting": False,
                    "frame_evidence": [
                        {
                            "frame_id": "frame_006",
                            "frame_path": "{frame_base}/frame_006.jpg",
                            "vlm_observation": "Beam resting on support points with temporary bracing.",
                            "vlm_stage_assessment": "placed",
                        }
                    ],
                },
                {
                    "id": "beam_right_1",
                    "name": "Right Beam",
                    "type": "beam",
                    "stage": "not_captured",
                    "stage_label": "Not visible in uploaded footage",
                    "confidence": "none",
                    "conflicting": False,
                    "frame_evidence": [],
                },
            ],
        },
        {
            "id": "wp_plumbing_roughin",
            "name": "Plumbing Rough-In",
            "zone": "floor_3_bay_a",
            "owner": "Allied Mechanical",
            "overall_stage": "rough_in_started",
            "elements": [
                {
                    "id": "pipe_main_supply",
                    "name": "Main Supply Line",
                    "type": "pipe",
                    "stage": "complete",
                    "stage_label": "Complete",
                    "confidence": "high",
                    "conflicting": False,
                    "frame_evidence": [
                        {
                            "frame_id": "frame_010",
                            "frame_path": "{frame_base}/frame_010.jpg",
                            "vlm_observation": "Main supply line fully installed and supported.",
                            "vlm_stage_assessment": "complete",
                        }
                    ],
                },
                {
                    "id": "pipe_branch_1",
                    "name": "Branch Line 1",
                    "type": "pipe",
                    "stage": "rough_in_started",
                    "stage_label": "Rough-In Started",
                    "confidence": "medium",
                    "conflicting": False,
                    "frame_evidence": [
                        {
                            "frame_id": "frame_012",
                            "frame_path": "{frame_base}/frame_012.jpg",
                            "vlm_observation": "Partial branch run visible with open end.",
                            "vlm_stage_assessment": "rough_in_started",
                        }
                    ],
                },
                {
                    "id": "pipe_branch_2",
                    "name": "Branch Line 2",
                    "type": "pipe",
                    "stage": "materials_on_site",
                    "stage_label": "Materials On Site",
                    "confidence": "low",
                    "conflicting": False,
                    "frame_evidence": [],
                },
            ],
        },
        {
            "id": "wp_hvac_main",
            "name": "HVAC Ductwork",
            "zone": "floor_3_bay_b",
            "owner": "CoolAir Systems",
            "overall_stage": "duct_installed",
            "elements": [
                {
                    "id": "duct_hvac_main",
                    "name": "Main Trunk Duct",
                    "type": "duct",
                    "stage": "duct_installed",
                    "stage_label": "Duct Installed",
                    "confidence": "high",
                    "conflicting": False,
                    "frame_evidence": [
                        {
                            "frame_id": "frame_018",
                            "frame_path": "{frame_base}/frame_018.jpg",
                            "vlm_observation": "Main duct run installed and hung at ceiling.",
                            "vlm_stage_assessment": "duct_installed",
                        }
                    ],
                },
                {
                    "id": "duct_branch_north",
                    "name": "North Branch",
                    "type": "duct",
                    "stage": "not_started",
                    "stage_label": "Not Started",
                    "confidence": "none",
                    "conflicting": False,
                    "frame_evidence": [],
                },
                {
                    "id": "duct_branch_south",
                    "name": "South Branch",
                    "type": "duct",
                    "stage": "materials_on_site",
                    "stage_label": "Materials On Site",
                    "confidence": "low",
                    "conflicting": False,
                    "frame_evidence": [],
                },
            ],
        },
        {
            "id": "wp_partition_walls",
            "name": "Partition Walls",
            "zone": "floor_3_bay_b",
            "owner": "WallCraft Interiors",
            "overall_stage": "framed",
            "elements": [
                {
                    "id": "wall_partition_a",
                    "name": "Partition Wall A",
                    "type": "wall",
                    "stage": "framed",
                    "stage_label": "Framed",
                    "confidence": "medium",
                    "conflicting": False,
                    "frame_evidence": [],
                },
                {
                    "id": "wall_partition_b",
                    "name": "Partition Wall B",
                    "type": "wall",
                    "stage": "not_captured",
                    "stage_label": "Not visible in uploaded footage",
                    "confidence": "none",
                    "conflicting": False,
                    "frame_evidence": [],
                },
                {
                    "id": "wall_partition_c",
                    "name": "Partition Wall C",
                    "type": "wall",
                    "stage": "complete",
                    "stage_label": "Complete",
                    "confidence": "high",
                    "conflicting": False,
                    "frame_evidence": [],
                },
            ],
        },
    ],
}


def _set_status(jobs: dict[str, dict], job_id: str, **updates) -> None:
    jobs[job_id].update(updates)


def _write_placeholder_frames(job_id: str) -> None:
    """Create deterministic frame files for /api/frames endpoint in mock mode."""
    from PIL import Image, ImageDraw  # imported lazily to keep module lightweight

    job_frame_dir = FRAMES_DIR / job_id
    job_frame_dir.mkdir(parents=True, exist_ok=True)

    frame_names = [
        "frame_004.jpg",
        "frame_006.jpg",
        "frame_010.jpg",
        "frame_012.jpg",
        "frame_018.jpg",
    ]

    for idx, name in enumerate(frame_names, start=1):
        image = Image.new("RGB", (1280, 720), color=(240 - idx * 10, 235 - idx * 8, 220 - idx * 6))
        draw = ImageDraw.Draw(image)
        draw.rectangle((50, 50, 1230, 670), outline=(80, 80, 80), width=3)
        draw.text((80, 90), f"StructIQ Mock Frame {idx}", fill=(20, 20, 20))
        draw.text((80, 130), f"Job: {job_id}", fill=(30, 30, 30))
        draw.text((80, 170), name, fill=(30, 30, 30))
        image.save(job_frame_dir / name, format="JPEG", quality=90)


def _build_results(job_id: str, detected_zones: list[str]) -> dict:
    frame_base = f"/api/frames/{job_id}"
    results = deepcopy(MOCK_RESULTS_TEMPLATE)

    for wp in results["work_packages"]:
        for element in wp.get("elements", []):
            for evidence in element.get("frame_evidence", []):
                evidence["frame_path"] = evidence["frame_path"].format(frame_base=frame_base)

    results.update(
        {
            "job_id": job_id,
            "zone_id": "multi_zone",
            "zone_label": "Multi-Zone Walkthrough",
            "detected_zones": detected_zones,
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return results


def run_pipeline(job_id: str, video_path: Path, jobs: dict[str, dict]) -> None:
    """Run mocked pipeline stages and persist mock results to disk."""
    try:
        _set_status(jobs, job_id, current_step="frame_extraction", progress_detail="Extracting frames from uploaded video...")
        time.sleep(0.6)

        _set_status(jobs, job_id, current_step="qr_detection", progress_detail="Detecting zones from QR codes...")
        time.sleep(0.6)

        detected_zones = [z["zone_label"] for z in MOCK_ZONES]
        _set_status(
            jobs,
            job_id,
            current_step="zone_segmentation",
            detected_zones=detected_zones,
            progress_detail=f"Found {len(detected_zones)} zones from QR scan.",
        )
        time.sleep(0.6)

        _set_status(jobs, job_id, current_step="frame_selection", progress_detail="Selecting best frames per detected zone...")
        time.sleep(0.6)

        for zone in detected_zones:
            _set_status(
                jobs,
                job_id,
                current_step="vlm_analysis",
                progress_detail=f"Analyzing {zone}...",
                detected_zones=detected_zones,
            )
            time.sleep(0.6)

        _set_status(jobs, job_id, current_step="assembling_results", progress_detail="Assembling final results...")
        time.sleep(0.4)

        _write_placeholder_frames(job_id)
        results = _build_results(job_id=job_id, detected_zones=detected_zones)

        result_dir = RESULTS_DIR / job_id
        result_dir.mkdir(parents=True, exist_ok=True)
        result_path = result_dir / "results.json"
        result_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

        _set_status(
            jobs,
            job_id,
            status="complete",
            current_step="complete",
            progress_detail="Analysis complete.",
            results_path=str(result_path),
            detected_zones=detected_zones,
            selected_frame_count=results.get("selection_metadata", {}).get("selected_count", 0),
        )
    except Exception as exc:
        _set_status(
            jobs,
            job_id,
            status="error",
            current_step="error",
            progress_detail="Pipeline failed.",
            error_message=str(exc),
        )
    finally:
        # Keep uploaded video by default for debugging; clean-up can be added later.
        if not video_path.exists():
            return


def cleanup_job_artifacts(job_id: str) -> None:
    """Best-effort cleanup helper for tests/manual resets."""
    for path in (RESULTS_DIR / job_id, FRAMES_DIR / job_id):
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
