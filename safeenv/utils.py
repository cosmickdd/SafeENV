# Console + print helpers. One place, one console, consistent everywhere.

import platform

from rich.console import Console
from rich.theme import Theme

# Single shared console — avoids the fun bug where two Console() instances
# fight each other over live display state.
_THEME = Theme(
    {
        "success": "bold green",
        "warning": "bold yellow",
        "error": "bold red",
        "info": "bold cyan",
        "muted": "dim white",
        "header": "bold white",
    }
)

console = Console(theme=_THEME)


def print_success(message: str) -> None:
    console.print(f"[success]  ✓[/success]  {message}")


def print_warning(message: str) -> None:
    console.print(f"[warning]  ⚠[/warning]  {message}")


def print_error(message: str) -> None:
    console.print(f"[error]  ✗[/error]  {message}")


def print_info(message: str) -> None:
    console.print(f"[info]  →[/info]  {message}")


def print_header(title: str) -> None:
    bar = "━" * 36
    console.print(f"\n[header]{bar}[/header]")
    console.print(f"[header]  {title}[/header]")
    console.print(f"[header]{bar}[/header]\n")


def is_windows() -> bool:
    return platform.system() == "Windows"


def is_macos() -> bool:
    return platform.system() == "Darwin"


def is_linux() -> bool:
    return platform.system() == "Linux"
