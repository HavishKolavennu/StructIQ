"""
Manual test runner for Chunk 4 QR-aware video processing pipeline.

Usage:
    cd backend
    python3 test_video_pipeline.py --video /path/to/video.mp4 --job-id demo_chunk4
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_PROJECT_ROOT = _HERE.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("test_video_pipeline")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Chunk 4 QR-aware video processing pipeline.")
    parser.add_argument("--video", required=True, help="Path to input video file.")
    parser.add_argument("--job-id", default=None, help="Optional fixed job id.")
    parser.add_argument("--fps", type=int, default=2, help="Frame extraction FPS (default: 2).")
    parser.add_argument("--max-frames", type=int, default=25, help="Max selected frames per zone.")
    parser.add_argument(
        "--ssim-threshold",
        type=float,
        default=0.85,
        help="Similarity threshold for diversity filter (default: 0.85).",
    )
    parser.add_argument(
        "--processing-root",
        default=None,
        help="Override processing root directory.",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Optional path to save full result JSON.",
    )
    args = parser.parse_args()

    from backend.pipeline.video_processor import process_video

    video_path = Path(args.video).resolve()
    processing_root = Path(args.processing_root).resolve() if args.processing_root else None

    def on_progress(step: str, detail: str) -> None:
        print(f"[{step}] {detail}")

    result = process_video(
        video_path=video_path,
        job_id=args.job_id,
        processing_root=processing_root,
        fps=args.fps,
        max_frames=args.max_frames,
        ssim_threshold=args.ssim_threshold,
        progress_callback=on_progress,
    )

    print("\n" + "=" * 60)
    print("CHUNK 4 PIPELINE RESULT (QR-AWARE)")
    print("=" * 60)
    print(f"Video            : {video_path}")
    print(f"Job ID           : {result.job_id}")
    print(f"Zones detected   : {len(result.zone_metadata)}")
    print(f"Metadata path    : {result.metadata_path}")
    print(f"Unlocalized      : {len(result.unlocalized_frames)} frame(s)")
    print("-" * 60)

    for zone_id, zone_data in result.zone_metadata.items():
        zone_label = str(zone_data.get("zone_label", zone_id))
        selected = result.zone_frames.get(zone_id, [])
        print(f"[{zone_label}] ({zone_id})")
        print(f"  selected_frames: {len(selected)}")
        if selected:
            print(f"  first_frame    : {selected[0]}")

    print("=" * 60)

    output_payload = result.to_dict()
    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(output_payload, indent=2))
        print(f"\nResult JSON saved to: {out_path.resolve()}")
    else:
        preview = json.dumps(output_payload, indent=2)
        print("\nResult preview:")
        print(preview[:2500] + ("\n... (truncated)" if len(preview) > 2500 else ""))


if __name__ == "__main__":
    main()
