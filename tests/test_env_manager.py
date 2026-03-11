"""
Tests for safeenv.env_manager
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from safeenv.env_manager import (
    VENV_DIR,
    create_venv,
    detect_python_version,
    get_activation_command,
    get_venv_python,
    venv_exists,
)


class TestDetectPythonVersion:
    def test_returns_tuple(self):
        result = detect_python_version()
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_major_is_three(self):
        major, _ = detect_python_version()
        assert major == 3, "safeenv requires Python 3"

    def test_matches_sys_version_info(self):
        major, minor = detect_python_version()
        assert major == sys.version_info.major
        assert minor == sys.version_info.minor


class TestVenvExists:
    def test_returns_false_when_no_venv(self, tmp_project: Path):
        assert venv_exists(tmp_project) is False

    def test_returns_true_when_venv_present(self, tmp_project: Path):
        (tmp_project / VENV_DIR).mkdir()
        assert venv_exists(tmp_project) is True


class TestCreateVenv:
    def test_creates_venv_directory(self, tmp_project: Path):
        # Mock subprocess so we don't wait for a real venv build.
        def _fake_venv(cmd, **kw):
            Path(cmd[-1]).mkdir(parents=True, exist_ok=True)
            return MagicMock(returncode=0, stderr="")

        with patch("safeenv.env_manager.subprocess.run", side_effect=_fake_venv):
            created = create_venv(tmp_project)
        assert created is True
        assert (tmp_project / VENV_DIR).is_dir()

    def test_venv_contains_python(self, real_venv_root: Path):
        # Uses the session-scoped .venv — only built once for the whole run.
        python = get_venv_python(real_venv_root)
        assert python is not None, "No Python interpreter found inside .venv"
        assert python.exists()

    def test_returns_false_when_already_exists(self, tmp_project: Path):
        # Pre-create the dir — create_venv returns False before ever touching subprocess.
        (tmp_project / VENV_DIR).mkdir()
        result = create_venv(tmp_project)
        assert result is False

    def test_does_not_overwrite_existing_venv(self, tmp_project: Path):
        (tmp_project / VENV_DIR).mkdir()
        marker = tmp_project / VENV_DIR / "safeenv_test_marker.txt"
        marker.write_text("do not delete", encoding="utf-8")

        create_venv(tmp_project)  # should short-circuit — .venv already exists

        assert marker.exists(), ".venv was overwritten — create_venv must be idempotent"


class TestGetVenvPython:
    def test_returns_none_when_no_venv(self, tmp_project: Path):
        assert get_venv_python(tmp_project) is None

    def test_returns_path_after_creation(self, real_venv_root: Path):
        result = get_venv_python(real_venv_root)
        assert result is not None
        assert result.exists()


class TestGetActivationCommand:
    def test_returns_string(self, tmp_project: Path):
        cmd = get_activation_command(tmp_project)
        assert isinstance(cmd, str)
        assert len(cmd) > 0

    def test_contains_venv(self, tmp_project: Path):
        cmd = get_activation_command(tmp_project)
        assert ".venv" in cmd
