# All safeenv CLI commands — the single entry point users interact with.
# Every new command added in v0.2 follows the same pattern: resolve the
# project root, print a header, do work, give clear output.

from pathlib import Path
from typing import List, Optional

import typer
from rich.padding import Padding
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.rule import Rule
from rich.table import Table

from safeenv import __version__
from safeenv import dependency_scanner, env_manager, installer
from safeenv.doctor import run_diagnostics
from safeenv.utils import (
    console,
    is_windows,
    print_error,
    print_hint,
    print_info,
    print_header,
    print_success,
    print_warning,
)

app = typer.Typer(
    name="safeenv",
    help="Automatic Python environment manager for students and developers.",
    add_completion=False,
    rich_markup_mode="rich",
    no_args_is_help=True,
    pretty_exceptions_show_locals=False,
)



def _version_callback(value: bool) -> None:
    if value:
        console.print(
            f"[bold]safeenv[/bold] version [bold cyan]{__version__}[/bold cyan]"
        )
        raise typer.Exit()




@app.callback()
def _callback(
    version: Optional[bool] = typer.Option(
        None,
        "--version",
        "-v",
        callback=_version_callback,
        is_eager=True,
        help="Show safeenv version and exit.",
    ),
) -> None:
    """safeenv — Automatic Python environment manager."""



def _spinner(description: str) -> Progress:
    return Progress(
        SpinnerColumn(),
        TextColumn(f"[progress.description]{description}"),
        transient=True,
        console=console,
    )


def _resolve_root(project_dir: Optional[str]) -> Path:
    """Resolve --dir to an absolute Path, defaulting to cwd."""
    return Path(project_dir).resolve() if project_dir else Path.cwd()


# ══════════════════════════════════════════════════════════════════════════════
# safeenv init
# ══════════════════════════════════════════════════════════════════════════════


@app.command()
def init(
    project_dir: Optional[str] = typer.Option(
        None,
        "--dir",
        "-d",
        help="Target project directory. Defaults to the current directory.",
        show_default=False,
    ),
) -> None:
    """Initialize a [bold].venv[/bold] for the current project. Safe to re-run."""
    root = _resolve_root(project_dir)
    print_header("SafeEnv Initialization")

    major, minor = env_manager.detect_python_version()
    print_success(f"Python version detected: [bold]{major}.{minor}[/bold]")

    with _spinner("Creating virtual environment..."):
        try:
            created = env_manager.create_venv(root)
        except RuntimeError as exc:
            print_error(f"Could not create virtual environment:\n\n  {exc}")
            raise typer.Exit(1) from exc

    if created:
        print_success("Virtual environment created: [bold].venv[/bold]")
    else:
        print_warning(
            "Virtual environment already exists: [bold].venv[/bold]  "
            "[dim](skipped)[/dim]"
        )

    # Activation varies by platform; print both when we're not on Windows
    # so the user can copy-paste the right one.
    console.print()
    console.print(Padding("[bold]Your environment is ready.[/bold]", (0, 2)))
    console.print()
    console.print(Padding("[bold]To activate:[/bold]", (0, 2)))
    console.print()

    if is_windows():
        console.print(Padding("[bold cyan]Windows:[/bold cyan]", (0, 4)))
        console.print(Padding(r"[green].venv\Scripts\activate[/green]", (0, 6)))
    else:
        console.print(Padding("[bold cyan]Mac / Linux:[/bold cyan]", (0, 4)))
        console.print(Padding("[green]source .venv/bin/activate[/green]", (0, 6)))
        console.print()
        console.print(Padding("[bold cyan]Windows:[/bold cyan]", (0, 4)))
        console.print(Padding(r"[green].venv\Scripts\activate[/green]", (0, 6)))

    console.print()
    console.print(Padding("[dim]Or skip activation entirely:[/dim]", (0, 4)))
    console.print(Padding("[green]safeenv run app.py[/green]", (0, 6)))
    console.print()


# ══════════════════════════════════════════════════════════════════════════════
# safeenv freeze
# ══════════════════════════════════════════════════════════════════════════════


