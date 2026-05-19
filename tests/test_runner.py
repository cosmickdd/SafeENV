"""
Tests for safeenv.runner — executing scripts/modules via .venv Python.
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from safeenv.runner import _resolve_python, is_using_venv


class TestResolvePython:
    def test_returns_venv_python_when_available(self, real_venv_root: Path):
        result = _resolve_python(real_venv_root)
        assert ".venv" in str(result)
        assert result.exists()

    def test_falls_back_to_system_python(self, tmp_path: Path):
        # No .venv here — should fall back to sys.executable
        result = _resolve_python(tmp_path)
        assert result == Path(sys.executable)


class TestIsUsingVenv:
    def test_true_when_venv_exists(self, real_venv_root: Path):
        assert is_using_venv(real_venv_root) is True

    def test_false_when_no_venv(self, tmp_path: Path):
        assert is_using_venv(tmp_path) is False
