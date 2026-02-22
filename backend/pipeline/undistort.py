"""
Optional fisheye undistortion helpers for StructIQ (Chunk 4.4).
"""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np


class UndistortError(RuntimeError):
    """Raised when fisheye undistortion fails."""


def undistort_frame(
    frame_path: Path,
    camera_params: dict,
    output_path: Path | None = None,
) -> Path:
    """
    Undistort a frame using OpenCV fisheye calibration parameters.

    Expected camera_params keys:
      - camera_matrix: 3x3 intrinsic matrix
      - dist_coeffs:   fisheye distortion coefficients (length 4)
    """
    if not frame_path.exists():
        raise UndistortError(f"Frame not found: {frame_path}")

    camera_matrix = camera_params.get("camera_matrix")
    dist_coeffs = camera_params.get("dist_coeffs")
    if camera_matrix is None or dist_coeffs is None:
        raise UndistortError(
            "camera_params must include 'camera_matrix' and 'dist_coeffs'."
        )

    k = np.asarray(camera_matrix, dtype=np.float64)
    d = np.asarray(dist_coeffs, dtype=np.float64).reshape(-1, 1)
    if k.shape != (3, 3):
        raise UndistortError(f"camera_matrix must be shape (3,3), got {k.shape}")

    image = cv2.imread(str(frame_path))
    if image is None:
        raise UndistortError(f"Failed to read frame image: {frame_path}")

    undistorted = cv2.fisheye.undistortImage(image, K=k, D=d, Knew=k)
    if output_path is None:
        output_path = frame_path.with_name(f"{frame_path.stem}_undistorted{frame_path.suffix}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    ok = cv2.imwrite(str(output_path), undistorted)
    if not ok:
        raise UndistortError(f"Failed to write undistorted frame: {output_path}")

    return output_path
