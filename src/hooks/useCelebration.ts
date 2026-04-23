import { useState, useCallback, useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBF49'];

export function useCelebration() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const trigger = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const velocity = 8 + Math.random() * 12;
      newParticles.push({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 10,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
      });
    }

    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;

    let frameId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.6,
            rotation: p.rotation + p.rotationSpeed,
          }))
          .filter(() => elapsed < 2000)
      );

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [particles.length]);

  return { particles, trigger };
}