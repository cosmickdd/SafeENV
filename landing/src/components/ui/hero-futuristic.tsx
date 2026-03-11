'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import {
  abs,
  blendScreen,
  float,
  mod,
  mx_cell_noise_float,
  oneMinus,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  pass,
} from 'three/tsl';

const TEXTURE_SRC = 'https://i.postimg.cc/XYwvXN8D/img-4.png';
const DEPTH_SRC = 'https://i.postimg.cc/2SHKQh2q/raw-4.webp';

interface HeroProps {
  title?: string;
  subtitle?: string;
}

export const Html = ({
  title = 'Just Write Code',
  subtitle = "safeenv handles your Python environment so you don't have to.",
}: HeroProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleWords = title.split(' ');
  const [visibleWords, setVisibleWords] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [delays] = useState<number[]>(() => titleWords.map(() => Math.random() * 0.07));
  const [subtitleDelay] = useState<number>(() => Math.random() * 0.1);

  // word-by-word title entrance
  useEffect(() => {
    if (visibleWords < titleWords.length) {
      const t = setTimeout(() => setVisibleWords((v) => v + 1), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSubtitleVisible(true), 800);
    return () => clearTimeout(t);
  }, [visibleWords, titleWords.length]);

  // imperative Three.js WebGPU scene — bypasses R3F to avoid async render conflicts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let stopped = false;
    let rafId = -1;
    let renderer: any = null;
    let removeListeners: (() => void) | null = null;

    (async () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(
        -w / 2, w / 2, h / 2, -h / 2, 0.1, 10
      );
      camera.position.z = 1;

      renderer = new (THREE as any).WebGPURenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(w, h, false);

      try {
        await renderer.init();
      } catch {
        return;
      }
      if (stopped) { renderer.dispose(); return; }

      // load textures
      const loader = new THREE.TextureLoader();
      const loadTex = (src: string) =>
        new Promise<THREE.Texture>((resolve, reject) =>
          loader.load(src, resolve, undefined, reject)
        );

      let rawMap: THREE.Texture, depthMap: THREE.Texture;
      try {
        [rawMap, depthMap] = await Promise.all([loadTex(TEXTURE_SRC), loadTex(DEPTH_SRC)]);
      } catch {
        return;
      }
      if (stopped) { renderer.dispose(); return; }

      // TSL node material — depth-map parallax + cell noise dot grid
      const uPointer = uniform(new THREE.Vector2());
      const uProgress = uniform(0);
      const tDepthMap = texture(depthMap);
      const tMap = texture(rawMap, uv().add(tDepthMap.r.mul(uPointer).mul(0.01)));

      const tUv = vec2(uv().x, uv().y);
      const tiling = vec2(120.0);
      const tiledUv = mod(tUv.mul(tiling), 2.0).sub(1.0);
      const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));
      const dotDist = float(tiledUv.length());
      const dotMask = float(smoothstep(0.5, 0.49, dotDist)).mul(brightness);
      const flow = oneMinus(smoothstep(0, 0.02, abs(tDepthMap.sub(uProgress))));
      // silver-white dots — clean depth trace, no aggressive colour
      const gridMask = dotMask.mul(flow).mul(vec3(3.5, 3.5, 3.5));
      const colorNode = blendScreen(tMap, gridMask);

      const mat = new (THREE as any).MeshBasicNodeMaterial({
        colorNode,
        transparent: true,
        opacity: 0,
      });

      const getSize = (cw: number, ch: number) => ({
        s: Math.min(cw, ch) * 0.66,
        x: cw > 900 ? cw * 0.14 : 0,
      });
      const init = getSize(w, h);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat as any);
      mesh.scale.set(init.s, init.s, 1);
      mesh.position.x = init.x;
      scene.add(mesh);

      // subtle bloom — just a gentle glow on the bright traced dots
      const pp = new (THREE as any).PostProcessing(renderer);
      const scenePass = pass(scene, camera);
      const sceneColor = scenePass.getTextureNode('output');
      const bloomPass = bloom(sceneColor, 0.3, 0.5, 0.9);
      pp.outputNode = sceneColor.add(bloomPass);

      // pointer + resize tracking
      const pointer = new THREE.Vector2();
      const onMove = (e: MouseEvent) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      const onResize = () => {
        const nw = canvas.clientWidth;
        const nh = canvas.clientHeight;
        renderer.setSize(nw, nh, false);
        camera.left = -nw / 2;
        camera.right = nw / 2;
        camera.top = nh / 2;
        camera.bottom = -nh / 2;
        camera.updateProjectionMatrix();
        const ns = getSize(nw, nh);
        mesh.scale.set(ns.s, ns.s, 1);
        mesh.position.x = ns.x;
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('resize', onResize);
      removeListeners = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('resize', onResize);
      };

      // animation loop
      const clock = new THREE.Clock();
      let opacity = 0;
      function tick() {
        if (stopped) return;
        const t = clock.getElapsedTime();
        uProgress.value = Math.sin(t * 0.38) * 0.5 + 0.5;
        uPointer.value.copy(pointer);
        opacity = THREE.MathUtils.lerp(opacity, 1, 0.05);
        mat.opacity = opacity;
        pp.renderAsync()
          .then(() => { if (!stopped) rafId = requestAnimationFrame(tick); })
          .catch(() => {});
      }
      rafId = requestAnimationFrame(tick);
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      if (removeListeners) removeListeners();
      try { if (renderer) renderer.dispose(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-svh relative overflow-hidden" style={{ background: '#080808' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Left vignette — text legibility over canvas */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'linear-gradient(to right, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.82) 40%, rgba(8,8,8,0.18) 62%, transparent 100%)',
        }}
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to top, #080808, transparent)' }}
      />

      {/* Left-aligned hero content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="w-full max-w-[1100px] mx-auto px-8 md:px-14">
          <div className="max-w-[500px]">

            {/* Badge */}
            <div
              className={`mb-8 ${visibleWords > 0 ? 'fade-in-subtitle' : ''}`}
              style={{ opacity: visibleWords > 0 ? undefined : 0, animationDelay: '0.05s' }}
            >
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#e53535] bg-[#e53535]/10 border border-[#e53535]/20 rounded-full px-4 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e53535]" />
                v0.1.2 — Open Source
              </span>
            </div>

            {/* Title */}
            <h1 className="font-black tracking-tight leading-[0.93] mb-5 text-white uppercase text-5xl md:text-6xl xl:text-[4.5rem]">
              {titleWords.map((word, index) => (
                <span
                  key={index}
                  className={`inline-block mr-[0.2em] last:mr-0 ${index < visibleWords ? 'fade-in' : ''}`}
                  style={{
                    animationDelay: `${index * 0.13 + delays[index]}s`,
                    opacity: index < visibleWords ? undefined : 0,
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <p
              className={`text-base md:text-lg leading-relaxed mb-9 normal-case ${subtitleVisible ? 'fade-in-subtitle' : ''}`}
              style={{
                opacity: subtitleVisible ? undefined : 0,
                color: 'rgba(255,255,255,0.45)',
                animationDelay: `${titleWords.length * 0.13 + 0.2 + subtitleDelay}s`,
              }}
            >
              {subtitle}
            </p>

            {/* CTAs */}
            <div
              className={`flex items-center gap-3 flex-wrap normal-case ${subtitleVisible ? 'fade-in-subtitle' : ''}`}
              style={{
                opacity: subtitleVisible ? undefined : 0,
                animationDelay: `${titleWords.length * 0.13 + 0.38 + subtitleDelay}s`,
                pointerEvents: subtitleVisible ? 'auto' : 'none',
              }}
            >
              <a
                href="https://pypi.org/project/safeenv-tool/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                style={{ background: '#e53535' }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f04040')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#e53535')}
              >
                pip install safeenv-tool
              </a>
              <a
                href="https://github.com/cosmickdd/safeenv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-sm px-5 py-2.5 rounded-lg transition-all border"
                style={{ color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.1)' }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                View on GitHub
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
            </div>

            {/* Meta strip */}
            <div
              className={`mt-7 flex items-center gap-5 text-xs normal-case ${subtitleVisible ? 'fade-in-subtitle' : ''}`}
              style={{
                opacity: subtitleVisible ? undefined : 0,
                color: 'rgba(255,255,255,0.2)',
                animationDelay: `${titleWords.length * 0.13 + 0.6 + subtitleDelay}s`,
              }}
            >
              <span>MIT License</span>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', display: 'inline-block', flexShrink: 0 }} />
              <span>Python 3.8+</span>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', display: 'inline-block', flexShrink: 0 }} />
              <span>Win &middot; Mac &middot; Linux</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <button className="explore-btn" style={{ animationDelay: '2.5s' }}>
        Scroll to explore
        <span className="explore-arrow">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-svg">
            <path d="M11 5V17" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 12L11 17L16 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default Html;
