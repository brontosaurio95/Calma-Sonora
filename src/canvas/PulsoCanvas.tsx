import { useEffect, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { evaluateBeatHit, getForestBpm } from '../game/minigamesLogic';
import {
  drawSprite,
  PIXEL_H,
  PIXEL_W,
  pxCircleFill,
  pxCircleOutline,
  pxDot,
  pxRect,
  SPRITE_LANTERN_SPIRIT,
  SPRITE_PINE_TREE,
} from './pixelSprites';

interface PulsoCanvasProps {
  paused: boolean;
  onScoreUpdate: (score: number, streak: number, hint: string) => void;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function PulsoCanvas({ paused, onScoreUpdate }: PulsoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  const callbackRef = useRef(onScoreUpdate);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    callbackRef.current = onScoreUpdate;
  }, [onScoreUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    let score = 0;
    let streak = 0;
    let beatPhase = 0.0;
    let beatIndex = 0;
    let hitUsedThisBeat = false;
    let spiritBob = 0;
    let walkOffset = 0;
    let shrineGlow = 0;
    let shrineColor = '#6A78A3';
    const sparks: Spark[] = [];

    const spawnSparks = (count: number, color: string) => {
      for (let i = 0; i < count; i++) {
        if (sparks.length > 36) sparks.shift();
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 16 + Math.random() * 20;
        sparks.push({
          x: PIXEL_W / 2,
          y: 96,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 8,
          life: 1,
          color,
        });
      }
    };

    const triggerHit = () => {
      if (pausedRef.current) return;
      soundEngine.unlock();

      if (hitUsedThisBeat) {
        return;
      }
      hitUsedThisBeat = true;

      const evalResult = evaluateBeatHit(beatPhase, streak);
      score += evalResult.pointsAwarded;
      streak = evalResult.nextStreak;
      soundEngine.playForestRespond(evalResult.judgment, streak);

      if (evalResult.judgment === 'perfect') {
        shrineGlow = 1;
        shrineColor = '#6E9A8C';
        spawnSparks(10, '#FAF9F5');
      } else if (evalResult.judgment === 'good') {
        shrineGlow = 0.7;
        shrineColor = '#7D8EB8';
        spawnSparks(6, '#DCE6E1');
      } else {
        shrineGlow = 0.3;
        shrineColor = '#C19A72';
      }

      callbackRef.current(score, streak, evalResult.feedbackLabel);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      if (e.code === 'Space' || e.key === 'Enter') {
        if (!e.repeat) {
          e.preventDefault();
          triggerHit();
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (pausedRef.current) return;
      e.preventDefault();
      triggerHit();
    };

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointerDown);

    callbackRef.current(0, 0, 'Toca o pulsa Espacio cuando el anillo llegue al centro');

    const renderFrame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (!pausedRef.current) {
        const bpm = getForestBpm(streak);
        const beatsPerSec = bpm / 60;
        const prevPhase = beatPhase;
        beatPhase += dt * beatsPerSec;

        // Beat trigger on wrap around 1.0 (or crossing 0.5 reset for hit lock)
        if (prevPhase < 0.5 && beatPhase >= 0.5) {
          hitUsedThisBeat = false;
        }
        if (beatPhase >= 1) {
          beatPhase -= 1;
          beatIndex++;
          hitUsedThisBeat = false;
          soundEngine.playForestPulse(beatIndex % 4 === 0);
        }

        spiritBob += dt * 4;
        walkOffset = (walkOffset + dt * 16) % 32;
        shrineGlow = Math.max(0, shrineGlow - dt * 1.8);

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 18 * dt;
          s.life -= dt * 1.7;
          if (s.life <= 0) sparks.splice(i, 1);
        }
      }

      // Pixel forest twilight sky
      ctx.imageSmoothingEnabled = false;
      pxRect(ctx, 0, 0, PIXEL_W, PIXEL_H, '#E5EAE8');
      pxRect(ctx, 0, 0, PIXEL_W, 56, '#DCE3E8');

      // Soft rolling hills
      pxRect(ctx, 0, 74, PIXEL_W, 44, '#CBD7D0');
      pxRect(ctx, 0, 114, PIXEL_W, 66, '#B7C7BE');

      // Pixel Pine Trees along forest clearing
      const treeXs = [18, 48, 86, 224, 260, 294];
      for (let i = 0; i < treeXs.length; i++) {
        drawSprite(
          ctx,
          SPRITE_PINE_TREE,
          { a: '#7F9C8E', b: '#9AB4A7', t: '#8E7968' },
          treeXs[i],
          52 + (i % 2) * 8,
          2
        );
      }

      // Mossy stepping stone path scrolling gently horizontally
      pxRect(ctx, 0, 126, PIXEL_W, 24, '#A1B4A8');
      for (let x = -Math.round(walkOffset); x < PIXEL_W + 32; x += 32) {
        pxRect(ctx, x, 132, 20, 10, '#DDE2DA');
        pxRect(ctx, x + 2, 134, 16, 6, '#EAECE6');
      }

      // Central stone shrine target
      const cx = PIXEL_W / 2;
      const cy = 92;
      pxCircleFill(ctx, cx, cy, 16, '#FAF9F5');
      pxCircleOutline(ctx, cx, cy, 16, '#7E9089');

      if (shrineGlow > 0.08) {
        pxCircleFill(ctx, cx, cy, 13, shrineColor);
      } else {
        pxCircleFill(ctx, cx, cy, 10, '#D4DFD9');
      }

      // Converging rhythm ring!
      // Ring shrinks from r=44 at beatPhase=0 -> wait: we want beatPhase=0/1 to be center!
      // So remaining fraction to next beat is (1 - beatPhase). At beatPhase=0.85 it's close; at 0.0 it's at center.
      const distToBeat = 1 - beatPhase;
      const ringRadius = 14 + distToBeat * 34;
      pxCircleOutline(ctx, cx, cy, ringRadius, distToBeat < 0.16 ? '#4B7366' : '#7D8EB8');
      if (distToBeat < 0.18) {
        pxCircleOutline(ctx, cx, cy, ringRadius - 1, '#FAF9F5');
      }

      // Walking pixel lantern spirit at foreground
      const bobY = Math.round(Math.sin(spiritBob) * 1.5);
      drawSprite(
        ctx,
        SPRITE_LANTERN_SPIRIT,
        {
          a: '#5A6D65',
          b: '#FAF9F5',
          c: shrineGlow > 0.2 ? '#E7C88B' : '#96B2A5',
          d: '#768B82',
        },
        cx - 9,
        118 + bobY,
        2
      );

      // Beat sparks
      for (const s of sparks) {
        pxDot(ctx, s.x, s.y, s.color);
      }

      // Quiet BPM indicator in sky corner (pixel dots)
      const activeBeat = beatIndex % 4;
      for (let b = 0; b < 4; b++) {
        pxRect(
          ctx,
          PIXEL_W / 2 - 18 + b * 10,
          156,
          6,
          4,
          b === activeBeat ? '#4B7366' : '#CBD6CF'
        );
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={PIXEL_W}
      height={PIXEL_H}
      data-testid="game-canvas-pulso"
      aria-label="Bosque interactivo en pixel art de Pulso del Bosque"
      className="pixelated w-full h-full block select-none cursor-pointer"
    />
  );
}
