# Everything to do with .venv: find it, make it, interrogate it.

import platform
import subprocess
import sys
from pathlib import Path
from typing import Optional, Tuple

# .venv is the conventional name; no plans to make this configurable.
VENV_DIR: str = ".venv"


def detect_python_version() -> Tuple[int, int]:
    return sys.version_info.major, sys.version_info.minor


def venv_exists(project_root: Path = Path(".")) -> bool:
    return (project_root / VENV_DIR).is_dir()


def create_venv(project_root: Path = Path(".")) -> bool:
    """Create .venv. Returns True if we actually made it, False if it was already there."""
    venv_path = project_root / VENV_DIR

    if venv_path.exists():
        return False

    result = subprocess.run(
        [sys.executable, "-m", "venv", str(venv_path)],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"venv creation failed.\n\n{result.stderr.strip()}"
        )

    return True


def get_venv_python(project_root: Path = Path(".")) -> Optional[Path]:
    # Windows stashes the interpreter under Scripts/, everyone else uses bin/.
    venv_path = project_root / VENV_DIR
    python = (
        venv_path / "Scripts" / "python.exe"
        if platform.system() == "Windows"
        else venv_path / "bin" / "python"
    )
    return python if python.exists() else None


def get_activation_command(project_root: Path = Path(".")) -> str:
    # We only return this string so the CLI can print it; we never exec it
    # because a subprocess can't touch its parent shell's environment.
    if platform.system() == "Windows":
        return r".venv\Scripts\activate"
    return "source .venv/bin/activate"
