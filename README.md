# StructIQ

**Construction progress tracking that shows you the proof, not just a number.**

StructIQ analyzes walkthrough video of construction sites, identifies individual elements (beams, pipes, ducts, walls), classifies each into its actual construction stage, and presents the findings on a dashboard backed by the exact frames that prove it. QR codes at zone entry points let the system automatically know *where* it is in the building — no GPS, no SLAM, no guessing.

The result: a project manager uploads a walkthrough video and gets back a dashboard where every work package shows its current stage, every stage has frame-level visual evidence, and every assessment can be verified or overridden in seconds.

---

## The Problem We Chose to Solve Differently

Construction progress tracking is broken. 80% of projects go over budget, and a major driver is that deviations — wrong installations, incomplete work, out-of-sequence construction — get caught too late. By the time someone notices a pipe is in the wrong place, the drywall crew has already closed the wall. That's a $50K rework order.

The current process: a superintendent walks the site with a clipboard, takes photos, and guesses completion percentages. Subcontractors bill for 80% when the real number is 60%. There is no fast, verifiable way to compare what's actually built against what was planned.

Every team at this hackathon has access to the same foundation models. The difference isn't the AI — it's the decisions about *how* to use it. Here are the five insights that shaped StructIQ.

---

## Insight 1: Percentages Are a Lie

The instinct is to look at a construction site and estimate "73% complete." But ask yourself: 73% of *what*? Square footage? Cost? Task count? And how would you verify that number from a video frame?

You can't. Continuous percentages from video are unmeasurable and unverifiable. They give the user a number they can't trust and can't check.

**What we did instead:** Construction elements move through discrete, visually distinct stages. A steel beam is either sitting on the ground (delivered), lifted into position (placed), or bolted to the columns (connected). These are categorical states a vision model can reliably distinguish — and more importantly, a human can verify in seconds by looking at the same frame.

StructIQ classifies elements into stages: `not_started → delivered → placed → connected → inspected → complete`. The completion percentage is derived from milestone counts (7 of 12 elements confirmed = 58%), not hallucinated from pixels. When we say "58% complete," we can show you exactly which 7 elements and what stage each one is in.

**The line we kept coming back to:** *"We don't tell you it's 73% done. We tell you the central beam is placed but not connected, the left beam is complete, and the right beam wasn't captured — and here are the frames that prove it."*

## Insight 2: The Hardest Problem Isn't Vision — It's Knowing Where You Are

When a camera walks through a construction site and you extract 600 frames, you have 600 unlabeled images. The AI can analyze what's *in* each frame, but it doesn't know which zone or floor it's looking at. Without spatial context, the VLM is analyzing frames in a vacuum — it might correctly identify a placed beam but has no idea which beam in which work package it belongs to.

This is the frame-to-work-package mapping problem, and it's what separates a demo from a product.

Most approaches to indoor localization require SLAM, visual odometry, or BLE beacons — all of which are research-grade problems with failure modes we couldn't debug in 36 hours.

**What we did instead:** QR codes at zone entry points. A $0.10 printed sticker at each doorway or zone transition encodes a JSON payload:

```json
{
  "zone_id": "floor_3_bay_a",
  "zone_label": "Floor 3 - Bay A",
  "project_id": "site_001",
  "work_packages": ["beam_layout", "plumbing_rough_in"]
}
```

The pipeline scans every extracted frame for QR codes using `pyzbar` — not ML, just fast pattern detection. When it sees a QR in frame 47, every frame from 47 onward belongs to that zone until the next QR appears. The video is automatically segmented into spatial groups, each with the exact list of work packages to analyze.

This means:
- **No manual labeling** — the PM just uploads raw video, the system figures out where it is
- **Dynamic work package loading** — the VLM prompt is built from what the QR says to look for, not a hardcoded list
- **Deployable today** — construction sites already use QR codes for equipment tracking. This isn't a research prototype; it's a workflow that works with a printer and tape

## Insight 3: Don't Reconstruct — Classify

