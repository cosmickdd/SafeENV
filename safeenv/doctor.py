# Runs a set of read-only checks on a project and hands back a dataclass
# the CLI can inspect to decide what to print (or fix).

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from safeenv.env_manager import (
    check_gitignore_has_venv,
    check_python_version_constraint,
    detect_python_version,
    read_python_version_file,
    venv_exists,
)
from safeenv.installer import get_missing_packages, read_requirements

# Minimum Python version safeenv considers "compatible".
MIN_PYTHON: Tuple[int, int] = (3, 7)


@dataclass
class DiagnosticReport:
    """Everything the doctor found. has_issues / issue_count are the quick summary."""

    python_version: Tuple[int, int] = field(default_factory=lambda: (0, 0))
    python_ok: bool = False
    venv_found: bool = False
    requirements_found: bool = False
    missing_packages: List[str] = field(default_factory=list)

    # v0.2 additions
    gitignore_has_venv: bool = True  # default True so it's not an issue when unchecked
    python_version_constraint: Optional[str] = None  # error message if mismatch
    required_python_version: Optional[str] = None  # contents of .python-version
    env_example_exists: bool = False
    env_file_exists: bool = False
    missing_env_vars: List[str] = field(default_factory=list)
    detected_env_vars: List[str] = field(default_factory=list)

    @property
    def has_issues(self) -> bool:
        return (
            not self.python_ok
            or not self.venv_found
            or not self.requirements_found
            or bool(self.missing_packages)
            or not self.gitignore_has_venv
            or self.python_version_constraint is not None
            or bool(self.missing_env_vars)
            or (self.env_example_exists and not self.env_file_exists)
        )

    @property
    def issue_count(self) -> int:
        count = 0
        if not self.python_ok:
            count += 1
        if not self.venv_found:
            count += 1
        if not self.requirements_found:
            count += 1
        count += len(self.missing_packages)
        if not self.gitignore_has_venv:
            count += 1
        if self.python_version_constraint is not None:
            count += 1
        if self.env_example_exists and not self.env_file_exists:
            count += 1
        count += len(self.missing_env_vars)
        return count


def run_diagnostics(project_root: Path = Path(".")) -> DiagnosticReport:
    """Check the project and return a populated DiagnosticReport. Nothing is modified."""
    report = DiagnosticReport()

    major, minor = detect_python_version()
    report.python_version = (major, minor)
    report.python_ok = (major, minor) >= MIN_PYTHON

    report.venv_found = venv_exists(project_root)

    req_path = project_root / "requirements.txt"
    report.requirements_found = req_path.exists()

    if report.requirements_found:
        required = read_requirements(req_path)
        report.missing_packages = get_missing_packages(required, project_root)

    # v0.2: .gitignore check
    gitignore_path = project_root / ".gitignore"
    if gitignore_path.exists():
        report.gitignore_has_venv = check_gitignore_has_venv(project_root)
    else:
        # No gitignore at all — flag as an issue only if .venv exists
        report.gitignore_has_venv = not report.venv_found

    # v0.2: .python-version check
    report.required_python_version = read_python_version_file(project_root)
    report.python_version_constraint = check_python_version_constraint(project_root)

    # v0.2: .env health check
    try:
        from safeenv.env_scanner import check_env_health
        env_health = check_env_health(project_root)
        report.env_example_exists = env_health["env_example_exists"]  # type: ignore
        report.env_file_exists = env_health["env_file_exists"]  # type: ignore
        report.missing_env_vars = env_health["missing_vars"]  # type: ignore
        report.detected_env_vars = env_health["detected_vars"]  # type: ignore
    except Exception:
        # If env scanning fails, don't break the whole doctor
        pass

    return report
