# pip wrappers. We always try to use the .venv interpreter so packages
# land in the right place, not loose in the system Python.

import re
import subprocess
import sys
from pathlib import Path
from typing import List, Set

from safeenv.env_manager import get_venv_python

def _pip_cmd(project_root: Path = Path(".")) -> List[str]:
    """Build the pip invocation, preferring the .venv interpreter when present."""
    venv_python = get_venv_python(project_root)
    if venv_python and venv_python.exists():
        return [str(venv_python), "-m", "pip"]
    return [sys.executable, "-m", "pip"]


# ── Public API ────────────────────────────────────────────────────────────────


def install_package(package: str, project_root: Path = Path(".")) -> bool:
    """Install a single *package* via pip.

    Args:
        package: The PyPI package name (or ``name==version`` specifier).
        project_root: Project directory used to locate the .venv.

    Returns:
        True if pip exited with code 0; False otherwise.
    """
    result = subprocess.run(
        _pip_cmd(project_root) + ["install", "--quiet", package],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def install_requirements(
    requirements_path: Path = Path("requirements.txt"),
    project_root: Path = Path("."),
) -> bool:
    """Install all packages listed in *requirements_path* via pip.

    Args:
        requirements_path: Path to the requirements file.
        project_root: Project directory used to locate the .venv.

    Returns:
        True if pip exited with code 0; False otherwise.
    """
    result = subprocess.run(
        _pip_cmd(project_root) + ["install", "--quiet", "-r", str(requirements_path)],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def get_installed_packages(project_root: Path = Path(".")) -> Set[str]:
    """Return installed package names, normalised to lowercase with _ instead of -.

    We normalise because pip, PyPI, and import machinery all have slightly
    different opinions about casing and separators.
    """
    result = subprocess.run(
        _pip_cmd(project_root) + ["list", "--format=columns"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return set()

    packages: Set[str] = set()
    lines = result.stdout.strip().splitlines()

    # First two lines are the header: "Package   Version" and the dashes row.
    for line in lines[2:]:
        parts = line.strip().split()
        if parts:
            packages.add(parts[0].lower().replace("-", "_"))

    return packages


def get_missing_packages(
    required: List[str], project_root: Path = Path(".")
) -> List[str]:
    """Filter *required* down to just the packages that aren't installed yet."""
    installed = get_installed_packages(project_root)
    missing: List[str] = []

    for pkg in required:
        normalised = pkg.lower().replace("-", "_")
        if normalised not in installed:
            missing.append(pkg)

    return missing


def read_requirements(requirements_path: Path = Path("requirements.txt")) -> List[str]:
    """Read requirements.txt and return bare package names, no version specifiers."""
    if not requirements_path.exists():
        return []

    packages: List[str] = []
    lines = requirements_path.read_text(encoding="utf-8").splitlines()

    for raw_line in lines:
        line = raw_line.strip()

        # Skip blank lines and comments.
        if not line or line.startswith("#"):
            continue

        # Strip version specifiers and extras (requests>=2.28 → requests).
        pkg_name = re.split(r"[><=!~\[;]", line)[0].strip()
        if pkg_name:
            packages.append(pkg_name)

    return packages
