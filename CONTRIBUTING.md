# Contributing to safeenv

Hey — thanks for stopping by. Whether you're fixing a typo, squashing a bug, or proposing something new, contributions are genuinely appreciated.

safeenv started as a tool to stop the "why won't my imports work" loop that wastes so much time at the start of every Python project. If that resonates with you, you're in the right place.

---

## Before you dive in

Please read the [Code of Conduct](CODE_OF_CONDUCT.md). Short version: be decent to people.

For questions that aren't bug reports, open a [GitHub Discussion](https://github.com/safeenv/safeenv/discussions) rather than an issue — it keeps the tracker clean.

---

## Ways to contribute

### Found a bug?

Check [existing issues](https://github.com/safeenv/safeenv/issues) first — someone might have already reported it. If not, open one using the [Bug Report template](https://github.com/safeenv/safeenv/issues/new?template=bug_report.md).

The most useful bug reports include:
- OS + Python version
- The exact command you ran
- Full terminal output (pasted, not screenshotted)
- What you expected vs. what actually happened

### Have a feature idea?

Use the [Feature Request template](https://github.com/safeenv/safeenv/issues/new?template=feature_request.md). Describe the *problem* you're trying to solve — not just the solution. That makes it a lot easier to figure out the right way to implement it.

### Want to write code?

Look for [`good first issue`](https://github.com/safeenv/safeenv/issues?q=label%3A%22good+first+issue%22) labels — those are kept small and well-scoped on purpose. Drop a comment on the issue before starting so two people don't end up doing the same thing.

---

## Getting the project running locally

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR-USERNAME/safeenv.git
cd safeenv

pip install -e ".[dev]"

# Make sure everything works before touching anything
pytest
python -m safeenv --help
```

---

## Project layout

| Module | What it does |
|---|---|
| `safeenv/cli.py` | All five Typer commands — kept intentionally thin |
| `safeenv/env_manager.py` | `.venv` creation, detection, Python version check |
| `safeenv/dependency_scanner.py` | AST-based import scanner + import→PyPI name mapping |
| `safeenv/installer.py` | pip wrapper (install, list installed, diff) |
| `safeenv/doctor.py` | `DiagnosticReport` dataclass + `run_diagnostics()` |
| `safeenv/utils.py` | Shared Rich console, `print_success / warning / error` |

Keep the CLI layer thin. Logic belongs in the modules, not in command handlers — it makes testing much easier.

---

## Code style

Nothing exotic:
- Type hints on all public function signatures
- No bare `print()` — use the helpers from `utils.py`
- Max line length: **100 characters**
- Don't add complexity that isn't needed right now

No formatter is enforced yet — just try to match the style of the code around you.

---

## Running the tests

```bash
# All tests
pytest

# With coverage
pytest --cov=safeenv --cov-report=term-missing

# One class only
pytest tests/test_cli.py::TestInit -v
```

A few rules:
- New features need tests. Bug fixes need a regression test.
- Tests must be deterministic — no network calls, no time-dependent assertions.
- Use the fixtures in `conftest.py` instead of rolling your own `tmp_path` setup.

---

## Pull requests

- One PR = one thing. Don't bundle unrelated changes.
- Reference the issue it closes: `Closes #123`
- Don't reformat files you're not changing — noisy diffs make reviewing harder.
- Don't add runtime dependencies without discussing in an issue first.
- Update `CHANGELOG.md` under `[Unreleased]` if your change is user-facing.

---

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add --quiet flag to freeze command
fix: handle UnicodeDecodeError in AST scanner
docs: update README installation steps
test: regression test for issue #42
chore: bump typer to 0.12
```

Prefixes: `feat` `fix` `docs` `test` `chore` `refactor` `perf` `ci` — subject line under 72 chars.

---

Thanks for contributing. Every bit helps. 💛
