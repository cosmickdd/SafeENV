# Security Policy

## Supported versions

Only the latest release gets security fixes. Once a new version ships, the previous one is on its own.

| Version | Maintained |
|---------|------------|
| 0.1.x | ✅ yes |
| < 0.1 | ❌ no |

---

## Found a vulnerability?

**Please don't open a public issue for this.** If there's a real security problem, disclosing it before there's a fix puts everyone who uses the tool at risk.

Instead, send an email to **cosmickdd@gmail.com** with:

- Subject: `[SECURITY] short description`
- What the issue is and how to reproduce it
- What someone could actually do by exploiting it
- Which version(s) are affected
- A suggested fix if you have one (totally optional)

### What happens after you report

| When | What we'll do |
|------|---------------|
| Within 48 hours | Acknowledge your email |
| Within 7 days | Share an initial assessment |
| Within 30 days | Ship a fix for confirmed issues |
| After the fix | Credit you publicly (unless you'd rather stay anonymous) |

---

## What's in scope

- Code execution triggered by a malformed `.py` file during `safeenv freeze`
- Path traversal through the `--dir` flag
- Command injection via subprocess calls
- Privilege escalation during venv creation or package install
- Unexpected behaviour from a crafted `requirements.txt`

**Out of scope:** vulnerabilities in packages that safeenv *installs* (report those upstream), issues in Python or pip itself, social engineering, local DoS.

---

## How safeenv is designed with this in mind

safeenv is a local CLI — no server, no credentials, no outbound requests it initiates itself. The parts worth knowing about:

- **`safeenv freeze` uses `ast.parse()`** — Python's built-in AST parser. It reads syntax trees, it never executes user code.
- **Subprocess calls to pip/python** are built from validated paths and package names. User input is never interpolated into a shell string.
- **Filesystem access** is scoped to the directory you point it at (cwd or `--dir`).

---

## Bug bounty

This is a free open-source project. No paid bounty program. But if you do responsible disclosure on a real vulnerability:

- You'll get credit in the release notes
- You'll be mentioned in `SECURITY_ADVISORIES.md`
- You'll have our genuine thanks

---

## Past Security Advisories

None at this time.
