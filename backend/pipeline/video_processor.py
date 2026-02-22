"""
Video processing orchestrator for StructIQ (Chunk 4.6).

Pipeline:
  extract frames -> QR scan -> zone segmentation -> per-zone smart frame selection

Public API:
    process_video(video_path, ...) -> VideoProcessingResult
"""

from __future__ import annotations

import json
import logging
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Optional

from .frame_extractor import FrameExtractionError, extract_frames
from .frame_selector import SelectionMetadata, select_frames
from .qr_detector import QRDetection, QRDetectionError, scan_frames_for_qr
from .zone_segmenter import ZoneSegmentationResult, segment_by_zone

logger = logging.getLogger(__name__)

ProgressCallback = Callable[[str, str], None]


class VideoProcessingError(RuntimeError):
    """Raised when the video processing pipeline fails."""


@dataclass(slots=True)
class VideoProcessingResult:
    job_id: str
    zone_frames: dict[str, list[Path]]
    zone_metadata: dict[str, dict]
    selection_metadata: dict[str, dict]
    unlocalized_frames: list[Path]
    metadata_path: Path

    def to_dict(self) -> dict:
        return {
            "job_id": self.job_id,
            "zone_frames": {
                zone_id: [str(path) for path in paths]
                for zone_id, paths in self.zone_frames.items()
            },
            "zone_metadata": self.zone_metadata,
            "selection_metadata": self.selection_metadata,
            "unlocalized_frames": [str(path) for path in self.unlocalized_frames],
            "metadata_path": str(self.metadata_path),
        }


def process_video(
    video_path: Path,
    job_id: Optional[str] = None,
    processing_root: Optional[Path] = None,
    fps: int = 2,
    max_frames: int = 25,
    ssim_threshold: float = 0.85,
    progress_callback: Optional[ProgressCallback] = None,
) -> VideoProcessingResult:
    """
    Process an uploaded video into selected frames grouped by detected zone.

    Hard requirement for hackathon flow:
      - At least one readable QR code must be detected in the video.
    """
    if not video_path.exists() or not video_path.is_file():
        raise VideoProcessingError(f"Video not found: {video_path}")

    resolved_job_id = job_id or _derive_job_id(video_path)
    resolved_processing_root = (processing_root or _default_processing_root()).resolve()

    job_dir = resolved_processing_root / resolved_job_id
    candidates_dir = job_dir / "candidates"
    selected_root_dir = job_dir / "selected"
    metadata_path = job_dir / "selection_metadata.json"

    candidates_dir.mkdir(parents=True, exist_ok=True)
    selected_root_dir.mkdir(parents=True, exist_ok=True)

    def notify(step: str, detail: str) -> None:
        logger.info("[%s] %s", step, detail)
        if progress_callback:
            try:
                progress_callback(step, detail)
            except Exception:
                pass

    notify("frame_extraction", f"Extracting candidate frames from '{video_path.name}'...")
    try:
        candidate_frames = extract_frames(
            video_path=video_path,
            fps=fps,
            output_dir=candidates_dir,
        )
    except FrameExtractionError as exc:
        raise VideoProcessingError(f"Frame extraction failed: {exc}") from exc

    notify(
        "frame_extraction",
        f"Frame extraction complete: {len(candidate_frames)} candidate frame(s).",
    )

    notify("qr_detection", "Scanning frames for QR zone markers...")
    try:
        qr_detections = scan_frames_for_qr(candidate_frames)
    except QRDetectionError as exc:
        raise VideoProcessingError(f"QR detection failed: {exc}") from exc

    if not qr_detections:
        raise VideoProcessingError(
            "No QR codes detected in uploaded video. "
            "For the hackathon demo flow, include at least one readable zone QR."
        )

    detected_zone_labels = sorted(
        {
            str(detection.zone_data.get("zone_label", detection.zone_data.get("zone_id", "unknown")))
            for detection in qr_detections
        }
    )
    notify(
        "qr_detection",
        (
            f"QR detection complete: {len(qr_detections)} detection(s), "
            f"{len(detected_zone_labels)} zone(s) found."
        ),
    )

    notify("zone_segmentation", "Assigning frames to zones by QR timeline...")
    segmentation: ZoneSegmentationResult = segment_by_zone(candidate_frames, qr_detections)

    if not segmentation.zone_frames:
        raise VideoProcessingError(
            "QR codes were detected, but no frames were assigned to a zone."
        )

    notify(
        "zone_segmentation",
        (
            f"Zone segmentation complete: {len(segmentation.zone_frames)} zone(s), "
            f"{len(segmentation.unlocalized_frames)} unlocalized frame(s)."
        ),
    )

    selected_frames_by_zone: dict[str, list[Path]] = {}
    selection_metadata_by_zone: dict[str, dict] = {}

    for zone_id, zone_candidates in segmentation.zone_frames.items():
        zone_label = str(segmentation.zone_metadata.get(zone_id, {}).get("zone_label", zone_id))
        notify(
            "frame_selection",
            (
                f"Selecting best frames for zone '{zone_label}' "
                f"({len(zone_candidates)} candidate frame(s))..."
            ),
        )

        selected_candidates, selection_metadata = select_frames(
            candidates=zone_candidates,
            max_frames=max_frames,
            ssim_threshold=ssim_threshold,
        )

        zone_output_dir = selected_root_dir / _safe_name(zone_id)
        zone_output_dir.mkdir(parents=True, exist_ok=True)

        zone_output_frames: list[Path] = []
        for src in selected_candidates:
            dst = zone_output_dir / src.name
            shutil.copy2(src, dst)
            zone_output_frames.append(dst)

        selected_frames_by_zone[zone_id] = zone_output_frames
        zone_metadata_payload = selection_metadata.to_dict()
        zone_metadata_payload["zone_label"] = zone_label
        zone_metadata_payload["selected_frames"] = [path.name for path in zone_output_frames]
        selection_metadata_by_zone[zone_id] = zone_metadata_payload

        notify(
            "frame_selection",
            (
                f"Zone '{zone_label}' selection complete: "
                f"{len(zone_output_frames)} selected / {len(zone_candidates)} candidates."
            ),
        )

    metadata = _build_metadata(
        job_id=resolved_job_id,
        video_path=video_path,
        fps=fps,
        max_frames=max_frames,
        ssim_threshold=ssim_threshold,
        candidates_dir=candidates_dir,
        selected_root_dir=selected_root_dir,
        qr_detections=qr_detections,
        segmentation=segmentation,
        selection_metadata_by_zone=selection_metadata_by_zone,
    )
    metadata_path.write_text(json.dumps(metadata, indent=2))

    return VideoProcessingResult(
        job_id=resolved_job_id,
        zone_frames=selected_frames_by_zone,
        zone_metadata=segmentation.zone_metadata,
        selection_metadata=selection_metadata_by_zone,
        unlocalized_frames=segmentation.unlocalized_frames,
        metadata_path=metadata_path,
    )


