# Changelog

Stuff that changed, in reverse chronological order. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versions follow [semver](https://semver.org/).

---

## [Unreleased]

Nothing yet — check the [main branch](https://github.com/safeenv/safeenv) if you're curious what's cooking.

---

## [0.2.0] — 2026-05-20

The **"Actually Useful"** release. Three new commands, version pinning, and environment variable scanning. safeenv now covers the full lifecycle from clone → run → debug.

### Added

- **`safeenv run`** — Run Python scripts and modules using the `.venv` interpreter **without activating** the virtual environment. Supports `safeenv run app.py` and `safeenv run -m pytest`. Uses `os.execvp` on Unix for zero-overhead process replacement.
- **`safeenv clean`** — Delete `.venv`, `__pycache__/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, and `*.pyc` files in one shot. Add `--rebuild` to clean and immediately run `safeenv setup`. Add `--yes` to skip confirmation.
- **`safeenv scan`** — AST-scan your code for environment variable usage (`os.environ`, `os.getenv`, `os.environ.get`, python-decouple `config()`) and generate a `.env.example` file so contributors know which variables to set.
- **`safeenv freeze --pin`** — Pin exact installed versions (`Flask==3.0.3`) instead of bare package names. Queries `.venv` for installed versions via `pip list --format=json`.
- **`.python-version` support** — `safeenv doctor` and `safeenv setup` now read `.python-version` and warn if your Python version is too low. Compatible with pyenv, asdf, and mise.
- **`.gitignore` auto-fix** — `safeenv doctor` warns if `.gitignore` doesn't contain `.venv`. `safeenv fix` automatically adds it.
- **`.env` health checks** — `safeenv doctor` detects when `.env.example` exists but `.env` doesn't, and warns about missing environment variables.
- **`print_hint()`** helper — dim italic output for non-critical suggestions.
- `safeenv init` now shows `safeenv run` as an alternative to manual activation.
- New test fixtures: `tmp_project_with_env_vars`, `tmp_project_with_env_example`, `tmp_project_healthy`.
- New test modules: `test_env_scanner.py`, `test_runner.py`.

### Changed

- Test count: **53 → 112 tests** (111% increase in coverage).
- `utils.py` — added `hint` and `pkg` theme tokens.
- `env_manager.py` — refactored with `destroy_venv()`, `clean_caches()`, `read_python_version_file()`, `check_python_version_constraint()`, and `check_gitignore_has_venv()`.
- `dependency_scanner.py` — added `get_installed_versions()` and `pin_packages()` for version pinning.
- `doctor.py` — `DiagnosticReport` now tracks `.gitignore`, `.python-version`, and `.env` health.
- `cli.py` — extracted `_resolve_root()` helper to reduce code duplication across commands.
- PyPI description updated to reflect new capabilities.
- Added Python 3.13 classifier.

### Architecture

New modules added while maintaining zero new runtime dependencies:
```
safeenv/
├── runner.py        # NEW — safeenv run
├── env_scanner.py   # NEW — .env variable detection via AST
```

---

## [0.1.2] — 2026-03-11

### Added
- `safeenv/__main__.py` — `python -m safeenv` now works, which is useful on Windows where the Scripts directory isn't always on PATH

### Changed
- Updated footer credit to **cosmickdd**
- `safeenv setup` now prints JAI SHREE RAM on completion 🙏

---

## [0.1.1] — 2026-03-11

### Changed
- Better PyPI short description
- README overhauled — ASCII banner, badges, full command docs, import→package mapping table

---

## [0.1.0] — 2025-01-01

First public release. Built the whole thing from scratch.

### What shipped

- **`safeenv init`** — makes a `.venv`. Skips silently if one already exists, so re-running is safe.
- **`safeenv freeze`** — walks every `.py` file in your project with Python's `ast` module (no code is ever executed) and writes a `requirements.txt` for you. Handles 60+ import→PyPI name mismatches out of the box (`cv2` → `opencv-python`, `PIL` → `Pillow`, `sklearn` → `scikit-learn`, etc.).
- **`safeenv setup`** — one command to go from nothing to a working environment: creates `.venv` and installs everything in `requirements.txt`.
- **`safeenv doctor`** — read-only health check. Tells you if your Python version is old, if `.venv` is missing, if `requirements.txt` is absent, and which packages are listed but not installed.
- **`safeenv fix`** — acts on whatever `doctor` found. Creates the venv if needed, installs the missing packages.
- **`--dir` flag** on all commands — point safeenv at a project folder without changing your cwd.
- Colour-coded output and spinners via [Rich](https://github.com/Textualize/rich).
- 53 tests, cross-platform (Windows / macOS / Linux).

### Dependencies
- `typer >= 0.9.0`
- `rich >= 13.0.0`

---

[Unreleased]: https://github.com/safeenv/safeenv/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/safeenv/safeenv/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/safeenv/safeenv/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/safeenv/safeenv/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/safeenv/safeenv/releases/tag/v0.1.0
