# Changelog

Stuff that changed, in reverse chronological order. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versions follow [semver](https://semver.org/).

---

## [Unreleased]

Nothing yet — check the [main branch](https://github.com/safeenv/safeenv) if you're curious what's cooking.

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

[Unreleased]: https://github.com/safeenv/safeenv/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/safeenv/safeenv/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/safeenv/safeenv/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/safeenv/safeenv/releases/tag/v0.1.0
