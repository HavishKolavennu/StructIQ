from __future__ import annotations

import asyncio
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

import backend.main as main
import backend.pipeline.orchestrator as orchestrator


class DummyUploadFile:
    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self._content = content

    async def read(self) -> bytes:
        return self._content


class StructIQApiTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)

        self.uploads = self.root / "uploads"
        self.results = self.root / "results"
        self.frames = self.root / "frames"
        self.models = self.root / "models"

        for directory in (self.uploads, self.results, self.frames, self.models):
            directory.mkdir(parents=True, exist_ok=True)

        main.UPLOADS_DIR = self.uploads
        main.RESULTS_DIR = self.results
        main.FRAMES_DIR = self.frames
        main.MODELS_DIR = self.models
        orchestrator.RESULTS_DIR = self.results
        orchestrator.FRAMES_DIR = self.frames

        main.JOBS.clear()

    def tearDown(self):
        main.JOBS.clear()
        self.tempdir.cleanup()

    def _upload_file(self, filename: str = "walkthrough.mp4", content: bytes = b"fake-video") -> DummyUploadFile:
        return DummyUploadFile(filename=filename, content=content)

    def _run_bg_tasks(self, bg: BackgroundTasks) -> None:
        for task in bg.tasks:
            task.func(*task.args, **task.kwargs)

    def test_upload_accepts_video_and_returns_job(self):
        def noop_pipeline(job_id, video_path, jobs):
            return None

        bg = BackgroundTasks()
        with patch("backend.main.run_pipeline", side_effect=noop_pipeline):
            payload = asyncio.run(main.upload_video(bg, self._upload_file()))

        self.assertEqual(payload["status"], "processing")
        self.assertIn("job_id", payload)
        self.assertIn(payload["job_id"], main.JOBS)
        self.assertEqual(main.JOBS[payload["job_id"]]["current_step"], "frame_extraction")

    def test_status_endpoint_returns_qr_fields(self):
        job_id = "job-status-1"
        main.JOBS[job_id] = {
            "status": "processing",
            "current_step": "qr_detection",
            "progress_detail": "Detecting zones from QR codes...",
            "detected_zones": ["Floor 3 - Bay A"],
            "selected_frame_count": 0,
            "error_message": None,
            "results_path": None,
        }

        payload = asyncio.run(main.get_status(job_id))
        self.assertEqual(payload["current_step"], "qr_detection")
        self.assertEqual(payload["detected_zones"], ["Floor 3 - Bay A"])
        self.assertIn("progress_detail", payload)

    def test_results_endpoint_returns_404_when_not_ready(self):
        job_id = "job-not-ready"
        main.JOBS[job_id] = {
            "status": "processing",
            "current_step": "vlm_analysis",
            "progress_detail": "Analyzing...",
            "detected_zones": [],
            "selected_frame_count": 0,
            "error_message": None,
            "results_path": None,
        }

        with self.assertRaises(HTTPException) as err:
            asyncio.run(main.get_results(job_id))

        self.assertEqual(err.exception.status_code, 404)

    def test_full_upload_status_results_flow(self):
        def complete_pipeline(job_id, video_path, jobs):
            frame_dir = self.frames / job_id
            frame_dir.mkdir(parents=True, exist_ok=True)
            frame_file = frame_dir / "frame_001.jpg"
            frame_file.write_bytes(b"fake-jpg")

            result_dir = self.results / job_id
            result_dir.mkdir(parents=True, exist_ok=True)
            result_path = result_dir / "results.json"

            results_payload = {
                "job_id": job_id,
                "zone_id": "multi_zone",
                "zone_label": "Multi-Zone Walkthrough",
                "detected_zones": ["Floor 3 - Bay A"],
                "summary": {
                    "total_work_packages": 1,
                    "total_elements": 1,
                    "stages_breakdown": {
                        "complete": 0,
                        "in_progress": 1,
                        "not_started": 0,
                        "not_captured": 0,
                        "inspected": 0,
                    },
                },
                "work_packages": [],
                "selection_metadata": {"selected_count": 1},
            }
            result_path.write_text(json.dumps(results_payload), encoding="utf-8")

            jobs[job_id].update(
                {
                    "status": "complete",
                    "current_step": "complete",
                    "progress_detail": "Analysis complete.",
                    "detected_zones": ["Floor 3 - Bay A"],
                    "selected_frame_count": 1,
                    "results_path": str(result_path),
                }
            )

        bg = BackgroundTasks()
        with patch("backend.main.run_pipeline", side_effect=complete_pipeline):
            upload_payload = asyncio.run(main.upload_video(bg, self._upload_file()))
            self._run_bg_tasks(bg)

        job_id = upload_payload["job_id"]

        status_payload = asyncio.run(main.get_status(job_id))
        self.assertEqual(status_payload["status"], "complete")

        results_payload = asyncio.run(main.get_results(job_id))
        self.assertEqual(results_payload["job_id"], job_id)

        frame_response = asyncio.run(main.serve_frame(job_id, "frame_001.jpg"))
        self.assertIsInstance(frame_response, FileResponse)

    def test_model_endpoint_serves_glb(self):
        glb = self.models / "reference.glb"
        glb.write_bytes(b"fake-glb")

        response = asyncio.run(main.serve_model("reference.glb"))
        self.assertIsInstance(response, FileResponse)


if __name__ == "__main__":
    unittest.main()