The natural approach to "spatial intelligence from construction footage" is 3D reconstruction. Extract camera poses, build a point cloud, generate a mesh, compare it to the BIM model, compute geometric deviation.

We went down this path initially. We evaluated SAM 3D Objects for mesh generation from video. Here's why we stopped:

- **Camera pose estimation from walkthrough video is unsolvable in our scope.** Without known camera intrinsics or SfM calibration, you can't register a reconstructed mesh to the BIM coordinate system. You get a mesh floating in arbitrary space.
- **SAM 3D hallucinates unseen geometry.** It completes objects behind walls and around corners — exactly the opposite of what a *validation* tool should do. We need to report what we can see, not what the model imagines.
- **Failure modes are undebuggable.** When a 10-step pipeline (video → frames → SAM 2 → masks → SAM 3D → mesh → registration → comparison) produces wrong results, a team without deep CV experience can't diagnose where it broke.

**What we did instead:** Skip reconstruction entirely. Send frames directly to a vision-language model with structured context ("here are the elements in this zone, here are the valid stages for each type") and ask it to classify what it sees. The VLM returns structured JSON identifying which elements are visible, what stage they're in, and the visual evidence for that assessment.

This is simpler, more reliable, and produces output a human can immediately verify — which is the entire point.

## Insight 4: Evidence Is the Product

Most AI tools for construction give you a dashboard with numbers. Green means good, red means bad. But when a superintendent sees "Beam Layout: 67% complete" and it doesn't match what they saw on-site yesterday, they have no way to investigate. The number is a black box.

**What we did instead:** Every stage assessment links back to the specific frame(s) that produced it. Click on "Central Beam — Connected" and you see the actual frames showing the beam with bolt connections at both column interfaces, along with the VLM's observation text explaining what it saw.

This changes the user's relationship with the tool. They're not trusting a number — they're reviewing evidence. If the AI is wrong (and sometimes it will be), the PM sees the frame and overrides the assessment in one click. If it's right, they've just verified it in 3 seconds instead of walking to that zone.

The confidence system reinforces this: if 3 frames from different angles all agree a beam is "connected," that's high confidence. If only 1 frame caught a glimpse, that's low confidence — and the system says so. If an element never appeared in any frame, the system doesn't guess. It reports "not captured" and tells you to check it on-site.

## Insight 5: Smart Frame Selection Matters More Than You'd Think

A 5-minute walkthrough at 30fps produces 9,000 raw frames. Most are useless — motion blur from walking, repeated views of the same wall, frames of the floor during a head turn. Sending all of them to a VLM is wasteful and expensive. Sending random samples misses important views.

**What we did instead:** A four-metric scoring and diversity pipeline:

1. **Extract** at 2 FPS → ~600 candidate frames (not 9,000)
2. **Score** each frame: sharpness (Laplacian variance, 40% weight), contrast (grayscale standard deviation, 15%), information density (Canny edge ratio, 15%), with 30% reserved for diversity
3. **Select diverse best frames**: greedy algorithm picks the highest-scoring frame, then skips any subsequent frame that's too similar (SSIM > 0.85) to anything already selected
4. **Result**: 20-25 sharp, high-information, diverse frames per zone — covering the space without redundancy

This isn't glamorous work, but it directly impacts VLM accuracy. Better input frames = better stage classifications = a more trustworthy product.

---

## System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│   Video      │     │  QR Zone     │     │  Smart Frame │     │   VLM      │
│   Upload     │────▶│  Detection   │────▶│  Selection   │────▶│  Analysis  │
│              │     │  (pyzbar)    │     │  (per zone)  │     │ (Kimi 2.5) │
└─────────────┘     └──────────────┘     └──────────────┘     └─────┬──────┘
                                                                     │
                                                                     ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│   3D Model   │     │   Detail     │     │  Dashboard   │     │  Results   │
