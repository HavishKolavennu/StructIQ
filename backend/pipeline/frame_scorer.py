"""
Frame quality scoring for StructIQ (Chunk 4.2).

Public API:
    score_frame(frame_path) -> FrameScore
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

# Weights from architecture/tasks:
# - 40% sharpness
# - 15% contrast
# - 15% information density (edge ratio)
# - 30% reserved for diversity in frame selection stage
WEIGHT_SHARPNESS = 0.40
WEIGHT_CONTRAST = 0.15
WEIGHT_EDGE_DENSITY = 0.15
DIVERSITY_WEIGHT_RESERVED = 0.30


class FrameScoringError(RuntimeError):
    """Raised when a frame cannot be scored."""


@dataclass(slots=True)
class FrameScore:
    """Per-frame quality metrics and weighted quality score."""

    frame_id: str
    frame_path: Path

    sharpness: float
    contrast: float
    edge_density: float

    sharpness_norm: float
    contrast_norm: float
    edge_density_norm: float

    quality_score: float
    composite_score: float

    def to_dict(self) -> dict:
        return {
            "frame_id": self.frame_id,
            "frame_path": str(self.frame_path),
            "sharpness": self.sharpness,
            "contrast": self.contrast,
            "edge_density": self.edge_density,
            "sharpness_norm": self.sharpness_norm,
            "contrast_norm": self.contrast_norm,
            "edge_density_norm": self.edge_density_norm,
            "quality_score": self.quality_score,
            "composite_score": self.composite_score,
        }


def score_frame(frame_path: Path) -> FrameScore:
    """
    Compute frame quality metrics and weighted quality score.

    Metrics:
      - sharpness: Laplacian variance
      - contrast: grayscale std-dev
      - edge_density: ratio of edge pixels from Canny detector

    Returns:
      FrameScore where `quality_score` is the weighted quality component
      (0.70 max), and `composite_score` initially equals quality_score.
      The selector may add diversity contribution (up to +0.30) later.
    """
    gray = cv2.imread(str(frame_path), cv2.IMREAD_GRAYSCALE)
    if gray is None:
        raise FrameScoringError(f"Failed to read frame for scoring: {frame_path}")

    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    contrast = float(gray.std())

    edges = cv2.Canny(gray, threshold1=100, threshold2=200)
    edge_density = float(np.count_nonzero(edges) / edges.size) if edges.size else 0.0

    # Soft clipping keeps scores bounded while preserving rank order.
    sharpness_norm = _soft_clip(sharpness, scale=350.0)
    contrast_norm = _soft_clip(contrast, scale=35.0)
    edge_density_norm = min(edge_density / 0.20, 1.0)

    quality_score = (
        WEIGHT_SHARPNESS * sharpness_norm
        + WEIGHT_CONTRAST * contrast_norm
        + WEIGHT_EDGE_DENSITY * edge_density_norm
    )

    return FrameScore(
        frame_id=frame_path.name,
        frame_path=frame_path,
        sharpness=sharpness,
        contrast=contrast,
        edge_density=edge_density,
        sharpness_norm=sharpness_norm,
        contrast_norm=contrast_norm,
        edge_density_norm=edge_density_norm,
        quality_score=quality_score,
        composite_score=quality_score,
    )


def _soft_clip(value: float, scale: float) -> float:
    """
    Convert an unbounded metric to ~[0, 1) with diminishing returns.
    """
    if value <= 0:
        return 0.0
    return float(value / (value + scale))
