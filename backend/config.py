"""Runtime configuration for StructIQ backend."""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = Path(os.getenv('UPLOAD_DIR', str(BASE_DIR / 'uploads')))
PROCESSING_DIR = Path(os.getenv('PROCESSING_DIR', str(BASE_DIR / 'processing')))
RESULTS_DIR = Path(os.getenv('RESULTS_DIR', str(BASE_DIR / 'results')))
MODEL_PATH = Path(os.getenv('MODEL_PATH', str(BASE_DIR / 'models' / 'reference.glb')))
MODELS_DIR = MODEL_PATH.parent

CORS_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

USE_MOCK_PIPELINE = os.getenv('USE_MOCK_PIPELINE', 'true').lower() == 'true'
USE_MOCK_CHAT = os.getenv('USE_MOCK_CHAT', 'true').lower() == 'true'


def ensure_directories() -> None:
    """Create required local storage directories if missing."""
    for path in [UPLOAD_DIR, PROCESSING_DIR, RESULTS_DIR, MODELS_DIR]:
        path.mkdir(parents=True, exist_ok=True)
