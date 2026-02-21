"""
VLM API client for StructIQ.

Primary:  Kimi K2.5 via api.kimi.com (Anthropic-compatible API).
Fallback: Claude Vision (Anthropic) — activated when Kimi fails or is unconfigured.

Public API:
    analyze_frame(frame_path, system_prompt, frame_prompt, frame_filename) -> dict
    AnalysisError  — raised when all retry/fallback attempts fail
"""

from __future__ import annotations

import base64
import json
import logging
import os
import time
from pathlib import Path

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration (from environment — populated via .env / uvicorn startup)
# ---------------------------------------------------------------------------

KIMI_API_KEY: str = os.getenv("KIMI_API_KEY", "")
# Kimi API base URL (Anthropic-compatible). Set KIMI_BASE_URL to override.
KIMI_BASE_URL: str = os.getenv("KIMI_BASE_URL", "https://api.kimi.com/coding")
KIMI_MODEL: str = os.getenv("KIMI_MODEL", "kimi-k2.5")

ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL: str = os.getenv("CLAUDE_VISION_MODEL", "claude-sonnet-4-6")

# Set USE_CLAUDE_FALLBACK=false to disable the Claude fallback entirely.
USE_CLAUDE_FALLBACK: bool = os.getenv("USE_CLAUDE_FALLBACK", "true").lower() == "true"

# Maximum retries per provider before giving up / switching fallback.
MAX_RETRIES: int = int(os.getenv("VLM_MAX_RETRIES", "2"))

_JPEG_EXTS = {".jpg", ".jpeg"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_image_b64(frame_path: Path) -> tuple[str, str]:
    """
    Load an image file and return (base64_string, media_type).
    """
    with open(frame_path, "rb") as fh:
        data = base64.b64encode(fh.read()).decode("utf-8")
    media_type = "image/jpeg" if frame_path.suffix.lower() in _JPEG_EXTS else "image/png"
    return data, media_type


def _strip_markdown_fences(text: str) -> str:
    """Remove leading/trailing markdown code fences (``` or ```json)."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Drop the first line (```json or ```) and the last line (```)
        inner = lines[1:] if len(lines) > 1 else lines
        if inner and inner[-1].strip() == "```":
            inner = inner[:-1]
        text = "\n".join(inner).strip()
    return text


def _parse_and_validate(raw: str, frame_filename: str) -> dict:
    """
    Parse the raw VLM string response into a validated dict.

    Expected shape:
        {
            "frame_id": str,
            "observations": [
                {
                    "element_id": str,
                    "work_package_id": str,
                    "stage": str,
                    "evidence": str,
                    "confidence": "high" | "medium" | "low"
                },
                ...
            ]
        }

    Raises:
        ValueError if the response cannot be parsed or fails schema validation.
    """
    text = _strip_markdown_fences(raw)

    try:
        parsed: dict = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Response is not valid JSON: {exc}\nRaw response:\n{raw[:500]}") from exc

    if not isinstance(parsed, dict):
        raise ValueError(f"Expected a JSON object, got {type(parsed).__name__}")

    if "observations" not in parsed:
        raise ValueError(f"Response missing 'observations' key. Keys present: {list(parsed.keys())}")

    if not isinstance(parsed["observations"], list):
        raise ValueError("'observations' must be a JSON array")

    # Normalise frame_id to what we actually sent (VLM may echo a different value)
    parsed["frame_id"] = frame_filename

    _OBS_REQUIRED = {"element_id", "work_package_id", "stage", "evidence", "confidence"}
    for i, obs in enumerate(parsed["observations"]):
        if not isinstance(obs, dict):
            raise ValueError(f"Observation {i} is not an object")
        missing = _OBS_REQUIRED - obs.keys()
        if missing:
            raise ValueError(f"Observation {i} missing keys: {missing}")
        # Normalise confidence to lowercase
        obs["confidence"] = str(obs.get("confidence", "medium")).lower()

    return parsed


# ---------------------------------------------------------------------------
# Provider-specific callers
# ---------------------------------------------------------------------------

def _call_kimi(image_b64: str, media_type: str, system_prompt: str, user_prompt: str) -> str:
    """Send an image to Kimi K2.5 via Kimi's Anthropic-compatible API."""
    try:
        import anthropic
    except ImportError as exc:
        raise RuntimeError("anthropic package not installed. Run: pip install anthropic") from exc

    client = anthropic.Anthropic(api_key=KIMI_API_KEY, base_url=KIMI_BASE_URL)

    response = client.messages.create(
        model=KIMI_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": user_prompt},
                ],
            }
        ],
    )
    return response.content[0].text if response.content else ""


def _call_claude(image_b64: str, media_type: str, system_prompt: str, user_prompt: str) -> str:
    """Send an image to Claude Vision via Anthropic API."""
    try:
        import anthropic
    except ImportError as exc:
        raise RuntimeError("anthropic package not installed. Run: pip install anthropic") from exc

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": user_prompt},
                ],
            }
        ],
    )
    return response.content[0].text if response.content else ""


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

