import { useEffect, useRef } from 'react';
import type { BreathingPhase } from '../game/types';
import {
  drawSprite,
  pxCircleFill,
  pxCircleOutline,
  pxDot,
  pxRect,
  SPRITE_LOTUS_FLOWER,
} from './pixelSprites';

interface BreathingPixelArtProps {
  phase: BreathingPhase;
  phaseProgress: number;
}

const SIZE = 160;

export function BreathingPixelArt({ phase, phaseProgress }: BreathingPixelArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ phase, phaseProgress });

  useEffect(() => {
    stateRef.current = { phase, phaseProgress };
  }, [phase, phaseProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const draw = () => {
      const { phase: curPhase, phaseProgress: prog } = stateRef.current;
      // Smooth ease-in-out curve for expansion/contraction
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * prog);
      let radiusFactor = 0.35;
      if (curPhase === 'inhale') {
        radiusFactor = 0.35 + ease * 0.65;
      } else if (curPhase === 'hold') {
        radiusFactor = 1.0;
      } else {
        radiusFactor = 1.0 - ease * 0.65;
      }

      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const outerR = Math.round(24 + radiusFactor * 38);

      ctx.imageSmoothingEnabled = false;
      pxRect(ctx, 0, 0, SIZE, SIZE, '#F3F1EC');

      // Calm concentric pixel breath halos
      pxCircleFill(ctx, cx, cy, outerR + 10, '#E6ECE8');
      pxCircleOutline(ctx, cx, cy, outerR + 10, '#C5D5CD');
      pxCircleFill(ctx, cx, cy, outerR, '#D4E2DA');
      pxCircleOutline(ctx, cx, cy, outerR, '#6E9A8C');
      pxCircleFill(ctx, cx, cy, Math.max(12, Math.round(outerR * 0.68)), '#FAF9F5');

      // Subtle orbiting pixel breath particles
      const count = 8;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const px = cx + Math.cos(angle) * (outerR + 4);
        const py = cy + Math.sin(angle) * (outerR + 4);
        pxDot(ctx, px, py, '#4B7366');
      }

      // Center pixel lotus blossom
      const scale = radiusFactor > 0.65 ? 3 : 2;
      const spriteW = 9 * scale;
      const spriteH = 7 * scale;
      drawSprite(
        ctx,
        SPRITE_LOTUS_FLOWER,
        {
          p: curPhase === 'hold' ? '#6A78A3' : '#6E9A8C',
          w: '#FAF9F5',
          y: '#DFBE7E',
          g: '#557A6C',
        },
        cx - spriteW / 2,
        cy - spriteH / 2,
        scale
      );

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      data-testid="breathing-pixel-canvas"
      aria-label="Animación pixel art de respiración por tiempos"
      className="pixelated w-56 h-56 sm:w-64 sm:h-64 rounded-2xl border border-[var(--border-soft)] bg-[#F3F1EC]"
    />
  );
}
