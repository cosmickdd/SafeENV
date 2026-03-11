<div align="center">

<br/>

```
███████╗ █████╗ ███████╗███████╗███████╗███╗   ██╗██╗   ██╗
██╔════╝██╔══██╗██╔════╝██╔════╝██╔════╝████╗  ██║██║   ██║
███████╗███████║█████╗  █████╗  █████╗  ██╔██╗ ██║██║   ██║
╚════██║██╔══██║██╔══╝  ██╔══╝  ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝
███████║██║  ██║██║     ███████╗███████╗██║ ╚████║ ╚████╔╝
╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝╚═╝  ╚═══╝  ╚═══╝
```

<h3>🛡 The Python environment tool that just works.</h3>

<p><em>Stop fighting your environment. Start building.</em></p>

<br/>

<p>
  <a href="https://pypi.org/project/safeenv-tool/"><img alt="PyPI" src="https://img.shields.io/pypi/v/safeenv-tool?color=4c9be8&label=PyPI&logo=pypi&logoColor=white"></a>
  <a href="https://pypi.org/project/safeenv-tool/"><img alt="Python" src="https://img.shields.io/pypi/pyversions/safeenv-tool?logo=python&logoColor=white"></a>
  <a href="https://github.com/safeenv/safeenv/actions/workflows/tests.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/safeenv/safeenv/tests.yml?label=tests&logo=github"></a>
  <a href="https://pypi.org/project/safeenv-tool/"><img alt="Downloads" src="https://img.shields.io/pypi/dm/safeenv-tool?color=orange&label=downloads"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-22c55e"></a>
  <a href="https://github.com/safeenv/safeenv/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/safeenv/safeenv?style=flat&color=yellow&label=stars"></a>
</p>

<br/>

<p>
  <b><a href="#-quick-start">Quick Start</a></b> •
  <b><a href="#-commands">Commands</a></b> •
  <b><a href="#-why-safeenv">Why safeenv?</a></b> •
  <b><a href="#-contributing">Contributing</a></b>
</p>

<br/>

</div>

---

## 🤔 Why safeenv?

Every Python developer has been there:

```
$ python app.py
ModuleNotFoundError: No module named 'flask'
```

Or worse — you clone a project, follow the README step by step, and it **still doesn't run**.

**safeenv eliminates this entire category of problem.**

It is the tool teachers wish existed when they started teaching Python, and the tool students wish they had on day one.

| Without `safeenv` | With `safeenv` |
|---|---|
| `python -m venv .venv` → activate → pip install → hope | `safeenv setup` |
| Manually grep imports → write requirements.txt | `safeenv freeze` |
| Google "ModuleNotFoundError fix" | `safeenv doctor` then `safeenv fix` |
| Broken environment → nuke and rebuild from scratch | `safeenv fix` |

---

## ⚡ Quick Start

**Install:**

```bash
pip install safeenv-tool
```

**Use:**

```bash
# New project
mkdir my-project && cd my-project
safeenv init

# Cloned project (does everything in one step)
git clone https://github.com/someone/cool-project
cd cool-project
safeenv setup

# Something broken?
safeenv doctor    # diagnose
safeenv fix       # repair
```

That's it. No config files. No YAML. No learning curve.

---

## 📋 Commands

### `safeenv init` — Initialize environment

Creates a `.venv` virtual environment and tells you exactly how to activate it.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SafeEnv Initialization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  Python version detected: 3.11
  ✓  Virtual environment created: .venv

  Your environment is ready.

  To activate:

    Mac / Linux:
      source .venv/bin/activate

    Windows:
      .venv\Scripts\activate
```

```bash
safeenv init                     # current directory
safeenv init --dir /my/project   # specific directory
```

> **Safe:** Running `init` on a project that already has `.venv` does nothing — it will never overwrite your environment.

---

### `safeenv freeze` — Generate requirements.txt

Scans every `.py` file with Python **AST parsing** — no code is executed — and produces a clean `requirements.txt`.

```
  Scanning project for imports...

  ✓  Flask
  ✓  numpy
  ✓  pandas
  ✓  requests

  ✓  requirements.txt generated with 4 packages.
