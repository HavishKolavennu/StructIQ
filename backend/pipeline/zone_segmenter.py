"""
Timeline segmentation by QR detections (Chunk 4.3).

Public API:
    segment_by_zone(frame_paths, qr_detections) -> ZoneSegmentationResult
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .qr_detector import QRDetection


@dataclass(slots=True)
class ZoneTransition:
    frame_index: int
    zone_id: str
    zone_label: str

    def to_dict(self) -> dict:
        return {
            "frame_index": self.frame_index,
            "zone_id": self.zone_id,
            "zone_label": self.zone_label,
        }


@dataclass(slots=True)
class ZoneSegmentationResult:
    zone_frames: dict[str, list[Path]]
    zone_metadata: dict[str, dict]
    unlocalized_frames: list[Path]
    transitions: list[ZoneTransition]

    def to_dict(self) -> dict:
        return {
            "zone_frames": {
                zone_id: [str(path) for path in paths]
                for zone_id, paths in self.zone_frames.items()
            },
            "zone_metadata": self.zone_metadata,
            "unlocalized_frames": [str(path) for path in self.unlocalized_frames],
            "transitions": [transition.to_dict() for transition in self.transitions],
        }


def segment_by_zone(
    frame_paths: list[Path],
    qr_detections: list[QRDetection],
) -> ZoneSegmentationResult:
    """
    Assign each frame to the most recently detected zone.

    Rules:
      - Frames before the first QR are marked unlocalized.
      - A new detection updates the active zone from that frame onward.
    """
    ordered_detections = sorted(qr_detections, key=lambda item: item.frame_index)

    zone_frames: dict[str, list[Path]] = {}
    zone_metadata: dict[str, dict] = {}
    unlocalized_frames: list[Path] = []
    transitions: list[ZoneTransition] = []

    detection_idx = 0
    current_zone_id: str | None = None

    for frame_index, frame_path in enumerate(frame_paths):
        while detection_idx < len(ordered_detections):
            detection = ordered_detections[detection_idx]
            if detection.frame_index > frame_index:
                break

            zone_data = detection.zone_data
            next_zone_id = str(zone_data["zone_id"])
            next_zone_label = str(zone_data.get("zone_label", next_zone_id))

            zone_metadata.setdefault(next_zone_id, zone_data)
            if current_zone_id != next_zone_id:
                transitions.append(
                    ZoneTransition(
                        frame_index=frame_index,
                        zone_id=next_zone_id,
                        zone_label=next_zone_label,
                    )
                )
            current_zone_id = next_zone_id
            detection_idx += 1

        if current_zone_id is None:
            unlocalized_frames.append(frame_path)
            continue

        zone_frames.setdefault(current_zone_id, []).append(frame_path)

    return ZoneSegmentationResult(
        zone_frames=zone_frames,
        zone_metadata=zone_metadata,
        unlocalized_frames=unlocalized_frames,
        transitions=transitions,
    )
