"""
Pipeline package exports.

Lazy attribute loading avoids importing optional/heavy dependencies (like OpenCV)
until a specific function/class is requested.
"""

from __future__ import annotations

from importlib import import_module

_EXPORTS: dict[str, tuple[str, str]] = {
    "extract_frames": ("frame_extractor", "extract_frames"),
    "FrameExtractionError": ("frame_extractor", "FrameExtractionError"),
    "score_frame": ("frame_scorer", "score_frame"),
    "FrameScore": ("frame_scorer", "FrameScore"),
    "FrameScoringError": ("frame_scorer", "FrameScoringError"),
    "scan_frames_for_qr": ("qr_detector", "scan_frames_for_qr"),
    "QRDetection": ("qr_detector", "QRDetection"),
    "QRDetectionError": ("qr_detector", "QRDetectionError"),
    "segment_by_zone": ("zone_segmenter", "segment_by_zone"),
    "ZoneSegmentationResult": ("zone_segmenter", "ZoneSegmentationResult"),
    "select_frames": ("frame_selector", "select_frames"),
    "SelectionMetadata": ("frame_selector", "SelectionMetadata"),
    "undistort_frame": ("undistort", "undistort_frame"),
    "UndistortError": ("undistort", "UndistortError"),
    "process_video": ("video_processor", "process_video"),
    "VideoProcessingError": ("video_processor", "VideoProcessingError"),
    "VideoProcessingResult": ("video_processor", "VideoProcessingResult"),
}

__all__ = list(_EXPORTS.keys())


def __getattr__(name: str):
    if name not in _EXPORTS:
        raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

    module_name, attr_name = _EXPORTS[name]
    module = import_module(f"{__name__}.{module_name}")
    value = getattr(module, attr_name)
    globals()[name] = value
    return value
