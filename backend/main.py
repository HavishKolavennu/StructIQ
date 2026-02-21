"""FastAPI application for StructIQ backend APIs."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

try:
    from .config import (
        CORS_ORIGINS,
        MODEL_PATH,
        MODELS_DIR,
        PROCESSING_DIR,
        RESULTS_DIR,
        UPLOAD_DIR,
        USE_MOCK_CHAT,
        ensure_directories,
    )
    from .pipeline.orchestrator import process_job
except ImportError:  # Supports `uvicorn main:app` from backend/
    from config import (
        CORS_ORIGINS,
        MODEL_PATH,
        MODELS_DIR,
        PROCESSING_DIR,
        RESULTS_DIR,
        UPLOAD_DIR,
        USE_MOCK_CHAT,
        ensure_directories,
    )
    from pipeline.orchestrator import process_job

app = FastAPI(title='StructIQ API', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

ensure_directories()

_job_lock = Lock()
job_store: dict[str, dict[str, Any]] = {}


class ChatRequest(BaseModel):
    job_id: str
    question: str


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.post('/api/upload')
async def upload_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    zone_id: str = 'floor_3',
) -> dict[str, str]:
    job_id = str(uuid4())

    upload_dir = UPLOAD_DIR / zone_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    upload_path = upload_dir / f'{job_id}.mp4'

    raw = await video.read()
    upload_path.write_bytes(raw)

    with _job_lock:
        job_store[job_id] = {
            'job_id': job_id,
            'status': 'processing',
            'current_step': 'frame_extraction',
            'progress_detail': 'Upload received. Starting processing...',
            'selected_frame_count': 0,
            'error_message': None,
            'zone_id': zone_id,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }

    background_tasks.add_task(_run_pipeline_task, job_id, zone_id, upload_path)

    return {
        'job_id': job_id,
        'status': 'processing',
        'message': 'Upload received. Processing started.',
    }


@app.get('/api/status/{job_id}')
def get_status(job_id: str) -> dict[str, Any]:
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job


@app.get('/api/results/{job_id}')
def get_results(job_id: str) -> dict[str, Any]:
    result_file = RESULTS_DIR / job_id / 'results.json'
    if not result_file.exists():
        raise HTTPException(status_code=404, detail='Results not found or job incomplete')

    return json.loads(result_file.read_text(encoding='utf-8'))


@app.get('/api/frames/{job_id}/{filename}')
def get_frame(job_id: str, filename: str) -> FileResponse:
    frame_path = PROCESSING_DIR / job_id / 'selected' / filename
    if not frame_path.exists():
        raise HTTPException(status_code=404, detail='Frame not found')
    return FileResponse(frame_path)


@app.get('/api/model/{filename}')
def get_model(filename: str) -> FileResponse:
    model_path = MODELS_DIR / filename
    if filename == MODEL_PATH.name and MODEL_PATH.exists():
        model_path = MODEL_PATH
    if not model_path.exists():
        raise HTTPException(status_code=404, detail='Model not found')
    return FileResponse(model_path)


@app.post('/api/chat')
def chat(payload: ChatRequest) -> dict[str, Any]:
    result_file = RESULTS_DIR / payload.job_id / 'results.json'
    if not result_file.exists():
        raise HTTPException(status_code=404, detail='Results not found for this job')

    results = json.loads(result_file.read_text(encoding='utf-8'))

    if USE_MOCK_CHAT:
        return _mock_chat_answer(results, payload.question)

    # Minimal fallback when live LLM integration is disabled but mock mode is off.
    return _mock_chat_answer(results, payload.question)


def _run_pipeline_task(job_id: str, zone_id: str, video_path: Path) -> None:
    def update_status(status: str, step: str, detail: str, error: str | None = None) -> None:
        with _job_lock:
            job = job_store.get(job_id)
            if not job:
                return
            job.update(
                {
                    'status': status,
                    'current_step': step,
                    'progress_detail': detail,
                    'error_message': error,
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                }
            )

            results_file = RESULTS_DIR / job_id / 'results.json'
            if results_file.exists():
                try:
                    loaded = json.loads(results_file.read_text(encoding='utf-8'))
                    job['selected_frame_count'] = loaded.get('selection_metadata', {}).get('selected_count', 0)
                except Exception:
                    pass

    process_job(job_id=job_id, zone_id=zone_id, video_path=video_path, update_status=update_status)


def _mock_chat_answer(results: dict[str, Any], question: str) -> dict[str, Any]:
    referenced: list[str] = []
    lines: list[str] = []

    for wp in results.get('work_packages', []):
        for element in wp.get('elements', []):
            if element.get('stage') in {'not_captured', 'not_started', 'placed', 'rough_in_started'}:
                referenced.append(element.get('id', ''))
                lines.append(f"{element.get('name')}: {element.get('stage')}")

    if not lines:
        lines = ['No immediate blockers detected from current staged data.']

    summary = '; '.join(lines[:3])
    return {
        'response': (
            f"Question: {question}. "
            f"Based on current analysis for {results.get('zone_label')}, focus first on: {summary}."
        ),
        'referenced_elements': [eid for eid in referenced[:5] if eid],
    }
