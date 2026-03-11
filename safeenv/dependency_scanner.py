# Walks .py files, grabs imports via AST (no code execution), maps them
# to their actual PyPI names. The annoying part is that cv2, PIL, sklearn
# etc. don't match the package you pip-install, so there's a lookup table.

import ast
import sys
from pathlib import Path
from typing import Dict, List, Optional, Set

# import name → PyPI distribution name.
# This only needs to exist for packages where the two differ; if they match,
# we just pass the import name straight through.
IMPORT_TO_PACKAGE: Dict[str, str] = {
    "PIL": "Pillow",
    "cv2": "opencv-python",
    "sklearn": "scikit-learn",
    "skimage": "scikit-image",
    "bs4": "beautifulsoup4",
    "yaml": "PyYAML",
    "dateutil": "python-dateutil",
    "dotenv": "python-dotenv",
    "attr": "attrs",
    "attrs": "attrs",
    "MySQLdb": "mysqlclient",
    "Crypto": "pycryptodome",
    "serial": "pyserial",
    "usb": "pyusb",
    "jwt": "PyJWT",
    "git": "GitPython",
    "pkg_resources": "setuptools",
    "boto3": "boto3",
    "botocore": "botocore",
    "jose": "python-jose",
    "pydantic": "pydantic",
    "aiohttp": "aiohttp",
    "httpx": "httpx",
    "fastapi": "fastapi",
    "uvicorn": "uvicorn",
    "starlette": "starlette",
    "celery": "celery",
    "redis": "redis",
    "pymongo": "pymongo",
    "motor": "motor",
    "sqlalchemy": "SQLAlchemy",
    "alembic": "alembic",
    "flask": "Flask",
    "django": "Django",
    "tornado": "tornado",
    "click": "click",
    "typer": "typer",
    "rich": "rich",
    "tqdm": "tqdm",
    "loguru": "loguru",
    "pytest": "pytest",
    "hypothesis": "hypothesis",
    "requests": "requests",
    "urllib3": "urllib3",
    "certifi": "certifi",
    "chardet": "chardet",
    "idna": "idna",
    "numpy": "numpy",
    "pandas": "pandas",
    "matplotlib": "matplotlib",
    "seaborn": "seaborn",
    "scipy": "scipy",
    "torch": "torch",
    "tensorflow": "tensorflow",
    "keras": "keras",
    "transformers": "transformers",
    "datasets": "datasets",
    "openai": "openai",
    "anthropic": "anthropic",
    "boto": "boto",
    "paramiko": "paramiko",
    "cryptography": "cryptography",
    "nacl": "PyNaCl",
    "toml": "toml",
    "tomllib": "tomli",
    "dotenv": "python-dotenv",
    "decouple": "python-decouple",
    "colorama": "colorama",
    "termcolor": "termcolor",
    "tabulate": "tabulate",
    "prettytable": "prettytable",
    "arrow": "arrow",
    "pendulum": "pendulum",
    "pytz": "pytz",
    "tzdata": "tzdata",
    "slugify": "python-slugify",
    "Levenshtein": "python-Levenshtein",
    "fuzz": "thefuzz",
    "psutil": "psutil",
    "watchdog": "watchdog",
    "schedule": "schedule",
    "apscheduler": "APScheduler",
}

# Directories we skip entirely. No one wants opencv-python in their
# requirements because we scanned a file inside .venv.
_DEFAULT_EXCLUDE_DIRS: Set[str] = {
    ".venv",
    "venv",
    "env",
    ".env",
    "__pycache__",
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "build",
    "dist",
    ".tox",
    ".mypy_cache",
    ".pytest_cache",
    "htmlcov",
    ".eggs",
}