@app.command()
def freeze(
    output: str = typer.Option(
        "requirements.txt",
        "--output",
        "-o",
        help="Destination file for the generated requirements.",
    ),
    project_dir: Optional[str] = typer.Option(
        None,
        "--dir",
        "-d",
        help="Project directory to scan. Defaults to the current directory.",
        show_default=False,
    ),
    pin: bool = typer.Option(
        False,
        "--pin",
        "-p",
        help="Pin exact versions from the installed .venv packages.",
    ),
) -> None:
    """Scan every .py file (AST, no exec) and write [bold]requirements.txt[/bold]."""
    root = _resolve_root(project_dir)
    output_path = root / output if not Path(output).is_absolute() else Path(output)

    console.print()
    console.print(Padding("[bold]Scanning project for imports...[/bold]", (0, 2)))
    console.print()

    with _spinner("Analysing Python files..."):
        packages = dependency_scanner.scan_project_imports(root)

    if not packages:
        print_warning("No third-party imports found in this project.")
        console.print()
        console.print(
            Padding(
                "[dim]Is this a new project?  "
                "Add some imports first, then re-run [bold]safeenv freeze[/bold].[/dim]",
                (0, 2),
            )
        )
        console.print()
        raise typer.Exit(0)

    # Pin versions if requested
    if pin:
        with _spinner("Resolving installed versions..."):
            packages = dependency_scanner.pin_packages(packages, root)

    for pkg in packages:
        print_success(pkg)

    console.print()
    dependency_scanner.write_requirements(packages, output_path)
    print_success(
        f"[bold]{output}[/bold] generated with "
        f"[bold cyan]{len(packages)}[/bold cyan] "
        f"{'package' if len(packages) == 1 else 'packages'}."
    )

    if pin:
        pinned_count = sum(1 for p in packages if "==" in p)
        if pinned_count < len(packages):
            console.print()
            print_hint(
                f"{len(packages) - pinned_count} package(s) could not be pinned "
                "— install them first, then re-run with --pin."
            )

    console.print()


# ══════════════════════════════════════════════════════════════════════════════
# safeenv setup
# ══════════════════════════════════════════════════════════════════════════════


@app.command()
def setup(
    project_dir: Optional[str] = typer.Option(
        None,
        "--dir",
        "-d",
        help="Project directory to set up. Defaults to the current directory.",
        show_default=False,
    ),
) -> None:
    """One shot: create [bold].venv[/bold] + install from [bold]requirements.txt[/bold]."""
    root = _resolve_root(project_dir)
    req_path = root / "requirements.txt"

    print_header("Project Setup")
    console.print(Padding("[bold]Checking environment...[/bold]", (0, 2)))
    console.print()

    # Check .python-version constraint before doing anything
    version_err = env_manager.check_python_version_constraint(root)
    if version_err:
        print_warning(version_err)
        console.print()

    major, minor = env_manager.detect_python_version()
    if (major, minor) >= (3, 7):
        print_success(f"Python version compatible: [bold]{major}.{minor}[/bold]")
    else:
        print_warning(
            f"Python [bold]{major}.{minor}[/bold] detected — "
            "version [bold]3.7+[/bold] is recommended"
        )

    with _spinner("Preparing virtual environment..."):
        try:
            created = env_manager.create_venv(root)
        except RuntimeError as exc:
            print_error(f"Could not create virtual environment:\n\n  {exc}")
            raise typer.Exit(1) from exc

    if created:
        print_success("Virtual environment created: [bold].venv[/bold]")
    else:
        print_success("Virtual environment found: [bold].venv[/bold]")


    if not req_path.exists():
        console.print()
        print_warning(
            "[bold]requirements.txt[/bold] not found — skipping dependency installation."
        )
        console.print()
        console.print(
            Padding(
                "[dim]Tip: run [bold]safeenv freeze[/bold] to generate one.[/dim]",
                (0, 4),
            )
        )
    else:
        packages = installer.read_requirements(req_path)
        if packages:
            console.print()
            console.print(Padding("[bold]Installing dependencies...[/bold]", (0, 2)))
            console.print()

            for pkg in packages:
                with _spinner(f"Installing [bold]{pkg}[/bold]..."):
                    success = installer.install_package(pkg, root)

                if success:
                    print_success(f"[bold]{pkg}[/bold] installed")
                else:
                    print_warning(
                        f"[bold]{pkg}[/bold] could not be installed — "
                        "check the package name"
                    )

    console.print()
    console.print(
        Padding("[bold green]Project setup complete.[/bold green]", (0, 2))
    )
    console.print(
        Padding("[bold red]JAI SHREE RAM[/bold red]", (0, 2))
    )
    console.print()


