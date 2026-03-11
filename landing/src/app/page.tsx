'use client';
import { useState, useEffect, useRef } from "react";

/* ─────────────────────────── DATA ─────────────────────────── */

const commands = [
  {
    name: "init",
    full: "safeenv init",
    desc: "Creates a .venv and shows you how to activate it. Running it again on an existing project does nothing — it never overwrites your environment.",
    detail: "Safe to run anywhere, anytime.",
    icon: "⬡",
    color: "#6366f1",
    highlight: false,
  },
  {
    name: "freeze",
    full: "safeenv freeze",
    desc: "Walks every .py file using Python's AST parser — no code executed — and writes a clean requirements.txt automatically.",
    detail: "Handles 60+ import → PyPI name mismatches.",
    icon: "❄",
    color: "#06b6d4",
    highlight: false,
  },
  {
    name: "setup",
    full: "safeenv setup",
    desc: "The one you run after cloning any project. Creates .venv + installs everything from requirements.txt in a single step.",
    detail: "Most used command by far.",
    icon: "◈",
    color: "#e53535",
    highlight: true,
  },
  {
    name: "doctor",
    full: "safeenv doctor",
    desc: "Read-only health check. Reports your Python version, .venv status, requirements.txt presence, and any missing packages.",
    detail: "Modifies absolutely nothing.",
    icon: "◎",
    color: "#10b981",
    highlight: false,
  },
  {
    name: "fix",
    full: "safeenv fix",
    desc: "Acts on what doctor found. Creates the venv if missing, installs missing packages. Auto-repair for your environment.",
    detail: "The cure to doctor's diagnosis.",
    icon: "⬟",
    color: "#f59e0b",
    highlight: false,
  },
];

const mappings = [
  { imp: "import cv2", pkg: "opencv-python" },
  { imp: "from PIL import Image", pkg: "Pillow" },
  { imp: "import sklearn", pkg: "scikit-learn" },
  { imp: "from bs4 import BeautifulSoup", pkg: "beautifulsoup4" },
  { imp: "import yaml", pkg: "PyYAML" },
  { imp: "from dotenv import load_dotenv", pkg: "python-dotenv" },
  { imp: "import dateutil", pkg: "python-dateutil" },
  { imp: "import wx", pkg: "wxPython" },
  { imp: "import usaddress", pkg: "usaddress" },
  { imp: "from skimage import ...", pkg: "scikit-image" },
];

const testimonials = [
  { quote: "I used to lose 20 minutes on every new project to env setup. safeenv made that zero.", handle: "@dev_priya", role: "Backend Engineer" },
  { quote: "Ran safeenv setup on a 3-year old repo I'd never touched. It just worked.", handle: "@mattcode", role: "Senior Python Dev" },
  { quote: "The freeze command alone is worth it. It reads AST instead of guessing — that's smart.", handle: "@al_infra", role: "Platform Engineer" },
];

/* ─────────────────────────── HOOKS ─────────────────────────── */

function useInView() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0, rootMargin: "200px 0px 200px 0px" }
    );
    obs.observe(el);
    // Fallback: show everything after 800ms no matter what
    const t = setTimeout(() => setVisible(true), 800);
    return () => { obs.disconnect(); clearTimeout(t); };
  }, []);
  return [ref, visible] as const;
}

interface TLLine {
  text: string;
  color?: string;
  prefix?: string;
  speed?: number;
  pause?: number;
  instant?: boolean;
  delay?: number;
}

function useTypewriter(lines: TLLine[], running = true) {
  const [display, setDisplay] = useState<TLLine[]>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running || done) return;
    if (lineIdx >= lines.length) { setDone(true); return; }
    const line = lines[lineIdx];
    if (line.instant) {
      const t = setTimeout(() => {
        setDisplay(d => [...d, { ...line, text: line.text }]);
        setLineIdx(i => i + 1);
        setCharIdx(0);
      }, line.delay || 300);
      return () => clearTimeout(t);
    }
    if (charIdx < line.text.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), line.speed || 28);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDisplay(d => [...d, { ...line, text: line.text }]);
        setLineIdx(i => i + 1);
        setCharIdx(0);
      }, line.pause || 180);
      return () => clearTimeout(t);
    }
  }, [running, done, lineIdx, charIdx, lines]);

  const current: TLLine | null = !done && lineIdx < lines.length && !lines[lineIdx]?.instant
    ? { ...lines[lineIdx], text: lines[lineIdx].text.slice(0, charIdx) }
    : null;

  return { display, current, done };
}

/* ─────────────────────────── PRIMITIVES ─────────────────────────── */

function Reveal({ children, delay = 0, y = 32, className = "", style = {} }: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0px)" : `translateY(${y}px)`,
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      fontFamily: "var(--mono)",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "var(--accent)",
      marginBottom: 20,
      ...(center && { justifyContent: "center", width: "100%", textAlign: "center" }),
    }}>
      <span style={{ width: 18, height: 1, background: "var(--accent)", opacity: 0.5, display: "inline-block" }} />
      {children}
      <span style={{ width: 18, height: 1, background: "var(--accent)", opacity: 0.5, display: "inline-block" }} />
    </div>
  );
}

/* ─────────────────────────── TERMINAL ─────────────────────────── */

