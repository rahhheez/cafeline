import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "backend"
if backend_dir.exists():
    sys.path.insert(0, str(backend_dir))