# ══════════════════════════════════════════════════════════════════════════════
# safeenv doctor
# ══════════════════════════════════════════════════════════════════════════════


@app.command()
def doctor(
    project_dir: Optional[str] = typer.Option(
        None,
        "--dir",
        "-d",
        help="Project directory to diagnose. Defaults to the current directory.",
        show_default=False,
    ),
) -> None:
    """Check your project environment and report any problems. Nothing is modified."""
    root = _resolve_root(project_dir)
    print_header("Project Health Report")

    with _spinner("Running diagnostics..."):
        report = run_diagnostics(root)
    major, minor = report.python_version
    venv_status = (
        "[bold green]detected[/bold green]"
        if report.venv_found
        else "[bold red]not found[/bold red]"
    )
    req_status = (
        "[bold green]found[/bold green]"
        if report.requirements_found
        else "[bold yellow]not found[/bold yellow]"
    )

    console.print(Padding(f"Python version      :  [bold]{major}.{minor}[/bold]", (0, 2)))
    console.print(Padding(f"Virtual environment :  {venv_status}", (0, 2)))
    console.print(Padding(f"requirements.txt    :  {req_status}", (0, 2)))

    # v0.2: Show .python-version if present
    if report.required_python_version:
        console.print(Padding(f".python-version     :  [bold]{report.required_python_version}[/bold]", (0, 2)))

    # v0.2: Show .env status
    if report.env_example_exists:
        env_status = (
            "[bold green]found[/bold green]"
            if report.env_file_exists
            else "[bold red]not found[/bold red]"
        )
        console.print(Padding(f".env file           :  {env_status}", (0, 2)))

    console.print()

    if not report.has_issues:
        console.print(
            Padding(
                "[bold green]✓  Everything looks great!  No issues found.[/bold green]",
                (0, 2),
            )
        )
        console.print()
        return


    console.print(Padding("[bold yellow]Issues found:[/bold yellow]", (0, 2)))
    console.print()

    if not report.python_ok:
        print_warning(
            f"Python [bold]{major}.{minor}[/bold] is below the recommended "
            "minimum (3.7)"
        )

    if report.python_version_constraint:
        print_warning(report.python_version_constraint)

    if not report.venv_found:
        print_warning("No virtual environment found — [dim]run [bold]safeenv init[/bold][/dim]")

    if not report.requirements_found:
        print_warning(
            "No [bold]requirements.txt[/bold] found — "
            "[dim]run [bold]safeenv freeze[/bold][/dim]"
        )

    for pkg in report.missing_packages:
        print_warning(f"Missing dependency: [bold]{pkg}[/bold]")

    # v0.2: .gitignore warning
    if not report.gitignore_has_venv and report.venv_found:
        print_warning(
            "[bold].gitignore[/bold] doesn't contain [bold].venv[/bold] — "
            "you may accidentally commit your virtual environment"
        )

    # v0.2: .env warnings
    if report.env_example_exists and not report.env_file_exists:
        print_warning(
            "[bold].env[/bold] file not found — "
            "[bold].env.example[/bold] exists with variables to configure"
        )
        print_hint("Copy it:  cp .env.example .env")

    for var in report.missing_env_vars:
        print_warning(f"Missing environment variable: [bold]{var}[/bold]")


    console.print()
    console.print(Padding("[bold]Recommendation:[/bold]", (0, 2)))
    console.print()
    console.print(Padding("Run:  [bold green]safeenv fix[/bold green]", (0, 4)))
    console.print()


# ══════════════════════════════════════════════════════════════════════════════
# safeenv fix
# ══════════════════════════════════════════════════════════════════════════════


