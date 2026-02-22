"""
Frame extraction utilities for StructIQ (Chunk 4.1).

Public API:
    extract_frames(video_path, fps=2, output_dir=None) -> list[Path]
"""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Callable, Optional

import cv2

logger = logging.getLogger(__name__)

DEFAULT_TARGET_FPS = 2
DEFAULT_MAX_CANDIDATES = 1000

ProgressCallback = Callable[[str], None]


class FrameExtractionError(RuntimeError):
    """Raised when frame extraction fails."""


def extract_frames(
    video_path: Path,
    fps: int = DEFAULT_TARGET_FPS,
    output_dir: Optional[Path] = None,
    max_candidates: int = DEFAULT_MAX_CANDIDATES,
    jpeg_quality: int = 90,
    progress_callback: Optional[ProgressCallback] = None,
) -> list[Path]:
    """
    Extract frames from a video at a target sampling FPS.

    Args:
        video_path:       Input video path.
        fps:              Target sampling rate (frames per second).
        output_dir:       Directory for extracted JPEGs. If None, a sibling directory
                          is created next to the input file.
        max_candidates:   Hard cap on number of extracted frames.
        jpeg_quality:     JPEG quality (0-100).
        progress_callback:Optional callback for coarse progress messages.

    Returns:
        List of extracted frame image paths.
    """
    if fps <= 0:
        raise FrameExtractionError(f"fps must be > 0, got {fps}")
    if max_candidates <= 0:
        raise FrameExtractionError(f"max_candidates must be > 0, got {max_candidates}")
    if not video_path.exists() or not video_path.is_file():
        raise FrameExtractionError(f"Video file not found: {video_path}")

    destination = output_dir or video_path.with_name(f"{video_path.stem}_candidates")
    destination.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise FrameExtractionError(f"Failed to open video: {video_path}")

    try:
        source_fps = cap.get(cv2.CAP_PROP_FPS)
        if source_fps is None or source_fps <= 0:
            source_fps = 30.0
            logger.warning(
                "Video reported invalid FPS. Falling back to %.1f FPS for sampling.",
                source_fps,
            )

        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        total_frames_int = int(total_frames) if total_frames and total_frames > 0 else 0

        desired_step = max(int(round(source_fps / float(fps))), 1)
        if total_frames_int > 0:
            cap_safety_step = max(int(math.ceil(total_frames_int / float(max_candidates))), 1)
            frame_step = max(desired_step, cap_safety_step)
        else:
            frame_step = desired_step

        logger.info(
            (
                "Extracting frames from %s at target=%s FPS "
                "(source=%.2f, total_frames=%s, desired_step=%d, final_step=%d)."
            ),
            video_path,
            fps,
            source_fps,
            total_frames_int if total_frames_int > 0 else "unknown",
            desired_step,
            frame_step,
        )

        extracted: list[Path] = []
        frame_index = 0

        while True:
            success, frame = cap.read()
            if not success:
                break

            if frame_index % frame_step == 0:
                frame_name = f"frame_{len(extracted):04d}.jpg"
                out_path = destination / frame_name
                write_ok = cv2.imwrite(
                    str(out_path),
                    frame,
                    [cv2.IMWRITE_JPEG_QUALITY, int(jpeg_quality)],
                )
                if not write_ok:
                    raise FrameExtractionError(f"Failed to write extracted frame: {out_path}")

                extracted.append(out_path)
                if progress_callback and len(extracted) % 25 == 0:
                    progress_callback(f"Extracted {len(extracted)} candidate frames...")

                if len(extracted) >= max_candidates:
                    logger.info(
                        "Reached max candidate frame cap (%d). Stopping extraction.",
                        max_candidates,
                    )
                    break

            frame_index += 1

        if not extracted:
            raise FrameExtractionError(
                f"No frames extracted from video '{video_path}'. "
                "File may be corrupted or unreadable."
            )

        logger.info("Frame extraction complete: %d candidate frame(s).", len(extracted))
        return extracted

    finally:
        cap.release()