class AnalysisError(Exception):
    """Raised when all provider attempts (primary + fallback) fail for a frame."""


def analyze_frame(
    frame_path: Path,
    system_prompt: str,
    frame_prompt: str,
    frame_filename: str,
) -> dict:
    """
    Analyze a single construction frame using the configured VLM providers.

    Strategy:
      1. Try Kimi 2.5 up to MAX_RETRIES times.
         - On the second attempt append a stricter JSON-only instruction.
         - On RateLimitError apply exponential backoff before retrying.
         - On non-rate-limit API errors, break out of the Kimi loop immediately.
      2. If Kimi fails entirely and USE_CLAUDE_FALLBACK is True, try Claude.
      3. If both fail, raise AnalysisError.

    Returns:
        Validated dict:
        {
            "frame_id": str,
            "observations": [{"element_id", "work_package_id", "stage", "evidence", "confidence"}, ...]
        }

    Raises:
        AnalysisError: if all attempts across all providers fail.
    """
    from .prompts import build_retry_suffix  # local import to avoid circular at module level

    image_b64, media_type = _load_image_b64(frame_path)

    # ---- Attempt 1: Kimi ----
    if KIMI_API_KEY:
        kimi_error = _try_provider(
            provider_name="Kimi",
            caller=_call_kimi,
            image_b64=image_b64,
            media_type=media_type,
            system_prompt=system_prompt,
            frame_prompt=frame_prompt,
            frame_filename=frame_filename,
            retry_suffix=build_retry_suffix(),
        )
        if isinstance(kimi_error, dict):
            return kimi_error  # success
        logger.warning("Kimi failed for %s: %s", frame_filename, kimi_error)
    else:
        logger.info("KIMI_API_KEY not set — skipping Kimi, going straight to Claude fallback.")

    # ---- Attempt 2: Claude fallback ----
    if USE_CLAUDE_FALLBACK and ANTHROPIC_API_KEY:
        logger.info("Falling back to Claude Vision for %s", frame_filename)
        claude_error = _try_provider(
            provider_name="Claude",
            caller=_call_claude,
            image_b64=image_b64,
            media_type=media_type,
            system_prompt=system_prompt,
            frame_prompt=frame_prompt,
            frame_filename=frame_filename,
            retry_suffix=build_retry_suffix(),
        )
        if isinstance(claude_error, dict):
            return claude_error  # success
        logger.error("Claude fallback also failed for %s: %s", frame_filename, claude_error)
    elif not ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set — cannot use Claude fallback.")

    raise AnalysisError(
        f"All VLM providers failed for frame '{frame_filename}'. "
        "Check API keys and logs for details."
    )


def _try_provider(
    provider_name: str,
    caller,
    image_b64: str,
    media_type: str,
    system_prompt: str,
    frame_prompt: str,
    frame_filename: str,
    retry_suffix: str,
) -> dict | Exception:
    """
    Try a single VLM provider up to MAX_RETRIES times.

    Returns the parsed dict on success, or the final Exception on failure.
    """
    # Detect rate-limit errors generically by class name
    # so we don't have to hard-import both openai and anthropic here.
    RATE_LIMIT_NAMES = {"RateLimitError"}

    last_exc: Exception = RuntimeError("No attempts made")

    for attempt in range(MAX_RETRIES):
        prompt = frame_prompt + (retry_suffix if attempt > 0 else "")

        # Exponential backoff before retries (not before the first attempt)
        if attempt > 0:
            wait = 2 ** attempt
            logger.info("%s retry %d for %s — waiting %ds", provider_name, attempt, frame_filename, wait)
            time.sleep(wait)

        try:
            raw = caller(image_b64, media_type, system_prompt, prompt)
            return _parse_and_validate(raw, frame_filename)

        except ValueError as exc:
            # JSON parse / schema validation error — retry with stricter prompt
            logger.warning(
                "%s attempt %d/%d parse error for %s: %s",
                provider_name, attempt + 1, MAX_RETRIES, frame_filename, exc,
            )
            last_exc = exc

        except Exception as exc:
            exc_type = type(exc).__name__
            if exc_type in RATE_LIMIT_NAMES:
                # Rate limit: longer backoff, still worth retrying
                wait = 2 ** (attempt + 2)
                logger.warning(
                    "%s rate-limited on %s — waiting %ds before retry",
                    provider_name, frame_filename, wait,
                )
                time.sleep(wait)
                last_exc = exc
            else:
                # API error, network error, auth error — don't retry
                logger.error(
                    "%s non-retryable error for %s (%s): %s",
                    provider_name, frame_filename, exc_type, exc,
                )
                last_exc = exc
                break

    return last_exc
