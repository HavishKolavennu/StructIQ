"""Backend pipeline orchestrator.

Primary path:
  process_video (Chunk 4) -> run_analysis per detected zone (Chunk 1) -> merge results

Demo fallback mode:
  If QR detection fails and demo_mode is enabled, continue with a single synthetic
  zone so hackathon demos can still run end-to-end.
"""

from __future__ import annotations

import json
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

try:
    from ..config import FRAMES_DIR, PROCESSING_DIR, RESULTS_DIR
    from ..models.work_packages import get_all_zones, get_demo_work_packages
    from .analyzer import run_analysis
    from .frame_extractor import FrameExtractionError, extract_frames
    from .frame_selector import select_frames
    from .video_processor import VideoProcessingError, process_video
except ImportError:
    from config import FRAMES_DIR, PROCESSING_DIR, RESULTS_DIR
    from models.work_packages import get_all_zones, get_demo_work_packages
    from pipeline.analyzer import run_analysis
    from pipeline.frame_extractor import FrameExtractionError, extract_frames
    from pipeline.frame_selector import select_frames
    from pipeline.video_processor import VideoProcessingError, process_video

logger = logging.getLogger(__name__)


def _set_status(jobs: dict[str, dict], job_id: str, **updates) -> None:
    jobs[job_id].update(updates)


def _safe_zone_label(zone_id: str, zone_meta: Optional[dict]) -> str:
    if zone_meta and zone_meta.get("zone_label"):
        return str(zone_meta["zone_label"])
    return zone_id.replace("_", " ").title()


def _resolve_analysis_zone_id(zone_id: str, zone_meta: Optional[dict]) -> str:
    """Map QR/demo zone IDs to known demo zone IDs used by current registry."""
    candidates: list[str] = []

    if zone_meta and zone_meta.get("zone_id"):
        candidates.append(str(zone_meta["zone_id"]))
    candidates.append(zone_id)

    # Heuristic: floor_3_bay_a -> floor_3
    for candidate in list(candidates):
        parts = candidate.split("_")
        if len(parts) >= 2 and parts[0] == "floor" and parts[1].isdigit():
            candidates.append(f"floor_{parts[1]}")

    valid_zones = set(get_all_zones())
    for candidate in candidates:
        if candidate in valid_zones:
            return candidate

    return "floor_3" if "floor_3" in valid_zones else (next(iter(valid_zones)) if valid_zones else zone_id)


def _copy_selected_frames_for_serving(zone_frames: dict[str, list[Path]], job_id: str) -> int:
    """Copy selected frames into /api/frames serving directory."""
    job_frame_dir = FRAMES_DIR / job_id
    job_frame_dir.mkdir(parents=True, exist_ok=True)

    copied = 0
    for frames in zone_frames.values():
        for src in frames:
            if not src.exists():
                continue
            dst = job_frame_dir / src.name
            if not dst.exists():
                shutil.copy2(src, dst)
                copied += 1
    return copied


def _process_video_demo_zone(video_path: Path, job_id: str) -> tuple[dict[str, list[Path]], dict[str, dict], dict[str, dict]]:
    """Fallback segmentation path used only when demo_mode=True and no QR is detected.

    Process:
      extract frames -> run global smart selection -> map selected frames to one zone.
    """
    job_dir = PROCESSING_DIR / job_id
    candidates_dir = job_dir / "candidates"
    selected_dir = job_dir / "selected" / "demo_zone"

    candidates_dir.mkdir(parents=True, exist_ok=True)
    selected_dir.mkdir(parents=True, exist_ok=True)

    try:
        candidate_frames = extract_frames(video_path=video_path, fps=2, output_dir=candidates_dir)
    except FrameExtractionError as exc:
        raise RuntimeError(f"Demo fallback frame extraction failed: {exc}") from exc

    selected_candidates, selection_metadata = select_frames(
        candidates=candidate_frames,
        max_frames=25,
        ssim_threshold=0.85,
    )

    copied_selected: list[Path] = []
    for src in selected_candidates:
        dst = selected_dir / src.name
        shutil.copy2(src, dst)
        copied_selected.append(dst)

    all_wp_ids = [wp.id for wp in get_demo_work_packages("floor_3")]

    zone_frames = {"demo_zone": copied_selected}
    zone_metadata = {
        "demo_zone": {
            "zone_id": "demo_zone",
            "zone_label": "Demo Zone",
            "work_packages": all_wp_ids,
            "mode": "demo_fallback",
        }
    }
    selection_metadata_by_zone = {
        "demo_zone": {
            **selection_metadata.to_dict(),
            "zone_label": "Demo Zone",
            "selected_frames": [path.name for path in copied_selected],
        }
    }

    return zone_frames, zone_metadata, selection_metadata_by_zone


