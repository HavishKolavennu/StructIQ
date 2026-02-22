"""
Smart frame selection with diversity filtering for StructIQ (Chunk 4.3).

Public API:
    select_frames(candidates, max_frames=25, ssim_threshold=0.85)
        -> (selected_frame_paths, SelectionMetadata)
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from .frame_scorer import (
    DIVERSITY_WEIGHT_RESERVED,
    WEIGHT_CONTRAST,
    WEIGHT_EDGE_DENSITY,
    WEIGHT_SHARPNESS,
    FrameScore,
    FrameScoringError,
    score_frame,
)

try:
    from skimage.metrics import structural_similarity as _skimage_ssim
except ImportError:  # Optional dependency. We have a fallback implementation.
    _skimage_ssim = None


@dataclass(slots=True)
class SelectionDecision:
    frame_id: str
    frame_path: str
    selected: bool
    reason: str

    sharpness: float
    contrast: float
    edge_density: float
    quality_score: float

    max_ssim_with_selected: Optional[float]
    diversity_score: float
    final_score: float

    def to_dict(self) -> dict:
        return {
            "frame_id": self.frame_id,
            "frame_path": self.frame_path,
            "selected": self.selected,
            "reason": self.reason,
            "sharpness": self.sharpness,
            "contrast": self.contrast,
            "edge_density": self.edge_density,
            "quality_score": self.quality_score,
            "max_ssim_with_selected": self.max_ssim_with_selected,
            "diversity_score": self.diversity_score,
            "final_score": self.final_score,
        }


@dataclass(slots=True)
class SelectionMetadata:
    total_candidates: int
    selected_count: int
    rejected_count: int
    max_frames: int
    ssim_threshold: float
    selection_criteria: dict
    decisions: list[SelectionDecision]

    def to_dict(self) -> dict:
        return {
            "total_candidates": self.total_candidates,
            "selected_count": self.selected_count,
            "rejected_count": self.rejected_count,
            "max_frames": self.max_frames,
            "ssim_threshold": self.ssim_threshold,
            "selection_criteria": self.selection_criteria,
            "decisions": [decision.to_dict() for decision in self.decisions],
        }


def select_frames(
    candidates: list[Path],
    max_frames: int = 25,
    ssim_threshold: float = 0.85,
) -> tuple[list[Path], SelectionMetadata]:
    """
    Score and select a diverse subset of candidate frames.

    Strategy:
      1) Score all frames by quality (sharpness/contrast/edge density).
      2) Sort by quality descending.
      3) Greedy pass with SSIM diversity constraint:
           - reject if max SSIM with selected set > threshold
           - otherwise select
      4) Stop selecting at max_frames.
    """
    if max_frames <= 0:
        raise ValueError("max_frames must be > 0")
    if not 0.0 <= ssim_threshold <= 1.0:
        raise ValueError("ssim_threshold must be in [0, 1]")

    if not candidates:
        metadata = SelectionMetadata(
            total_candidates=0,
            selected_count=0,
            rejected_count=0,
            max_frames=max_frames,
            ssim_threshold=ssim_threshold,
            selection_criteria=_criteria_dict(),
            decisions=[],
        )
        return [], metadata

    scored: list[FrameScore] = []
    decisions: list[SelectionDecision] = []

    for frame_path in candidates:
        try:
            scored.append(score_frame(frame_path))
        except FrameScoringError as exc:
            decisions.append(
                SelectionDecision(
                    frame_id=frame_path.name,
                    frame_path=str(frame_path),
                    selected=False,
                    reason=f"Rejected: scoring failed ({exc}).",
                    sharpness=0.0,
                    contrast=0.0,
                    edge_density=0.0,
                    quality_score=0.0,
                    max_ssim_with_selected=None,
                    diversity_score=0.0,
                    final_score=0.0,
                )
            )

    scored.sort(key=lambda item: item.composite_score, reverse=True)

    selected_paths: list[Path] = []
    selected_similarity_images: list[np.ndarray] = []
    similarity_cache: dict[Path, np.ndarray] = {}

    for score in scored:
        if len(selected_paths) >= max_frames:
            decisions.append(
                SelectionDecision(
                    frame_id=score.frame_id,
                    frame_path=str(score.frame_path),
                    selected=False,
                    reason="Rejected: max_frames limit reached.",
                    sharpness=score.sharpness,
                    contrast=score.contrast,
                    edge_density=score.edge_density,
                    quality_score=score.quality_score,
                    max_ssim_with_selected=None,
                    diversity_score=0.0,
                    final_score=score.quality_score,
                )
            )
            continue

        frame_similarity_img = similarity_cache.get(score.frame_path)
        if frame_similarity_img is None:
            frame_similarity_img = _load_similarity_image(score.frame_path)
            if frame_similarity_img is None:
                decisions.append(
                    SelectionDecision(
                        frame_id=score.frame_id,
                        frame_path=str(score.frame_path),
                        selected=False,
                        reason="Rejected: failed to load image for similarity check.",
                        sharpness=score.sharpness,
                        contrast=score.contrast,
                        edge_density=score.edge_density,
                        quality_score=score.quality_score,
                        max_ssim_with_selected=None,
                        diversity_score=0.0,
                        final_score=score.quality_score,
                    )
                )
                continue
            similarity_cache[score.frame_path] = frame_similarity_img

        if not selected_similarity_images:
            diversity_score = 1.0
            final_score = score.quality_score + DIVERSITY_WEIGHT_RESERVED * diversity_score
            selected_paths.append(score.frame_path)
            selected_similarity_images.append(frame_similarity_img)
            decisions.append(
                SelectionDecision(
                    frame_id=score.frame_id,
                    frame_path=str(score.frame_path),
                    selected=True,
                    reason="Selected: seed frame (highest quality).",
                    sharpness=score.sharpness,
                    contrast=score.contrast,
                    edge_density=score.edge_density,
                    quality_score=score.quality_score,
                    max_ssim_with_selected=None,
                    diversity_score=diversity_score,
                    final_score=final_score,
                )
            )
            continue

        similarity_scores = [
            _compute_ssim(frame_similarity_img, selected_img)
            for selected_img in selected_similarity_images
        ]
        max_ssim = max(similarity_scores) if similarity_scores else 0.0
        diversity_score = max(0.0, 1.0 - max_ssim)
        final_score = score.quality_score + DIVERSITY_WEIGHT_RESERVED * diversity_score

        if max_ssim > ssim_threshold:
            decisions.append(
                SelectionDecision(
                    frame_id=score.frame_id,
                    frame_path=str(score.frame_path),
                    selected=False,
                    reason=(
                        f"Rejected: too similar (max SSIM={max_ssim:.3f} > "
                        f"threshold={ssim_threshold:.3f})."
                    ),
                    sharpness=score.sharpness,
                    contrast=score.contrast,
                    edge_density=score.edge_density,
                    quality_score=score.quality_score,
                    max_ssim_with_selected=max_ssim,
                    diversity_score=diversity_score,
                    final_score=final_score,
                )
            )
            continue

        selected_paths.append(score.frame_path)
        selected_similarity_images.append(frame_similarity_img)
        decisions.append(
            SelectionDecision(
                frame_id=score.frame_id,
                frame_path=str(score.frame_path),
                selected=True,
                reason=(
                    f"Selected: quality + diversity (max SSIM={max_ssim:.3f} <= "
                    f"threshold={ssim_threshold:.3f})."
                ),
                sharpness=score.sharpness,
                contrast=score.contrast,
                edge_density=score.edge_density,
                quality_score=score.quality_score,
                max_ssim_with_selected=max_ssim,
                diversity_score=diversity_score,
                final_score=final_score,
            )
        )

    metadata = SelectionMetadata(
        total_candidates=len(candidates),
        selected_count=len(selected_paths),
        rejected_count=max(len(decisions) - len(selected_paths), 0),
        max_frames=max_frames,
        ssim_threshold=ssim_threshold,
        selection_criteria=_criteria_dict(),
        decisions=decisions,
    )
    return selected_paths, metadata


def _criteria_dict() -> dict:
    return {
        "sharpness_weight": WEIGHT_SHARPNESS,
        "contrast_weight": WEIGHT_CONTRAST,
        "edge_density_weight": WEIGHT_EDGE_DENSITY,
        "diversity_weight_reserved": DIVERSITY_WEIGHT_RESERVED,
    }


def _load_similarity_image(frame_path: Path, target_size: tuple[int, int] = (320, 180)) -> Optional[np.ndarray]:
    """
    Load and resize an image for fast SSIM comparison.
    """
    gray = cv2.imread(str(frame_path), cv2.IMREAD_GRAYSCALE)
    if gray is None:
        return None
    return cv2.resize(gray, target_size, interpolation=cv2.INTER_AREA)


def _compute_ssim(image_a: np.ndarray, image_b: np.ndarray) -> float:
    """
    Compute SSIM in [0, 1] (best-effort).
    Uses scikit-image if available, otherwise a global-formula fallback.
    """
    if image_a.shape != image_b.shape:
        image_b = cv2.resize(image_b, (image_a.shape[1], image_a.shape[0]), interpolation=cv2.INTER_AREA)

    if _skimage_ssim is not None:
        score = float(_skimage_ssim(image_a, image_b, data_range=255))
        return float(np.clip(score, 0.0, 1.0))

    a = image_a.astype(np.float64)
    b = image_b.astype(np.float64)
    mu_a = a.mean()
    mu_b = b.mean()
    sigma_a = ((a - mu_a) ** 2).mean()
    sigma_b = ((b - mu_b) ** 2).mean()
    sigma_ab = ((a - mu_a) * (b - mu_b)).mean()

    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2

    numerator = (2 * mu_a * mu_b + c1) * (2 * sigma_ab + c2)
    denominator = (mu_a**2 + mu_b**2 + c1) * (sigma_a + sigma_b + c2)
    if denominator == 0:
        return 0.0

    return float(np.clip(numerator / denominator, 0.0, 1.0))