│   Viewer     │◀────│   View +     │◀────│  (stage      │◀────│  Assembly  │
│  (Three.js)  │     │  Evidence    │     │   status)    │     │ + scoring  │
└─────────────┘     └──────────────┘     └──────────────┘     └────────────┘
```

### Tech Stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| Backend | FastAPI (Python) | Fast to scaffold, async file processing, team knows Python |
| Video Processing | OpenCV | Frame extraction, quality metrics (Laplacian, Canny, SSIM) |
| QR Detection | pyzbar | Fast barcode/QR detection, not ML — hundreds of frames/second |
| VLM | Kimi 2.5 API (primary), Claude Vision (fallback) | Free API access, strong vision + structured output |
| Frontend | React + Vite + Tailwind | Dark theme dashboard, fast iteration |
| 3D Viewer | Three.js via @react-three/fiber | GLB model loading, dynamic coloring, click-to-inspect |
| Reference Model | Blender → GLB | Scriptable, exports to web-native format |

### Data Pipeline Detail

**Frame Extraction** → OpenCV `VideoCapture` at 2 FPS. Saves JPEG candidates to disk.

**QR Scan Pass** → Every candidate frame is scanned with `pyzbar.decode()`. QR detections are recorded with frame index and decoded JSON payload. Timeline is segmented: frames between QR code N and QR code N+1 belong to QR N's zone.

**Smart Selection** → Per zone, all candidate frames are scored (sharpness + contrast + edge density), then greedily selected with SSIM diversity filtering. Each zone gets 15-25 best frames.

**VLM Analysis** → Per zone, a system prompt is constructed containing the zone's work package definitions (element names, types, valid stages). Each selected frame is sent to the VLM with this context. The VLM returns structured JSON: which elements it sees, what stage each is in, and the visual evidence.

**Aggregation** → Observations are grouped by element across all frames. Multiple consistent observations = high confidence. Single observation = low. Conflicting observations = medium confidence with the most frequent stage winning. No observations = "not captured."

**Results** → Final structured JSON with work packages, elements, stages, confidence scores, and frame evidence paths. Served to the frontend via REST API.

### VLM Prompt Strategy

The system prompt provides full context: zone label, work package definitions, element lists, and valid stage progressions per element type. Rules enforce conservative assessment — when in doubt, report the lower stage. The VLM responds in strict JSON with an observations array. If the response isn't parseable JSON, the system retries once with a stricter instruction. If both attempts fail, that frame is logged and skipped.

The key design choice: **one prompt per frame, not one prompt for all frames.** This keeps context focused and avoids the VLM conflating observations across different images. Aggregation happens in deterministic Python code, not in the model's head.

---

## What We Built

### Dashboard
The primary interface. Work packages listed with stage badges, grouped by QR-detected zones. Each card shows the work package name, current stage, responsible subcontractor, element count, and confidence level. This is where the PM gets their answer in 5 seconds.

### Detail View
Drill into any work package to see individual element breakdowns. Each element shows its stage and confidence. Select an element to see the frame evidence gallery — the actual images the system used, with VLM annotations describing what it observed and why it classified the stage that way.

### 3D Reference Viewer
A pre-built Blender model with meshes named to match element IDs. Loaded in Three.js, each mesh is dynamically colored by its detected stage: gray (not started), yellow (early stages), blue (mid stages), green (complete), red (flagged). Click any element to see its evidence. Provides spatial context that the list view can't.

### QR Code System
Python script generates printable QR codes from zone definitions. Print, tape to doorways, walk through with a camera. The system handles the rest. For the demo, we printed QR codes and taped them to doorways in our workspace.

---

## How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- System dependency: `libzbar0` (Ubuntu: `sudo apt-get install libzbar0`)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add your API keys
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # runs on localhost:5173, proxies /api to :8000
```

### Generate QR Codes (for filming demo footage)
```bash
python backend/pipeline/generate_qr_codes.py
# prints QR code PNGs to qr_codes/ directory
```

### Environment Variables
```
KIMI_API_KEY=...
ANTHROPIC_API_KEY=...
```
# StructIQ
