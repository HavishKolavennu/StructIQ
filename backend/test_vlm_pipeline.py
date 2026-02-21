"""
Manual test runner for the VLM analysis pipeline (Sub-task 1.6).

Usage:
    cd backend
    python test_vlm_pipeline.py --frames /path/to/frame/directory --zone floor_3

    # Or point at individual files:
    python test_vlm_pipeline.py --frames img1.jpg img2.jpg img3.jpg

Options:
    --frames    Directory of images OR space-separated list of image paths
    --zone      Zone id to analyse (default: floor_3)
    --job-id    Job id used in output frame paths (default: test_run)
    --out       Save results JSON to this file (default: prints to stdout)
    --dry-run   Skip VLM calls, inject mock observations (useful for testing aggregation)

Environment:
    KIMI_API_KEY        / KIMI_MODEL / KIMI_BASE_URL
    ANTHROPIC_API_KEY   / CLAUDE_VISION_MODEL
    USE_CLAUDE_FALLBACK (true | false)

    Load from a .env file by setting the vars before running, or install python-dotenv
    and they are loaded automatically.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Bootstrap: add the backend/ directory to sys.path so imports work when
# running directly with `python test_vlm_pipeline.py` from the backend/ dir.
# ---------------------------------------------------------------------------
_HERE = Path(__file__).resolve().parent        # absolute path to backend/
_PROJECT_ROOT = _HERE.parent                   # absolute path to StructIQ/
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))     # enables `from backend.X import ...`

# Try to load .env from backend/ or project root
try:
    from dotenv import load_dotenv
    for env_candidate in [_HERE / ".env", _HERE.parent / ".env"]:
        if env_candidate.exists():
            load_dotenv(env_candidate)
            print(f"Loaded env from {env_candidate}")
            break
except ImportError:
    pass  # python-dotenv not installed — rely on shell env

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("test_pipeline")

_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}


def collect_frames(frame_args: list[str]) -> list[Path]:
    """Resolve --frames argument to a sorted list of image Paths."""
    paths: list[Path] = []
    for arg in frame_args:
        p = Path(arg)
        if p.is_dir():
            for ext in _IMAGE_EXTS:
                paths.extend(sorted(p.glob(f"*{ext}")))
        elif p.is_file() and p.suffix in _IMAGE_EXTS:
            paths.append(p)
        else:
            logger.warning("Skipping '%s' — not a recognised image file or directory.", arg)
    return paths


def make_mock_observations(frames: list[Path], zone_id: str) -> list[dict]:
    """
    Return synthetic observations so you can test the aggregation logic
    without spending API credits. Injects realistic-looking data for
    the Floor 3 demo work packages.
    """
    from backend.models.work_packages import get_demo_work_packages
    wps = get_demo_work_packages(zone_id)

    mock_data = []
    for i, frame_path in enumerate(frames):
        observations = []

        # Simulate: beam_central_1 consistently "connected" in first 3 frames
        if i < 3 and any(wp.id == "wp_beam_layout" for wp in wps):
            observations.append({
                "element_id": "beam_central_1",
                "work_package_id": "wp_beam_layout",
                "stage": "connected",
                "evidence": "(MOCK) Steel I-beam with visible bolt heads at both column connections.",
                "confidence": "high",
            })

        # Simulate: beam_left_1 seen once as "placed" (low confidence)
        if i == 1 and any(wp.id == "wp_beam_layout" for wp in wps):
            observations.append({
                "element_id": "beam_left_1",
                "work_package_id": "wp_beam_layout",
                "stage": "placed",
                "evidence": "(MOCK) Beam resting on columns with temporary bracing visible.",
                "confidence": "medium",
            })

        # Simulate: beam_right_1 never captured → will appear as not_captured

        # Simulate: plumbing — conflicting assessments across frames
        if any(wp.id == "wp_plumbing_roughin" for wp in wps):
            if i == 0:
                observations.append({
                    "element_id": "pipe_main_supply",
                    "work_package_id": "wp_plumbing_roughin",
                    "stage": "rough_in_started",
                    "evidence": "(MOCK) Partial pipe run visible with hangers installed.",
                    "confidence": "medium",
                })
            elif i == 1:
                observations.append({
                    "element_id": "pipe_main_supply",
                    "work_package_id": "wp_plumbing_roughin",
                    "stage": "rough_in_complete",  # Different stage — triggers conflict
                    "evidence": "(MOCK) Full pipe run appears complete from this angle.",
                    "confidence": "low",
                })
            elif i == 2:
                observations.append({
                    "element_id": "pipe_main_supply",
                    "work_package_id": "wp_plumbing_roughin",
                    "stage": "rough_in_started",
                    "evidence": "(MOCK) Some branches still missing.",
                    "confidence": "medium",
                })

        mock_data.append({
            "frame_id": frame_path.name,
            "observations": observations,
        })

    return mock_data


def main() -> None:
    parser = argparse.ArgumentParser(description="Test the StructIQ VLM analysis pipeline.")
    parser.add_argument(
        "--frames",
        nargs="+",
        required=True,
        metavar="PATH",
        help="Directory of images OR individual image file paths.",
    )
    parser.add_argument("--zone", default="floor_3", help="Zone id (default: floor_3)")
    parser.add_argument("--job-id", default="test_run", help="Job id for frame URL paths")
    parser.add_argument("--out", default=None, help="Save results JSON to file (default: stdout)")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Skip VLM API calls — use mock observations to test aggregation.",
    )
    args = parser.parse_args()

    frames = collect_frames(args.frames)
    if not frames:
        logger.error("No image files found. Check --frames argument.")
        sys.exit(1)

    logger.info("Found %d frame(s) to analyse.", len(frames))
    for f in frames:
        logger.info("  %s", f)

    if args.dry_run:
        logger.info("DRY RUN: injecting mock observations (no API calls).")
        from backend.models.work_packages import get_demo_work_packages
        from backend.pipeline.aggregator import aggregate_observations, compute_work_package_stage
        from backend.pipeline.analyzer import _assemble_results

        wps = get_demo_work_packages(args.zone)
        mock_obs = make_mock_observations(frames, args.zone)
        element_results = aggregate_observations(mock_obs, wps)
        results = _assemble_results(
            job_id=args.job_id,
            zone_id=args.zone,
            zone_label=args.zone.replace("_", " ").title(),
            work_packages=wps,
            element_results=element_results,
            selected_frame_count=len(frames),
            failed_frames=[],
        )
    else:
        # Live run — sends frames to Kimi / Claude
        from backend.pipeline.analyzer import run_analysis

        def on_progress(step: str, detail: str) -> None:
            print(f"[{step}] {detail}")

        results = run_analysis(
            selected_frames=frames,
            zone_id=args.zone,
            job_id=args.job_id,
            progress_callback=on_progress,
        )

    # ---------------------------------------------------------------------------
    # Pretty print summary
    # ---------------------------------------------------------------------------
    summary = results.get("summary", {})
    print("\n" + "=" * 60)
    print(f"RESULTS — {results.get('zone_label')}  (job: {results.get('job_id')})")
    print("=" * 60)
    print(f"Work packages : {summary.get('total_work_packages')}")
    print(f"Total elements: {summary.get('total_elements')}")
    print(f"Breakdown     : {summary.get('stages_breakdown')}")
    if summary.get("failed_frames"):
        print(f"Failed frames : {summary.get('failed_frames')}")
    print()

    for wp in results.get("work_packages", []):
        print(f"  [{wp['overall_stage'].upper()}] {wp['name']}  (owner: {wp['owner']})")
        for elem in wp.get("elements", []):
            conf = elem["confidence"]
            conflict = " ⚠" if elem.get("conflicting") else ""
            evidence_count = len(elem.get("frame_evidence", []))
            print(
                f"    - {elem['name']:<22} {elem['stage']:<22} "
                f"conf:{conf:<6} frames:{evidence_count}{conflict}"
            )
        print()

    print("=" * 60)

    # ---------------------------------------------------------------------------
    # Output full JSON
    # ---------------------------------------------------------------------------
    json_str = json.dumps(results, indent=2)
    if args.out:
        out_path = Path(args.out)
        out_path.write_text(json_str)
        print(f"\nFull results saved to: {out_path.resolve()}")
    else:
        print("\nFull results JSON:")
        print(json_str)


if __name__ == "__main__":
    main()
