# Run Python scripts / modules using the .venv interpreter, so the
# developer never has to think about activation.

import os
import platform
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

from safeenv.env_manager import get_venv_python


def _resolve_python(project_root: Path) -> Path:
    """Return the best Python interpreter — .venv first, system fallback."""
    venv_python = get_venv_python(project_root)
    if venv_python and venv_python.exists():
        return venv_python
    return Path(sys.executable)


def run_script(
    script: str,
    args: List[str],
    project_root: Path = Path("."),
) -> int:
    """Run ``python <script> [args...]`` using the .venv interpreter.

    Returns the exit code of the child process.
    """
    python = _resolve_python(project_root)
    cmd = [str(python), script, *args]

    if platform.system() != "Windows":
        # On Unix, replace this process entirely — cheaper, keeps signal
        # handling sane, and lets Ctrl-C propagate correctly.
        os.execvp(str(python), cmd)
        # unreachable, but makes type checkers happy
        return 0  # pragma: no cover
    else:
        # Windows doesn't support execvp cleanly, so we spawn.
        result = subprocess.run(cmd)
        return result.returncode


def run_module(
    module: str,
    args: List[str],
    project_root: Path = Path("."),
) -> int:
    """Run ``python -m <module> [args...]`` using the .venv interpreter.

    Returns the exit code of the child process.
    """
    python = _resolve_python(project_root)
    cmd = [str(python), "-m", module, *args]

    if platform.system() != "Windows":
        os.execvp(str(python), cmd)
        return 0  # pragma: no cover
    else:
        result = subprocess.run(cmd)
        return result.returncode


def is_using_venv(project_root: Path = Path(".")) -> bool:
    """Return True if .venv interpreter was found and will be used."""
    venv_python = get_venv_python(project_root)
    return venv_python is not None and venv_python.exists()