def _merge_zone_results(
    *,
    job_id: str,
    zone_results: list[dict],
    detected_zones: list[str],
    selection_metadata_by_zone: dict[str, dict],
    demo_fallback_used: bool,
) -> dict:
    breakdown_keys = {"complete", "in_progress", "not_started", "not_captured", "inspected"}
    merged_breakdown = {key: 0 for key in breakdown_keys}

    merged_work_packages: list[dict] = []
    failed_frames: list[str] = []

    total_work_packages = 0
    total_elements = 0

    for zone_result in zone_results:
        summary = zone_result.get("summary", {})
        total_work_packages += int(summary.get("total_work_packages", 0) or 0)
        total_elements += int(summary.get("total_elements", 0) or 0)

        for key, value in (summary.get("stages_breakdown") or {}).items():
            merged_breakdown[key] = merged_breakdown.get(key, 0) + int(value or 0)

        failed_frames.extend(summary.get("failed_frames") or [])
        merged_work_packages.extend(zone_result.get("work_packages") or [])

    selected_count = sum(
        int((zone_meta or {}).get("selected_count", 0) or 0)
        for zone_meta in selection_metadata_by_zone.values()
    )
    total_candidates = sum(
        int((zone_meta or {}).get("total_candidates", 0) or 0)
        for zone_meta in selection_metadata_by_zone.values()
    )

    summary = {
        "total_work_packages": total_work_packages,
        "total_elements": total_elements,
        "stages_breakdown": merged_breakdown,
        "failed_frames": failed_frames,
    }

    if demo_fallback_used:
        summary["pipeline_note"] = (
            "Demo mode enabled: QR markers not detected. "
            "Used single-zone fallback segmentation for demo continuity."
        )

    return {
        "job_id": job_id,
        "zone_id": "multi_zone",
        "zone_label": "Multi-Zone Walkthrough" if not demo_fallback_used else "Demo Zone Walkthrough",
        "detected_zones": detected_zones,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "work_packages": merged_work_packages,
        "selection_metadata": {
            "total_candidates": total_candidates,
            "selected_count": selected_count,
            "zones": selection_metadata_by_zone,
        },
        "mode": "demo_fallback" if demo_fallback_used else "qr_segmented",
    }


def run_pipeline(job_id: str, video_path: Path, jobs: dict[str, dict], demo_mode: bool = False) -> None:
    """Run real Chunk 4 + Chunk 1 pipeline, with optional no-QR demo fallback mode."""
    try:
        _set_status(
            jobs,
            job_id,
            current_step="frame_extraction",
            progress_detail="Extracting frames from uploaded video...",
        )

        def on_video_progress(step: str, detail: str) -> None:
            _set_status(jobs, job_id, current_step=step, progress_detail=detail)

        demo_fallback_used = False

        try:
            video_result = process_video(
                video_path=video_path,
                job_id=job_id,
                processing_root=PROCESSING_DIR,
                progress_callback=on_video_progress,
            )
            zone_frames = video_result.zone_frames
            zone_metadata = video_result.zone_metadata
            selection_metadata_by_zone = video_result.selection_metadata
        except VideoProcessingError as exc:
            message = str(exc)
            no_qr = "No QR codes detected" in message

            if no_qr and demo_mode:
                demo_fallback_used = True
                _set_status(
                    jobs,
                    job_id,
                    current_step="zone_segmentation",
                    progress_detail="No QR detected. Demo mode enabled -> using single Demo Zone fallback...",
                )
                zone_frames, zone_metadata, selection_metadata_by_zone = _process_video_demo_zone(video_path, job_id)
            else:
                if no_qr:
                    message = (
                        "No QR zone markers were detected in this video. "
                        "StructIQ requires at least one visible zone QR code to segment and analyze the walkthrough."
                    )
                logger.warning("Video processing failed for job %s: %s", job_id, message)
                _set_status(
                    jobs,
                    job_id,
                    status="error",
                    current_step="error",
                    progress_detail="Video processing failed.",
                    error_message=message,
                )
                return

        detected_zones = [
            _safe_zone_label(zone_id, zone_metadata.get(zone_id))
            for zone_id in zone_frames.keys()
        ]

        copied_frames = _copy_selected_frames_for_serving(zone_frames, job_id)

        _set_status(
            jobs,
            job_id,
            current_step="frame_selection",
            progress_detail=f"Frame selection complete. {copied_frames} frame(s) prepared for evidence serving.",
            detected_zones=detected_zones,
            selected_frame_count=copied_frames,
        )

        zone_results: list[dict] = []
        for index, (zone_id, selected_frames) in enumerate(zone_frames.items(), start=1):
            zone_meta = zone_metadata.get(zone_id, {})
            zone_label = _safe_zone_label(zone_id, zone_meta)

            _set_status(
                jobs,
                job_id,
                current_step="vlm_analysis",
                detected_zones=detected_zones,
                progress_detail=f"Analyzing {zone_label} ({index}/{len(zone_frames)})...",
            )

            analysis_zone_id = _resolve_analysis_zone_id(zone_id, zone_meta)
            work_packages = get_demo_work_packages(analysis_zone_id)

            zone_result = run_analysis(
                selected_frames=selected_frames,
                zone_id=analysis_zone_id,
                work_packages=work_packages if work_packages else None,
                job_id=job_id,
            )
            zone_results.append(zone_result)

        _set_status(jobs, job_id, current_step="assembling_results", progress_detail="Assembling final results...")

        if not zone_results:
            raise RuntimeError("No zone analysis results were produced.")

        results = _merge_zone_results(
            job_id=job_id,
            zone_results=zone_results,
            detected_zones=detected_zones,
            selection_metadata_by_zone=selection_metadata_by_zone,
            demo_fallback_used=demo_fallback_used,
        )

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
            detected_zones=results.get("detected_zones", detected_zones),
            selected_frame_count=int(results.get("selection_metadata", {}).get("selected_count", copied_frames) or copied_frames),
        )

    except Exception as exc:
        logger.exception("Pipeline failure for job %s", job_id)
        _set_status(
            jobs,
            job_id,
            status="error",
            current_step="error",
            progress_detail="Pipeline failed.",
            error_message=str(exc),
        )


def cleanup_job_artifacts(job_id: str) -> None:
    """Best-effort cleanup helper for tests/manual resets."""
    for path in (RESULTS_DIR / job_id, FRAMES_DIR / job_id):
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
