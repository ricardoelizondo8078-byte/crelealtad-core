import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
REGION_CODE = os.getenv("REGION_CODE", "MX").strip().upper()
STATE_HINT = os.getenv("STATE_HINT", "Nuevo León").strip()
CHECKPOINT_EVERY = int(os.getenv("CHECKPOINT_EVERY", "50"))
REQUEST_DELAY_SECONDS = float(os.getenv("REQUEST_DELAY_SECONDS", "0.05"))
USE_GEOCODING_FALLBACK = os.getenv("USE_GEOCODING_FALLBACK", "true").lower() == "true"

INPUT_DIR = ROOT / "input"
OUTPUT_DIR = ROOT / "output"
CACHE_DIR = ROOT / "cache"
LOG_DIR = ROOT / "logs"
CATALOG_DIR = ROOT / "catalogos"
CACHE_DB = CACHE_DIR / "google_cache.sqlite3"
