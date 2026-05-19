"""
Tests for safeenv.env_scanner — AST-based environment variable detection.
"""

from pathlib import Path

import pytest

from safeenv.env_scanner import (
    extract_env_vars_from_file,
    scan_project_env_vars,
    read_env_file,
    write_env_example,
    check_env_health,
)


class TestExtractEnvVarsFromFile:
    def test_detects_os_environ_subscript(self, tmp_path: Path):
        f = tmp_path / "a.py"
        f.write_text("import os\ndb = os.environ['DATABASE_URL']\n", encoding="utf-8")
        result = extract_env_vars_from_file(f)
        assert "DATABASE_URL" in result

    def test_detects_os_getenv(self, tmp_path: Path):
        f = tmp_path / "b.py"
        f.write_text("import os\nkey = os.getenv('SECRET_KEY')\n", encoding="utf-8")
        result = extract_env_vars_from_file(f)
        assert "SECRET_KEY" in result

    def test_detects_os_environ_get(self, tmp_path: Path):
        f = tmp_path / "c.py"
        f.write_text("import os\nval = os.environ.get('DEBUG', 'false')\n", encoding="utf-8")
        result = extract_env_vars_from_file(f)
        assert "DEBUG" in result

    def test_detects_decouple_config(self, tmp_path: Path):
        f = tmp_path / "d.py"
        f.write_text("from decouple import config\ndb = config('DATABASE_URL')\n", encoding="utf-8")
        result = extract_env_vars_from_file(f)
        assert "DATABASE_URL" in result

    def test_ignores_non_env_calls(self, tmp_path: Path):
        f = tmp_path / "e.py"
        f.write_text("x = print('hello')\ny = len('test')\n", encoding="utf-8")
        result = extract_env_vars_from_file(f)
        assert result == set()

    def test_handles_syntax_error(self, tmp_path: Path):
        f = tmp_path / "broken.py"
        f.write_text("def foo(:\n", encoding="utf-8")
        result = extract_env_vars_from_file(f)
        assert result == set()

    def test_handles_empty_file(self, tmp_path: Path):
        f = tmp_path / "empty.py"
        f.write_text("", encoding="utf-8")
        result = extract_env_vars_from_file(f)
        assert result == set()

    def test_multiple_env_vars_in_one_file(self, tmp_path: Path):
        f = tmp_path / "config.py"
        code = (
            "import os\n"
            "a = os.environ['VAR_A']\n"
            "b = os.getenv('VAR_B')\n"
            "c = os.environ.get('VAR_C')\n"
        )
        f.write_text(code, encoding="utf-8")
        result = extract_env_vars_from_file(f)
        assert result == {"VAR_A", "VAR_B", "VAR_C"}


class TestScanProjectEnvVars:
    def test_finds_env_vars(self, tmp_project_with_env_vars: Path):
        result = scan_project_env_vars(tmp_project_with_env_vars)
        assert "DATABASE_URL" in result
        assert "SECRET_KEY" in result
        assert "DEBUG" in result

    def test_returns_sorted(self, tmp_project_with_env_vars: Path):
        result = scan_project_env_vars(tmp_project_with_env_vars)
        assert result == sorted(result)

    def test_empty_project(self, tmp_project: Path):
        result = scan_project_env_vars(tmp_project)
        assert result == []

    def test_excludes_venv_directory(self, tmp_path: Path):
        venv_file = tmp_path / ".venv" / "lib" / "config.py"
        venv_file.parent.mkdir(parents=True)
        venv_file.write_text("import os\nx = os.getenv('VENV_SECRET')\n", encoding="utf-8")

        main = tmp_path / "app.py"
        main.write_text("import os\ndb = os.getenv('APP_DB')\n", encoding="utf-8")

        result = scan_project_env_vars(tmp_path)
        assert "APP_DB" in result
        assert "VENV_SECRET" not in result


class TestReadEnvFile:
    def test_reads_simple_env(self, tmp_path: Path):
        f = tmp_path / ".env"
        f.write_text("KEY=value\nSECRET=mysecret\n", encoding="utf-8")
        result = read_env_file(f)
        assert result == {"KEY": "value", "SECRET": "mysecret"}

    def test_strips_quotes(self, tmp_path: Path):
        f = tmp_path / ".env"
        f.write_text('KEY="quoted"\nKEY2=\'single\'\n', encoding="utf-8")
        result = read_env_file(f)
        assert result["KEY"] == "quoted"
        assert result["KEY2"] == "single"

    def test_skips_comments(self, tmp_path: Path):
        f = tmp_path / ".env"
        f.write_text("# comment\nKEY=value\n", encoding="utf-8")
        result = read_env_file(f)
        assert "#" not in str(result.keys())
        assert "KEY" in result

    def test_returns_empty_for_missing_file(self, tmp_path: Path):
        result = read_env_file(tmp_path / ".env")
        assert result == {}


class TestWriteEnvExample:
    def test_writes_file(self, tmp_path: Path):
        output = tmp_path / ".env.example"
        write_env_example(["DATABASE_URL", "SECRET_KEY"], output)
        assert output.exists()

    def test_contains_variables(self, tmp_path: Path):
        output = tmp_path / ".env.example"
        write_env_example(["DATABASE_URL", "SECRET_KEY"], output)
        content = output.read_text(encoding="utf-8")
        assert "DATABASE_URL=" in content
        assert "SECRET_KEY=" in content

    def test_contains_instructions(self, tmp_path: Path):
        output = tmp_path / ".env.example"
        write_env_example(["KEY"], output)
        content = output.read_text(encoding="utf-8")
        assert "cp .env.example .env" in content


class TestCheckEnvHealth:
    def test_detects_missing_env_file(self, tmp_project_with_env_example: Path):
        result = check_env_health(tmp_project_with_env_example)
        assert result["env_example_exists"] is True
        assert result["env_file_exists"] is False

    def test_detects_missing_vars(self, tmp_path: Path):
        (tmp_path / ".env.example").write_text("KEY_A=\nKEY_B=\n", encoding="utf-8")
        (tmp_path / ".env").write_text("KEY_A=value\n", encoding="utf-8")
        result = check_env_health(tmp_path)
        assert "KEY_B" in result["missing_vars"]

    def test_no_issues_when_all_present(self, tmp_path: Path):
        (tmp_path / ".env.example").write_text("KEY=\n", encoding="utf-8")
        (tmp_path / ".env").write_text("KEY=value\n", encoding="utf-8")
        result = check_env_health(tmp_path)
        assert result["missing_vars"] == []
