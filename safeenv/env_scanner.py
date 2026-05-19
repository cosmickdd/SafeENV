# Scans Python files for environment variable access (os.environ, os.getenv,
# python-dotenv, python-decouple) and produces a .env.example so new
# contributors know which variables the project expects.
#
# Like the dependency scanner, this uses AST only — no code execution.

import ast
from pathlib import Path
from typing import Dict, List, Optional, Set

from safeenv.dependency_scanner import _DEFAULT_EXCLUDE_DIRS


# ── AST visitor ──────────────────────────────────────────────────────────────


class _EnvVarVisitor(ast.NodeVisitor):
    """Walk an AST and collect environment variable names."""

    def __init__(self) -> None:
        self.env_vars: Set[str] = set()

    # ── os.environ["KEY"] / os.environ.get("KEY") / os.getenv("KEY") ─────

    def visit_Subscript(self, node: ast.Subscript) -> None:
        # os.environ["DATABASE_URL"]
        if self._is_os_environ(node.value):
            key = self._extract_string(node.slice)
            if key:
                self.env_vars.add(key)
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        # os.getenv("KEY") / os.environ.get("KEY")
        if self._is_os_getenv(node) or self._is_environ_get(node):
            if node.args:
                key = self._extract_string(node.args[0])
                if key:
                    self.env_vars.add(key)

        # python-decouple: config("KEY")
        if self._is_decouple_config(node):
            if node.args:
                key = self._extract_string(node.args[0])
                if key:
                    self.env_vars.add(key)

        self.generic_visit(node)

    # ── Pattern matchers ─────────────────────────────────────────────────

    @staticmethod
    def _is_os_environ(node: ast.expr) -> bool:
        """Match ``os.environ``."""
        return (
            isinstance(node, ast.Attribute)
            and node.attr == "environ"
            and isinstance(node.value, ast.Name)
            and node.value.id == "os"
        )

    @staticmethod
    def _is_os_getenv(node: ast.Call) -> bool:
        """Match ``os.getenv(...)``."""
        return (
            isinstance(node.func, ast.Attribute)
            and node.func.attr == "getenv"
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "os"
        )

    @staticmethod
    def _is_environ_get(node: ast.Call) -> bool:
        """Match ``os.environ.get(...)``."""
        if not isinstance(node.func, ast.Attribute):
            return False
        if node.func.attr != "get":
            return False
        # node.func.value should be os.environ
        return _EnvVarVisitor._is_os_environ(node.func.value)

    @staticmethod
    def _is_decouple_config(node: ast.Call) -> bool:
        """Match ``config("KEY")`` from python-decouple."""
        return isinstance(node.func, ast.Name) and node.func.id == "config"

    @staticmethod
    def _extract_string(node: ast.expr) -> Optional[str]:
        """Pull a string literal from a Constant / Str node."""
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return node.value
        return None


# ── Public API ───────────────────────────────────────────────────────────────


def extract_env_vars_from_file(filepath: Path) -> Set[str]:
    """Parse a .py file and return every env var name referenced in it."""
    try:
        source = filepath.read_text(encoding="utf-8", errors="ignore")
        tree = ast.parse(source, filename=str(filepath))
    except (SyntaxError, OSError):
        return set()

    visitor = _EnvVarVisitor()
    visitor.visit(tree)
    return visitor.env_vars


def scan_project_env_vars(
    project_root: Path = Path("."),
    extra_exclude_dirs: Optional[Set[str]] = None,
) -> List[str]:
    """Walk the project and return sorted list of env var names used in code."""
    exclude_dirs = _DEFAULT_EXCLUDE_DIRS.copy()
    if extra_exclude_dirs:
        exclude_dirs |= extra_exclude_dirs

    all_vars: Set[str] = set()

    for py_file in project_root.rglob("*.py"):
        if any(part in exclude_dirs for part in py_file.parts):
            continue
        all_vars |= extract_env_vars_from_file(py_file)

    return sorted(all_vars)


def read_env_file(env_path: Path) -> Dict[str, str]:
    """Parse a .env file into a {KEY: value} dict. Handles comments & blanks."""
    result: Dict[str, str] = {}
    if not env_path.exists():
        return result

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            result[key.strip()] = value.strip().strip("\"'")

    return result


def write_env_example(
    env_vars: List[str],
    output_path: Path = Path(".env.example"),
) -> None:
    """Write a .env.example file with placeholder values."""
    lines = [
        "# Environment variables required by this project.",
        "# Copy this file to .env and fill in the values:",
        "#   cp .env.example .env",
        "",
    ]
    for var in env_vars:
        lines.append(f"{var}=")

    lines.append("")  # trailing newline
    output_path.write_text("\n".join(lines), encoding="utf-8")


def check_env_health(project_root: Path = Path(".")) -> Dict[str, object]:
    """Check .env setup and return a status dict for doctor integration.

    Returns:
        dict with keys:
          - env_example_exists (bool)
          - env_file_exists (bool)
          - missing_vars (list[str]) — vars in .env.example but not in .env
          - detected_vars (list[str]) — vars found in code via AST scan
    """
    env_path = project_root / ".env"
    env_example_path = project_root / ".env.example"

    result: Dict[str, object] = {
        "env_example_exists": env_example_path.exists(),
        "env_file_exists": env_path.exists(),
        "missing_vars": [],
        "detected_vars": [],
    }

    # Scan code for env var usage
    detected = scan_project_env_vars(project_root)
    result["detected_vars"] = detected

    # If .env.example exists, check what's missing from .env
    if env_example_path.exists() and env_path.exists():
        example_vars = read_env_file(env_example_path)
        actual_vars = read_env_file(env_path)
        missing = [k for k in example_vars if k not in actual_vars]
        result["missing_vars"] = missing
    elif env_example_path.exists() and not env_path.exists():
        # All vars are "missing" because .env doesn't exist
        result["missing_vars"] = list(read_env_file(env_example_path).keys())

    return result
