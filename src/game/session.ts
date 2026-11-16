import type { BreathingPhaseInfo, MinigameId, MinigameMeta } from './types';

export const DEFAULT_GAME_DURATION_SEC = 15 * 60; // 15 minutos = 900 segundos
export const DEFAULT_BREATHING_DURATION_SEC = 60; // 1 minuto = 60 segundos

export const BREATH_INHALE_SEC = 4;
export const BREATH_HOLD_SEC = 2;
export const BREATH_EXHALE_SEC = 6;
export const BREATH_CYCLE_SEC = BREATH_INHALE_SEC + BREATH_HOLD_SEC + BREATH_EXHALE_SEC; // 12s

export const MINIGAMES: MinigameMeta[] = [
  {
    id: 'ecos',
    title: 'Ecos en el Estanque',
    subtitle: 'Escucha la secuencia de tonos suaves en el agua y repite el orden en los nenúfares.',
    neuralFocus: 'Atención selectiva · Discriminación tonal y espacial',
    controlsHint: 'Teclas 1-4 / A-S-D-F o clic en cada nenúfar · Esc Pausar',
    durationMinutes: 15,
    accentColor: '#4B7366',
  },
  {
    id: 'pulso',
    title: 'Pulso del Bosque',
    subtitle: 'Sigue el latido tranquilo de la marimba y sincroniza tu toque cuando el anillo alcance el centro.',
    neuralFocus: 'Circuito audio-motor · Sincronización rítmica',
    controlsHint: 'Espacio / Enter o clic al ritmo del pulso · Esc Pausar',
    durationMinutes: 15,
    accentColor: '#6A78A3',
  },
  {
    id: 'frecuencia',
    title: 'Frecuencia Serena',
    subtitle: 'Identifica las linternas que emiten el tono guía y armonízalas antes de que crucen el cielo.',
    neuralFocus: 'Filtro figura-fondo · Vigilancia auditiva sostenida',
    controlsHint: 'Clic en la linterna objetivo o Espacio al pasar · Esc Pausar',
    durationMinutes: 15,
    accentColor: '#9E7856',
  },
];

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export interface ParsedSessionParams {
  autostart: boolean;
  gameId: MinigameId;
  gameDurationSec: number;
  breathDurationSec: number;
  startBreathing: boolean;
}

export function parseSessionParams(search: string): ParsedSessionParams {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const autostart = params.get('autostart') === '1';
  const startBreathing = params.get('breathe') === '1';

  const rawGame = params.get('game');
  let gameId: MinigameId = 'ecos';
  if (rawGame === '2' || rawGame === 'pulso') gameId = 'pulso';
  else if (rawGame === '3' || rawGame === 'frecuencia') gameId = 'frecuencia';
  else if (rawGame === '1' || rawGame === 'ecos') gameId = 'ecos';

  const rawDuration = Number(params.get('duration'));
  const gameDurationSec =
    Number.isFinite(rawDuration) && rawDuration > 0 && rawDuration <= 3600
      ? rawDuration
      : DEFAULT_GAME_DURATION_SEC;

  const rawBreath = Number(params.get('breathDuration'));
  const breathDurationSec =
    Number.isFinite(rawBreath) && rawBreath > 0 && rawBreath <= 600
      ? rawBreath
      : DEFAULT_BREATHING_DURATION_SEC;

  return {
    autostart,
    gameId,
    gameDurationSec,
    breathDurationSec,
    startBreathing,
  };
}

export function getBreathingPhase(
  elapsedSec: number,
  totalDurationSec: number = DEFAULT_BREATHING_DURATION_SEC
): BreathingPhaseInfo {
  const safeElapsed = Math.max(0, elapsedSec);
  const totalCycles = Math.max(1, Math.round(totalDurationSec / BREATH_CYCLE_SEC));
  const cycleIndex = Math.min(totalCycles, Math.floor(safeElapsed / BREATH_CYCLE_SEC) + 1);
  const inCycle = safeElapsed % BREATH_CYCLE_SEC;

  if (inCycle < BREATH_INHALE_SEC) {
    const phaseElapsed = inCycle;
    const progress = phaseElapsed / BREATH_INHALE_SEC;
    return {
      phase: 'inhale',
      label: 'Inhala despacio',
      instruction: 'Toma aire suavemente por la nariz',
      phaseElapsed,
      phaseDuration: BREATH_INHALE_SEC,
      phaseProgress: progress,
      countInPhase: Math.min(BREATH_INHALE_SEC, Math.floor(phaseElapsed) + 1),
      cycleIndex,
      totalCycles,
    };
  }

  if (inCycle < BREATH_INHALE_SEC + BREATH_HOLD_SEC) {
    const phaseElapsed = inCycle - BREATH_INHALE_SEC;
    const progress = phaseElapsed / BREATH_HOLD_SEC;
    return {
      phase: 'hold',
      label: 'Mantén el aire',
      instruction: 'Sostén con calma sin tensionar los hombros',
      phaseElapsed,
      phaseDuration: BREATH_HOLD_SEC,
      phaseProgress: progress,
      countInPhase: Math.min(BREATH_HOLD_SEC, Math.floor(phaseElapsed) + 1),
      cycleIndex,
      totalCycles,
    };
  }

  const phaseElapsed = inCycle - BREATH_INHALE_SEC - BREATH_HOLD_SEC;
  const progress = Math.min(1, phaseElapsed / BREATH_EXHALE_SEC);
  return {
    phase: 'exhale',
    label: 'Exhala suave',
    instruction: 'Suelta el aire despacio dejando caer los hombros',
    phaseElapsed,
    phaseDuration: BREATH_EXHALE_SEC,
    phaseProgress: progress,
    countInPhase: Math.min(BREATH_EXHALE_SEC, Math.floor(phaseElapsed) + 1),
    cycleIndex,
    totalCycles,
  };
}
