"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { createNoise2D } from "simplex-noise";

interface Point {
  x: number;
  y: number;
  wave: { x: number; y: number };
  cursor: { x: number; y: number; vx: number; vy: number };
}

interface WavesProps {
  className?: string;
  strokeColor?: string;
  backgroundColor?: string;
  pointerSize?: number;
}

export function Waves({
  className = "",
  strokeColor = "#ffffff",
  backgroundColor = "#040506",
  pointerSize = 0.5,
}: WavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mouseRef = useRef({
    x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false,
  });
  const pathsRef = useRef<SVGPathElement[]>([]);
  const linesRef = useRef<Point[][]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const noise = createNoise2D();
    let bounding: DOMRect = container.getBoundingClientRect();

    // ---- Helpers ----
    const moved = (point: Point, withCursorForce = true) => ({
      x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
      y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
    });

    const setSize = () => {
      bounding = container.getBoundingClientRect();
      svg.style.width = `${bounding.width}px`;
      svg.style.height = `${bounding.height}px`;
    };

    const setLines = () => {
      linesRef.current = [];
      pathsRef.current.forEach((p) => p.remove());
      pathsRef.current = [];

      const { width, height } = bounding;
      const xGap = 8;
      const yGap = 8;
      const totalLines = Math.ceil((width + 200) / xGap);
      const totalPoints = Math.ceil((height + 30) / yGap);
      const xStart = (width - xGap * totalLines) / 2;
      const yStart = (height - yGap * totalPoints) / 2;

      for (let i = 0; i < totalLines; i++) {
        const points: Point[] = [];
        for (let j = 0; j < totalPoints; j++) {
          points.push({
            x: xStart + xGap * i,
            y: yStart + yGap * j,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          });
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", strokeColor);
        path.setAttribute("stroke-width", "1");
        path.style.opacity = "0.3";
        svg.appendChild(path);
        pathsRef.current.push(path);
        linesRef.current.push(points);
      }
    };

    const updateMousePosition = (x: number, y: number) => {
      const mouse = mouseRef.current;
      mouse.x = x - bounding.left;
      mouse.y = y - bounding.top + window.scrollY;
      if (!mouse.set) {
        mouse.sx = mouse.x;
        mouse.sy = mouse.y;
        mouse.lx = mouse.x;
        mouse.ly = mouse.y;
        mouse.set = true;
      }
    };

    const movePoints = (time: number) => {
      const mouse = mouseRef.current;
      linesRef.current.forEach((points) => {
        points.forEach((p) => {
          const move = noise((p.x + time * 0.008) * 0.003, (p.y + time * 0.003) * 0.002) * 8;
          p.wave.x = Math.cos(move) * 12;
          p.wave.y = Math.sin(move) * 6;
          const dx = p.x - mouse.sx;
          const dy = p.y - mouse.sy;
          const d = Math.hypot(dx, dy);
          const l = Math.max(175, mouse.vs);
          if (d < l) {
            const s = 1 - d / l;
            const f = Math.cos(d * 0.001) * s;
            p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035;
            p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035;
          }
          p.cursor.vx += (0 - p.cursor.x) * 0.01;
          p.cursor.vy += (0 - p.cursor.y) * 0.01;
          p.cursor.vx *= 0.95;
          p.cursor.vy *= 0.95;
          p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x + p.cursor.vx));
          p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y + p.cursor.vy));
        });
      });
    };

    const drawLines = () => {
      linesRef.current.forEach((points, lIndex) => {
        if (points.length < 2 || !pathsRef.current[lIndex]) return;
        const first = moved(points[0], false);
        let d = `M ${first.x} ${first.y}`;
        for (let i = 1; i < points.length; i++) {
          const c = moved(points[i]);
          d += ` L ${c.x} ${c.y}`;
        }
        pathsRef.current[lIndex].setAttribute("d", d);
      });
    };

    const tick = (time: number) => {
      const mouse = mouseRef.current;
      mouse.sx += (mouse.x - mouse.sx) * 0.1;
      mouse.sy += (mouse.y - mouse.sy) * 0.1;
      const dx = mouse.x - mouse.lx;
      const dy = mouse.y - mouse.ly;
      mouse.v = Math.hypot(dx, dy);
      mouse.vs = Math.min(100, mouse.vs + (mouse.v - mouse.vs) * 0.1);
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.a = Math.atan2(dy, dx);
      movePoints(time);
      drawLines();
      rafRef.current = requestAnimationFrame(tick);
    };

    const onMouseMove = (e: MouseEvent) => updateMousePosition(e.pageX, e.pageY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onResize = () => { setSize(); setLines(); };

    // ---- Init ----
    setSize();
    setLines();
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("touchmove", onTouchMove);
    };
  // strokeColor is a dependency but rarely changes; it's safe to include
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`waves-component relative overflow-hidden ${className}`}
      style={{
        backgroundColor,
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <svg
        ref={svgRef}
        className="block w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${pointerSize}rem`,
          height: `${pointerSize}rem`,
          background: strokeColor,
          borderRadius: "50%",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
