"""
StructIQ FastAPI backend — main entry point.

Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
(From the backend/ directory)
"""

from pathlib import Path
import uuid
import threading
import shutil

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# Load .env before other imports
try:
    from dotenv import load_dotenv
    for p in [Path(__file__).parent / ".env", Path(__file__).parent.parent / ".env"]:
        if p.exists():
            load_dotenv(p)
            break
except ImportError:
    pass

# Add backend to path for imports
import sys
_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from models.work_packages import get_demo_work_packages

app = FastAPI(title="StructIQ API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROCESSING_DIR = Path(__file__).resolve().parent / "processing"
PROCESSING_DIR.mkdir(exist_ok=True)

_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}

# In-memory store (replace with disk/DB in production)
JOBS: dict[str, dict] = {}


def _run_analysis_task(job_id: str, zone_id: str) -> None:
    """Background thread: run VLM analysis and store results."""
    frames_dir = PROCESSING_DIR / job_id
    frames = []
    for ext in _IMAGE_EXTS:
        frames.extend(frames_dir.glob(f"*{ext}"))
    frames = sorted(frames)

    if not frames:
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["error_message"] = "No valid image files found."
        return

    try:
        from pipeline.analyzer import run_analysis

        def on_progress(step: str, detail: str) -> None:
            JOBS[job_id]["current_step"] = step
            JOBS[job_id]["progress_detail"] = detail

        results = run_analysis(
            selected_frames=frames,
            zone_id=zone_id,
            job_id=job_id,
            progress_callback=on_progress,
        )
        JOBS[job_id]["results"] = results
        JOBS[job_id]["status"] = "complete"
        JOBS[job_id]["current_step"] = "complete"
        JOBS[job_id]["progress_detail"] = "Analysis complete."
        JOBS[job_id]["selected_frame_count"] = len(frames)
    except Exception as exc:
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["error_message"] = str(exc)
        JOBS[job_id]["current_step"] = "error"


@app.post("/api/upload")
async def upload(zone_id: str = Form(...), images: list[UploadFile] = File(...)):
    """Upload construction site images for AI analysis."""
    if not images:
        raise HTTPException(400, "At least one image is required.")

    job_id = str(uuid.uuid4())
    job_dir = PROCESSING_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    saved_count = 0
    for f in images:
        if not f.filename:
            continue
        ext = Path(f.filename).suffix
        if ext not in _IMAGE_EXTS:
            continue
        dest = job_dir / f.filename
        content = await f.read()
        dest.write_bytes(content)
        saved_count += 1

    if saved_count == 0:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(400, "No valid image files (JPG/PNG) received.")

    JOBS[job_id] = {
        "status": "processing",
        "zone_id": zone_id,
        "current_step": "starting",
        "progress_detail": f"Saved {saved_count} image(s). Starting analysis...",
        "selected_frame_count": saved_count,
        "error_message": None,
    }

    thread = threading.Thread(target=_run_analysis_task, args=(job_id, zone_id))
    thread.start()

    return {"job_id": job_id, "status": "processing", "message": "Upload received. Analysis started."}


@app.get("/api/status/{job_id}")
async def status(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(404, "Job not found")
    j = JOBS[job_id]
    return {
        "job_id": job_id,
        "status": j["status"],
        "current_step": j.get("current_step", "processing"),
        "progress_detail": j.get("progress_detail", ""),
        "selected_frame_count": j.get("selected_frame_count", 0),
        "error_message": j.get("error_message"),
    }


@app.get("/api/results/{job_id}")
async def results(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(404, "Job not found")
    j = JOBS[job_id]
    if j["status"] != "complete":
        raise HTTPException(400, f"Job not complete. Status: {j['status']}")
    if "results" not in j:
        raise HTTPException(500, "Results not available.")
    return j["results"]


@app.get("/api/frames/{job_id}/{filename}")
async def serve_frame(job_id: str, filename: str):
    """Serve an analyzed frame image."""
    if job_id not in JOBS:
        raise HTTPException(404, "Job not found")
    frame_path = PROCESSING_DIR / job_id / filename
    if not frame_path.is_file():
        raise HTTPException(404, "Frame not found")
    return FileResponse(frame_path)


class ChatRequest(BaseModel):
    job_id: str
    question: str


@app.post("/api/chat")
async def chat(body: ChatRequest):
    return {
        "response": "Based on the latest analysis, the Left Beam is placed but not yet connected. The Right Beam was not captured. Focus on verifying the Right Beam on-site and completing the Left Beam connections.",
        "referenced_elements": ["beam_left_1", "beam_right_1"],
    }


@app.get("/")
async def root():
    return {"message": "StructIQ API", "docs": "/docs"}
