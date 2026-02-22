"""
Analysis orchestrator for StructIQ — the main entry point for Chunk 1.

Public API:
    run_analysis(selected_frames, zone_id, work_packages, job_id, progress_callback)
        -> dict  (matches GET /api/results/{job_id} contract in architecture.md)

Usage (from main.py or a test script):

    from pathlib import Path
    from pipeline.analyzer import run_analysis

    results = run_analysis(
        selected_frames=[Path("processing/abc/selected/frame_004.jpg"), ...],
        zone_id="floor_3",
        job_id="abc-123",
    )
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Optional

try:
    from ..models.work_packages import WorkPackage, get_demo_work_packages
    from .prompts import build_system_prompt, build_frame_prompt
    from .vlm_client import analyze_frame, AnalysisError
    from .aggregator import aggregate_observations, compute_work_package_stage, ElementResults
except ImportError:
    from models.work_packages import WorkPackage, get_demo_work_packages
    from pipeline.prompts import build_system_prompt, build_frame_prompt
    from pipeline.vlm_client import analyze_frame, AnalysisError
    from pipeline.aggregator import aggregate_observations, compute_work_package_stage, ElementResults

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Human-readable stage labels (used in results JSON for frontend display)
# ---------------------------------------------------------------------------

_STAGE_LABELS: dict[str, str] = {
    # Beam stages
    "not_started": "Not Started",
    "delivered": "Delivered — material on site",
    "placed": "Placed — in position, not yet connected",
    "braced": "Braced — temporary bracing installed",
    "connected": "Connected — permanent connections made",
    "inspected": "Inspected — inspection passed",
    "complete": "Complete",
    # Plumbing stages
    "materials_on_site": "Materials On Site",
    "rough_in_started": "Rough-In Started",
    "rough_in_complete": "Rough-In Complete",
    "pressure_tested": "Pressure Tested",
    # HVAC stages
    "duct_installed": "Duct Installed",
    "branches_complete": "Branches Complete",
    "balanced": "Air Balanced",
    # Generic
    "not_captured": "Not visible in uploaded footage",
    "unclear": "Visible but stage could not be determined",
}

# Stages that map to "in_progress" for the summary breakdown
_IN_PROGRESS_STAGES: frozenset[str] = frozenset({
    "delivered",
    "placed",
    "braced",
    "connected",
    "materials_on_site",
    "rough_in_started",
    "rough_in_complete",
    "pressure_tested",
    "duct_installed",
    "branches_complete",
    "balanced",
    "unclear",
})

_ZONE_LABELS: dict[str, str] = {
    "floor_1": "Floor 1",
    "floor_2": "Floor 2",
    "floor_3": "Floor 3",
    "floor_4": "Floor 4",
    "floor_5": "Floor 5",
    "basement": "Basement",
    "roof": "Roof",
    "exterior": "Exterior",
}

ProgressCallback = Callable[[str, str], None]


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def run_analysis(
    selected_frames: list[Path],
    zone_id: str,
    work_packages: Optional[list[WorkPackage]] = None,
    job_id: str = "demo",
    progress_callback: Optional[ProgressCallback] = None,
) -> dict:
    """
    Run the full VLM analysis pipeline on a set of selected frames.

    Args:
        selected_frames:    Paths to selected frame images (JPEG or PNG).
                            These should be the output of the frame selection step (Chunk 4).
        zone_id:            Zone identifier, e.g. "floor_3".
        work_packages:      Work package definitions. If None, demo data for the zone is used.
        job_id:             Used to construct frame_path URLs in the results JSON.
        progress_callback:  Optional callable(step: str, detail: str) for real-time status
                            updates. The step values match the /api/status step names:
                            "vlm_analysis" and "assembling_results".

    Returns:
        Full results dict matching the GET /api/results/{job_id} API contract.
    """
    if work_packages is None:
        work_packages = get_demo_work_packages(zone_id)
        if not work_packages:
            logger.warning("No work packages found for zone '%s' — results will be empty.", zone_id)

    zone_label = _ZONE_LABELS.get(zone_id, zone_id.replace("_", " ").title())

    def notify(step: str, detail: str) -> None:
        logger.info("[%s] %s", step, detail)
        if progress_callback:
            try:
                progress_callback(step, detail)
            except Exception:
                pass  # Don't let a callback crash the pipeline

    notify("vlm_analysis", f"Starting analysis — {len(selected_frames)} frame(s), zone: {zone_label}")

    # ------------------------------------------------------------------
    # Step 1: Build the system prompt (sent once, shared across all frames)
    # ------------------------------------------------------------------
    system_prompt = build_system_prompt(zone_label, work_packages)

    # ------------------------------------------------------------------
    # Step 2: Analyse each frame sequentially
    # (sequential to respect API rate limits; parallelism can be added later)
    # ------------------------------------------------------------------
    all_frame_results: list[dict] = []
    failed_frames: list[str] = []

    for i, frame_path in enumerate(selected_frames):
        frame_filename = frame_path.name
        notify(
            "vlm_analysis",
            f"Analyzing frame {i + 1} of {len(selected_frames)}: {frame_filename}",
        )

        frame_prompt = build_frame_prompt(frame_filename, zone_label)

        try:
            result = analyze_frame(
                frame_path=frame_path,
                system_prompt=system_prompt,
                frame_prompt=frame_prompt,
                frame_filename=frame_filename,
            )
            all_frame_results.append(result)
            obs_count = len(result.get("observations", []))
            notify("vlm_analysis", f"  → {obs_count} element observation(s) recorded")

        except AnalysisError as exc:
            logger.error("Frame analysis failed for '%s': %s", frame_filename, exc)
            failed_frames.append(frame_filename)
            # Continue processing remaining frames — a single frame failure is not fatal

    notify(
        "vlm_analysis",
        f"Frame analysis complete. "
        f"{len(all_frame_results)} succeeded, {len(failed_frames)} failed.",
    )

    # ------------------------------------------------------------------
    # Step 3: Aggregate observations across frames
    # ------------------------------------------------------------------
    notify("assembling_results", "Aggregating element observations across all frames...")
    element_results: ElementResults = aggregate_observations(all_frame_results, work_packages)

    # ------------------------------------------------------------------
    # Step 4: Assemble the final results JSON
    # ------------------------------------------------------------------
    notify("assembling_results", "Assembling final results JSON...")
    results = _assemble_results(
        job_id=job_id,
        zone_id=zone_id,
        zone_label=zone_label,
        work_packages=work_packages,
        element_results=element_results,
        selected_frame_count=len(selected_frames),
        failed_frames=failed_frames,
    )

    notify("assembling_results", "Analysis complete.")
    return results


# ---------------------------------------------------------------------------
# Results assembly
# ---------------------------------------------------------------------------

def _assemble_results(
    job_id: str,
    zone_id: str,
    zone_label: str,
    work_packages: list[WorkPackage],
    element_results: ElementResults,
    selected_frame_count: int,
    failed_frames: list[str],
) -> dict:
    """
    Build the final results dict matching the GET /api/results/{job_id} contract.
    """
    stages_breakdown = {
        "complete": 0,
        "in_progress": 0,
        "not_started": 0,
        "not_captured": 0,
        "inspected": 0,
    }
    total_elements = 0
    assembled_wps: list[dict] = []

    for wp in work_packages:
        overall_stage = compute_work_package_stage(wp, element_results)
        elements_out: list[dict] = []

        for elem in wp.elements:
            total_elements += 1

            result = element_results.get(
                elem.id,
                {
                    "stage": "not_captured",
                    "confidence": "none",
                    "conflicting": False,
                    "conflict_note": None,
                    "frame_evidence": [],
                },
            )

            stage = result["stage"]
            stage_label = _STAGE_LABELS.get(stage, stage.replace("_", " ").title())

            # Append conflict note to the label when useful for the PM
            if result.get("conflicting") and result.get("conflict_note"):
                stage_label = f"{stage_label} \u26a0\ufe0f {result['conflict_note']}"

            # Summary breakdown
            if stage == "complete":
                stages_breakdown["complete"] += 1
            elif stage == "inspected":
                stages_breakdown["inspected"] += 1
            elif stage == "not_started":
                stages_breakdown["not_started"] += 1
            elif stage == "not_captured":
                stages_breakdown["not_captured"] += 1
            elif stage in _IN_PROGRESS_STAGES:
                stages_breakdown["in_progress"] += 1

            # Build frame evidence with API-routed paths
            frame_evidence: list[dict] = []
            for fe in result.get("frame_evidence", []):
                frame_evidence.append(
                    {
                        "frame_id": fe["frame_id"],
                        "frame_path": f"/api/frames/{job_id}/{fe['frame_id']}",
                        "vlm_observation": fe["vlm_observation"],
                        "vlm_stage_assessment": fe["vlm_stage_assessment"],
                    }
                )

            elements_out.append(
                {
                    "id": elem.id,
                    "name": elem.name,
                    "type": elem.type,
                    "stage": stage,
                    "stage_label": stage_label,
                    "confidence": result["confidence"],
                    "conflicting": result.get("conflicting", False),
                    "frame_evidence": frame_evidence,
                }
            )

        assembled_wps.append(
            {
                "id": wp.id,
                "name": wp.name,
                "description": wp.description,
                "zone": wp.zone,
                "owner": wp.owner,
                "trade_category": wp.trade_category,
                "week": wp.week,
                "overall_stage": overall_stage,
                "elements": elements_out,
            }
        )

    return {
        "job_id": job_id,
        "zone_id": zone_id,
        "zone_label": zone_label,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_work_packages": len(work_packages),
            "total_elements": total_elements,
            "stages_breakdown": stages_breakdown,
            "failed_frames": failed_frames,
        },
        "work_packages": assembled_wps,
        "selection_metadata": {
            "selected_count": selected_frame_count,
            "failed_frame_count": len(failed_frames),
        },
    }
