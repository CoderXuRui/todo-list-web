import { useEffect, useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'square' | 'star';
}

interface CelebrationEffectProps {
  trigger: number;
  originX: number;
  originY: number;
  onComplete?: () => void;
}

const COLORS = ['#FF6B9D', '#C44569', '#FFB7C5', '#98D8AA', '#A8E6CF', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF9FF3'];
const SHAPES: Particle['shape'][] = ['circle', 'square', 'star'];

export function CelebrationEffect({ trigger, originX, originY, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const count = 30;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const velocity = 3 + Math.random() * 6;

      newParticles.push({
        id: Date.now() + i,
        x: originX,
        y: originY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      });
    }

    setParticles(newParticles);
  }, [originX, originY]);

  useEffect(() => {
    if (trigger > 0) {
      createParticles();
    }
  }, [trigger, createParticles]);

  useEffect(() => {
    if (particles.length === 0) return;

    const gravity = 0.15;
    const friction = 0.98;

    const animation = setInterval(() => {
      setParticles((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * friction,
            vy: p.vy * friction + gravity,
            rotation: p.rotation + p.rotationSpeed,
          }))
          .filter((p) => p.y < window.innerHeight + 50 && p.size > 0);

        if (updated.length === 0 && onComplete) {
          onComplete();
        }

        return updated;
      });
    }, 16);

    return () => clearInterval(animation);
  }, [particles.length, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
            transform: `rotate(${p.rotation}deg)`,
            boxShadow: p.shape === 'star' ? `0 0 ${p.size}px ${p.color}` : 'none',
          }}
        >
          {p.shape === 'star' && (
            <svg viewBox="0 0 24 24" fill={p.color} style={{ width: '100%', height: '100%' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

// Hook to manage celebration state
export function useCelebration() {
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const celebrate = useCallback((x: number, y: number) => {
    setOrigin({ x, y });
    setCelebrationKey((k) => k + 1);
  }, []);

  return { celebrationKey, origin, celebrate };
}