```

```bash
safeenv freeze                        # writes requirements.txt
safeenv freeze --output deps.txt      # custom output file
```

**Under the hood:**
- Reads every `.py` file with `ast.parse()` — zero code execution, zero risk
- Skips `.venv`, `__pycache__`, `build`, `dist`, and other generated directories
- Automatically resolves import → package name mismatches (see [Import Name Mapping](#-import-name-mapping))
- Produces a sorted, deduplicated list

---

### `safeenv setup` — One-command project setup

The only command you need after cloning a project. Combines `init` + install.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Checking environment...

  ✓  Python version compatible: 3.11
  ✓  Virtual environment created: .venv

  Installing dependencies...

  ✓  Flask installed
  ✓  numpy installed
  ✓  requests installed

  Project setup complete.
```

```bash
safeenv setup
safeenv setup --dir /my/project
```

---

### `safeenv doctor` — Diagnose your project

A full read-only health check. **Never modifies anything.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Health Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Python version      :  3.11
  Virtual environment :  detected
  requirements.txt    :  found

  Issues found:

  ⚠  Missing dependency: torch
  ⚠  Missing dependency: fastapi

  Recommendation:

    Run:  safeenv fix
```

---

### `safeenv fix` — Repair automatically

Resolves every issue `doctor` reports — missing venv, missing packages — in one shot.

```
  Repairing environment...

  ✓  Virtual environment: OK

  Missing package detected: torch
  ✓  torch installed

  Missing package detected: fastapi
  ✓  fastapi installed

  ✓  Environment repaired successfully.
```

```bash
safeenv fix
safeenv fix --dir /my/project
```

---

## 🗺 Import Name Mapping

`safeenv freeze` automatically translates the import name you use in code to the correct PyPI distribution name:

| You write | `pip install` |
|---|---|
| `import cv2` | `opencv-python` |
| `from PIL import Image` | `Pillow` |
| `import sklearn` | `scikit-learn` |
| `from bs4 import BeautifulSoup` | `beautifulsoup4` |
| `import yaml` | `PyYAML` |
| `from dotenv import load_dotenv` | `python-dotenv` |
| `import dateutil` | `python-dateutil` |
| `import serial` | `pyserial` |
| `import jwt` | `PyJWT` |
| `import git` | `GitPython` |
| `import skimage` | `scikit-image` |
| `from nacl import ...` | `PyNaCl` |

> See [`dependency_scanner.py`](safeenv/dependency_scanner.py) for the full list of 60+ mappings.

---

## 🏗 Architecture

safeenv is intentionally modular. Each file has exactly one job:

```
safeenv/
│
├── safeenv/
│   ├── __init__.py            # Package metadata and __version__
│   ├── cli.py                 # Typer CLI — all 5 commands live here
│   ├── env_manager.py         # .venv creation, detection, Python version
│   ├── dependency_scanner.py  # AST import scanner + PyPI name mapping
│   ├── installer.py           # pip helpers (install, list, diff missing)
│   ├── doctor.py              # DiagnosticReport dataclass + run_diagnostics()
│   └── utils.py               # Shared Rich console, print helpers
│
├── tests/
│   ├── conftest.py            # Shared pytest fixtures
│   ├── test_cli.py            # Integration tests (CLI commands via CliRunner)
│   ├── test_dependency_scanner.py   # Unit tests for AST scanning
│   └── test_env_manager.py    # Unit tests for venv logic
│
├── .github/
│   ├── workflows/tests.yml    # CI — runs on every push and PR
│   ├── ISSUE_TEMPLATE/        # Bug report & feature request templates
│   └── PULL_REQUEST_TEMPLATE.md
│
├── pyproject.toml             # Build config + CLI entry point
├── CONTRIBUTING.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE
```

---

## 🔧 Installation

**From PyPI (recommended):**

```bash
pip install safeenv-tool
```

**From source (for contributors):**

```bash
git clone https://github.com/safeenv/safeenv.git
cd safeenv
pip install -e ".[dev]"
```

**Requirements:**
- Python 3.8+
- Works on **Windows**, **macOS**, and **Linux**
- Runtime dependencies: `typer` + `rich` — both installed automatically

---

## 🧪 Running Tests

```bash
# Run the full test suite
pytest

# With coverage report
pytest --cov=safeenv --cov-report=term-missing

