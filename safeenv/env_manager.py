# Everything to do with .venv: find it, make it, destroy it, interrogate it.

import platform
import shutil
import subprocess
import sys
from pathlib import Path
from typing import List, Optional, Tuple

# .venv is the conventional name; no plans to make this configurable.
VENV_DIR: str = ".venv"

# Directories and file patterns that `clean` removes.
_CACHE_DIRS: List[str] = ["__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache"]
_CACHE_PATTERNS: List[str] = ["*.pyc", "*.pyo"]


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


def destroy_venv(project_root: Path = Path(".")) -> bool:
    """Delete the .venv directory. Returns True if it was deleted, False if nothing to delete."""
    venv_path = project_root / VENV_DIR
    if not venv_path.exists():
        return False

    shutil.rmtree(venv_path, ignore_errors=True)
    return True


def clean_caches(project_root: Path = Path(".")) -> int:
    """Remove __pycache__, .pyc, and other cache artifacts. Returns count of items deleted."""
    count = 0

    # Remove cache directories
    for cache_dir_name in _CACHE_DIRS:
        for cache_dir in project_root.rglob(cache_dir_name):
            # Don't accidentally clean inside .venv
            if VENV_DIR in cache_dir.parts:
                continue
            if cache_dir.is_dir():
                shutil.rmtree(cache_dir, ignore_errors=True)
                count += 1

    # Remove stray .pyc / .pyo files outside __pycache__
    for pattern in _CACHE_PATTERNS:
        for cache_file in project_root.rglob(pattern):
            if VENV_DIR in cache_file.parts:
                continue
            try:
                cache_file.unlink()
                count += 1
            except OSError:
                pass

    return count


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


def read_python_version_file(project_root: Path = Path(".")) -> Optional[str]:
    """Read .python-version if it exists. Returns the version string or None."""
    version_file = project_root / ".python-version"
    if not version_file.exists():
        return None

    content = version_file.read_text(encoding="utf-8").strip()
    return content if content else None


def check_python_version_constraint(project_root: Path = Path(".")) -> Optional[str]:
    """Check if the current Python version satisfies .python-version.

    Returns None if satisfied (or no file exists), otherwise returns
    an error message string.
    """
    required = read_python_version_file(project_root)
    if required is None:
        return None

    # Parse "3.11" or "3.11.2" — we only compare major.minor
    try:
        parts = required.split(".")
        req_major = int(parts[0])
        req_minor = int(parts[1]) if len(parts) > 1 else 0
    except (ValueError, IndexError):
        return f"Could not parse .python-version: '{required}'"

    current_major, current_minor = detect_python_version()

    if (current_major, current_minor) < (req_major, req_minor):
        return (
            f"Project requires Python {req_major}.{req_minor}, "
            f"but you have {current_major}.{current_minor}"
        )

    return None


def check_gitignore_has_venv(project_root: Path = Path(".")) -> bool:
    """Return True if .gitignore exists and contains .venv."""
    gitignore = project_root / ".gitignore"
    if not gitignore.exists():
        return False

    content = gitignore.read_text(encoding="utf-8", errors="ignore")
    for line in content.splitlines():
        stripped = line.strip()
        if stripped in (".venv", ".venv/", ".venv/*"):
            return True
    return False