def _stdlib_modules() -> Set[str]:
    # Python 3.10+ ships sys.stdlib_module_names which is authoritative.
    # For older versions we keep a hand-rolled fallback list — it's not
    # exhaustive but covers everything you'd realistically import.
    if hasattr(sys, "stdlib_module_names"):
        return sys.stdlib_module_names  # type: ignore[attr-defined]

    # Fallback for < 3.10.
    return {
        "_thread", "abc", "aifc", "argparse", "array", "ast", "asynchat",
        "asyncio", "asyncore", "atexit", "audioop", "base64", "bdb",
        "binascii", "binhex", "bisect", "builtins", "bz2", "calendar",
        "cgi", "cgitb", "chunk", "cmath", "cmd", "code", "codecs",
        "codeop", "colorsys", "compileall", "concurrent", "configparser",
        "contextlib", "contextvars", "copy", "copyreg", "cProfile",
        "csv", "ctypes", "curses", "dataclasses", "datetime", "dbm",
        "decimal", "difflib", "dis", "distutils", "doctest", "email",
        "encodings", "enum", "errno", "faulthandler", "fcntl",
        "filecmp", "fileinput", "fnmatch", "fractions", "ftplib",
        "functools", "gc", "getopt", "getpass", "gettext", "glob",
        "grp", "gzip", "hashlib", "heapq", "hmac", "html", "http",
        "idlelib", "imaplib", "imghdr", "imp", "importlib", "inspect",
        "io", "ipaddress", "itertools", "json", "keyword", "lib2to3",
        "linecache", "locale", "logging", "lzma", "mailbox", "mailcap",
        "marshal", "math", "mimetypes", "mmap", "modulefinder",
        "multiprocessing", "netrc", "nis", "nntplib", "numbers",
        "operator", "optparse", "os", "ossaudiodev", "pathlib",
        "pdb", "pickle", "pickletools", "pipes", "pkgutil", "platform",
        "plistlib", "poplib", "posix", "posixpath", "pprint", "profile",
        "pstats", "pty", "pwd", "py_compile", "pyclbr", "pydoc",
        "queue", "quopri", "random", "re", "readline", "reprlib",
        "rlcompleter", "runpy", "sched", "secrets", "select",
        "selectors", "shelve", "shlex", "shutil", "signal", "site",
        "smtpd", "smtplib", "sndhdr", "socket", "socketserver",
        "spwd", "sqlite3", "sre_compile", "sre_constants", "sre_parse",
        "ssl", "stat", "statistics", "string", "stringprep", "struct",
        "subprocess", "sunau", "symtable", "sys", "sysconfig",
        "syslog", "tabnanny", "tarfile", "telnetlib", "tempfile",
        "termios", "test", "textwrap", "threading", "time",
        "timeit", "tkinter", "token", "tokenize", "trace",
        "traceback", "tracemalloc", "tty", "turtle", "turtledemo",
        "types", "typing", "unicodedata", "unittest", "urllib",
        "uu", "uuid", "venv", "warnings", "wave", "weakref",
        "webbrowser", "winreg", "winsound", "wsgiref", "xdrlib",
        "xml", "xmlrpc", "zipapp", "zipfile", "zipimport", "zlib",
        "zoneinfo",
    }


def extract_imports_from_file(filepath: Path) -> Set[str]:
    """Parse a .py file and return every top-level import name in it.

    Returns an empty set if the file has a syntax error or can't be read —
    no point crashing the whole scan because of one broken file.
    """
    imports: Set[str] = set()

    try:
        source = filepath.read_text(encoding="utf-8", errors="ignore")
        tree = ast.parse(source, filename=str(filepath))
    except (SyntaxError, OSError):
        return imports

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                top_level = alias.name.split(".")[0]
                imports.add(top_level)

        elif isinstance(node, ast.ImportFrom):
            # Skip relative imports (from . import x, from ..utils import y).
            if node.level and node.level > 0:
                continue
            if node.module:
                top_level = node.module.split(".")[0]
                imports.add(top_level)

    return imports


def scan_project_imports(
    project_root: Path = Path("."),
    extra_exclude_dirs: Optional[Set[str]] = None,
) -> List[str]:
    """Walk the project, collect third-party imports, return sorted PyPI names."""
    exclude_dirs = _DEFAULT_EXCLUDE_DIRS.copy()
    if extra_exclude_dirs:
        exclude_dirs |= extra_exclude_dirs

    stdlib = _stdlib_modules()
    all_imports: Set[str] = set()

    for py_file in project_root.rglob("*.py"):
        # Skip any file that lives under an excluded directory name.
        if any(part in exclude_dirs for part in py_file.parts):
            continue

        all_imports |= extract_imports_from_file(py_file)

    packages: Set[str] = set()
    for imp in all_imports:
        if imp in stdlib or imp.startswith("_"):
            continue
        pypi_name = IMPORT_TO_PACKAGE.get(imp, imp)
        packages.add(pypi_name)

    return sorted(packages, key=str.lower)


def write_requirements(
    packages: List[str],
    output_path: Path = Path("requirements.txt"),
) -> None:
    """Write package names to a requirements file, one per line."""
    output_path.write_text("\n".join(packages) + "\n", encoding="utf-8")
