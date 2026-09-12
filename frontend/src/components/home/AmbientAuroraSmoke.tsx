'use client';

import React, { useEffect, useRef } from 'react';

interface SmokeOrb {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  baseRadius: number;
  color: string;
  phase: number;
  speed: number;
  alpha: number;
}

interface SmokePuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  decay: number;
}

export default function AmbientAuroraSmoke() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; prevX: number; prevY: number; active: boolean }>({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette of ethereal, glowing smoke:
    // Emerald green, vibrant cyber cyan, soft lavender violet, electric blue, warm amber gold, rose pink
    const palette = [
      { r: 16, g: 185, b: 129 }, // Emerald Green
      { r: 6, g: 182, b: 212 },  // Cyan
      { r: 139, g: 92, b: 246 }, // Violet
      { r: 59, g: 130, b: 246 }, // Royal Blue
      { r: 245, g: 158, b: 11 }, // Amber Gold
      { r: 236, g: 72, b: 153 }, // Rose Pink
      { r: 20, g: 184, b: 166 }, // Teal
    ];

    const smokePuffs: SmokePuff[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      const mouse = mouseRef.current;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      // Spawn 1-2 interactive cursor smoke puffs when moving
      const speed = Math.hypot(mouse.x - mouse.prevX, mouse.y - mouse.prevY);
      if (speed > 2 && smokePuffs.length < 50) {
        const col = palette[Math.floor(Math.random() * palette.length)];
        smokePuffs.push({
          x: mouse.x + (Math.random() - 0.5) * 20,
          y: mouse.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 1.2 + (mouse.x - mouse.prevX) * 0.05,
          vy: (Math.random() - 0.5) * 1.2 + (mouse.y - mouse.prevY) * 0.05 - 0.4,
          radius: 35 + Math.random() * 25,
          maxRadius: 110 + Math.random() * 60,
          color: `${col.r}, ${col.g}, ${col.b}`,
          alpha: 0.35 + Math.random() * 0.2,
          decay: 0.005 + Math.random() * 0.006,
        });
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Create 8 large ambient floating aurora smoke clouds
    const orbs: SmokeOrb[] = palette.map((col, i) => {
      const angle = (i / palette.length) * Math.PI * 2;
      const dist = Math.min(width, height) * 0.32;
      const initX = width / 2 + Math.cos(angle) * dist;
      const initY = height / 2 + Math.sin(angle) * dist;
      const baseR = 240 + Math.random() * 120;

      return {
        x: initX,
        y: initY,
        baseX: initX,
        baseY: initY,
        radius: baseR,
        baseRadius: baseR,
        color: `${col.r}, ${col.g}, ${col.b}`,
        phase: Math.random() * Math.PI * 2,
        speed: 0.006 + Math.random() * 0.008,
        alpha: 0.32 + Math.random() * 0.12,
      };
    });

    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // 1. Render Large Ambient Floating Aurora Smoke Clouds
      orbs.forEach((orb, i) => {
        orb.phase += orb.speed;

        // Organic sin-cos drift paths
        const offsetX = Math.cos(orb.phase + i * 0.8) * 120 + Math.sin(time * 0.5 + i) * 60;
        const offsetY = Math.sin(orb.phase * 1.2 + i * 0.5) * 90 + Math.cos(time * 0.4 + i) * 50;

        let targetX = orb.baseX + offsetX;
        let targetY = orb.baseY + offsetY;

        // Subtle interactive mouse attraction
        if (mouse.active) {
          const dx = mouse.x - orb.x;
          const dy = mouse.y - orb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 600;

          if (dist < maxDist) {
            const pull = (1 - dist / maxDist) * 70;
            targetX += (dx / dist) * pull;
            targetY += (dy / dist) * pull;
          }
        }

        // Smooth easing towards target
        orb.x += (targetX - orb.x) * 0.03;
        orb.y += (targetY - orb.y) * 0.03;

        // Breathing cloud radius
        orb.radius = orb.baseRadius + Math.sin(time * 1.5 + i) * 45;

        // Volumetric radial smoke gradient
        const grad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );

        grad.addColorStop(0, `rgba(${orb.color}, ${orb.alpha})`);
        grad.addColorStop(0.35, `rgba(${orb.color}, ${orb.alpha * 0.6})`);
        grad.addColorStop(0.7, `rgba(${orb.color}, ${orb.alpha * 0.2})`);
        grad.addColorStop(1, `rgba(${orb.color}, 0)`);

        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 2. Render Interactive Cursor Smoke Puffs
      for (let j = smokePuffs.length - 1; j >= 0; j--) {
        const puff = smokePuffs[j];
        puff.x += puff.vx;
        puff.y += puff.vy;
        puff.radius += (puff.maxRadius - puff.radius) * 0.04;
        puff.alpha -= puff.decay;

        if (puff.alpha <= 0.01) {
          smokePuffs.splice(j, 1);
          continue;
        }

        const puffGrad = ctx.createRadialGradient(
          puff.x,
          puff.y,
          0,
          puff.x,
          puff.y,
          puff.radius
        );

        puffGrad.addColorStop(0, `rgba(${puff.color}, ${puff.alpha})`);
        puffGrad.addColorStop(0.4, `rgba(${puff.color}, ${puff.alpha * 0.5})`);
        puffGrad.addColorStop(0.8, `rgba(${puff.color}, ${puff.alpha * 0.15})`);
        puffGrad.addColorStop(1, `rgba(${puff.color}, 0)`);

        ctx.save();
        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-75 transition-opacity duration-700"
      style={{
        filter: 'blur(40px)',
      }}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full block"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
