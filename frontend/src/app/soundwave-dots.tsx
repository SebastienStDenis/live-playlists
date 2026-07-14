"use client";

import { useEffect, useRef } from "react";

// A field of dots arranged in rows, each row a sine wave travelling sideways so
// the whole background reads as slow-moving sound waves. Deliberately quiet: it
// borrows the primary token at low opacity and sits behind the page content.
const ROW_GAP = 34;
const DOT_GAP = 26;
const AMPLITUDE = 7;
const WAVELENGTH = 260;
const SPEED = 0.0011; // radians per ms
const ROW_PHASE = 0.6; // phase shift between adjacent rows

export function SoundwaveDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let color = "oklch(0.55 0.05 60)";

    const readColor = () => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      if (value) color = value;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      const k = (2 * Math.PI) / WAVELENGTH;
      let rowIndex = 0;
      for (let baseY = ROW_GAP / 2; baseY < height; baseY += ROW_GAP) {
        for (let x = DOT_GAP / 2; x < width; x += DOT_GAP) {
          const phase = k * x - time * SPEED + rowIndex * ROW_PHASE;
          const wave = Math.sin(phase);
          const y = baseY + wave * AMPLITUDE;
          const radius = 1 + (wave + 1) * 0.6;
          ctx.globalAlpha = 0.05 + (wave + 1) * 0.05;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        rowIndex += 1;
      }
      ctx.globalAlpha = 1;
    };

    let frame = 0;
    const loop = (time: number) => {
      draw(time);
      frame = requestAnimationFrame(loop);
    };

    readColor();
    resize();

    if (reduceMotion) {
      draw(0);
    } else {
      frame = requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resize);
    const themeObserver = new MutationObserver(() => {
      readColor();
      if (reduceMotion) draw(0);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
