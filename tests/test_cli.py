"""
Tests for the safeenv CLI commands.

Uses Typer's built-in ``CliRunner`` so commands are invoked in-process
without spawning a subprocess.  Each test runs inside a temporary directory
so the real project workspace is never modified.
"""

import os
from pathlib import Path

import pytest
from typer.testing import CliRunner

from safeenv.cli import app

runner = CliRunner()


# ── Helpers ───────────────────────────────────────────────────────────────────


def _run(args, cwd: Path):
    """Invoke *args* against the CLI with *cwd* as the working directory."""
    old_dir = Path.cwd()
    os.chdir(cwd)
    try:
        result = runner.invoke(app, args)
    finally:
        os.chdir(old_dir)
    return result


def _instant_create_venv(project_root=Path(".")):
    """Drop-in for create_venv that skips subprocess — just makes the .venv dir."""
    venv_path = Path(project_root) / ".venv"
    if venv_path.exists():
        return False
    venv_path.mkdir(parents=True, exist_ok=True)
    return True


# ══════════════════════════════════════════════════════════════════════════════
# --version
# ══════════════════════════════════════════════════════════════════════════════


class TestVersion:
    def test_version_flag(self, tmp_project: Path):
        result = _run(["--version"], tmp_project)
        assert result.exit_code == 0
        assert "safeenv" in result.output
        # Should contain the version string from __version__
        from safeenv import __version__
        assert __version__ in result.output

    def test_version_is_0_2_0(self):
        from safeenv import __version__
        assert __version__ == "0.2.0"


# ══════════════════════════════════════════════════════════════════════════════
# safeenv init
# ══════════════════════════════════════════════════════════════════════════════


class TestInit:
    @pytest.fixture(autouse=True)
    def _patch_create_venv(self, monkeypatch):
        monkeypatch.setattr("safeenv.env_manager.create_venv", _instant_create_venv)

    def test_creates_venv(self, tmp_project: Path):
        result = _run(["init"], tmp_project)
        assert result.exit_code == 0
        assert (tmp_project / ".venv").is_dir()

    def test_output_contains_python_version(self, tmp_project: Path):
        result = _run(["init"], tmp_project)
        assert "Python version detected" in result.output

    def test_output_contains_venv_created(self, tmp_project: Path):
        result = _run(["init"], tmp_project)
        assert ".venv" in result.output

    def test_idempotent_second_run(self, tmp_project: Path):
        _run(["init"], tmp_project)  # first run
        result = _run(["init"], tmp_project)  # second run — must not fail
        assert result.exit_code == 0
        assert "already exists" in result.output

    def test_dir_option(self, tmp_path: Path):
        sub = tmp_path / "myproject"
        sub.mkdir()
        result = runner.invoke(app, ["init", "--dir", str(sub)])
        assert result.exit_code == 0
        assert (sub / ".venv").is_dir()

    def test_shows_run_hint(self, tmp_project: Path):
        result = _run(["init"], tmp_project)
        assert "safeenv run" in result.output


# ══════════════════════════════════════════════════════════════════════════════
# safeenv freeze
# ══════════════════════════════════════════════════════════════════════════════


class TestFreeze:
    def test_generates_requirements_txt(self, tmp_project_with_imports: Path):
        result = _run(["freeze"], tmp_project_with_imports)
        assert result.exit_code == 0
        assert (tmp_project_with_imports / "requirements.txt").exists()

    def test_requirements_contains_detected_packages(
        self, tmp_project_with_imports: Path
    ):
        _run(["freeze"], tmp_project_with_imports)
        content = (tmp_project_with_imports / "requirements.txt").read_text()
        # app.py in this fixture imports numpy, pandas, flask
        assert "numpy" in content
        assert "pandas" in content
        assert "Flask" in content

    def test_output_file_option(self, tmp_project_with_imports: Path):
        result = _run(["freeze", "--output", "deps.txt"], tmp_project_with_imports)
        assert result.exit_code == 0
        assert (tmp_project_with_imports / "deps.txt").exists()

    def test_empty_project_exits_zero(self, tmp_project: Path):
        # An empty project should not crash; it should warn and exit cleanly.
        result = _run(["freeze"], tmp_project)
        assert result.exit_code == 0
        assert "No third-party imports" in result.output

    def test_pin_flag_accepted(self, tmp_project_with_imports: Path):
        # --pin should not crash even without a real .venv
        result = _run(["freeze", "--pin"], tmp_project_with_imports)
        assert result.exit_code == 0


# ══════════════════════════════════════════════════════════════════════════════
# safeenv doctor
# ══════════════════════════════════════════════════════════════════════════════


class TestDoctor:
    def test_runs_without_error(self, tmp_project: Path):
        result = _run(["doctor"], tmp_project)
        assert result.exit_code == 0

    def test_reports_missing_venv(self, tmp_project: Path):
        result = _run(["doctor"], tmp_project)
        assert "not found" in result.output

    def test_reports_missing_requirements(self, tmp_project: Path):
        result = _run(["doctor"], tmp_project)
        assert "not found" in result.output

    def test_shows_python_version(self, tmp_project: Path):
        result = _run(["doctor"], tmp_project)
        assert "Python version" in result.output

    def test_all_clear_message_when_healthy(self, tmp_project_healthy: Path):
        result = _run(["doctor"], tmp_project_healthy)
        assert result.exit_code == 0
        assert "great" in result.output.lower() or "no issues" in result.output.lower()

    def test_warns_about_missing_gitignore_venv(self, tmp_project: Path):
        (tmp_project / ".venv").mkdir()
        (tmp_project / "requirements.txt").write_text("", encoding="utf-8")
        # No .gitignore — should warn
        result = _run(["doctor"], tmp_project)
        assert "gitignore" in result.output.lower() or "Issues" in result.output

    def test_shows_env_file_status(self, tmp_project_with_env_example: Path):
        (tmp_project_with_env_example / ".venv").mkdir()
        (tmp_project_with_env_example / "requirements.txt").write_text("", encoding="utf-8")
        (tmp_project_with_env_example / ".gitignore").write_text(".venv\n", encoding="utf-8")
        result = _run(["doctor"], tmp_project_with_env_example)
        assert ".env" in result.output


