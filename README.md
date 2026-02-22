# StructIQ

StructIQ is a construction progress intelligence prototype that analyzes walkthrough videos and reports stage status by work package.

## What It Does

- Accepts a walkthrough video upload from the web UI.
- Extracts candidate frames from the video.
- Detects QR codes in frames to segment the timeline into zones.
- Selects diverse high-quality frames per zone.
- Runs VLM-based analysis on selected frames.
- Displays results in a dashboard and detail view with frame evidence.

## Current Workflow

1. Upload video in frontend (`/api/upload`).
2. Backend pipeline runs:
- `frame_extraction`
- `qr_detection`
- `zone_segmentation`
- `frame_selection`
- `vlm_analysis`
- `assembling_results`
3. Frontend polls `/api/status/{job_id}`.
4. Frontend fetches `/api/results/{job_id}` on completion.
5. Frame evidence is served through `/api/frames/{job_id}/{filename}`.

## Important Behavior

- QR markers are required for zone-aware processing.
- If no QR codes are detected, the job fails with a clear error message.
- Work package definitions are currently driven by the demo registry in `backend/models/work_packages.py`.

## Repo Structure

- `backend/main.py` — FastAPI app and API endpoints.
- `backend/pipeline/video_processor.py` — Chunk 4 video/QR pipeline.
- `backend/pipeline/orchestrator.py` — end-to-end pipeline orchestration.
- `backend/pipeline/analyzer.py` — VLM analysis orchestration.
- `frontend/src/App.jsx` — top-level frontend routing.
- `frontend/src/components/upload/*` — upload + processing UI.
- `frontend/src/components/dashboard/*` — dashboard UI.
- `frontend/src/components/detail/*` — detail/evidence UI.

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- System dependency for QR detection:

```bash
sudo apt-get update
sudo apt-get install -y libzbar0
```

## Environment Setup

Create backend env file:

```bash
cd backend
cp .env.example .env
```

Set API keys in `backend/.env` if using real VLM calls:

- `KIMI_API_KEY`
- `ANTHROPIC_API_KEY`

## Run Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## End-to-End Test (Manual)

1. Start backend and frontend.
2. Open `http://localhost:5173`.
3. Upload a walkthrough video.
4. Confirm status steps progress in UI.
5. Verify dashboard appears on completion.
6. Open work package detail and frame evidence.

If your video has no QR markers:

- job will enter `error` state,
- UI will display the backend no-QR message.

## API Endpoints

- `POST /api/upload` — multipart form, field: `video`
- `GET /api/status/{job_id}`
- `GET /api/results/{job_id}`
- `GET /api/frames/{job_id}/{filename}`
- `GET /api/model/{filename}`

## Backend Tests

```bash
python3 -m unittest backend.tests.test_api -v
```

## Notes

- Runtime artifacts are written under `backend/storage/` and ignored by git.
- Legacy frontend files are preserved under `frontend/src/legacy/`.