@app.command()
def fix(
    project_dir: Optional[str] = typer.Option(
        None,
        "--dir",
        "-d",
        help="Project directory to repair. Defaults to the current directory.",
        show_default=False,
    ),
) -> None:
    """Fix what [bold]safeenv doctor[/bold] finds: create .venv and install missing packages."""
    root = _resolve_root(project_dir)
    req_path = root / "requirements.txt"

    console.print()
    console.print(Padding("[bold]Repairing environment...[/bold]", (0, 2)))
    console.print()

    if not env_manager.venv_exists(root):
        with _spinner("Creating virtual environment..."):
            try:
                env_manager.create_venv(root)
            except RuntimeError as exc:
                print_error(f"Could not create virtual environment:\n\n  {exc}")
                raise typer.Exit(1) from exc
        print_success("Virtual environment created: [bold].venv[/bold]")
    else:
        print_success("Virtual environment: [bold]OK[/bold]")


    if not req_path.exists():
        console.print()
        print_warning(
            "[bold]requirements.txt[/bold] not found — nothing to install."
        )
        console.print(
            Padding(
                "[dim]Tip: run [bold]safeenv freeze[/bold] to generate one.[/dim]",
                (0, 4),
            )
        )
    else:
        required = installer.read_requirements(req_path)
        missing = installer.get_missing_packages(required, root)

        if not missing:
            print_success("All dependencies are already installed")
        else:
            console.print()
            for pkg in missing:
                console.print(
                    Padding(
                        f"Missing package detected: [bold]{pkg}[/bold]",
                        (0, 2),
                    )
                )
                with _spinner(f"Installing [bold]{pkg}[/bold]..."):
                    success = installer.install_package(pkg, root)

                if success:
                    print_success(f"[bold]{pkg}[/bold] installed")
                else:
                    print_error(
                        f"Failed to install [bold]{pkg}[/bold] — "
                        "check the package name or your internet connection"
                    )

    # v0.2: Fix .gitignore if needed
    gitignore_path = root / ".gitignore"
    if env_manager.venv_exists(root) and not env_manager.check_gitignore_has_venv(root):
        if gitignore_path.exists():
            with open(gitignore_path, "a", encoding="utf-8") as f:
                f.write("\n# Virtual environment\n.venv/\n")
        else:
            gitignore_path.write_text(
                "# Virtual environment\n.venv/\n\n"
                "# Python cache\n__pycache__/\n*.pyc\n",
                encoding="utf-8",
            )
        print_success("[bold].gitignore[/bold] updated to exclude [bold].venv[/bold]")

    console.print()
    console.print(
        Padding(
            "[bold green]✓  Environment repaired successfully.[/bold green]",
            (0, 2),
        )
    )
    console.print()


# ══════════════════════════════════════════════════════════════════════════════
# safeenv run  (v0.2)
# ══════════════════════════════════════════════════════════════════════════════


@app.command(
    context_settings={"allow_extra_args": True, "allow_interspersed_args": False}
)
def run(
    ctx: typer.Context,
    module: bool = typer.Option(
        False,
        "--module",
        "-m",
        help="Run as a module (python -m <name>).",
    ),
    project_dir: Optional[str] = typer.Option(
        None,
        "--dir",
        "-d",
        help="Project directory. Defaults to the current directory.",
        show_default=False,
    ),
) -> None:
    """Run a script or module using the [bold].venv[/bold] interpreter - no activation needed."""
    from safeenv.runner import run_script, run_module, is_using_venv

    root = _resolve_root(project_dir)
    extra_args = ctx.args

    if not extra_args:
        print_error("Nothing to run. Usage:")
        console.print()
        console.print(Padding("[green]safeenv run app.py[/green]", (0, 4)))
        console.print(Padding("[green]safeenv run -m pytest[/green]", (0, 4)))
        console.print()
        raise typer.Exit(1)

    target = extra_args[0]
    args = extra_args[1:]

    # Show which interpreter we're using
    if is_using_venv(root):
        print_info(f"Using [bold].venv[/bold] interpreter")
    else:
        print_warning("No .venv found - using system Python")

    if module:
        exit_code = run_module(target, args, root)
    else:
        # Check the file exists before trying to run it
        target_path = root / target
        if not target_path.exists() and not Path(target).exists():
            print_error(f"File not found: [bold]{target}[/bold]")
            raise typer.Exit(1)
        exit_code = run_script(target, args, root)

    raise typer.Exit(exit_code)


# ══════════════════════════════════════════════════════════════════════════════
# safeenv clean  (v0.2)
# ══════════════════════════════════════════════════════════════════════════════


