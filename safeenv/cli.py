# Five commands, one purpose: make Python project setup stop being annoying.
# All output goes through Rich so it at least looks nice when things break.

from pathlib import Path
from typing import Optional

import typer
from rich.padding import Padding
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.rule import Rule

from safeenv import __version__
from safeenv import dependency_scanner, env_manager, installer
from safeenv.doctor import run_diagnostics
from safeenv.utils import (
    console,
    is_windows,
    print_error,
    print_info,
    print_header,
    print_success,
    print_warning,
)

app = typer.Typer(
    name="safeenv",
    help="🛡  Automatic Python environment manager for students and developers.",
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
    """🛡  safeenv — Automatic Python environment manager."""




def _spinner(description: str) -> Progress:
    return Progress(
        SpinnerColumn(),
        TextColumn(f"[progress.description]{description}"),
        transient=True,
        console=console,
    )




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
    root = Path(project_dir).resolve() if project_dir else Path.cwd()
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
) -> None:
    """Scan every .py file (AST, no exec) and write [bold]requirements.txt[/bold]."""
    root = Path(project_dir).resolve() if project_dir else Path.cwd()
    output_path = Path(output)

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

    for pkg in packages:
        print_success(pkg)

    console.print()
    dependency_scanner.write_requirements(packages, output_path)
    print_success(
        f"[bold]{output_path}[/bold] generated with "
        f"[bold cyan]{len(packages)}[/bold cyan] "
        f"{'package' if len(packages) == 1 else 'packages'}."
    )
    console.print()




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
    root = Path(project_dir).resolve() if project_dir else Path.cwd()
    req_path = root / "requirements.txt"

    print_header("Project Setup")
    console.print(Padding("[bold]Checking environment...[/bold]", (0, 2)))
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
    root = Path(project_dir).resolve() if project_dir else Path.cwd()
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

    if not report.venv_found:
        print_warning("No virtual environment found — [dim]run [bold]safeenv init[/bold][/dim]")

    if not report.requirements_found:
        print_warning(
            "No [bold]requirements.txt[/bold] found — "
            "[dim]run [bold]safeenv freeze[/bold][/dim]"
        )

    for pkg in report.missing_packages:
        print_warning(f"Missing dependency: [bold]{pkg}[/bold]")


    console.print()
    console.print(Padding("[bold]Recommendation:[/bold]", (0, 2)))
    console.print()
    console.print(Padding("Run:  [bold green]safeenv fix[/bold green]", (0, 4)))
    console.print()




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
    root = Path(project_dir).resolve() if project_dir else Path.cwd()
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

    console.print()
    console.print(
        Padding(
            "[bold green]✓  Environment repaired successfully.[/bold green]",
            (0, 2),
        )
    )
    console.print()


# Entry point


def main() -> None:
    app()


if __name__ == "__main__":
    main()
