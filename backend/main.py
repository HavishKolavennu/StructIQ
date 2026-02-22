"""StructIQ FastAPI backend entrypoint for Chunk 6 API integration."""

from __future__ import annotations

import json
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# Load .env if present
try:
    from dotenv import load_dotenv

    for env_path in [Path(__file__).parent / ".env", Path(__file__).parent.parent / ".env"]:
        if env_path.exists():
            load_dotenv(env_path)
            break
except Exception:
    pass

try:
    from .config import CORS_ORIGINS, FRAMES_DIR, MODELS_DIR, RESULTS_DIR, UPLOADS_DIR, ensure_directories
    from .pipeline.orchestrator import run_pipeline
except ImportError:
    from config import CORS_ORIGINS, FRAMES_DIR, MODELS_DIR, RESULTS_DIR, UPLOADS_DIR, ensure_directories
    from pipeline.orchestrator import run_pipeline

app = FastAPI(title="StructIQ API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ensure_directories()

# In-memory job store for hackathon scope
JOBS: dict[str, dict] = {}


@app.get("/")
async def root() -> dict:
    return {"message": "StructIQ API", "docs": "/docs"}


@app.post("/api/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    demo_mode: bool = Form(False),
) -> dict:
    """Accepts one video file, creates a processing job, starts background pipeline."""
    if not video.filename:
        raise HTTPException(status_code=400, detail="Video filename is missing.")

    ext = Path(video.filename).suffix.lower()
    if ext not in {".mp4", ".mov", ".avi", ".mkv", ".webm"}:
        raise HTTPException(status_code=400, detail="Unsupported video format.")

    job_id = str(uuid.uuid4())
    dest = UPLOADS_DIR / f"{job_id}{ext}"

    contents = await video.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded video is empty.")
    dest.write_bytes(contents)

    JOBS[job_id] = {
        "status": "processing",
        "current_step": "frame_extraction",
        "progress_detail": "Upload received. Preparing processing pipeline...",
        "detected_zones": [],
        "selected_frame_count": 0,
        "error_message": None,
        "results_path": None,
        "upload_path": str(dest),
        "demo_mode": demo_mode,
    }

    background_tasks.add_task(run_pipeline, job_id, dest, JOBS, demo_mode)

    return {
        "job_id": job_id,
        "status": "processing",
        "message": "Upload received. Processing started.",
    }


@app.get("/api/status/{job_id}")
async def get_status(job_id: str) -> dict:
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job_id,
        "status": job["status"],
        "current_step": job.get("current_step", "processing"),
        "detected_zones": job.get("detected_zones", []),
        "progress_detail": job.get("progress_detail", ""),
        "selected_frame_count": job.get("selected_frame_count", 0),
        "demo_mode": job.get("demo_mode", False),
        "error_message": job.get("error_message"),
    }


@app.get("/api/results/{job_id}")
async def get_results(job_id: str) -> dict:
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "complete":
        raise HTTPException(status_code=404, detail="Results not ready")

    result_path = job.get("results_path")
    if not result_path:
        raise HTTPException(status_code=404, detail="Results file missing")

    path = Path(result_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Results file missing")

    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/api/frames/{job_id}/{filename}")
async def serve_frame(job_id: str, filename: str):
    frame_path = FRAMES_DIR / job_id / filename
    if not frame_path.is_file():
        raise HTTPException(status_code=404, detail="Frame not found")
    return FileResponse(frame_path)


@app.get("/api/model/{filename}")
async def serve_model(filename: str):
    model_path = MODELS_DIR / filename
    if not model_path.is_file():
        raise HTTPException(status_code=404, detail="Model not found")
    return FileResponse(model_path)
