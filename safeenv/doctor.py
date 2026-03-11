# Runs a set of read-only checks on a project and hands back a dataclass
# the CLI can inspect to decide what to print (or fix).

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Tuple

from safeenv.env_manager import detect_python_version, venv_exists
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

    @property
    def has_issues(self) -> bool:
        return (
            not self.python_ok
            or not self.venv_found
            or not self.requirements_found
            or bool(self.missing_packages)
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

    return report
