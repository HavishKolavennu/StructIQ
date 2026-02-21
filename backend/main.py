"""
StructIQ FastAPI backend — main entry point.

Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
(From the backend/ directory)
"""

from pathlib import Path
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# Add backend to path for imports
import sys
_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND.parent))

from models.work_packages import get_demo_work_packages

app = FastAPI(title="StructIQ API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for demo (replace with disk/DB in production)
JOBS: dict[str, dict] = {}

# Mock results matching frontend contract
def _mock_results(job_id: str, zone_id: str) -> dict:
    work_packages = get_demo_work_packages(zone_id)
    wp_list = []
    all_elements = []
    for wp in work_packages:
        el_results = []
        for el in wp.elements:
            if "right" in el.id or "drain" in el.id:
                stage, label, conf, evidence = "not_captured", "Not visible in uploaded footage", "none", []
            elif "central" in el.id or "main" in el.id:
                stage, label, conf, evidence = "connected", "Connected — bolted at both ends", "high", [
                    {"frame_id": "frame_001", "frame_path": f"/api/frames/{job_id}/frame_001.jpg", "vlm_observation": "Element visible with connections.", "vlm_stage_assessment": "connected"}
                ]
            else:
                stage, label, conf, evidence = "placed", "Placed — in position, not yet connected", "medium", [
                    {"frame_id": "frame_002", "frame_path": f"/api/frames/{job_id}/frame_002.jpg", "vlm_observation": "Element in position.", "vlm_stage_assessment": "placed"}
                ]
            el_results.append({
                "id": el.id, "name": el.name, "type": el.type,
                "stage": stage, "stage_label": label, "confidence": conf, "frame_evidence": evidence,
            })
            all_elements.append(el_results[-1])
        stages = [e["stage"] for e in el_results]
        overall = "not_captured" if "not_captured" in stages else "in_progress" if any(s not in ("complete", "inspected") for s in stages) else "complete"
        wp_list.append({"id": wp.id, "name": wp.name, "zone": wp.zone, "owner": wp.owner, "overall_stage": overall, "elements": el_results})
    return {
        "job_id": job_id,
        "zone_id": zone_id,
        "zone_label": zone_id.replace("_", " ").title(),
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_work_packages": len(wp_list),
            "total_elements": len(all_elements),
            "stages_breakdown": {"complete": 2, "in_progress": 4, "not_started": 0, "not_captured": 2},
        },
        "work_packages": wp_list,
        "selection_metadata": {"total_candidates": 500, "selected_count": 20},
    }


@app.post("/api/upload")
async def upload(video: UploadFile = File(...), zone_id: str = Form(...)):
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"status": "complete", "zone_id": zone_id}
    return {"job_id": job_id, "status": "processing", "message": "Upload received. Processing started."}


@app.get("/api/status/{job_id}")
async def status(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(404, "Job not found")
    j = JOBS[job_id]
    return {
        "job_id": job_id,
        "status": "complete",
        "current_step": "assembling_results",
        "progress_detail": "Done",
        "selected_frame_count": 20,
        "error_message": None,
    }


@app.get("/api/results/{job_id}")
async def results(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(404, "Job not found")
    zone_id = JOBS[job_id].get("zone_id", "floor_3")
    return _mock_results(job_id, zone_id)


@app.get("/api/frames/{job_id}/{filename}")
async def serve_frame(job_id: str, filename: str):
    # Placeholder — return 404; frontend uses placeholder images when frames missing
    raise HTTPException(404, "Frame not found")


class ChatRequest(BaseModel):
    job_id: str
    question: str

@app.post("/api/chat")
async def chat(body: ChatRequest):
    return {
        "response": "Based on the latest analysis, the Left Beam is placed but not yet connected. The Right Beam was not captured. Focus on verifying the Right Beam on-site and completing the Left Beam connections.",
        "referenced_elements": ["beam_left_1", "beam_right_1"],
    }


# Ensure we can run from project root: uvicorn backend.main:app
# Or from backend/: uvicorn main:app


@app.get("/")
async def root():
    return {"message": "StructIQ API", "docs": "/docs"}
