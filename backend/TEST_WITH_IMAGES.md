# Testing the VLM Pipeline with Real Construction Images

This guide walks you through running the StructIQ backend with your own images of construction sites (unfinished walls, pipes, beams, etc.) to see the AI identify objects and assess build progress.

## What the system does

1. **Takes your images** (JPG or PNG) of a construction site
2. **Sends each image to a Vision AI** (Kimi 2.5)
3. **Identifies construction elements** from a predefined list: beams, pipes, ducts, walls
4. **Assesses each element's stage** (e.g. "placed but not connected", "rough-in started", "framed") based on what it sees vs. how it should look when complete
5. **Outputs structured results** with evidence and confidence

## Prerequisites

1. **API key** — Kimi 2.5 from [Moonshot AI](https://platform.moonshot.cn/):
   - Create an account and get your API key
   - Add it to `backend/.env`:
   ```
   KIMI_API_KEY=your_kimi_key_here
   ```

## Step 1: Put your images in a folder

Create a folder and add your construction site images:

```bash
mkdir -p /Users/havishkolavennu/StructIQ/test_images
# Copy your images (unfinished walls, pipes, beams, etc.) into test_images/
```

Supported formats: `.jpg`, `.jpeg`, `.png`

## Step 2: Run the pipeline

From the project root, with your venv activated:

```bash
cd /Users/havishkolavennu/StructIQ
source venv/bin/activate
cd backend
python test_vlm_pipeline.py --frames ../test_images --zone floor_3 --out results.json
```

**Options:**
- `--frames` — Path to a folder of images, or list individual files: `--frames img1.jpg img2.jpg img3.jpg`
- `--zone` — Zone ID (default: floor_3). The system looks for: beams, plumbing, HVAC, walls in Floor 3.
- `--out` — Save full JSON results to a file (optional)
- `--dry-run` — Skip API calls and use mock data (useful to test without spending credits)

## Step 3: View results

The script prints a summary and the full JSON. Example output:

```
============================================================
RESULTS — Floor 3  (job: test_run)
============================================================
Work packages : 4
Total elements: 15
Breakdown     : {'complete': 2, 'in_progress': 6, 'not_started': 0, 'not_captured': 7}

  [IN_PROGRESS] Beam Layout  (owner: Joe's Structural LLC)
    - Central Beam            connected               conf:high   frames:2
    - Left Beam               placed                  conf:medium frames:1
    - Right Beam              not_captured            conf:none   frames:0
...
```

## What elements the AI looks for

| Work Package   | Elements                    | Stages (examples)                          |
|----------------|-----------------------------|--------------------------------------------|
| Beam Layout    | Central/Left/Right Beam     | not_started → delivered → placed → connected → complete |
| Plumbing       | Main Supply, Branch Lines, Drain | materials_on_site → rough_in_started → rough_in_complete → complete |
| HVAC Ductwork | Main Trunk, North/South Branch | duct_installed → branches_complete → complete |
| Wall Finishes  | North/South/East/West Wall  | framed → insulated → drywalled → painted → complete |

The AI maps what it sees to these elements. If your image shows "a pipe" or "a wall", it will assign it to the closest matching element and assess the stage based on visual evidence.

## Troubleshooting

- **"Could not import module"** — Run from `backend/` directory
- **"KIMI_API_KEY not set"** — Add keys to `backend/.env`
- **"All VLM providers failed"** — Check API keys, network, and that images are valid JPG/PNG
- **Empty observations** — The AI may not see any of the predefined elements; try images that clearly show beams, pipes, ducts, or walls