@app.command()
def clean(
    project_dir: Optional[str] = typer.Option(
        None,
        "--dir",
        "-d",
        help="Project directory to clean. Defaults to the current directory.",
        show_default=False,
    ),
    rebuild: bool = typer.Option(
        False,
        "--rebuild",
        "-r",
        help="After cleaning, run safeenv setup to rebuild the environment.",
    ),
    yes: bool = typer.Option(
        False,
        "--yes",
        "-y",
        help="Skip confirmation prompt.",
    ),
) -> None:
    """Remove .venv, __pycache__, and build artifacts. Use [bold]--rebuild[/bold] to start fresh."""
    root = _resolve_root(project_dir)
    print_header("Clean Environment")

    # Show what will be deleted
    venv_path = root / ".venv"
    has_venv = venv_path.is_dir()

    if has_venv:
        console.print(Padding("Will remove: [bold red].venv/[/bold red]", (0, 2)))
    console.print(Padding("Will remove: [bold yellow]__pycache__/, *.pyc, .pytest_cache/, .mypy_cache/, .ruff_cache/[/bold yellow]", (0, 2)))
    console.print()

    if not yes:
        confirm = typer.confirm("Proceed?", default=True)
        if not confirm:
            print_info("Cancelled.")
            raise typer.Exit(0)

    # Delete .venv
    if has_venv:
        with _spinner("Removing .venv..."):
            env_manager.destroy_venv(root)
        print_success("[bold].venv[/bold] removed")
    else:
        print_info("No .venv to remove")

    # Clean caches
    with _spinner("Cleaning caches..."):
        count = env_manager.clean_caches(root)

    if count > 0:
        print_success(f"Removed [bold]{count}[/bold] cache {'item' if count == 1 else 'items'}")
    else:
        print_info("No caches to clean")

    console.print()

    if rebuild:
        console.print(Padding("[bold]Rebuilding environment...[/bold]", (0, 2)))
        console.print()
        # Trigger setup — this reuses the existing setup logic
        ctx = typer.Context(setup)
        setup(project_dir=project_dir)
    else:
        print_success("[bold]Clean complete.[/bold]")
        if has_venv:
            print_hint("Run [bold]safeenv setup[/bold] or [bold]safeenv clean --rebuild[/bold] to restore.")
        console.print()


# ══════════════════════════════════════════════════════════════════════════════
# safeenv scan  (v0.2 — .env scanner)
# ══════════════════════════════════════════════════════════════════════════════


@app.command()
def scan(
    project_dir: Optional[str] = typer.Option(
        None,
        "--dir",
        "-d",
        help="Project directory to scan. Defaults to the current directory.",
        show_default=False,
    ),
    output: str = typer.Option(
        ".env.example",
        "--output",
        "-o",
        help="Output file for the generated .env template.",
    ),
) -> None:
    """Scan code for environment variable usage and generate [bold].env.example[/bold]."""
    from safeenv.env_scanner import scan_project_env_vars, write_env_example

    root = _resolve_root(project_dir)
    output_path = root / output if not Path(output).is_absolute() else Path(output)

    print_header("Environment Variable Scanner")

    with _spinner("Scanning for environment variables..."):
        env_vars = scan_project_env_vars(root)

    if not env_vars:
        print_info("No environment variable usage detected in your code.")
        console.print()
        print_hint(
            "This scans for os.environ, os.getenv, and python-decouple patterns."
        )
        console.print()
        raise typer.Exit(0)

    console.print(Padding(f"[bold]Found {len(env_vars)} environment variable{'s' if len(env_vars) != 1 else ''}:[/bold]", (0, 2)))
    console.print()

    for var in env_vars:
        console.print(Padding(f"  [bold cyan]${var}[/bold cyan]", (0, 2)))

    console.print()

    write_env_example(env_vars, output_path)
    print_success(
        f"[bold]{output}[/bold] generated — "
        "share this with contributors so they know which variables to set."
    )
    console.print()
    print_hint("Add [bold].env[/bold] to your [bold].gitignore[/bold] — never commit secrets!")
    console.print()


# ══════════════════════════════════════════════════════════════════════════════
# Entry point
# ══════════════════════════════════════════════════════════════════════════════


def main() -> None:
    app()


if __name__ == "__main__":
    main()
