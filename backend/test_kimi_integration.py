"""
Quick integration test for the Kimi K2.5 → Claude fallback chain.

Tests:
  1. Kimi text-only ping (no image) — confirms auth + endpoint
  2. Kimi with a tiny dummy image — confirms vision path
  3. Claude fallback reachability — confirms backup works

Run from the project root:
    cd /path/to/StructIQ
    python backend/test_kimi_integration.py
"""

from __future__ import annotations

import base64
import io
import os
import sys
from pathlib import Path

# ── path setup ──────────────────────────────────────────────────────────────
_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent
sys.path.insert(0, str(_ROOT))

# Load .env
try:
    from dotenv import load_dotenv
    for candidate in [_HERE / ".env", _ROOT / ".env"]:
        if candidate.exists():
            load_dotenv(candidate)
            print(f"Loaded .env from {candidate}\n")
            break
except ImportError:
    pass

KIMI_API_KEY = os.getenv("KIMI_API_KEY", "")
KIMI_BASE_URL = os.getenv("KIMI_BASE_URL", "https://api.kimi.com/coding")
KIMI_MODEL = os.getenv("KIMI_MODEL", "kimi-k2.5")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_VISION_MODEL", "claude-sonnet-4-6")


def make_tiny_png_b64() -> str:
    """Generate a 10x10 white PNG and return it as a base64 string."""
    try:
        from PIL import Image
        img = Image.new("RGB", (10, 10), color=(200, 200, 200))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        # Fallback: hand-crafted minimal valid 1x1 PNG
        minimal_png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
            b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00"
            b"\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18"
            b"\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        return base64.b64encode(minimal_png).decode()


def ok(label: str) -> None:
    print(f"  [PASS] {label}")


def fail(label: str, err: Exception) -> None:
    print(f"  [FAIL] {label}: {err}")


# ── Test 1: Kimi text-only ───────────────────────────────────────────────────
def test_kimi_text():
    print("Test 1: Kimi text-only ping")
    if not KIMI_API_KEY:
        print("  [SKIP] KIMI_API_KEY not set")
        return False
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=KIMI_API_KEY, base_url=KIMI_BASE_URL)
        response = client.messages.create(
            model=KIMI_MODEL,
            max_tokens=32,
            messages=[{"role": "user", "content": "Reply with exactly: OK"}],
        )
        reply = response.content[0].text.strip() if response.content else ""
        ok(f"Kimi responded: {reply!r}")
        return True
    except Exception as e:
        fail("Kimi text ping", e)
        return False


# ── Test 2: Kimi with image ──────────────────────────────────────────────────
def test_kimi_vision():
    print("\nTest 2: Kimi with image")
    if not KIMI_API_KEY:
        print("  [SKIP] KIMI_API_KEY not set")
        return False
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=KIMI_API_KEY, base_url=KIMI_BASE_URL)
        img_b64 = make_tiny_png_b64()
        response = client.messages.create(
            model=KIMI_MODEL,
            max_tokens=64,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": img_b64,
                            },
                        },
                        {"type": "text", "text": "What color is this image? Reply in one word."},
                    ],
                }
            ],
        )
        reply = response.content[0].text.strip() if response.content else ""
        ok(f"Kimi vision responded: {reply!r}")
        return True
    except Exception as e:
        fail("Kimi vision", e)
        print("  (If Kimi K2.5 doesn't support vision, Claude fallback will handle images)")
        return False


# ── Test 3: Claude fallback reachability ─────────────────────────────────────
def test_claude_fallback():
    print("\nTest 3: Claude fallback reachability")
    if not ANTHROPIC_API_KEY:
        print("  [SKIP] ANTHROPIC_API_KEY not set")
        return False
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=32,
            messages=[{"role": "user", "content": "Reply with exactly: OK"}],
        )
        reply = response.content[0].text.strip() if response.content else ""
        ok(f"Claude responded: {reply!r}")
        return True
    except Exception as e:
        fail("Claude fallback", e)
        return False


# ── Test 4: vlm_client.py module import ──────────────────────────────────────
def test_vlm_client_import():
    print("\nTest 4: vlm_client module loads with correct config")
    try:
        from backend.pipeline import vlm_client
        assert vlm_client.KIMI_BASE_URL == "https://api.kimi.com/coding", (
            f"Expected https://api.kimi.com/coding, got {vlm_client.KIMI_BASE_URL}"
        )
        assert vlm_client.KIMI_MODEL == "kimi-k2.5", (
            f"Expected kimi-k2.5, got {vlm_client.KIMI_MODEL}"
        )
        ok(f"KIMI_BASE_URL = {vlm_client.KIMI_BASE_URL}")
        ok(f"KIMI_MODEL    = {vlm_client.KIMI_MODEL}")
        ok(f"CLAUDE_MODEL  = {vlm_client.CLAUDE_MODEL}")
        ok(f"USE_FALLBACK  = {vlm_client.USE_CLAUDE_FALLBACK}")
        return True
    except Exception as e:
        fail("vlm_client import", e)
        return False


if __name__ == "__main__":
    results = [
        test_kimi_text(),
        test_kimi_vision(),
        test_claude_fallback(),
        test_vlm_client_import(),
    ]
    passed = sum(1 for r in results if r)
    total = len(results)
    print(f"\n{'='*40}")
    print(f"Results: {passed}/{total} passed")
    sys.exit(0 if passed == total else 1)
