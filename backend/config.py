"""Runtime configuration for StructIQ backend."""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# Filesystem roots
STORAGE_ROOT = Path(os.getenv("STRUCTIQ_STORAGE_ROOT", BASE_DIR / "storage")).resolve()
UPLOADS_DIR = Path(os.getenv("STRUCTIQ_UPLOADS_DIR", STORAGE_ROOT / "uploads")).resolve()
PROCESSING_DIR = Path(os.getenv("STRUCTIQ_PROCESSING_DIR", STORAGE_ROOT / "processing")).resolve()
RESULTS_DIR = Path(os.getenv("STRUCTIQ_RESULTS_DIR", STORAGE_ROOT / "results")).resolve()
FRAMES_DIR = Path(os.getenv("STRUCTIQ_FRAMES_DIR", STORAGE_ROOT / "frames")).resolve()
MODELS_DIR = Path(os.getenv("STRUCTIQ_MODELS_DIR", PROJECT_ROOT / "frontend" / "public" / "models")).resolve()

# CORS
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "STRUCTIQ_CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
    ).split(",")
    if origin.strip()
]


def ensure_directories() -> None:
    """Create required runtime directories if they don't exist."""
    for directory in (STORAGE_ROOT, UPLOADS_DIR, PROCESSING_DIR, RESULTS_DIR, FRAMES_DIR):
        directory.mkdir(parents=True, exist_ok=True)
