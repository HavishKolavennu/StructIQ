"""Background pipeline orchestration for upload jobs."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable

try:
    from ..config import PROCESSING_DIR, RESULTS_DIR, USE_MOCK_PIPELINE
    from ..mock_results import build_mock_results
except ImportError:  # Supports imports when running from backend/ directly
    from config import PROCESSING_DIR, RESULTS_DIR, USE_MOCK_PIPELINE
    from mock_results import build_mock_results

StatusUpdater = Callable[[str, str, str | None], None]


def process_job(
    job_id: str,
    zone_id: str,
    video_path: Path,
    update_status: StatusUpdater,
) -> None:
    """Run the pipeline steps for one uploaded video job."""
    try:
        update_status('processing', 'frame_extraction', 'Extracting frames from upload...')

        if USE_MOCK_PIPELINE:
            update_status('processing', 'frame_selection', 'Selecting best frames (mock)...')
            selected_frames = [f'frame_{i:03d}.jpg' for i in range(1, 6)]

            update_status('processing', 'vlm_analysis', 'Running VLM analysis (mock)...')
            _write_placeholder_frames(job_id, selected_frames)
            results = build_mock_results(job_id, zone_id)
        else:
            try:
                from .video_processor import process_video
                from .analyzer import run_analysis
            except ImportError:
                from pipeline.video_processor import process_video
                from pipeline.analyzer import run_analysis

            selected_paths, _metadata = process_video(video_path=video_path, zone_id=zone_id)

            update_status(
                'processing',
                'vlm_analysis',
                f'Analyzing {len(selected_paths)} selected frame(s)...',
            )
            results = run_analysis(selected_frames=selected_paths, zone_id=zone_id, job_id=job_id)

        update_status('processing', 'assembling_results', 'Saving structured results...')
        result_dir = RESULTS_DIR / job_id
        result_dir.mkdir(parents=True, exist_ok=True)
        (result_dir / 'results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')

        update_status('complete', 'complete', 'Processing complete.')
    except Exception as exc:
        update_status('error', 'failed', f'Pipeline failed: {exc}', str(exc))


def _write_placeholder_frames(job_id: str, frame_names: list[str]) -> None:
    """Create tiny placeholder frame files for API frame endpoints during mock mode."""
    frame_dir = PROCESSING_DIR / job_id / 'selected'
    frame_dir.mkdir(parents=True, exist_ok=True)
    jpeg_stub = bytes.fromhex('FFD8FFE000104A46494600010100000100010000FFDB004300')

    for name in frame_names:
        (frame_dir / name).write_bytes(jpeg_stub)
