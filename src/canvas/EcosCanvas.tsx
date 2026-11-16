import { useEffect, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';
import {
  ECHO_PADS,
  evaluateEchoInput,
  generateEchoSequence,
  getTargetSequenceLength,
} from '../game/minigamesLogic';
import {
  drawPixelText,
  drawSprite,
  PIXEL_H,
  PIXEL_W,
  pxCircleFill,
  pxCircleOutline,
  pxDot,
  pxRect,
  SPRITE_KOI,
  SPRITE_LOTUS_FLOWER,
} from './pixelSprites';

interface EcosCanvasProps {
  paused: boolean;
  onScoreUpdate: (score: number, streak: number, hint: string) => void;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  color: string;
}

const PAD_POSITIONS = [
  { x: 64, y: 98 },
  { x: 128, y: 74 },
  { x: 192, y: 112 },
  { x: 256, y: 84 },
];

export function EcosCanvas({ paused, paused: isPaused, onScoreUpdate }: EcosCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(isPaused);
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

    // Simulation state (zero React state at 60Hz)
    let score = 0;
    let streak = 0;
    let sequence = generateEchoSequence(2);
    let mode: 'demo' | 'listen' | 'pause_before_demo' = 'pause_before_demo';
    let demoIndex = 0;
    let demoTimer = 0.55;
    let playerStep = 0;
    const padGlow = [0, 0, 0, 0];
    const ripples: Ripple[] = [];

    const fireflies = Array.from({ length: 14 }, (_, i) => ({
      x: 24 + ((i * 53) % (PIXEL_W - 48)),
      y: 20 + ((i * 37) % (PIXEL_H - 44)),
      phase: i * 0.9,
      speed: 0.4 + (i % 3) * 0.18,
    }));

    const koi = [
      { x: 40, y: 144, vx: 11, color: '#D49A79' },
      { x: 230, y: 42, vx: -9, color: '#C9B38C' },
    ];

    const spawnRipple = (x: number, y: number, color: string, maxR = 28) => {
      if (ripples.length > 24) ripples.shift();
      ripples.push({ x, y, r: 4, maxR, alpha: 1, color });
    };

    const triggerPadFeedback = (padIdx: number, gentle = false) => {
      const pad = ECHO_PADS[padIdx];
      const pos = PAD_POSITIONS[padIdx];
      padGlow[padIdx] = 1;
      spawnRipple(pos.x, pos.y, pad.color, gentle ? 24 : 30);
      soundEngine.playEchoTone(pad.freqHz, pad.pan, gentle);
    };

    const handlePlayerPad = (padIdx: number) => {
      if (pausedRef.current || mode !== 'listen') return;
      soundEngine.unlock();
      const pos = PAD_POSITIONS[padIdx];
      const evalResult = evaluateEchoInput(sequence, playerStep, padIdx, streak);

      if (evalResult.matched) {
        triggerPadFeedback(padIdx, false);
        score += evalResult.pointsAwarded;
        streak = evalResult.nextStreak;

        if (evalResult.sequenceCompleted) {
          callbackRef.current(score, streak, 'Secuencia completada · escucha el siguiente eco');
          sequence = generateEchoSequence(getTargetSequenceLength(streak));
          mode = 'pause_before_demo';
          demoIndex = 0;
          demoTimer = 0.95;
          playerStep = 0;
        } else {
          playerStep = evalResult.nextStep;
          callbackRef.current(
            score,
            streak,
            `Paso ${playerStep} de ${sequence.length} · continúa`
          );
        }
      } else {
        // Gentle non-punishing nudge and replay current sequence
        padGlow[padIdx] = 0.5;
        spawnRipple(pos.x, pos.y, '#B9875D', 20);
        soundEngine.playSoftNudge();
        streak = 0;
        playerStep = 0;
        mode = 'pause_before_demo';
        demoIndex = 0;
        demoTimer = 0.85;
        callbackRef.current(score, streak, 'Escucha de nuevo el eco con calma');
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      const key = e.key.toLowerCase();
      let padIdx = -1;
      if (key === '1' || key === 'a' || key === 'arrowleft') padIdx = 0;
      else if (key === '2' || key === 's' || key === 'arrowdown') padIdx = 1;
      else if (key === '3' || key === 'd' || key === 'arrowup') padIdx = 2;
      else if (key === '4' || key === 'f' || key === 'arrowright') padIdx = 3;

      if (padIdx >= 0) {
        e.preventDefault();
        handlePlayerPad(padIdx);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (pausedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const px = ((e.clientX - rect.left) / rect.width) * PIXEL_W;
      const py = ((e.clientY - rect.top) / rect.height) * PIXEL_H;

      let closestIdx = -1;
      let closestDist = 34;
      for (let i = 0; i < PAD_POSITIONS.length; i++) {
        const dx = px - PAD_POSITIONS[i].x;
        const dy = py - PAD_POSITIONS[i].y;
        const d = Math.hypot(dx, dy);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      }
      if (closestIdx >= 0) {
        handlePlayerPad(closestIdx);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointerDown);

    callbackRef.current(0, 0, 'Observa y escucha los ecos del estanque');

    const renderFrame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (!pausedRef.current) {
        if (mode === 'pause_before_demo') {
          demoTimer -= dt;
          if (demoTimer <= 0) {
            mode = 'demo';
            demoIndex = 0;
            demoTimer = 0.05;
            callbackRef.current(score, streak, 'Escucha el orden de los tonos...');
          }
        } else if (mode === 'demo') {
          demoTimer -= dt;
          if (demoTimer <= 0) {
            if (demoIndex < sequence.length) {
              triggerPadFeedback(sequence[demoIndex], true);
              demoIndex++;
              demoTimer = 0.68;
            } else {
              mode = 'listen';
              playerStep = 0;
              callbackRef.current(
                score,
                streak,
                `Tu turno · repite los ${sequence.length} tonos`
              );
            }
          }
        }

        for (let i = 0; i < 4; i++) {
          padGlow[i] = Math.max(0, padGlow[i] - dt * 1.6);
        }

        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.r += dt * 22;
          r.alpha = Math.max(0, 1 - r.r / r.maxR);
          if (r.r >= r.maxR) ripples.splice(i, 1);
        }

        for (const fish of koi) {
          fish.x += fish.vx * dt;
          if (fish.vx > 0 && fish.x > PIXEL_W + 14) fish.x = -16;
          if (fish.vx < 0 && fish.x < -16) fish.x = PIXEL_W + 14;
        }

        for (const ff of fireflies) {
          ff.phase += dt * ff.speed;
        }
      }

      // Draw pixel pond background
      ctx.imageSmoothingEnabled = false;
      pxRect(ctx, 0, 0, PIXEL_W, PIXEL_H, '#DCE6E1');

      // Subtle dithered water depth bands
      for (let y = 12; y < PIXEL_H; y += 6) {
        for (let x = (y % 12 === 0 ? 0 : 3); x < PIXEL_W; x += 10) {
          pxDot(ctx, x, y, '#CEDCD5');
        }
      }

      // Soft mossy pond banks (top & bottom corners)
      pxRect(ctx, 0, 0, PIXEL_W, 14, '#B9CEC2');
      pxRect(ctx, 0, 14, PIXEL_W, 2, '#9FB9AB');
      pxRect(ctx, 0, PIXEL_H - 12, PIXEL_W, 12, '#B9CEC2');
      pxRect(ctx, 0, PIXEL_H - 14, PIXEL_W, 2, '#9FB9AB');

      // Swimming koi silhouettes under water
      for (const fish of koi) {
        drawSprite(
          ctx,
          SPRITE_KOI,
          { o: fish.color, w: '#F5EFE6', p: '#C47D61' },
          fish.x,
          fish.y,
          1
        );
      }

      // Water ripples
      for (const r of ripples) {
        if (r.alpha > 0.12) {
          pxCircleOutline(ctx, r.x, r.y, r.r, r.alpha > 0.55 ? r.color : '#F4F6F4');
        }
      }

      // 4 Pixel Lotus Pads
      for (let i = 0; i < PAD_POSITIONS.length; i++) {
        const pos = PAD_POSITIONS[i];
        const pad = ECHO_PADS[i];
        const glow = padGlow[i];

        // Shadow under pad
        pxCircleFill(ctx, pos.x + 1, pos.y + 3, 16, '#B8CBC1');

        // Glow ring when active
        if (glow > 0.1) {
          pxCircleOutline(ctx, pos.x, pos.y, 19, '#FAF9F5');
          pxCircleOutline(ctx, pos.x, pos.y, 18, pad.color);
        }

        // Leaf pad base
        pxCircleFill(ctx, pos.x, pos.y, 15, glow > 0.2 ? pad.color : '#8AA999');
        pxCircleFill(ctx, pos.x, pos.y, 12, glow > 0.2 ? '#FAF9F5' : '#9EBCAE');
        // Classic lily pad notch
        pxRect(ctx, pos.x + 6, pos.y - 2, 10, 4, '#DCE6E1');

        // Center pixel lotus blossom
        drawSprite(
          ctx,
          SPRITE_LOTUS_FLOWER,
          {
            p: glow > 0.25 ? '#FAF9F5' : pad.color,
            w: '#FAF9F5',
            y: '#E5C687',
            g: '#6A8B7B',
          },
          pos.x - 9,
          pos.y - 8,
          2
        );

        // Clean pixel key tag below pad
        pxRect(ctx, pos.x - 14, pos.y + 20, 28, 9, '#FAF9F5');
        drawPixelText(ctx, pad.keyLabel, pos.x, pos.y + 22, '#33423D', 1);
      }

      // Gentle floating fireflies
      for (const ff of fireflies) {
        const ox = Math.round(ff.x + Math.sin(ff.phase) * 5);
        const oy = Math.round(ff.y + Math.cos(ff.phase * 1.3) * 3);
        const bright = Math.sin(ff.phase * 2) > 0;
        pxDot(ctx, ox, oy, bright ? '#F7F1CE' : '#C9D8CC');
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
      data-testid="game-canvas-ecos"
      aria-label="Estanque interactivo en pixel art de Ecos en el Estanque"
      className="pixelated w-full h-full block select-none cursor-pointer"
    />
  );
}
