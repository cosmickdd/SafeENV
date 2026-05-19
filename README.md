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
  <b><a href="#-whats-new-in-v020">What's New</a></b> •
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
| Broken environment → nuke and rebuild from scratch | `safeenv clean --rebuild` |
| Forget to activate venv → wrong Python | `safeenv run app.py` |
| New contributor → "what env vars do I need?" | `safeenv scan` |

---

## 🆕 What's New in v0.2.0

Three new commands and major enhancements to every existing one:

| Feature | What it does |
|---|---|
| **`safeenv run`** | Run scripts using `.venv` Python — **no activation needed** |
| **`safeenv clean`** | Nuke `.venv` + caches in one shot, `--rebuild` to start fresh |
| **`safeenv scan`** | Detect env var usage in code → generate `.env.example` |
| **`freeze --pin`** | Pin exact versions: `Flask==3.0.3` instead of `Flask` |
| **.python-version** | Doctor/setup now enforce Python version requirements |
| **.gitignore fix** | Auto-adds `.venv` to `.gitignore` so you don't commit it |
| **.env health** | Doctor warns when `.env` is missing but `.env.example` exists |

See the full [CHANGELOG](CHANGELOG.md) for details.

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

# Run without activating
safeenv run app.py
safeenv run -m pytest

# Something broken?
safeenv doctor    # diagnose
safeenv fix       # repair

# Environment corrupted?
safeenv clean --rebuild   # nuke and start fresh

# Scan for env var usage
safeenv scan      # generates .env.example
```

That's it. No config files. No YAML. No learning curve.

---

## 📋 Commands

### `safeenv init` — Initialize environment

Creates a `.venv` virtual environment and tells you exactly how to activate it (or use `safeenv run` instead).

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

    Or skip activation entirely:
      safeenv run app.py
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

  ✓  Flask==3.0.3
  ✓  numpy==1.26.4
  ✓  pandas==2.2.0
  ✓  requests==2.31.0

  ✓  requirements.txt generated with 4 packages.
```

```bash
safeenv freeze                        # bare package names
safeenv freeze --pin                  # pinned versions (Flask==3.0.3)
safeenv freeze --output deps.txt      # custom output file
```

**Under the hood:**
- Reads every `.py` file with `ast.parse()` — zero code execution, zero risk
- Skips `.venv`, `__pycache__`, `build`, `dist`, and other generated directories
- Automatically resolves import → package name mismatches (see [Import Name Mapping](#-import-name-mapping))
- `--pin` queries installed versions from `.venv` for reproducible builds
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

**Now checks `.python-version`** — if the project requires Python 3.11 and you have 3.9, you'll get a clear warning before anything installs.

---

### `safeenv run` — Run without activating ⚡ NEW

Run any Python script or module using the `.venv` interpreter. No more "forgot to activate".

```bash
safeenv run app.py                    # runs with .venv/bin/python
safeenv run app.py --port 8000        # passes args through
safeenv run -m pytest                 # python -m style
safeenv run -m flask run --debug      # works with any module
```

```
  →  Using .venv interpreter
```

**Why this matters:** On Unix, `safeenv run` uses `os.execvp` to replace the current process — zero overhead, proper signal handling, Ctrl-C works correctly. On Windows, it uses `subprocess.run` as a clean fallback.

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
  .python-version     :  3.11
  .env file           :  not found

  Issues found:

  ⚠  Missing dependency: torch
  ⚠  .env file not found — .env.example exists with variables to configure
       Copy it:  cp .env.example .env
  ⚠  .gitignore doesn't contain .venv

  Recommendation:

    Run:  safeenv fix
```

**Checks (v0.2):**
- Python version (minimum: 3.7)
- `.python-version` constraint satisfaction
- `.venv` directory presence
- `requirements.txt` presence
- Missing packages from requirements
- `.gitignore` contains `.venv`
- `.env` file vs `.env.example` health
- Missing environment variables

---

### `safeenv fix` — Repair automatically

Resolves every issue `doctor` reports — missing venv, missing packages, missing `.gitignore` entries — in one shot.

```
  Repairing environment...

  ✓  Virtual environment created: .venv

  Missing package detected: torch
  ✓  torch installed

  ✓  .gitignore updated to exclude .venv

  ✓  Environment repaired successfully.
```

```bash
safeenv fix
safeenv fix --dir /my/project
```

**New in v0.2:** Automatically adds `.venv/` to `.gitignore` if it's missing, or creates a `.gitignore` if the project doesn't have one.

---

### `safeenv clean` — Nuke and rebuild ⚡ NEW

When your environment is truly broken — corrupted venv, pip itself broken, weird version conflicts — sometimes you just need to start over.

```bash
safeenv clean                # delete .venv + __pycache__ + *.pyc + caches
safeenv clean --rebuild      # clean + safeenv setup (full reset)
safeenv clean --yes          # skip confirmation prompt
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Clean Environment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Will remove: .venv/
  Will remove: __pycache__/, *.pyc, .pytest_cache/, .mypy_cache/, .ruff_cache/

  Proceed? [Y/n]: y

  ✓  .venv removed
  ✓  Removed 12 cache items

  Clean complete.
     Run safeenv setup or safeenv clean --rebuild to restore.
```

**Removes:** `.venv/`, `__pycache__/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `*.pyc`, `*.pyo`

**Does NOT remove:** Your code, `.git`, `requirements.txt`, or anything else.

---

### `safeenv scan` — Detect env var usage ⚡ NEW

Scans your code for environment variable access patterns and generates a `.env.example` so new contributors know exactly what to configure.

```bash
safeenv scan                         # generates .env.example
safeenv scan --output env.template   # custom output file
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Environment Variable Scanner
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Found 3 environment variables:

    $DATABASE_URL
    $DEBUG
    $SECRET_KEY

  ✓  .env.example generated — share this with contributors.
     Add .env to your .gitignore — never commit secrets!
```

**Detects:**
- `os.environ["KEY"]`
- `os.getenv("KEY")`
- `os.environ.get("KEY")`
- `config("KEY")` (python-decouple)

All via AST parsing — **no code is ever executed**.

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
│   ├── __main__.py            # python -m safeenv support
│   ├── cli.py                 # Typer CLI — all 8 commands live here
│   ├── env_manager.py         # .venv creation, detection, destruction, Python version
│   ├── dependency_scanner.py  # AST import scanner + PyPI name mapping + version pinning
│   ├── installer.py           # pip helpers (install, list, diff missing)
│   ├── doctor.py              # DiagnosticReport dataclass + run_diagnostics()
│   ├── runner.py              # Run scripts/modules via .venv interpreter (NEW)
│   ├── env_scanner.py         # AST env var scanner + .env.example generation (NEW)
│   └── utils.py               # Shared Rich console, print helpers
│
├── tests/
│   ├── conftest.py            # Shared pytest fixtures
│   ├── test_cli.py            # Integration tests (CLI commands via CliRunner)
│   ├── test_dependency_scanner.py   # Unit tests for AST scanning
│   ├── test_env_manager.py    # Unit tests for venv logic + clean + .python-version
│   ├── test_env_scanner.py    # Unit tests for env var detection (NEW)
│   └── test_runner.py         # Unit tests for script runner (NEW)
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
- **Zero new dependencies added in v0.2**

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

The test suite currently has **112 tests** covering the CLI, AST scanners, environment manager, env var detector, and script runner.

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
