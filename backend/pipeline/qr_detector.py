"""
QR code detection for zone localization (Chunk 4.2).

Public API:
    scan_frames_for_qr(frame_paths) -> list[QRDetection]
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

ProgressCallback = Callable[[str], None]

REQUIRED_QR_FIELDS = {"zone_id", "zone_label", "project_id", "work_packages"}


class QRDetectionError(RuntimeError):
    """Raised when QR detection cannot run or returns unusable data."""


@dataclass(slots=True)
class QRDetection:
    frame_index: int
    frame_path: Path
    zone_data: dict
    payload_text: str
    qr_type: str
    rect: tuple[int, int, int, int] | None

    def to_dict(self) -> dict:
        return {
            "frame_index": self.frame_index,
            "frame_path": str(self.frame_path),
            "zone_data": self.zone_data,
            "payload_text": self.payload_text,
            "qr_type": self.qr_type,
            "rect": list(self.rect) if self.rect else None,
        }


def scan_frames_for_qr(
    frame_paths: list[Path],
    progress_callback: Optional[ProgressCallback] = None,
) -> list[QRDetection]:
    """
    Scan extracted frames for QR payloads.

    Notes:
      - For each frame, only the first valid QR payload is used to avoid
        ambiguous multi-zone detections in a single frame.
      - Invalid JSON payloads are skipped with warnings.
    """
    decoder = _load_qr_decoder()

    detections: list[QRDetection] = []

    for idx, frame_path in enumerate(frame_paths):
        image = cv2.imread(str(frame_path))
        if image is None:
            logger.warning("Skipping unreadable frame during QR scan: %s", frame_path)
            continue

        codes = decoder(image)
        if not codes:
            continue

        first_valid: QRDetection | None = None
        for code in codes:
            payload_raw = code.payload_text.strip()
            if not payload_raw:
                continue

            try:
                zone_data = json.loads(payload_raw)
            except json.JSONDecodeError:
                logger.warning(
                    "Invalid QR JSON in frame '%s': %s",
                    frame_path.name,
                    payload_raw[:160],
                )
                continue

            try:
                normalized_zone_data = _validate_zone_payload(zone_data)
            except QRDetectionError as exc:
                logger.warning(
                    "Invalid QR payload in frame '%s': %s",
                    frame_path.name,
                    exc,
                )
                continue

            first_valid = QRDetection(
                frame_index=idx,
                frame_path=frame_path,
                zone_data=normalized_zone_data,
                payload_text=payload_raw,
                qr_type=code.qr_type,
                rect=code.rect,
            )
            break

        if first_valid is not None:
            detections.append(first_valid)

        if progress_callback and (idx + 1) % 100 == 0:
            progress_callback(
                f"QR scan progress: {idx + 1}/{len(frame_paths)} frame(s) checked."
            )

    detections.sort(key=lambda item: item.frame_index)
    logger.info("QR scan complete: %d detection(s).", len(detections))
    return detections


@dataclass(slots=True)
class _DecodedQR:
    payload_text: str
    qr_type: str
    rect: tuple[int, int, int, int] | None


def _load_qr_decoder():
    try:
        from pyzbar.pyzbar import decode as pyzbar_decode

        def _decoder(image: np.ndarray) -> list[_DecodedQR]:
            decoded = []
            for item in pyzbar_decode(image):
                payload = bytes(getattr(item, "data", b"")).decode(
                    "utf-8",
                    errors="ignore",
                ).strip()
                rect = getattr(item, "rect", None)
                rect_tuple = (
                    (int(rect.left), int(rect.top), int(rect.width), int(rect.height))
                    if rect is not None
                    else None
                )
                decoded.append(
                    _DecodedQR(
                        payload_text=payload,
                        qr_type=str(getattr(item, "type", "QRCODE")),
                        rect=rect_tuple,
                    )
                )
            return decoded

        logger.info("QR decoder backend: pyzbar")
        return _decoder

    except Exception:
        logger.warning(
            "pyzbar unavailable; falling back to OpenCV QRCodeDetector. "
            "Install `pyzbar` + `libzbar0` for best compatibility."
        )
        return _opencv_qr_decoder


def _opencv_qr_decoder(image: np.ndarray) -> list[_DecodedQR]:
    detector = cv2.QRCodeDetector()

    decoded: list[_DecodedQR] = []

    # Prefer multi-code path when available.
    ok_multi, decoded_info, points, _ = detector.detectAndDecodeMulti(image)
    if ok_multi and decoded_info is not None:
        for i, payload in enumerate(decoded_info):
            payload_text = (payload or "").strip()
            if not payload_text:
                continue
            rect_tuple = None
            if points is not None and len(points) > i:
                rect_tuple = _points_to_rect(points[i])
            decoded.append(
                _DecodedQR(
                    payload_text=payload_text,
                    qr_type="QRCODE",
                    rect=rect_tuple,
                )
            )
        if decoded:
            return decoded

    # Fallback to single-code decode for OpenCV builds with weaker multi support.
    payload_single, points_single, _ = detector.detectAndDecode(image)
    payload_single = (payload_single or "").strip()
    if payload_single:
        decoded.append(
            _DecodedQR(
                payload_text=payload_single,
                qr_type="QRCODE",
                rect=_points_to_rect(points_single) if points_single is not None else None,
            )
        )

    return decoded


def _points_to_rect(points) -> tuple[int, int, int, int] | None:
    arr = np.asarray(points).reshape(-1, 2)
    if arr.size == 0:
        return None
    x_min = int(np.min(arr[:, 0]))
    y_min = int(np.min(arr[:, 1]))
    x_max = int(np.max(arr[:, 0]))
    y_max = int(np.max(arr[:, 1]))
    return (x_min, y_min, max(x_max - x_min, 0), max(y_max - y_min, 0))


def _validate_zone_payload(zone_data: dict) -> dict:
    if not isinstance(zone_data, dict):
        raise QRDetectionError("QR payload must be a JSON object.")

    missing = REQUIRED_QR_FIELDS - set(zone_data.keys())
    if missing:
        raise QRDetectionError(
            f"QR payload missing required field(s): {', '.join(sorted(missing))}"
        )

    zone_id = str(zone_data["zone_id"]).strip()
    zone_label = str(zone_data["zone_label"]).strip()
    project_id = str(zone_data["project_id"]).strip()
    work_packages_raw = zone_data["work_packages"]

    if not zone_id:
        raise QRDetectionError("zone_id cannot be empty.")
    if not zone_label:
        raise QRDetectionError("zone_label cannot be empty.")
    if not project_id:
        raise QRDetectionError("project_id cannot be empty.")

    if not isinstance(work_packages_raw, list) or not work_packages_raw:
        raise QRDetectionError("work_packages must be a non-empty list of IDs.")

    work_packages: list[str] = []
    for wp in work_packages_raw:
        wp_id = str(wp).strip()
        if wp_id:
            work_packages.append(wp_id)
    if not work_packages:
        raise QRDetectionError("work_packages contains no valid IDs.")

    normalized = dict(zone_data)
    normalized["zone_id"] = zone_id
    normalized["zone_label"] = zone_label
    normalized["project_id"] = project_id
    normalized["work_packages"] = work_packages
    return normalized
