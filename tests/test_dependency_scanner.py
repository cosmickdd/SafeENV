"""
Tests for safeenv.dependency_scanner
"""

from pathlib import Path
from typing import Set

import pytest

from safeenv.dependency_scanner import (
    extract_imports_from_file,
    scan_project_imports,
    write_requirements,
)


class TestExtractImportsFromFile:
    def test_extracts_simple_import(self, tmp_path: Path):
        f = tmp_path / "a.py"
        f.write_text("import numpy\n", encoding="utf-8")
        result = extract_imports_from_file(f)
        assert "numpy" in result

    def test_extracts_from_import(self, tmp_path: Path):
        f = tmp_path / "b.py"
        f.write_text("from flask import Flask\n", encoding="utf-8")
        result = extract_imports_from_file(f)
        assert "flask" in result

    def test_takes_only_top_level(self, tmp_path: Path):
        f = tmp_path / "c.py"
        f.write_text("import numpy.random\n", encoding="utf-8")
        result = extract_imports_from_file(f)
        assert "numpy" in result
        assert "numpy.random" not in result

    def test_skips_relative_imports(self, tmp_path: Path):
        f = tmp_path / "d.py"
        f.write_text("from . import utils\nfrom ..core import base\n", encoding="utf-8")
        result = extract_imports_from_file(f)
        assert result == set()

    def test_handles_syntax_error_gracefully(self, tmp_path: Path):
        f = tmp_path / "broken.py"
        f.write_text("def foo(:\n", encoding="utf-8")  # intentionally broken
        result = extract_imports_from_file(f)
        assert result == set()

    def test_handles_empty_file(self, tmp_path: Path):
        f = tmp_path / "empty.py"
        f.write_text("", encoding="utf-8")
        result = extract_imports_from_file(f)
        assert result == set()

    def test_multiple_imports_on_one_line(self, tmp_path: Path):
        f = tmp_path / "multi.py"
        f.write_text("import os, sys, numpy\n", encoding="utf-8")
        result = extract_imports_from_file(f)
        assert "numpy" in result
        # os and sys are stdlib but still appear here — filtering is done later
        assert "os" in result


class TestScanProjectImports:
    def test_finds_third_party_imports(self, tmp_project_with_imports: Path):
        packages = scan_project_imports(tmp_project_with_imports)
        assert "numpy" in packages
        assert "pandas" in packages
        assert "Flask" in packages

    def test_excludes_stdlib(self, tmp_project_with_imports: Path):
        packages = scan_project_imports(tmp_project_with_imports)
        assert "os" not in packages
        assert "sys" not in packages

    def test_returns_sorted_list(self, tmp_project_with_imports: Path):
        packages = scan_project_imports(tmp_project_with_imports)
        assert packages == sorted(packages, key=str.lower)

    def test_excludes_venv_directory(self, tmp_path: Path):
        """Imports inside .venv must not pollute the result."""
        venv_pkg = tmp_path / ".venv" / "lib" / "site-packages" / "somelib"
        venv_pkg.mkdir(parents=True)
        (venv_pkg / "fake.py").write_text("import secretlib\n", encoding="utf-8")

        # Project file with known imports
        (tmp_path / "main.py").write_text("import requests\n", encoding="utf-8")

        packages = scan_project_imports(tmp_path)
        assert "secretlib" not in packages
        assert "requests" in packages

    def test_empty_project_returns_empty_list(self, tmp_project: Path):
        result = scan_project_imports(tmp_project)
        assert result == []

    def test_maps_cv2_to_opencv_python(self, tmp_path: Path):
        (tmp_path / "vision.py").write_text("import cv2\n", encoding="utf-8")
        packages = scan_project_imports(tmp_path)
        assert "opencv-python" in packages
        assert "cv2" not in packages

    def test_maps_PIL_to_Pillow(self, tmp_path: Path):
        (tmp_path / "image.py").write_text("from PIL import Image\n", encoding="utf-8")
        packages = scan_project_imports(tmp_path)
        assert "Pillow" in packages
        assert "PIL" not in packages

    def test_maps_sklearn_to_scikit_learn(self, tmp_path: Path):
        (tmp_path / "ml.py").write_text("import sklearn\n", encoding="utf-8")
        packages = scan_project_imports(tmp_path)
        assert "scikit-learn" in packages


class TestWriteRequirements:
    def test_writes_packages_to_file(self, tmp_path: Path):
        output = tmp_path / "requirements.txt"
        write_requirements(["flask", "numpy", "requests"], output)
        content = output.read_text(encoding="utf-8")
        assert "flask\n" in content
        assert "numpy\n" in content
        assert "requests\n" in content

    def test_file_ends_with_newline(self, tmp_path: Path):
        output = tmp_path / "requirements.txt"
        write_requirements(["package-a"], output)
        content = output.read_text(encoding="utf-8")
        assert content.endswith("\n")

    def test_overwrites_existing_file(self, tmp_path: Path):
        output = tmp_path / "requirements.txt"
        output.write_text("old-package\n", encoding="utf-8")
        write_requirements(["new-package"], output)
        content = output.read_text(encoding="utf-8")
        assert "old-package" not in content
        assert "new-package" in content