# ══════════════════════════════════════════════════════════════════════════════
# safeenv fix
# ══════════════════════════════════════════════════════════════════════════════


class TestFix:
    @pytest.fixture(autouse=True)
    def _patch_create_venv(self, monkeypatch):
        monkeypatch.setattr("safeenv.env_manager.create_venv", _instant_create_venv)

    def test_creates_venv_when_missing(self, tmp_project: Path):
        result = _run(["fix"], tmp_project)
        assert result.exit_code == 0
        assert (tmp_project / ".venv").is_dir()

    def test_output_mentions_repair(self, tmp_project: Path):
        result = _run(["fix"], tmp_project)
        assert "Repairing" in result.output or "repaired" in result.output.lower()

    def test_warns_when_no_requirements(self, tmp_project: Path):
        result = _run(["fix"], tmp_project)
        assert result.exit_code == 0
        # Should warn about missing requirements.txt
        assert "requirements.txt" in result.output

    def test_exits_zero_when_already_healthy(self, tmp_project: Path):
        (tmp_project / ".venv").mkdir()
        (tmp_project / "requirements.txt").write_text("", encoding="utf-8")

        result = _run(["fix"], tmp_project)
        assert result.exit_code == 0

    def test_creates_gitignore_when_missing(self, tmp_project: Path):
        result = _run(["fix"], tmp_project)
        assert result.exit_code == 0
        gitignore = tmp_project / ".gitignore"
        assert gitignore.exists()
        content = gitignore.read_text(encoding="utf-8")
        assert ".venv" in content


# ══════════════════════════════════════════════════════════════════════════════
# safeenv setup
# ══════════════════════════════════════════════════════════════════════════════


class TestSetup:
    @pytest.fixture(autouse=True)
    def _patch_create_venv(self, monkeypatch):
        monkeypatch.setattr("safeenv.env_manager.create_venv", _instant_create_venv)

    def test_creates_venv(self, tmp_project: Path):
        result = _run(["setup"], tmp_project)
        assert result.exit_code == 0
        assert (tmp_project / ".venv").is_dir()

    def test_setup_complete_message(self, tmp_project: Path):
        result = _run(["setup"], tmp_project)
        assert "complete" in result.output.lower()

    def test_warns_about_missing_requirements(self, tmp_project: Path):
        result = _run(["setup"], tmp_project)
        assert "requirements.txt" in result.output


# ══════════════════════════════════════════════════════════════════════════════
# safeenv run  (v0.2)
# ══════════════════════════════════════════════════════════════════════════════


class TestRun:
    def test_no_args_shows_error(self, tmp_project: Path):
        result = _run(["run"], tmp_project)
        assert result.exit_code == 1
        assert "Nothing to run" in result.output

    def test_missing_file_shows_error(self, tmp_project: Path):
        result = _run(["run", "nonexistent.py"], tmp_project)
        assert result.exit_code == 1
        assert "not found" in result.output.lower() or "File not found" in result.output

    def test_warns_about_no_venv(self, tmp_project: Path):
        (tmp_project / "hello.py").write_text("print('hi')\n", encoding="utf-8")
        result = _run(["run", "hello.py"], tmp_project)
        # Should warn about missing venv (but still try to run)
        assert "system Python" in result.output or "No .venv" in result.output


# ══════════════════════════════════════════════════════════════════════════════
# safeenv clean  (v0.2)
# ══════════════════════════════════════════════════════════════════════════════


class TestClean:
    def test_removes_caches(self, tmp_project: Path):
        cache = tmp_project / "__pycache__"
        cache.mkdir()
        (cache / "file.pyc").write_text("", encoding="utf-8")

        result = _run(["clean", "--yes"], tmp_project)
        assert result.exit_code == 0
        assert not cache.exists()

    def test_removes_venv(self, tmp_project: Path):
        (tmp_project / ".venv").mkdir()
        result = _run(["clean", "--yes"], tmp_project)
        assert result.exit_code == 0
        assert not (tmp_project / ".venv").exists()

    def test_shows_clean_complete(self, tmp_project: Path):
        result = _run(["clean", "--yes"], tmp_project)
        assert result.exit_code == 0
        assert "clean" in result.output.lower() or "Clean" in result.output


# ══════════════════════════════════════════════════════════════════════════════
# safeenv scan  (v0.2)
# ══════════════════════════════════════════════════════════════════════════════


class TestScan:
    def test_finds_env_vars(self, tmp_project_with_env_vars: Path):
        result = _run(["scan"], tmp_project_with_env_vars)
        assert result.exit_code == 0
        assert "DATABASE_URL" in result.output
        assert "SECRET_KEY" in result.output

    def test_generates_env_example(self, tmp_project_with_env_vars: Path):
        _run(["scan"], tmp_project_with_env_vars)
        assert (tmp_project_with_env_vars / ".env.example").exists()

    def test_empty_project_exits_zero(self, tmp_project: Path):
        result = _run(["scan"], tmp_project)
        assert result.exit_code == 0
        assert "No environment variable" in result.output

    def test_custom_output(self, tmp_project_with_env_vars: Path):
        result = _run(["scan", "--output", "env.template"], tmp_project_with_env_vars)
        assert result.exit_code == 0
        assert (tmp_project_with_env_vars / "env.template").exists()