const TERMINAL_LINES: TLLine[] = [
  { text: "python -m safeenv setup", color: "rgba(255,255,255,0.7)", prefix: "$", speed: 40, pause: 400 },
  { text: "", instant: true, delay: 0 },
  { text: "  Scanning project files...", color: "rgba(255,255,255,0.3)", prefix: "", instant: true, delay: 180 },
  { text: "  Found 6 imports to resolve", color: "rgba(255,255,255,0.25)", prefix: "", instant: true, delay: 120 },
  { text: "", instant: true, delay: 0 },
  { text: "  \u2713  Created .venv", color: "rgba(120,220,120,0.6)", prefix: "", instant: true, delay: 280 },
  { text: "  \u2713  Resolved all package names", color: "rgba(120,220,120,0.6)", prefix: "", instant: true, delay: 220 },
  { text: "  \u2713  Installed 6 packages (2.1s)", color: "rgba(120,220,120,0.6)", prefix: "", instant: true, delay: 260 },
  { text: "", instant: true, delay: 0 },
  { text: "  \u2713  Environment ready.", color: "rgba(229,83,53,0.9)", prefix: "", instant: true, delay: 180 },
];

function LiveTerminal() {
  const [ref, inView] = useInView();
  const { display, current } = useTypewriter(TERMINAL_LINES, inView);
  const [copied, setCopied] = useState(false);

  const copyCmd = () => {
    navigator.clipboard?.writeText("pip install safeenv-tool").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={ref} style={{
      background: "rgba(10,10,12,0.95)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
      maxWidth: 580,
      width: "100%",
      backdropFilter: "blur(20px)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", gap: 7 }}>
          {["#e53535", "#f5a623", "#27c93f"].map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.8 }} />
          ))}
        </div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>
          ~ safeenv
        </span>
        <button onClick={copyCmd} style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: copied ? "rgba(120,220,120,0.8)" : "rgba(255,255,255,0.2)",
          background: "none",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 5,
          padding: "3px 10px",
          cursor: "pointer",
          transition: "all 0.2s",
          letterSpacing: "0.06em",
        }}>
          {copied ? "copied!" : "copy install"}
        </button>
      </div>

      <div style={{ padding: "24px 28px 28px", minHeight: 220, fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.8 }}>
        {display.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {line.prefix !== undefined && (
              <span style={{ color: "rgba(255,255,255,0.15)", userSelect: "none", minWidth: 10 }}>{line.prefix}</span>
            )}
            <span style={{ color: line.color || "rgba(255,255,255,0.4)" }}>{line.text}</span>
          </div>
        ))}
        {current && (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {current.prefix !== undefined && (
              <span style={{ color: "rgba(255,255,255,0.15)", userSelect: "none", minWidth: 10 }}>{current.prefix}</span>
            )}
            <span style={{ color: current.color || "rgba(255,255,255,0.4)" }}>
              {current.text}
              <span style={{
                display: "inline-block",
                width: 7,
                height: 14,
                background: "var(--accent)",
                marginLeft: 2,
                verticalAlign: "middle",
                animation: "blink 1s step-end infinite",
                borderRadius: 1,
              }} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── COMMAND CARD ─────────────────────────── */

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "255,255,255";
}

function CommandCard({ cmd, index }: { cmd: typeof commands[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={index * 70}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          background: hovered
            ? `linear-gradient(135deg, rgba(${hexToRgb(cmd.color)},0.05) 0%, rgba(255,255,255,0.01) 100%)`
            : "rgba(255,255,255,0.015)",
          border: `1px solid ${hovered ? cmd.color + "30" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 16,
          padding: "28px 32px",
          cursor: "default",
          transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? `0 20px 60px rgba(${hexToRgb(cmd.color)},0.08), 0 0 0 1px ${cmd.color}22` : "none",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 160, height: 160, borderRadius: "50%",
          background: `radial-gradient(circle, ${cmd.color}15 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.4s",
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700,
              color: cmd.color, letterSpacing: "0.05em",
              background: `${cmd.color}14`, border: `1px solid ${cmd.color}28`,
              borderRadius: 8, padding: "5px 12px",
            }}>
              {cmd.full}
            </span>
            {cmd.highlight && (
              <span style={{
                fontSize: 9, fontWeight: 700, fontFamily: "var(--mono)",
                color: "rgba(229,53,53,0.7)", border: "1px solid rgba(229,53,53,0.2)",
                borderRadius: 4, padding: "2px 8px", letterSpacing: "0.12em", textTransform: "uppercase",
              }}>
                most used
              </span>
            )}
          </div>
          <span style={{ fontSize: 18, opacity: hovered ? 0.6 : 0.2, transition: "opacity 0.3s" }}>{cmd.icon}</span>
        </div>

        <p style={{
          fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7,
          fontWeight: 300, marginBottom: 12, fontFamily: "var(--sans)",
        }}>
          {cmd.desc}
        </p>

        <p style={{ fontSize: 12, color: cmd.color, opacity: 0.55, fontFamily: "var(--mono)", letterSpacing: "0.03em" }}>
          → {cmd.detail}
        </p>
      </div>
    </Reveal>
  );
}

/* ─────────────────────────── STYLES ─────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@300;400;500;600&family=Geist:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #060608;
    --bg2:      #09090c;
    --bg3:      #0d0d11;
    --bg4:      #111116;
    --border:   rgba(255,255,255,0.055);
    --borderhov:rgba(255,255,255,0.11);
    --text:     #eeeef2;
    --muted:    rgba(238,238,242,0.4);
    --dim:      rgba(238,238,242,0.18);
    --accent:   #e53535;
    --accentd:  #c42020;
    --mono:     'Geist Mono', monospace;
    --sans:     'Geist', sans-serif;
    --display:  'Cabinet Grotesk', sans-serif;
    --serif:    'Instrument Serif', serif;
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    cursor: default;
  }
  ::selection { background: rgba(229,53,53,0.28); }

  .cursor-dot {
    width: 5px; height: 5px;
    background: var(--accent);
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%,-50%);
    transition: width 0.2s, height 0.2s, background 0.2s;
  }
  .cursor-ring {
    width: 32px; height: 32px;
    border: 1px solid rgba(229,53,53,0.4);
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9998;
    transform: translate(-50%,-50%);
    transition: width 0.35s cubic-bezier(0.16,1,0.3,1), height 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.2s;
  }

  .noise-layer {
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    opacity: 0.032;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 256px;
  }

  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 500;
    height: 58px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px;
    border-bottom: 1px solid transparent;
    transition: border-color 0.4s, background 0.4s, backdrop-filter 0.4s;
  }
  .nav.scrolled {
    background: rgba(6,6,8,0.85);
    backdrop-filter: blur(24px) saturate(1.5);
    border-color: var(--border);
  }
  .nav-brand {
    display: flex; align-items: center; gap: 10px;
    font-family: var(--display); font-size: 15px; font-weight: 800;
    color: var(--text); letter-spacing: -0.02em; text-decoration: none;
  }
  .nav-mark {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .nav-mark svg { filter: drop-shadow(0 0 6px rgba(229,53,53,0.55)); }
  .nav-links { display: flex; align-items: center; gap: 2px; }
  .nav-link {
    font-size: 13px; font-weight: 400;
    color: var(--dim); text-decoration: none;
    padding: 6px 14px; border-radius: 8px;
    transition: color 0.2s, background 0.2s;
  }
  .nav-link:hover { color: var(--text); background: rgba(255,255,255,0.05); }
  .nav-btn {
    margin-left: 10px; font-size: 12px; font-weight: 600;
    color: white; text-decoration: none;
    padding: 7px 16px 7px 13px; border-radius: 100px;
    background: linear-gradient(135deg, #e53535 0%, #c42020 100%);
    transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
    box-shadow: 0 0 0 1px rgba(229,53,53,0.35), 0 4px 20px rgba(229,53,53,0.25);
    letter-spacing: 0.02em; display: inline-flex; align-items: center; gap: 6px;
    position: relative; overflow: hidden;
  }
  .nav-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
    transform: translateX(-100%); transition: transform 0.5s ease;
  }
  .nav-btn:hover::before { transform: translateX(100%); }
  .nav-btn:hover {
    background: linear-gradient(135deg, #f04040 0%, #d42525 100%);
    transform: translateY(-2px);
    box-shadow: 0 0 0 1px rgba(229,53,53,0.5), 0 10px 32px rgba(229,53,53,0.35);
  }

  .hero {
    position: relative; min-height: 100svh;
    display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
    padding: 130px 48px 100px; text-align: center; overflow: hidden;
  }
  .hero-canvas { position: absolute; inset: 0; pointer-events: none; }
  .hero-grid-lines {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 80px 80px;
    mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, black 0%, transparent 75%);
  }
  .hero-radial {
    position: absolute; border-radius: 50%;
    filter: blur(80px); pointer-events: none;
  }

  .badge {
    display: inline-flex; align-items: center; gap: 0;
    border: 1px solid rgba(229,53,53,0.28);
    background: rgba(229,53,53,0.06);
    border-radius: 100px; padding: 0; margin-bottom: 40px;
    font-family: var(--mono); letter-spacing: 0.06em; backdrop-filter: blur(12px);
    overflow: hidden; box-shadow: 0 0 0 1px rgba(229,53,53,0.08), 0 4px 24px rgba(229,53,53,0.1);
    position: relative;
  }
  .badge::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
    transform: translateX(-100%);
    animation: badge-shimmer 4s ease-in-out infinite;
  }
  @keyframes badge-shimmer { 0%,60%{transform:translateX(-100%)} 80%,100%{transform:translateX(100%)} }
  .badge-tag {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 12px 5px 10px;
    font-size: 10.5px; font-weight: 700; color: rgba(229,53,53,0.95);
    border-right: 1px solid rgba(229,53,53,0.2);
  }
  .badge-label {
    padding: 5px 14px 5px 12px;
    font-size: 10.5px; font-weight: 500; color: rgba(255,255,255,0.45);
  }
  .badge-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    background: var(--accent); box-shadow: 0 0 8px var(--accent);
    animation: blink 2s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }

  .hero-title {
    font-family: var(--display);
    font-size: clamp(56px, 9vw, 110px);
    font-weight: 900; line-height: 0.94; letter-spacing: -0.04em;
    color: var(--text); margin-bottom: 28px; max-width: 900px;
  }
  .hero-title em {
    font-family: var(--serif); font-style: italic; font-weight: 400;
    background: linear-gradient(135deg, #e53535 0%, #ff8080 50%, #e53535 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: shimmer 5s linear infinite;
  }
  @keyframes shimmer { 0%{background-position:0% center} 100%{background-position:200% center} }

  .hero-sub {
    font-size: clamp(15px, 2vw, 18px); font-weight: 300; color: var(--muted);
    max-width: 500px; line-height: 1.75; margin: 0 auto 52px; letter-spacing: 0.01em;
  }

  .hero-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 72px; }
  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--accent); color: white;
    font-size: 14px; font-weight: 600; padding: 13px 26px; border-radius: 11px;
    text-decoration: none; transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
    box-shadow: 0 0 0 1px rgba(229,53,53,0.25), 0 8px 32px rgba(229,53,53,0.22);
    letter-spacing: 0.01em;
  }
  .btn-primary:hover { background: #f03030; transform: translateY(-3px); box-shadow: 0 0 0 1px rgba(229,53,53,0.45), 0 16px 48px rgba(229,53,53,0.32); }
  .btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    background: transparent; color: var(--muted);
    font-size: 13.5px; font-weight: 500; padding: 13px 24px; border-radius: 11px;
    text-decoration: none; border: 1px solid var(--border); transition: all 0.2s;
  }
  .btn-ghost:hover { color: var(--text); border-color: var(--borderhov); background: rgba(255,255,255,0.03); }

  .install-strip {
    display: inline-flex; align-items: center; gap: 16px;
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 12px; padding: 12px 20px;
    font-family: var(--mono); font-size: 13px; transition: border-color 0.2s;
  }
  .install-strip:hover { border-color: var(--borderhov); }
  .install-label {
    font-size: 9.5px; font-weight: 600; font-family: var(--sans);
    text-transform: uppercase; letter-spacing: 0.12em; color: var(--dim);
  }
  .install-divider { width: 1px; height: 18px; background: rgba(255,255,255,0.08); }
  .install-cmd { color: rgba(255,255,255,0.6); }
  .copy-btn {
    font-family: var(--mono); font-size: 10px; color: var(--dim);
    background: none; border: 1px solid var(--border);
    border-radius: 6px; padding: 3px 10px; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.05em;
  }
  .copy-btn:hover { color: var(--muted); border-color: var(--borderhov); }
  .copy-btn.copied { color: rgba(100,220,140,0.8); border-color: rgba(100,220,140,0.2); }

  .stats-bar {
    display: grid; grid-template-columns: repeat(4,1fr);
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    background: var(--bg2); max-width: 100%;
  }
  .stat {
    padding: 36px 0; border-right: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; cursor: default;
    opacity: 0; animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  .stat:nth-child(1) { animation-delay: 0.05s; }
  .stat:nth-child(2) { animation-delay: 0.15s; }
  .stat:nth-child(3) { animation-delay: 0.25s; }
  .stat:nth-child(4) { animation-delay: 0.35s; border-right: none; }
  .stat-val {
    font-family: var(--display); font-size: 48px; font-weight: 900;
    letter-spacing: -0.04em; color: var(--text); line-height: 1; margin-bottom: 8px;
  }
  .stat-lbl { font-size: 10.5px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.14em; font-weight: 500; }

  .section { padding: 128px 48px; position: relative; }
  .section-inner { max-width: 1160px; margin: 0 auto; }
  .section-divider { border: none; border-top: 1px solid var(--border); margin: 0; }
  .section-title {
    font-family: var(--display); font-size: clamp(36px, 4.5vw, 58px);
    font-weight: 900; letter-spacing: -0.03em; line-height: 1.04;
    color: var(--text); margin-bottom: 20px;
  }
  .section-title em { font-family: var(--serif); font-style: italic; font-weight: 400; color: rgba(238,238,242,0.55); }
  .section-sub { font-size: 15px; color: var(--muted); font-weight: 300; line-height: 1.75; max-width: 440px; }

  .why-split { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; margin-top: 80px; }

  .problem-card {
    background: var(--bg3); border: 1px solid rgba(229,53,53,0.12);
    border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.35);
  }
  .card-header {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);
    background: rgba(255,255,255,0.015);
  }
  .mac-btn { width: 11px; height: 11px; border-radius: 50%; }
  .card-title { font-family: var(--mono); font-size: 11px; color: var(--dim); letter-spacing: 0.06em; margin-left: 4px; }
  .card-body { padding: 24px 28px; font-family: var(--mono); font-size: 13px; line-height: 2; }

  .tline { display: flex; gap: 14px; align-items: flex-start; }
  .tline-prefix { color: rgba(255,255,255,0.15); user-select: none; }
  .tline-err { color: rgba(229,83,83,0.75); }
  .tline-cmd { color: rgba(255,255,255,0.42); }
  .tline-dim { color: rgba(255,255,255,0.15); font-size: 11px; margin-top: 6px; font-style: italic; }

  .feature-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 36px; }
  .pill {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.035); border: 1px solid var(--border);
    border-radius: 100px; padding: 7px 16px;
    font-size: 12.5px; color: var(--muted); transition: all 0.2s;
  }
  .pill:hover { background: rgba(255,255,255,0.055); border-color: var(--borderhov); color: var(--text); }
  .pill-dot { width: 6px; height: 6px; border-radius: 50%; }

  .commands-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 64px; }
  .cmd-featured { grid-column: 1 / -1; }

  .mappings-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; margin-top: 80px; }
  .mappings-intro p { font-size: 15px; color: var(--muted); font-weight: 300; line-height: 1.75; margin-bottom: 28px; }
  .mapping-example { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }
  .mapping-chip { font-family: var(--mono); font-size: 12.5px; padding: 9px 16px; border-radius: 9px; border: 1px solid; }
  .mapping-chip-left { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.55); }
  .mapping-chip-right { background: rgba(229,53,53,0.07); border-color: rgba(229,53,53,0.18); color: rgba(229,120,100,0.9); }
  .arrow-icon { color: rgba(255,255,255,0.12); flex-shrink: 0; }

  .mappings-table { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .map-head { display: grid; grid-template-columns: 1fr 1fr; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); }
  .map-head-cell { padding: 11px 20px; font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: var(--dim); font-family: var(--mono); }
  .map-row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.18s; }
  .map-row:last-child { border-bottom: none; }
  .map-row:hover { background: rgba(255,255,255,0.025); }
  .map-cell { padding: 11px 20px; font-family: var(--mono); font-size: 12px; }
  .map-cell-l { color: rgba(229,100,80,0.65); }
  .map-cell-r { color: rgba(255,255,255,0.25); border-left: 1px solid rgba(255,255,255,0.03); }
  .map-footer { padding: 11px 20px; border-top: 1px solid var(--border); font-size: 11px; color: var(--dim); background: rgba(255,255,255,0.01); font-family: var(--sans); }

  .testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 64px; }
  .testi-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 16px; padding: 28px; transition: all 0.3s; }
  .testi-card:hover { border-color: var(--borderhov); transform: translateY(-3px); box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
  .testi-quote { color: rgba(238,238,242,0.6); line-height: 1.7; margin-bottom: 24px; font-weight: 300; font-family: var(--serif); font-style: italic; font-size: 16px; }
  .testi-handle { font-family: var(--mono); font-size: 12px; color: var(--accent); margin-bottom: 4px; }
  .testi-role { font-size: 12px; color: var(--dim); }

  .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 64px; }
  .step-card { position: relative; background: var(--bg3); border: 1px solid var(--border); border-radius: 16px; padding: 36px 32px; transition: background 0.25s, border-color 0.25s, box-shadow 0.25s, transform 0.25s; overflow: hidden; }
  .step-card:hover { background: var(--bg4); border-color: rgba(229,53,53,0.28); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.35); z-index: 1; }
  .step-num {
    font-family: var(--display); font-size: 96px; font-weight: 900;
    color: rgba(255,255,255,0.028); position: absolute; bottom: -10px; right: 12px;
    line-height: 1; letter-spacing: -0.06em; pointer-events: none; user-select: none;
  }
  .step-counter { font-family: var(--mono); font-size: 10px; color: var(--accent); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 20px; }
  .step-title { font-family: var(--display); font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin-bottom: 18px; }
  .step-code-wrap { position: relative; margin-bottom: 14px; }
  .step-code {
    display: block; background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 9px; padding: 11px 46px 11px 28px; font-family: var(--mono); font-size: 12.5px;
    color: rgba(255,255,255,0.7); word-break: break-all;
  }
  .step-prompt { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); font-family: var(--mono); font-size: 12px; color: var(--accent); opacity: 0.7; pointer-events: none; }
  .step-copy { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 3px 8px; font-family: var(--mono); font-size: 9px; color: var(--dim); cursor: pointer; letter-spacing: 0.05em; transition: border-color 0.2s, color 0.2s; }
  .step-copy:hover { border-color: rgba(255,255,255,0.2); color: var(--text); }
  .step-note { font-size: 12px; color: var(--dim); font-weight: 300; }

  .cta-section { position: relative; padding: 180px 48px; text-align: center; overflow: hidden; border-top: 1px solid var(--border); }
  .cta-glow {
    position: absolute; bottom: -100px; left: 50%; transform: translateX(-50%);
    width: 900px; height: 500px;
    background: radial-gradient(ellipse, rgba(229,53,53,0.07) 0%, transparent 65%); pointer-events: none;
  }
  .cta-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(229,53,53,0.06); pointer-events: none; }
  .cta-title {
    font-family: var(--display); font-size: clamp(44px, 7vw, 88px);
    font-weight: 900; letter-spacing: -0.04em; line-height: 0.95;
    color: var(--text); margin: 0 auto 24px; max-width: 780px;
  }
  .cta-title em { font-family: var(--serif); font-style: italic; font-weight: 400; color: rgba(238,238,242,0.5); }
  .cta-sub { font-size: 16px; color: var(--muted); font-weight: 300; margin-bottom: 52px; font-style: italic; }

  footer {
    border-top: 1px solid var(--border); background: var(--bg2);
    padding: 28px 48px; display: flex; align-items: center; justify-content: space-between;
  }
  .footer-brand { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-size: 14px; font-weight: 800; letter-spacing: -0.02em; color: var(--text); text-decoration: none; }
  .footer-links { display: flex; align-items: center; gap: 4px; }
  .footer-link { font-size: 12.5px; color: var(--dim); text-decoration: none; padding: 5px 11px; border-radius: 7px; transition: all 0.2s; }
  .footer-link:hover { color: var(--muted); background: rgba(255,255,255,0.04); }
  .footer-sep { color: rgba(255,255,255,0.07); }
  .footer-copy { font-size: 11px; color: var(--dim); font-family: var(--mono); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
  .anim-0 { opacity: 0; animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s forwards; }
  .anim-1 { opacity: 0; animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; }
  .anim-2 { opacity: 0; animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s forwards; }
  .anim-3 { opacity: 0; animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s forwards; }
  .anim-4 { opacity: 0; animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.65s forwards; }
  .anim-5 { opacity: 0; animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.78s forwards; }

  @media (max-width: 960px) {
    .nav { padding: 0 24px; }
    .nav-links .nav-link { display: none; }
    .hero { padding: 100px 24px 80px; }
    .stats-bar { grid-template-columns: repeat(2,1fr); }
    .stat { border-right: none; border-bottom: 1px solid var(--border); }
    .stat:nth-child(odd) { border-right: 1px solid var(--border); }
    .stat:nth-child(3), .stat:nth-child(4) { border-bottom: none; border-right: none; }
    .stat:nth-child(4) { border-right: none; }
    .section { padding: 80px 24px; }
    .why-split, .mappings-layout { grid-template-columns: 1fr; gap: 44px; }
    .commands-grid { grid-template-columns: 1fr; }
    .cmd-featured { grid-column: auto; }
    .testimonials-grid, .steps-grid { grid-template-columns: 1fr; }
    .cta-section { padding: 100px 24px; }
    footer { flex-direction: column; gap: 20px; text-align: center; padding: 24px; }
    .footer-links { flex-wrap: wrap; justify-content: center; }
  }
`;

/* ─────────────────────────── MAIN ─────────────────────────── */

export default function SafeenvPage() {
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mouse, setMouse] = useState({ x: -100, y: -100 });
  const ringRef = useRef({ x: -100, y: -100 });
  const ringDomRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMove);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const animate = () => {
      if (ringDomRef.current) {
        ringRef.current.x = lerp(ringRef.current.x, mouseRef.current.x, 0.1);
        ringRef.current.y = lerp(ringRef.current.y, mouseRef.current.y, 0.1);
        ringDomRef.current.style.left = ringRef.current.x + "px";
        ringDomRef.current.style.top = ringRef.current.y + "px";
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const copy = () => {
    navigator.clipboard?.writeText("pip install safeenv-tool").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="noise-layer" />

      <div className="cursor-dot" style={{ left: mouse.x, top: mouse.y }} />
      <div className="cursor-ring" ref={ringDomRef} />

      {/* NAV */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <a href="#" className="nav-brand">
          <div className="nav-mark">
            <svg width="26" height="28" viewBox="0 0 26 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 1L2 5.5V13.5C2 19.5 6.9 25.1 13 27C19.1 25.1 24 19.5 24 13.5V5.5L13 1Z" fill="#e53535" fillOpacity="0.15" stroke="#e53535" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="9" y="11.5" width="8" height="6" rx="1" stroke="#e53535" strokeWidth="1.4" fill="none"/>
              <path d="M10.5 11.5V9.5C10.5 8.12 11.62 7 13 7C14.38 7 15.5 8.12 15.5 9.5V11.5" stroke="#e53535" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="13" cy="14.5" r="1" fill="#e53535"/>
            </svg>
          </div>
          safeenv
        </a>
        <div className="nav-links">
          <a href="#why" className="nav-link">Why</a>
          <a href="#commands" className="nav-link">Commands</a>
          <a href="#mappings" className="nav-link">Mappings</a>
          <a href="https://github.com/cosmickdd/safeenv" target="_blank" rel="noopener noreferrer" className="nav-link">GitHub</a>
          <a href="https://pypi.org/project/safeenv-tool/" target="_blank" rel="noopener noreferrer" className="nav-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Install
            </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-canvas">
          <div className="hero-grid-lines" />
          <div className="hero-radial" style={{ width: 800, height: 800, background: "radial-gradient(circle, rgba(229,53,53,0.07) 0%, transparent 65%)", top: -300, left: "50%", transform: "translateX(-50%)" }} />
          <div className="hero-radial" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(229,53,53,0.04) 0%, transparent 70%)", bottom: 0, right: "5%" }} />
          <div className="hero-radial" style={{ width: 300, height: 300, background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)", top: "30%", left: "8%" }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="badge anim-0">
            <div className="badge-tag">
              <div className="badge-dot" />
              v0.1.2
            </div>
            <div className="badge-label">Python environment, automated</div>
          </div>

          <h1 className="hero-title anim-1">
            Just write<br /><em>code.</em>
          </h1>

          <p className="hero-sub anim-2">
            safeenv handles virtual environments, dependency scanning,
            and package installation — without config files or headaches.
          </p>

          <div className="hero-actions anim-3">
            <a href="https://pypi.org/project/safeenv-tool/" target="_blank" rel="noopener noreferrer" className="btn-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Install from PyPI
            </a>
            <a href="https://github.com/cosmickdd/safeenv" target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Star on GitHub
            </a>
          </div>

          <div className="install-strip anim-4" onClick={copy} style={{ cursor: "pointer" }}>
            <span className="install-label">Quick install</span>
            <div className="install-divider" />
            <code className="install-cmd">pip install safeenv-tool</code>
            <button className={`copy-btn${copied ? " copied" : ""}`}>{copied ? "\u2713 copied" : "copy"}</button>
          </div>

          <div className="anim-5" style={{ marginTop: 72, width: "100%", display: "flex", justifyContent: "center" }}>
            <LiveTerminal />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-bar">
        {[
          { v: "5", l: "Total commands" },
          { v: "60+", l: "Import mappings" },
          { v: "0", l: "Config files needed" },
          { v: "~2s", l: "Average setup time" },
        ].map((s) => (
          <div className="stat" key={s.l}>
            <div className="stat-val">{s.v}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── WHY ── */}
      <hr className="section-divider" />
      <section className="section" id="why" style={{ background: "var(--bg)" }}>
        <div className="section-inner">
          <Reveal>
            <Eyebrow>The Problem</Eyebrow>
            <h2 className="section-title">Every Python dev<br />has been <em>here.</em></h2>
            <p className="section-sub">
              You clone a repo, follow the README word-for-word, and it still won&apos;t run.
              The gap between writing code and running code is a wall of manual environment work.
            </p>
          </Reveal>

          <div className="why-split">
            <Reveal delay={80}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(229,53,53,0.5)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>Without safeenv</span>
              </div>
              <div className="problem-card">
                <div className="card-header">
                  <div className="mac-btn" style={{ background: "#e53535", opacity: 0.75 }} />
                  <div className="mac-btn" style={{ background: "#f5a623", opacity: 0.75 }} />
                  <div className="mac-btn" style={{ background: "#27c93f", opacity: 0.75 }} />
                  <span className="card-title">~/projects/my-app</span>
                </div>
                <div className="card-body">
                  <div className="tline"><span className="tline-prefix">$</span><span className="tline-cmd">python app.py</span></div>
                  <div className="tline"><span className="tline-prefix">!</span><span className="tline-err">ModuleNotFoundError: No module named &apos;flask&apos;</span></div>
                  <div className="tline"><span className="tline-prefix">$</span><span className="tline-cmd">pip install flask</span></div>
                  <div className="tline"><span className="tline-prefix">!</span><span className="tline-err">ModuleNotFoundError: No module named &apos;requests&apos;</span></div>
                  <div className="tline"><span className="tline-prefix">$</span><span className="tline-cmd">pip install requests</span></div>
                  <div className="tline"><span className="tline-prefix">!</span><span className="tline-err">ModuleNotFoundError: No module named &apos;sqlalchemy&apos;</span></div>
                  <div className="tline-dim">...google, install, repeat until you give up</div>
                </div>
              </div>
              <div className="feature-pills" style={{ marginTop: 28 }}>
                {["No venv isolation", "Manual guesswork", "Wrong package names", "Global pollution"].map((t) => (
                  <div className="pill" key={t}>
                    <div className="pill-dot" style={{ background: "#e53535", opacity: 0.6 }} />
                    {t}
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(100,200,120,0.6)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>With safeenv</span>
              </div>
              <div className="problem-card" style={{ borderColor: "rgba(229,53,53,0.14)" }}>
                <div className="card-header">
                  <div className="mac-btn" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div className="mac-btn" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div className="mac-btn" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <span className="card-title">~/projects/my-app</span>
                </div>
                <div className="card-body">
                  <div className="tline"><span className="tline-prefix">$</span><span className="tline-cmd">python -m safeenv setup</span></div>
                  <div style={{ height: 8 }} />
                  {[
                    "Created .venv",
                    "Scanned 12 Python files",
                    "Resolved 6 package names",
                    "Installed 6 packages (1.8s)",
                    "Environment ready.",
                  ].map((line, i) => (
                    <div className="tline" key={i}>
                      <span style={{ color: i === 4 ? "var(--accent)" : "rgba(120,200,120,0.55)", fontFamily: "var(--mono)" }}>\u2713</span>
                      <span style={{ color: i === 4 ? "rgba(229,100,80,0.85)" : "rgba(255,255,255,0.32)", fontFamily: "var(--mono)", fontSize: 13 }}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="feature-pills" style={{ marginTop: 28 }}>
                {["Isolated .venv", "AST-based scanning", "Smart name mapping", "Zero config"].map((t) => (
                  <div className="pill" key={t}>
                    <div className="pill-dot" style={{ background: "#10b981", opacity: 0.7 }} />
                    {t}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── COMMANDS ── */}
      <hr className="section-divider" />
      <section className="section" id="commands" style={{ background: "var(--bg2)" }}>
        <div className="section-inner">
          <Reveal>
            <Eyebrow>Commands</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "end" }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Five commands.<br /><em>The whole API.</em></h2>
              <p className="section-sub">No config files. No YAML. No plugins. Each command does exactly one thing and does it with precision.</p>
            </div>
          </Reveal>

          <div className="commands-grid">
            {commands.map((cmd, i) => (
              <div key={cmd.name} className={cmd.highlight ? "cmd-featured" : ""}>
                <CommandCard cmd={cmd} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAPPINGS ── */}
      <hr className="section-divider" />
      <section className="section" id="mappings" style={{ background: "var(--bg)" }}>
        <div className="section-inner">
          <div className="mappings-layout">
            <Reveal>
              <Eyebrow>Smart Mappings</Eyebrow>
              <h2 className="section-title">Knows what<br />you <em>actually</em> mean.</h2>
              <div className="mappings-intro">
                <p>
                  The import name and the{" "}
                  <code style={{ fontFamily: "var(--mono)", fontSize: 12, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>pip install</code>
                  {" "}name are often completely different. safeenv resolves 60+ of these mismatches automatically — without any configuration.
                </p>
              </div>
              <div className="mapping-example">
                <code className="mapping-chip mapping-chip-left">import cv2</code>
                <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <code className="mapping-chip mapping-chip-right">opencv-python</code>
              </div>
              <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.7, fontWeight: 300, marginBottom: 20 }}>
                Standard library modules are excluded automatically. No false positives, no noise.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <a href="https://pypi.org/project/safeenv-tool/" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 13, padding: "10px 20px" }}>View all mappings</a>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="mappings-table">
                <div className="map-head">
                  <div className="map-head-cell">import statement</div>
                  <div className="map-head-cell" style={{ borderLeft: "1px solid rgba(255,255,255,0.04)" }}>pip package</div>
                </div>
                {mappings.map((row, i) => (
                  <div className="map-row" key={i}>
                    <div className="map-cell map-cell-l">{row.imp}</div>
                    <div className="map-cell map-cell-r">{row.pkg}</div>
                  </div>
                ))}
                <div className="map-footer">+ 50 more · stdlib excluded automatically</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <hr className="section-divider" />
      <section className="section" style={{ background: "var(--bg2)" }}>
        <div className="section-inner">
          <Reveal style={{ textAlign: "center" }}>
            <Eyebrow center>From developers</Eyebrow>
            <h2 className="section-title" style={{ textAlign: "center", maxWidth: 520, margin: "0 auto 16px" }}>
              Developers who stopped<br /><em>fighting their setup.</em>
            </h2>
          </Reveal>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="testi-card">
                  <div style={{ marginBottom: 20, color: "rgba(229,53,53,0.35)", fontSize: 32, lineHeight: 1 }}>&quot;</div>
                  <p className="testi-quote">{t.quote}</p>
                  <div className="testi-handle">{t.handle}</div>
                  <div className="testi-role">{t.role}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <hr className="section-divider" />
      <section className="section" style={{ background: "var(--bg)" }}>
        <div className="section-inner">
          <Reveal>
            <Eyebrow>Quick Start</Eyebrow>
            <h2 className="section-title">Up and running<br /><em>in 30 seconds.</em></h2>
          </Reveal>

          <div className="steps-grid">
            {[
              { n: "01", label: "Step 01", title: "Install safeenv", code: "pip install safeenv-tool", note: "Requires Python 3.8+" },
              { n: "02", label: "Step 02", title: "Navigate to your project", code: "cd your-project", note: "Works with any Python project" },
              { n: "03", label: "Step 03", title: "Run setup — done", code: "python -m safeenv setup", note: "Creates venv + installs everything" },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="step-card">
                  <div className="step-num">{s.n}</div>
                  <div className="step-counter">{s.label}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-code-wrap">
                    <span className="step-prompt">$</span>
                    <code className="step-code">{s.code}</code>
                    <button className="step-copy" onClick={(e) => { navigator.clipboard.writeText(s.code); const b = e.currentTarget; b.textContent = "Copied"; setTimeout(() => { b.textContent = "Copy"; }, 1500); }}>Copy</button>
                  </div>
                  <div className="step-note">{s.note}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div style={{
              marginTop: 32, display: "inline-flex", alignItems: "baseline", gap: 10,
              fontSize: 13, color: "var(--dim)",
            }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", flexShrink: 0 }}>Note</span>
              <span>On Windows, <code style={{ fontFamily: "var(--mono)", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>python -m safeenv</code> works even when the <code style={{ fontFamily: "var(--mono)", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>safeenv</code> command isn&apos;t on your PATH.</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-glow" />
        {[600, 900, 1200].map((s, i) => (
          <div key={i} className="cta-ring" style={{
            width: s, height: s * 0.5,
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.5 - i * 0.15,
          }} />
        ))}
        <div style={{ position: "relative", zIndex: 2 }}>
          <Reveal>
            <Eyebrow center>Open Source · MIT · Free Forever</Eyebrow>
            <h2 className="cta-title">
              Stop fighting<br />your <em>environment.</em>
            </h2>
            <p className="cta-sub">Works on Windows, macOS, and Linux. Zero configuration required.</p>
            <div className="hero-actions" style={{ marginBottom: 0 }}>
              <a href="https://pypi.org/project/safeenv-tool/" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 15, padding: "14px 30px" }}>
                Install from PyPI
              </a>
              <a href="https://github.com/cosmickdd/safeenv" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 14, padding: "14px 28px" }}>
                ⭐ Star on GitHub
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <a href="#" className="footer-brand">
          <div className="nav-mark" style={{ width: 24, height: 24 }}>
            <svg width="22" height="24" viewBox="0 0 26 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 1L2 5.5V13.5C2 19.5 6.9 25.1 13 27C19.1 25.1 24 19.5 24 13.5V5.5L13 1Z" fill="#e53535" fillOpacity="0.15" stroke="#e53535" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="9" y="11.5" width="8" height="6" rx="1" stroke="#e53535" strokeWidth="1.4" fill="none"/>
              <path d="M10.5 11.5V9.5C10.5 8.12 11.62 7 13 7C14.38 7 15.5 8.12 15.5 9.5V11.5" stroke="#e53535" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="13" cy="14.5" r="1" fill="#e53535"/>
            </svg>
          </div>
          safeenv
        </a>
        <div className="footer-links">
          <a href="https://github.com/cosmickdd" target="_blank" rel="noopener noreferrer" className="footer-link">cosmickdd</a>
          <span className="footer-sep">·</span>
          <a href="https://github.com/cosmickdd/safeenv" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          <span className="footer-sep">·</span>
          <a href="https://pypi.org/project/safeenv-tool/" target="_blank" rel="noopener noreferrer" className="footer-link">PyPI</a>
          <span className="footer-sep">·</span>
          <span className="footer-link" style={{ cursor: "default" }}>MIT License</span>
        </div>
        <span className="footer-copy">Built with ❤️ by cosmickdd</span>
      </footer>
    </>
  );
}

