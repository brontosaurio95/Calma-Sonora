import { useEffect, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';
import {
  evaluateLanternPick,
  getTargetToneForElapsed,
  TONE_ORDER,
  TONE_PROFILES,
  type ToneId,
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
  SPRITE_CRYSTAL,
  SPRITE_PAPER_LANTERN,
} from './pixelSprites';

interface FrecuenciaCanvasProps {
  paused: boolean;
  onScoreUpdate: (score: number, streak: number, hint: string) => void;
}

interface DriftingLantern {
  id: number;
  x: number;
  y: number;
  lane: number;
  toneId: ToneId;
  speed: number;
  chimed: boolean;
  harmonized: boolean;
  fade: number;
}

const LANE_YS = [48, 88, 128];

export function FrecuenciaCanvas({ paused, onScoreUpdate }: FrecuenciaCanvasProps) {
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
    let elapsed = 0;
    let targetToneId: ToneId = getTargetToneForElapsed(0);
    let spawnTimer = 0.6;
    let nextId = 1;
    let crystalPulse = 1;
    const lanterns: DriftingLantern[] = [];
    const stars = Array.from({ length: 18 }, (_, i) => ({
      x: 16 + ((i * 61) % (PIXEL_W - 32)),
      y: 12 + ((i * 29) % 70),
      phase: i * 0.7,
    }));

    const pickToneForSpawn = (): ToneId => {
      // ~48% chance to match target tone so player gets steady engaging oddball hits
      if (Math.random() < 0.48) return targetToneId;
      const others = TONE_ORDER.filter((t) => t !== targetToneId);
      return others[Math.floor(Math.random() * others.length)];
    };

    const spawnLantern = () => {
      const lane = Math.floor(Math.random() * LANE_YS.length);
      const toneId = pickToneForSpawn();
      lanterns.push({
        id: nextId++,
        x: PIXEL_W + 16,
        y: LANE_YS[lane],
        lane,
        toneId,
        speed: 24 + Math.random() * 8,
        chimed: false,
        harmonized: false,
        fade: 1,
      });
    };

    const pickLantern = (target: DriftingLantern | undefined) => {
      if (!target || target.harmonized) return;
      soundEngine.unlock();
      const res = evaluateLanternPick(target.toneId, targetToneId, streak);
      score += res.pointsAwarded;
      streak = res.nextStreak;

      if (res.isMatch) {
        target.harmonized = true;
        soundEngine.playFrequencyTone(target.toneId, 0, false);
        callbackRef.current(score, streak, `${res.feedbackLabel} · ${TONE_PROFILES[targetToneId].label}`);
      } else {
        target.fade = 0.45;
        soundEngine.playSoftNudge();
        callbackRef.current(score, streak, `${res.feedbackLabel}: ${TONE_PROFILES[targetToneId].label}`);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (pausedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const px = ((e.clientX - rect.left) / rect.width) * PIXEL_W;
      const py = ((e.clientY - rect.top) / rect.height) * PIXEL_H;

      // Clicking the reference crystal plays the reference tone preview
      if (px < 64 && Math.abs(py - 88) < 34) {
        soundEngine.unlock();
        crystalPulse = 1;
        soundEngine.playFrequencyTone(targetToneId, -0.65, true);
        return;
      }

      let best: DriftingLantern | undefined;
      let bestDist = 28;
      for (const l of lanterns) {
        if (l.harmonized) continue;
        const d = Math.hypot(px - l.x, py - l.y);
        if (d < bestDist) {
          bestDist = d;
          best = l;
        }
      }
      pickLantern(best);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      if (e.code === 'Space' || e.key === 'Enter') {
        if (e.repeat) return;
        e.preventDefault();
        // Harmonize the lantern closest to the listening zone center (~x=160)
        let candidate: DriftingLantern | undefined;
        let bestScore = Infinity;
        for (const l of lanterns) {
          if (l.harmonized || l.x < 68 || l.x > PIXEL_W - 20) continue;
          const distFromZone = Math.abs(l.x - 160);
          if (distFromZone < bestScore) {
            bestScore = distFromZone;
            candidate = l;
          }
        }
        pickLantern(candidate);
      } else if (e.key.toLowerCase() === 'r') {
        soundEngine.unlock();
        crystalPulse = 1;
        soundEngine.playFrequencyTone(targetToneId, -0.65, true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointerDown);

    // Spawn 2 initial lanterns so the sky is alive on frame 1
    spawnLantern();
    lanterns[0].x = 240;

    callbackRef.current(0, 0, `Escucha y elige las linternas de ${TONE_PROFILES[targetToneId].label}`);

    const renderFrame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (!pausedRef.current) {
        elapsed += dt;
        const nextTarget = getTargetToneForElapsed(elapsed);
        if (nextTarget !== targetToneId) {
          targetToneId = nextTarget;
          crystalPulse = 1;
          soundEngine.playFrequencyTone(targetToneId, -0.65, true);
          callbackRef.current(
            score,
            streak,
            `Nuevo tono guía: ${TONE_PROFILES[targetToneId].label}`
          );
        }

        crystalPulse = Math.max(0, crystalPulse - dt * 1.1);
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnLantern();
          spawnTimer = 2.0;
        }

        for (let i = lanterns.length - 1; i >= 0; i--) {
          const l = lanterns[i];
          if (l.harmonized) {
            l.y -= dt * 20;
            l.fade -= dt * 1.6;
            if (l.fade <= 0) lanterns.splice(i, 1);
            continue;
          }
          l.x -= l.speed * dt;
          if (!l.chimed && l.x <= 255) {
            l.chimed = true;
            const pan = ((l.x / PIXEL_W) * 2 - 1) * 0.65;
            soundEngine.playFrequencyTone(l.toneId, pan, true);
          }
          if (l.x < 52) {
            lanterns.splice(i, 1);
          }
        }

        for (const st of stars) {
          st.phase += dt * 2;
        }
      }

      // Soft twilight sky background
      ctx.imageSmoothingEnabled = false;
      pxRect(ctx, 0, 0, PIXEL_W, PIXEL_H, '#DFE5EC');
      pxRect(ctx, 0, 128, PIXEL_W, 52, '#C7D3D4');
      pxRect(ctx, 0, 146, PIXEL_W, 34, '#B5C5C1');

      // Gentle pixel stars
      for (const st of stars) {
        const bright = Math.sin(st.phase) > 0.2;
        pxDot(ctx, st.x, st.y, bright ? '#FAF9F5' : '#C3CDD9');
      }

      // Subtle guide lane lines
      for (const ly of LANE_YS) {
        for (let x = 74; x < PIXEL_W - 12; x += 8) {
          pxRect(ctx, x, ly, 3, 1, '#CDD7DE');
        }
      }

      // Left Reference Crystal Panel
      const targetProfile = TONE_PROFILES[targetToneId];
      pxRect(ctx, 8, 52, 48, 72, '#FAF9F5');
      pxRect(ctx, 9, 53, 46, 70, '#EDF1EE');
      if (crystalPulse > 0.15) {
        pxCircleOutline(ctx, 32, 82, 16, targetProfile.color);
      }
      drawSprite(
        ctx,
        SPRITE_CRYSTAL,
        {
          c: targetProfile.color,
          l: targetProfile.glowColor,
          w: '#FAF9F5',
        },
        23,
        74,
        2
      );
      drawPixelText(ctx, 'GUIA', 32, 60, '#33423D', 1);
      drawPixelText(ctx, targetProfile.label.replace('Tono ', ''), 32, 111, '#33423D', 1);

      // Drifting paper lanterns
      for (const l of lanterns) {
        const profile = TONE_PROFILES[l.toneId];
        if (l.harmonized) {
          pxCircleOutline(ctx, l.x, l.y, 12, '#FAF9F5');
          pxDot(ctx, l.x, l.y, '#FAF9F5');
          continue;
        }
        if (l.chimed) {
          pxCircleOutline(ctx, l.x, l.y, 12, profile.glowColor);
        }
        drawSprite(
          ctx,
          SPRITE_PAPER_LANTERN,
          {
            t: '#7E6E63',
            l: profile.color,
            w: '#FAF9F5',
            s: profile.glowColor,
          },
          l.x - 9,
          l.y - 8,
          2
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
      data-testid="game-canvas-frecuencia"
      aria-label="Cielo interactivo en pixel art de Frecuencia Serena"
      className="pixelated w-full h-full block select-none cursor-pointer"
    />
  );
}
