import os
import sys
from pathlib import Path

if __name__ == "__main__":
    backend_dir = Path(__file__).parent / "backend"
    sys.path.insert(0, str(backend_dir))

    # Defaults for local dev
    os.environ.setdefault("DB_URL", "sqlite:///./pietro.db")

    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
