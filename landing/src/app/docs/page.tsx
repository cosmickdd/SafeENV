"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Premium Custom CSS specifically for Stripe/OpenAI-style Documentation
const DOCS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Geist+Mono:wght@300;400;500;600&family=Geist:wght@300;400;500;600&display=swap');

  :root {
    --sans: 'Geist', 'Inter', -apple-system, sans-serif;
    --display: 'Cabinet Grotesk', -apple-system, sans-serif;
    --mono: 'Geist Mono', 'JetBrains Mono', monospace;
    --accent: #e53535;
    --accent-glow: rgba(229, 53, 53, 0.15);
    --bg-dark: #060608;
    --bg-panel: #0d0d11;
    --border-glow: rgba(255, 255, 255, 0.05);
    --text-primary: #eeeef2;
    --text-muted: #8e909a;
  }

  /* Base reset for /docs */
  .docs-container {
    background-color: var(--bg-dark);
    color: var(--text-primary);
    font-family: var(--sans);
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .docs-header {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(20px);
    background: rgba(6, 6, 8, 0.85);
    border-bottom: 1px solid var(--border-glow);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    height: 64px;
  }

  /* Code Block styling */
  .terminal-box {
    background: #000000;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 20px;
    font-family: var(--mono);
    font-size: 13.5px;
    line-height: 1.6;
    overflow-x: auto;
    position: relative;
    margin: 20px 0;
  }

  .terminal-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    padding-bottom: 8px;
  }

  .terminal-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  /* Table of Contents right sidebar styling */
  .toc-item {
    font-size: 13px;
    color: var(--text-muted);
    transition: all 0.2s ease;
    cursor: pointer;
    border-left: 2px solid transparent;
    padding-left: 12px;
  }

  .toc-item:hover, .toc-item.active {
    color: var(--text-primary);
    border-left-color: var(--accent);
  }

  /* Callouts */
  .callout {
    background: rgba(229, 53, 53, 0.03);
    border: 1px solid rgba(229, 53, 53, 0.15);
    border-left: 4px solid var(--accent);
    border-radius: 8px;
    padding: 16px 20px;
    margin: 24px 0;
  }

  .callout-info {
    background: rgba(16, 185, 129, 0.02);
    border: 1px solid rgba(16, 185, 129, 0.12);
    border-left: 4px solid #10b981;
  }

  /* Transition Animations */
  .fade-in-content {
    animation: docsFadeIn 0.3s ease-out forwards;
  }

  @keyframes docsFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Sidebar Active button */
  .sidebar-btn {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    font-size: 13.5px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sidebar-btn.active {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    font-weight: 600;
  }

  .sidebar-btn:hover:not(.active) {
    color: #fff;
    background: rgba(255, 255, 255, 0.02);
  }

  /* Version Selector */
  .version-dropdown {
    background: #0d0d11;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #fff;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    outline: none;
    transition: all 0.2s;
  }

  .version-dropdown:hover {
    border-color: var(--accent);
  }
`;

interface DocSection {
  id: string;
  title: string;
  category: "Getting Started" | "CLI Commands" | "Guides";
  isNew?: boolean;
  content: React.ReactNode;
  toc: { id: string; title: string }[];
}

export default function DocsPage() {
  const [selectedVersion, setSelectedVersion] = useState<"v0.2.x" | "v0.1.x">("v0.2.x");
  const [activeSectionId, setActiveSectionId] = useState<string>("intro");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Lock body scroll on mobile when sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  // Reset active section if switching to version where it doesn't exist
  useEffect(() => {
    const validIds = SECTIONS[selectedVersion].map((s) => s.id);
    if (!validIds.includes(activeSectionId)) {
      setActiveSectionId("intro");
    }
  }, [selectedVersion]);

  // Documentation Definitions for v0.2.x and v0.1.x
  const SECTIONS: Record<"v0.2.x" | "v0.1.x", DocSection[]> = {
    "v0.2.x": [
      {
        id: "intro",
        title: "Introduction",
        category: "Getting Started",
        toc: [
          { id: "why-safeenv", title: "Why safeenv?" },
          { id: "core-philosophy", title: "Core Philosophy" },
          { id: "installation", title: "Installation" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>Introduction</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              safeenv is a professional, zero-config, platform-independent environment manager for Python developers. 
              By analyzing imports directly from your codebase using abstract syntax tree (AST) parsing, safeenv completely automates virtual environment isolation, dependency tracking, environment diagnostic reporting, and script execution without configuration files or manual activation steps.
            </p>

            <h2 id="why-safeenv" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Why safeenv?</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Typical Python environments require developers to fight with platform-dependent scripts (`source .venv/bin/activate` vs `.venv\\Scripts\\activate.ps1`), manage multiple competing CLI wrappers (venv, virtualenv, pipenv, poetry, conda), or manually resolve inconsistencies between what package name they use inside Python imports (e.g. <code style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>import cv2</code>) and what they have to install via pip (e.g. <code style={{ fontFamily: "var(--mono)", color: "#10b981" }}>opencv-python</code>).
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 20 }}>
              safeenv bridges this gap entirely. It resolves over 60+ common mismatches out-of-the-box, automatically repairs broken virtual environments, and lets teams share consistent dependency manifests instantly.
            </p>

            <div className="callout callout-info">
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#10b981", marginBottom: 6 }}>💡 Pro-Tip: Zero Code Execution</h4>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-muted)" }}>
                safeenv scans your Python codebase using Python&apos;s own compiler abstract syntax tree (AST). We never execute your scripts during analysis, keeping your secrets, environments, and local execution safe and sandboxed.
              </p>
            </div>

            <h2 id="core-philosophy" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Core Philosophy</h2>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12, fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
              <li><strong>Zero Config:</strong> No setup schemas, strict pyproject.toml constraints, or config specifications required.</li>
              <li><strong>Non-Destructive:</strong> We never wipe virtual environments, systems configurations, or dependencies unless explicitly requested (e.g. via <code style={{ fontFamily: "var(--mono)" }}>safeenv clean</code>).</li>
              <li><strong>Platform Uniformity:</strong> The exact same commands behave identically across macOS, Linux, and Windows (PowerShell/CMD).</li>
            </ul>

            <h2 id="installation" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Installation</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Install safeenv globally on your system through pip:
            </p>
            <div className="terminal-box">
              <div className="terminal-header">
                <span className="terminal-dot" style={{ background: "#ff5f56" }} />
                <span className="terminal-dot" style={{ background: "#ffbd2e" }} />
                <span className="terminal-dot" style={{ background: "#27c93f" }} />
                <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "rgba(255,255,255,0.25)", marginLeft: 8 }}>Terminal</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#10b981" }}><span style={{ color: "rgba(255,255,255,0.35)", marginRight: 8 }}>$</span>pip install safeenv-tool</span>
                <button 
                  onClick={() => handleCopy("pip install safeenv-tool", "pip-install")}
                  style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                  {copiedId === "pip-install" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )
      },
      {
        id: "cmd-init",
        title: "safeenv init",
        category: "CLI Commands",
        toc: [
          { id: "init-description", title: "Description" },
          { id: "init-syntax", title: "Syntax & Usage" },
          { id: "init-preview", title: "Interactive Output" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv init</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              Initializes a fully isolated virtual environment directory (<code style={{ fontFamily: "var(--mono)" }}>.venv</code>) for the target workspace.
            </p>

            <h2 id="init-description" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Description</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              The `init` command verifies the system&apos;s active Python runtime version and sets up a clean, isolated virtual environment folder. If `.venv` already exists in your workspace, the command will complete successfully **without destroying, overriding, or mutating** your existing packages.
            </p>

            <h2 id="init-syntax" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Syntax & Usage</h2>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv init [--dir &lt;path&gt;]</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0", border: "1px solid rgba(255,255,255,0.04)" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--accent)" }}>Option</th>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--text-muted)" }}>Type</th>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--text-muted)" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 13, color: "#fff" }}>--dir, -d</td>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-muted)" }}>PATH</td>
                  <td style={{ padding: 12, fontSize: 13.5, color: "var(--text-muted)" }}>Target project directory. Defaults to current working directory.</td>
                </tr>
              </tbody>
            </table>

            <h2 id="init-preview" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Interactive Output</h2>
            <div className="terminal-box">
              <div style={{ color: "var(--text-muted)", marginBottom: 8 }}># Initializing env...</div>
              <div style={{ color: "#10b981" }}>✓ Python version detected: 3.11</div>
              <div style={{ color: "#10b981" }}>✓ Virtual environment created: .venv</div>
              <div style={{ color: "#eee", marginTop: 12 }}>Your environment is ready.</div>
            </div>
          </div>
        )
      },
      {
        id: "cmd-run",
        title: "safeenv run",
        category: "CLI Commands",
        isNew: true,
        toc: [
          { id: "run-description", title: "Description" },
          { id: "run-activation", title: "Zero Activation Overhead" },
          { id: "run-syntax", title: "Syntax & Parameters" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv run</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              Executes Python scripts or module packages directly inside the workspace virtual environment without manual activation steps.
            </p>

            <h2 id="run-description" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Description</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              In typical setups, running a script requires developers to type complex activation commands such as `source .venv/bin/activate` or `.venv\\Scripts\\activate`.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              The `safeenv run` wrapper intercepts execution, resolves the absolute location of your `.venv` python compiler, and triggers the executable directly. Any subsequent flags or CLI arguments are forwarded natively to your program.
            </p>

            <h2 id="run-activation" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Zero Activation Overhead</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              On Unix systems (macOS/Linux), safeenv uses standard system level `os.execvp` system calls. This replaces the active terminal execution process directly with the isolated compiler process, resulting in **zero** memory or execution time overhead.
            </p>

            <h2 id="run-syntax" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Syntax & Parameters</h2>
            <div className="terminal-box">
              <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: 6 }}># Running a python file</div>
              <div style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv run app.py --port 8000</div>
              <div style={{ color: "rgba(255,255,255,0.3)", margin: "10px 0 6px" }}># Running a package module</div>
              <div style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv run -m pytest tests/</div>
            </div>
          </div>
        )
      },
      {
        id: "cmd-setup",
        title: "safeenv setup",
        category: "CLI Commands",
        toc: [
          { id: "setup-description", title: "Description" },
          { id: "setup-syntax", title: "Syntax" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv setup</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              Performs a fully automated, one-shot project environment setup and package installation.
            </p>

            <h2 id="setup-description" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Description</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              This is by far the most popular developer command. It will check if a virtual environment folder `.venv` is present, create it if missing, scan files for imports, resolve third-party package names, generate requirements, and install all required dependencies using pip.
            </p>

            <h2 id="setup-syntax" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Syntax</h2>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv setup [--dir &lt;path&gt;]</span>
            </div>
          </div>
        )
      },
      {
        id: "cmd-freeze",
        title: "safeenv freeze",
        category: "CLI Commands",
        toc: [
          { id: "freeze-description", title: "Description" },
          { id: "freeze-pinning", title: "Version Pinning (v2.0)" },
          { id: "freeze-syntax", title: "Syntax & Options" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv freeze</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              Scans imports in Python files to write a cleanly formatted, system-agnostic dependency file (<code style={{ fontFamily: "var(--mono)" }}>requirements.txt</code>).
            </p>

            <h2 id="freeze-description" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Description</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Standard `pip freeze` lists every package installed globally on your computer, resulting in a bloated and broken requirements list.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              safeenv AST-scans Python code directly and maps your local import declarations to their true third-party package names, completely filtering out Python&apos;s standard library libraries (like `sys`, `json`, `os`) automatically.
            </p>

            <h2 id="freeze-pinning" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Version Pinning (v2.0)</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              By default, `safeenv freeze` generates bare package names to provide flexible environments (e.g. `Flask`). 
              In **version 2.0**, passing the `--pin` or `-p` flag connects with the `.venv` directory directly to resolve the exact version currently installed in the workspace, generating deterministic requirements (e.g. `Flask==3.0.3`).
            </p>

            <h2 id="freeze-syntax" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Syntax & Options</h2>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv freeze [--pin] [--output &lt;file&gt;]</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0", border: "1px solid rgba(255,255,255,0.04)" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--accent)" }}>Option</th>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--text-muted)" }}>Type</th>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--text-muted)" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 13, color: "#fff" }}>--pin, -p</td>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-muted)" }}>FLAG</td>
                  <td style={{ padding: 12, fontSize: 13.5, color: "var(--text-muted)" }}>Look up local compiler active packages and lock exact installed versions.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 13, color: "#fff" }}>--output, -o</td>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-muted)" }}>FILE</td>
                  <td style={{ padding: 12, fontSize: 13.5, color: "var(--text-muted)" }}>Target destination requirements file path. Defaults to `requirements.txt`.</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      },
      {
        id: "cmd-scan",
        title: "safeenv scan",
        category: "CLI Commands",
        isNew: true,
        toc: [
          { id: "scan-description", title: "Description" },
          { id: "scan-syntax", title: "Syntax & Usage" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv scan</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              Scans Python files for environment variable usage and automatically outputs a `.env.example` file.
            </p>

            <h2 id="scan-description" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Description</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Missing environment variables are a primary friction point when onboarding new developers.
              safeenv uses abstract syntax tree (AST) node parsing to inspect all references to `os.environ`, `os.getenv()`, and decouple `config()`. It extracts their names and constructs a clean `.env.example` template with placeholder values automatically.
            </p>

            <h2 id="scan-syntax" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Syntax & Usage</h2>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv scan [--output &lt;file&gt;]</span>
            </div>
          </div>
        )
      },
      {
        id: "cmd-doctor",
        title: "safeenv doctor",
        category: "CLI Commands",
        toc: [
          { id: "doctor-description", title: "Description" },
          { id: "doctor-checks", title: "Validations Performed" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv doctor</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              Runs a complete system diagnostic report on your workspace. **Completely read-only.**
            </p>

            <h2 id="doctor-description" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Description</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              The doctor command performs a multi-point audit to identify why a workspace environment is broken or misconfigured. It does not modify, write, or install any files, making it completely safe to execute.
            </p>

            <h2 id="doctor-checks" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Validations Performed</h2>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12, fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
              <li><strong>Python constraints:</strong> Audits if system Python matches `.python-version` limitations.</li>
              <li><strong>Virtual Isolation:</strong> Verifies if `.venv` exists and contains a valid structure.</li>
              <li><strong>Git Safety:</strong> Audits `.gitignore` to prevent accidentally committing virtual environments.</li>
              <li><strong>Environment secrets:</strong> Validates if active variables align with `.env.example` templates.</li>
              <li><strong>Dependency sync:</strong> Cross-references active requirements with package directories.</li>
            </ul>
          </div>
        )
      },
      {
        id: "cmd-fix",
        title: "safeenv fix",
        category: "CLI Commands",
        toc: [
          { id: "fix-description", title: "Description" },
          { id: "fix-syntax", title: "Syntax" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv fix</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              Resolves, configures, and auto-repairs issues discovered by safeenv doctor.
            </p>

            <h2 id="fix-description" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Description</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              `safeenv fix` serves as the automated cure to doctor&apos;s diagnosis. It will dynamically resolve issues like missing folders, missing virtual environment exclusion directories in `.gitignore`, or uninstalled packages.
            </p>

            <h2 id="fix-syntax" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Syntax</h2>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv fix [--dir &lt;path&gt;]</span>
            </div>
          </div>
        )
      },
      {
        id: "cmd-clean",
        title: "safeenv clean",
        category: "CLI Commands",
        isNew: true,
        toc: [
          { id: "clean-description", title: "Description" },
          { id: "clean-syntax", title: "Syntax & Arguments" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv clean</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              Safely removes environments, execution caches (`__pycache__`, pytest, ruff), and build artifacts.
            </p>

            <h2 id="clean-description" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Description</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Corrupted local compilers or package caches are complex to trace and debug. The `clean` command provides a safe, system-agnostic way to completely reset the project workspace and trigger a clean installation.
            </p>

            <h2 id="clean-syntax" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Syntax & Arguments</h2>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv clean [--rebuild] [--yes]</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0", border: "1px solid rgba(255,255,255,0.04)" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--accent)" }}>Option</th>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--text-muted)" }}>Type</th>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 12, color: "var(--text-muted)" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 13, color: "#fff" }}>--rebuild, -r</td>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-muted)" }}>FLAG</td>
                  <td style={{ padding: 12, fontSize: 13.5, color: "var(--text-muted)" }}>Trigger setup automatically to rebuild virtual environments freshly after cleaning.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 13, color: "#fff" }}>--yes, -y</td>
                  <td style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-muted)" }}>FLAG</td>
                  <td style={{ padding: 12, fontSize: 13.5, color: "var(--text-muted)" }}>Skip interactive validation prompts and delete directly.</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      },
    ],
    "v0.1.x": [
      {
        id: "intro",
        title: "Introduction",
        category: "Getting Started",
        toc: [
          { id: "what-is-v1", title: "What was safeenv v0.1.x?" },
          { id: "v1-limitation", title: "Limitations" },
        ],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>Introduction (Legacy v0.1.x)</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-muted)", fontWeight: 300, marginBottom: 28 }}>
              safeenv v0.1.x laid the initial foundation for automatic Python environment setups.
            </p>

            <h2 id="what-is-v1" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>What was safeenv v0.1.x?</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              The legacy version supported a smaller API surface (specifically 5 core commands: `init`, `setup`, `freeze`, `doctor`, and `fix`). It resolved initial import package conflicts and simplified basic requirements generation.
            </p>

            <h2 id="v1-limitation" style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, marginTop: 40, marginBottom: 16, color: "#fff" }}>Limitations</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Unlike the robust `v0.2.x` release, the `v0.1.x` architecture lacked native support for:
            </p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12, fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
              <li><strong>No activation script execution:</strong> Developers still had to activate environments manually to execute code.</li>
              <li><strong>Unpinned Freeze:</strong> The dependency output could not extract active package versions from virtual folders.</li>
              <li><strong>No dotenv AST scan:</strong> Completely unaware of variables referenced via os.environ.</li>
            </ul>
          </div>
        )
      },
      {
        id: "cmd-init",
        title: "safeenv init",
        category: "CLI Commands",
        toc: [{ id: "legacy-usage", title: "Usage" }],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv init (v0.1.x)</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Initializes a `.venv` directory using system defaults.
            </p>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv init</span>
            </div>
          </div>
        )
      },
      {
        id: "cmd-setup",
        title: "safeenv setup",
        category: "CLI Commands",
        toc: [{ id: "legacy-usage", title: "Usage" }],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv setup (v0.1.x)</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Reads requirements.txt and installs packages.
            </p>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv setup</span>
            </div>
          </div>
        )
      },
      {
        id: "cmd-freeze",
        title: "safeenv freeze",
        category: "CLI Commands",
        toc: [{ id: "legacy-usage", title: "Usage" }],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv freeze (v0.1.x)</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Generates non-pinned package requirement declarations.
            </p>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv freeze</span>
            </div>
          </div>
        )
      },
      {
        id: "cmd-doctor",
        title: "safeenv doctor",
        category: "CLI Commands",
        toc: [{ id: "legacy-usage", title: "Usage" }],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv doctor (v0.1.x)</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Performs basic check-ups on folder directories.
            </p>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv doctor</span>
            </div>
          </div>
        )
      },
      {
        id: "cmd-fix",
        title: "safeenv fix",
        category: "CLI Commands",
        toc: [{ id: "legacy-usage", title: "Usage" }],
        content: (
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>safeenv fix (v0.1.x)</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
              Builds basic directories or missing packages.
            </p>
            <div className="terminal-box">
              <span style={{ color: "#eee" }}><span style={{ color: "var(--accent)" }}>$</span> safeenv fix</span>
            </div>
          </div>
        )
      },
    ]
  };

  const activeSection = SECTIONS[selectedVersion].find((s) => s.id === activeSectionId) || SECTIONS[selectedVersion][0];

  return (
    <div className="docs-container">
      <style dangerouslySetInnerHTML={{ __html: DOCS_CSS }} />

      {/* Global Header */}
      <header className="docs-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, fontFamily: "var(--display)" }}>
            <div style={{ width: 22, height: 22, background: "rgba(229,53,53,0.1)", border: "1px solid rgba(229,53,53,0.2)", borderRadius: 6, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 26 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 1L2 5.5V13.5C2 19.5 6.9 25.1 13 27C19.1 25.1 24 19.5 24 13.5V5.5L13 1Z" fill="#e53535" fillOpacity="0.3" stroke="#e53535" strokeWidth="1.5" strokeLinejoin="round"/>
                <rect x="9" y="11.5" width="8" height="6" rx="1" stroke="#e53535" strokeWidth="1.4" fill="none"/>
                <path d="M10.5 11.5V9.5C10.5 8.12 11.62 7 13 7C14.38 7 15.5 8.12 15.5 9.5V11.5" stroke="#e53535" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            safeenv
          </Link>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>/</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Developer Documentation</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Version:</span>
            <select 
              value={selectedVersion} 
              onChange={(e) => setSelectedVersion(e.target.value as "v0.2.x" | "v0.1.x")} 
              className="version-dropdown"
            >
              <option value="v0.2.x">v0.2.x (Latest)</option>
              <option value="v0.1.x">v0.1.x (Legacy)</option>
            </select>
          </div>
          <a href="https://github.com/cosmickdd/safeenv" target="_blank" rel="noopener noreferrer" style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "6px 12px",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}>
            GitHub
          </a>
        </div>
      </header>

      {/* Main Layout Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Sidebar */}
        <aside style={{
          width: 280,
          borderRight: "1px solid var(--border-glow)",
          background: "rgba(10,10,12,0.45)",
          padding: "30px 20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}>
          {["Getting Started", "CLI Commands", "Guides"].map((cat) => {
            const catSections = SECTIONS[selectedVersion].filter((s) => s.category === cat);
            if (catSections.length === 0) return null;
            return (
              <div key={cat}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>{cat}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {catSections.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSectionId(item.id)}
                      className={`sidebar-btn ${activeSectionId === item.id ? "active" : ""}`}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.title}
                      </span>
                      {item.isNew && (
                        <span style={{ fontSize: 8, fontWeight: 700, background: "rgba(229,53,53,0.12)", color: "var(--accent)", padding: "2px 6px", borderRadius: 4 }}>NEW</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Content Panel */}
        <main className="fade-in-content" key={`${selectedVersion}-${activeSectionId}`} style={{
          flex: 1,
          padding: "50px 80px",
          overflowY: "auto",
          background: "rgba(6,6,8,0.2)",
        }}>
          <div style={{ maxWidth: 800 }}>
            {activeSection.content}
          </div>
        </main>

        {/* On this page right sidebar */}
        {activeSection.toc && activeSection.toc.length > 0 && (
          <aside style={{
            width: 240,
            borderLeft: "1px solid var(--border-glow)",
            background: "rgba(10,10,12,0.2)",
            padding: "40px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>On this page</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeSection.toc.map((t) => (
                <a 
                  key={t.id}
                  href={`#${t.id}`}
                  className="toc-item"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {t.title}
                </a>
              ))}
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}
