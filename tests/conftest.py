"""
Shared pytest fixtures for the safeenv test suite.

Provides temporary project directory helpers so individual test modules
do not have to repeat boilerplate ``tmp_path`` set-up code.
"""

import pytest
from pathlib import Path


@pytest.fixture()
def tmp_project(tmp_path: Path) -> Path:
    """Return a temporary directory representing an empty project root."""
    return tmp_path


@pytest.fixture()
def tmp_project_with_imports(tmp_path: Path) -> Path:
    """Temporary project containing a Python file with third-party imports."""
    code = (
        "import os\n"                  # stdlib — should be excluded
        "import sys\n"                 # stdlib — should be excluded
        "import numpy\n"               # third-party — should appear
        "import pandas\n"             # third-party — should appear
        "from flask import Flask\n"   # third-party — should appear
        "from . import utils\n"       # relative — should be excluded
    )
    (tmp_path / "app.py").write_text(code, encoding="utf-8")
    return tmp_path


@pytest.fixture()
def tmp_project_with_requirements(tmp_path: Path) -> Path:
    """Temporary project containing a requirements.txt file."""
    requirements = "requests\nnumpy>=1.24\npandas\n"
    (tmp_path / "requirements.txt").write_text(requirements, encoding="utf-8")
    return tmp_path


@pytest.fixture(scope="session")
def real_venv_root(tmp_path_factory) -> Path:
    """Create one real .venv per session — shared by tests that need an actual Python binary."""
    from safeenv.env_manager import create_venv
    root = tmp_path_factory.mktemp("shared_venv")
    create_venv(root)
    return root