def _build_metadata(
    job_id: str,
    video_path: Path,
    fps: int,
    max_frames: int,
    ssim_threshold: float,
    candidates_dir: Path,
    selected_root_dir: Path,
    qr_detections: list[QRDetection],
    segmentation: ZoneSegmentationResult,
    selection_metadata_by_zone: dict[str, dict],
) -> dict:
    return {
        "job_id": job_id,
        "video_path": str(video_path.resolve()),
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "fps": fps,
        "max_frames_per_zone": max_frames,
        "ssim_threshold": ssim_threshold,
        "paths": {
            "job_dir": str(candidates_dir.parent),
            "candidates_dir": str(candidates_dir),
            "selected_root_dir": str(selected_root_dir),
        },
        "summary": {
            "total_candidates": len(list(candidates_dir.glob("*.jpg"))),
            "total_qr_detections": len(qr_detections),
            "detected_zone_ids": sorted(segmentation.zone_metadata.keys()),
            "detected_zone_labels": sorted(
                str(item.get("zone_label", zone_id))
                for zone_id, item in segmentation.zone_metadata.items()
            ),
            "unlocalized_count": len(segmentation.unlocalized_frames),
        },
        "qr_detections": [
            {
                "frame_index": detection.frame_index,
                "frame_id": detection.frame_path.name,
                "zone_id": detection.zone_data.get("zone_id"),
                "zone_label": detection.zone_data.get("zone_label"),
                "work_packages": detection.zone_data.get("work_packages", []),
            }
            for detection in qr_detections
        ],
        "zone_metadata": segmentation.zone_metadata,
        "zone_transitions": [transition.to_dict() for transition in segmentation.transitions],
        "selection_metadata": selection_metadata_by_zone,
    }


def _safe_name(value: str) -> str:
    safe = "".join(ch if (ch.isalnum() or ch in ("-", "_")) else "_" for ch in value.strip())
    return safe or "zone"


def _default_processing_root() -> Path:
    # backend/pipeline/video_processor.py -> parents[0]=pipeline, [1]=backend, [2]=project root
    return Path(__file__).resolve().parents[2] / "processing"


def _derive_job_id(video_path: Path) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    stem = "".join(ch if (ch.isalnum() or ch in ("-", "_")) else "_" for ch in video_path.stem)
    stem = stem[:48] if stem else "video"
    return f"{stem}_{timestamp}"