# Run a specific test file
pytest tests/test_cli.py -v
```

The test suite currently has **53 tests** covering the CLI, AST scanner, and environment manager.

---

## 🤝 Contributing

safeenv is built for the community, by the community. All skill levels welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. The short version:

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/safeenv.git
cd safeenv

# 2. Install in dev mode
pip install -e ".[dev]"

# 3. Create a branch
git checkout -b feature/my-great-idea

# 4. Make changes, run tests
pytest

# 5. Open a PR
```

**Good first issues** are labelled [`good first issue`](https://github.com/safeenv/safeenv/issues?q=label%3A%22good+first+issue%22) on GitHub.

---

## 📜 Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

---

## 🔒 Security

Found a vulnerability? Please do **not** open a public issue.
Read [SECURITY.md](SECURITY.md) for the responsible disclosure process.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 💛 Acknowledgements

Built with:
- [Typer](https://typer.tiangolo.com/) — the CLI framework
- [Rich](https://rich.readthedocs.io/) — beautiful terminal output

Inspired by the frustrations of students and developers everywhere who just want their code to run.

---

<div align="center">

**If safeenv saved you time, please ⭐ star the repo — it helps others find it.**

[⭐ Star on GitHub](https://github.com/safeenv/safeenv) · [🐛 Report a Bug](https://github.com/safeenv/safeenv/issues/new?template=bug_report.md) · [💡 Request a Feature](https://github.com/safeenv/safeenv/issues/new?template=feature_request.md)

</div>


Students and new developers often struggle with:

- Creating and activating virtual environments
- Generating `requirements.txt` files
- Getting a cloned project to run
- Mysterious `ModuleNotFoundError` messages
- Missing or broken dependencies

`safeenv` makes these problems disappear with simple, memorable commands.

---

## Features

| Command            | What it does                                                    |
|--------------------|------------------------------------------------------------------|
| `safeenv init`     | Create a `.venv` virtual environment in the current directory   |
| `safeenv freeze`   | Scan all `.py` files and generate `requirements.txt`            |
| `safeenv setup`    | Create `.venv` + install all dependencies (great after cloning) |
| `safeenv doctor`   | Diagnose missing venv, packages, or bad Python versions         |
| `safeenv fix`      | Repair the environment automatically                            |

---

## Installation

```bash
pip install safeenv
```

Or install in editable/development mode from source:

```bash
git clone https://github.com/safeenv/safeenv.git
cd safeenv
pip install -e ".[dev]"
```

After installation, the `safeenv` command will be available globally.

---

## Quick Start

### 1. Start a new project

```bash
mkdir my-project && cd my-project
safeenv init
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SafeEnv Initialization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  Python version detected: 3.11
  ✓  Virtual environment created: .venv

  Your environment is ready.

  To activate:

    Mac / Linux:
      source .venv/bin/activate

    Windows:
      .venv\Scripts\activate
```

### 2. Scan your project and generate requirements.txt

```bash
safeenv freeze
```

```
  Scanning project for imports...

  ✓  Flask
  ✓  numpy
  ✓  pandas
  ✓  requests

  ✓  requirements.txt generated with 4 packages.
```

`safeenv freeze` uses Python **AST parsing** — it reads your source files without
executing them, so it is completely safe.

### 3. Get a cloned project running in one command

```bash
git clone https://github.com/someone/awesome-project.git
cd awesome-project
safeenv setup
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Checking environment...

  ✓  Python version compatible: 3.11
  ✓  Virtual environment created: .venv

  Installing dependencies...

  ✓  Flask installed
  ✓  numpy installed
  ✓  pandas installed

  Project setup complete.
```

### 4. Check project health

```bash
safeenv doctor
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Health Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Python version      :  3.11
  Virtual environment :  detected
  requirements.txt    :  found

  Issues found:

  ⚠  Missing dependency: torch
  ⚠  Missing dependency: fastapi

  Recommendation:

    Run:  safeenv fix
```

### 5. Fix problems automatically

```bash
safeenv fix
```

```
  Repairing environment...

  ✓  Virtual environment: OK
  
  Missing package detected: torch
  Installing torch...
  ✓  torch installed

  Missing package detected: fastapi
  Installing fastapi...
  ✓  fastapi installed

  ✓  Environment repaired successfully.
```

---

## Command Reference

### `safeenv init`

Creates a `.venv` virtual environment in the current directory using the
active Python interpreter.

```bash
safeenv init                    # current directory
safeenv init --dir /path/to/project
```

- Safe to run multiple times — will never overwrite an existing `.venv`
- Displays platform-specific activation instructions

---

### `safeenv freeze`

Scans all `.py` files in the project using Python AST parsing and writes
a `requirements.txt`.

```bash
safeenv freeze                           # writes requirements.txt
safeenv freeze --output deps.txt         # custom output file
safeenv freeze --dir /path/to/project    # specific directory
```

**How it works:**

1. Recursively walks all `.py` files (ignores `.venv`, `__pycache__`, etc.)
2. Parses each file with `ast.parse()` — no code is executed
3. Collects all `import` and `from ... import` statements
4. Filters out Python standard-library modules
5. Maps import names to correct PyPI names (e.g. `cv2` → `opencv-python`)
6. Writes a sorted `requirements.txt`

---

### `safeenv setup`

The single command to run after cloning a project. Combines `init` + dependency installation.

```bash
safeenv setup
safeenv setup --dir /path/to/project
```

**Steps performed:**
1. Checks Python version compatibility
2. Creates `.venv` if not present
3. Reads `requirements.txt`
4. Installs each package into `.venv`

---

### `safeenv doctor`

Performs a read-only health check and lists all issues. Never modifies anything.

```bash
safeenv doctor
safeenv doctor --dir /path/to/project
```

**Checks:**
- Python version (minimum: 3.7)
- `.venv` directory presence
- `requirements.txt` presence
- Packages listed in `requirements.txt` that are not installed

---

### `safeenv fix`

Automatically resolves issues reported by `safeenv doctor`.

```bash
safeenv fix
safeenv fix --dir /path/to/project
```

**Actions:**
- Creates `.venv` if missing
- Installs any missing packages from `requirements.txt`

---

## Import Name Mapping

`safeenv freeze` automatically translates common import names to their correct
PyPI package names:

| Import name  | PyPI package        |
|--------------|---------------------|
| `cv2`        | `opencv-python`     |
| `PIL`        | `Pillow`            |
| `sklearn`    | `scikit-learn`      |
| `bs4`        | `beautifulsoup4`    |
| `yaml`       | `PyYAML`            |
| `dotenv`     | `python-dotenv`     |
| `dateutil`   | `python-dateutil`   |
| `serial`     | `pyserial`          |
| `jwt`        | `PyJWT`             |
| `git`        | `GitPython`         |

_(and many more — see `dependency_scanner.py` for the full list)_

---

## Requirements

- Python 3.8 or newer
- Works on **Windows**, **macOS**, and **Linux**
- Runtime dependencies: `typer` and `rich` (both installed automatically)

---

## Development Setup

```bash
git clone https://github.com/safeenv/safeenv.git
cd safeenv
pip install -e ".[dev]"
```

### Run tests

```bash
pytest
```

### Run tests with coverage

```bash
pytest --cov=safeenv --cov-report=term-missing
```

---

## Project Structure

```
safeenv/
│
├── safeenv/
│   ├── __init__.py          # Package metadata and version
│   ├── cli.py               # Typer CLI commands (init, freeze, setup, doctor, fix)
│   ├── env_manager.py       # Virtual environment creation and detection
│   ├── dependency_scanner.py # AST-based import scanning and requirements generation
│   ├── installer.py         # pip-based package installation helpers
│   ├── doctor.py            # Project health diagnostics
│   └── utils.py             # Shared Rich console and styled print utilities
│
├── tests/
│   ├── conftest.py          # Shared pytest fixtures
│   ├── test_env_manager.py  # Tests for virtual environment logic
│   ├── test_dependency_scanner.py  # Tests for AST scanning
│   └── test_cli.py          # Integration tests for CLI commands
│
├── README.md
├── LICENSE
└── pyproject.toml
```

---

## Contributing

Contributions are welcome! Here is how to get started:

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/safeenv.git
   cd safeenv
   pip install -e ".[dev]"
   ```
3. **Create a branch** for your change:
   ```bash
   git checkout -b feature/my-improvement
   ```
4. **Make your changes** — follow the existing code style
5. **Run the tests** to make sure everything still works:
   ```bash
   pytest
   ```
6. **Open a Pull Request** with a clear description of what you changed and why

### Guidelines

- Keep the tool lightweight and beginner-friendly
- Add tests for any new functionality
- Write clear docstrings for new functions
- Use type hints throughout
- Prefer simple, readable code over clever one-liners

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ❤️ for students and developers who just want their code to run.
</div>
