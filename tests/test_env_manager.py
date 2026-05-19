"""
Tests for safeenv.env_manager
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from safeenv.env_manager import (
    VENV_DIR,
    check_gitignore_has_venv,
    check_python_version_constraint,
    clean_caches,
    create_venv,
    destroy_venv,
    detect_python_version,
    get_activation_command,
    get_venv_python,
    read_python_version_file,
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


class TestDestroyVenv:
    def test_removes_existing_venv(self, tmp_project: Path):
        (tmp_project / VENV_DIR).mkdir()
        (tmp_project / VENV_DIR / "marker.txt").write_text("x", encoding="utf-8")
        result = destroy_venv(tmp_project)
        assert result is True
        assert not (tmp_project / VENV_DIR).exists()

    def test_returns_false_when_no_venv(self, tmp_project: Path):
        result = destroy_venv(tmp_project)
        assert result is False


class TestCleanCaches:
    def test_removes_pycache(self, tmp_project: Path):
        cache_dir = tmp_project / "__pycache__"
        cache_dir.mkdir()
        (cache_dir / "module.cpython-311.pyc").write_text("", encoding="utf-8")
        count = clean_caches(tmp_project)
        assert count >= 1
        assert not cache_dir.exists()

    def test_removes_nested_pycache(self, tmp_project: Path):
        nested = tmp_project / "src" / "__pycache__"
        nested.mkdir(parents=True)
        (nested / "file.pyc").write_text("", encoding="utf-8")
        count = clean_caches(tmp_project)
        assert count >= 1
        assert not nested.exists()

    def test_does_not_clean_inside_venv(self, tmp_project: Path):
        venv_cache = tmp_project / ".venv" / "lib" / "__pycache__"
        venv_cache.mkdir(parents=True)
        (venv_cache / "internal.pyc").write_text("", encoding="utf-8")
        clean_caches(tmp_project)
        assert venv_cache.exists()

    def test_returns_zero_for_clean_project(self, tmp_project: Path):
        count = clean_caches(tmp_project)
        assert count == 0

    def test_removes_pytest_cache(self, tmp_project: Path):
        cache = tmp_project / ".pytest_cache"
        cache.mkdir()
        (cache / "v" / "cache").mkdir(parents=True)
        count = clean_caches(tmp_project)
        assert count >= 1
        assert not cache.exists()


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


class TestReadPythonVersionFile:
    def test_returns_none_when_no_file(self, tmp_project: Path):
        assert read_python_version_file(tmp_project) is None

    def test_reads_version(self, tmp_project: Path):
        (tmp_project / ".python-version").write_text("3.11\n", encoding="utf-8")
        result = read_python_version_file(tmp_project)
        assert result == "3.11"

    def test_strips_whitespace(self, tmp_project: Path):
        (tmp_project / ".python-version").write_text("  3.10  \n", encoding="utf-8")
        result = read_python_version_file(tmp_project)
        assert result == "3.10"


class TestCheckPythonVersionConstraint:
    def test_returns_none_when_no_file(self, tmp_project: Path):
        assert check_python_version_constraint(tmp_project) is None

    def test_returns_none_when_satisfied(self, tmp_project: Path):
        major, minor = sys.version_info.major, sys.version_info.minor
        (tmp_project / ".python-version").write_text(f"{major}.{minor}\n", encoding="utf-8")
        assert check_python_version_constraint(tmp_project) is None

    def test_returns_error_when_too_low(self, tmp_project: Path):
        # Require a version higher than any current Python
        (tmp_project / ".python-version").write_text("3.99\n", encoding="utf-8")
        result = check_python_version_constraint(tmp_project)
        assert result is not None
        assert "3.99" in result


class TestCheckGitignoreHasVenv:
    def test_returns_false_when_no_gitignore(self, tmp_project: Path):
        assert check_gitignore_has_venv(tmp_project) is False

    def test_returns_true_when_venv_listed(self, tmp_project: Path):
        (tmp_project / ".gitignore").write_text(".venv/\n", encoding="utf-8")
        assert check_gitignore_has_venv(tmp_project) is True

    def test_returns_true_for_bare_venv(self, tmp_project: Path):
        (tmp_project / ".gitignore").write_text(".venv\n", encoding="utf-8")
        assert check_gitignore_has_venv(tmp_project) is True

    def test_returns_false_when_not_listed(self, tmp_project: Path):
        (tmp_project / ".gitignore").write_text("*.pyc\n", encoding="utf-8")
        assert check_gitignore_has_venv(tmp_project) is False
