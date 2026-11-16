// Pure deterministic rules and adaptive tuning for the 3 attention & audio-circuitry minigames

// --- MINIGAME 1: ECOS EN EL ESTANQUE ---
export interface EchoPadConfig {
  index: number;
  freqHz: number;
  pan: number;
  noteLabel: string;
  keyLabel: string;
  color: string;
}

export const ECHO_PADS: EchoPadConfig[] = [
  { index: 0, freqHz: 261.63, pan: -0.72, noteLabel: 'Do', keyLabel: '1 / A', color: '#6E9A8C' },
  { index: 1, freqHz: 329.63, pan: -0.24, noteLabel: 'Mi', keyLabel: '2 / S', color: '#7D8EB8' },
  { index: 2, freqHz: 392.0, pan: 0.24, noteLabel: 'Sol', keyLabel: '3 / D', color: '#C19A72' },
  { index: 3, freqHz: 440.0, pan: 0.72, noteLabel: 'La', keyLabel: '4 / F', color: '#9D84A8' },
];

export function getTargetSequenceLength(streak: number): number {
  if (streak < 2) return 2;
  if (streak < 5) return 3;
  if (streak < 10) return 4;
  return 5;
}

export function generateEchoSequence(length: number, rng: () => number = Math.random): number[] {
  const safeLen = Math.max(2, Math.min(6, length));
  const seq: number[] = [];
  for (let i = 0; i < safeLen; i++) {
    let candidate = Math.floor(rng() * ECHO_PADS.length);
    if (i > 0 && candidate === seq[i - 1] && rng() < 0.7) {
      candidate = (candidate + 1) % ECHO_PADS.length;
    }
    seq.push(candidate);
  }
  return seq;
}

export interface EchoEvaluationResult {
  matched: boolean;
  sequenceCompleted: boolean;
  nextStep: number;
  pointsAwarded: number;
  nextStreak: number;
}

export function evaluateEchoInput(
  sequence: number[],
  currentStep: number,
  padIndex: number,
  currentStreak: number
): EchoEvaluationResult {
  if (currentStep < 0 || currentStep >= sequence.length) {
    return {
      matched: false,
      sequenceCompleted: false,
      nextStep: 0,
      pointsAwarded: 0,
      nextStreak: 0,
    };
  }

  const expected = sequence[currentStep];
  if (padIndex !== expected) {
    return {
      matched: false,
      sequenceCompleted: false,
      nextStep: 0,
      pointsAwarded: 0,
      nextStreak: 0,
    };
  }

  const nextStep = currentStep + 1;
  const sequenceCompleted = nextStep >= sequence.length;
  const nextStreak = sequenceCompleted ? currentStreak + 1 : currentStreak;
  const pointsAwarded = sequenceCompleted
    ? 10 * sequence.length + Math.min(30, nextStreak * 3)
    : 5;

  return {
    matched: true,
    sequenceCompleted,
    nextStep: sequenceCompleted ? 0 : nextStep,
    pointsAwarded,
    nextStreak,
  };
}

// --- MINIGAME 2: PULSO DEL BOSQUE ---
export type BeatJudgment = 'perfect' | 'good' | 'soft_miss';

export interface BeatEvaluation {
  judgment: BeatJudgment;
  pointsAwarded: number;
  nextStreak: number;
  feedbackLabel: string;
}

export function getForestBpm(streak: number): number {
  // Calm, grounding cadence: starts at 72 BPM and gently lifts up to 88 BPM as flow deepens
  return Math.min(88, 72 + Math.floor(streak / 4) * 2);
}

export function evaluateBeatHit(beatPhase: number, currentStreak: number): BeatEvaluation {
  // beatPhase in [0, 1), where 0 (or 1) is the exact beat center
  const normalized = ((beatPhase % 1) + 1) % 1;
  const distanceFromBeat = Math.min(normalized, 1 - normalized);

  if (distanceFromBeat <= 0.14) {
    const nextStreak = currentStreak + 1;
    const multiplier = Math.min(4, 1 + Math.floor(nextStreak / 6));
    return {
      judgment: 'perfect',
      pointsAwarded: 20 * multiplier,
      nextStreak,
      feedbackLabel: 'En el pulso',
    };
  }

  if (distanceFromBeat <= 0.27) {
    const nextStreak = currentStreak + 1;
    const multiplier = Math.min(4, 1 + Math.floor(nextStreak / 6));
    return {
      judgment: 'good',
      pointsAwarded: 10 * multiplier,
      nextStreak,
      feedbackLabel: 'Armónico',
    };
  }

  return {
    judgment: 'soft_miss',
    pointsAwarded: 0,
    nextStreak: 0,
    feedbackLabel: 'Respira y sigue el ritmo',
  };
}

// --- MINIGAME 3: FRECUENCIA SERENA ---
export type ToneId = 'grave' | 'media' | 'aguda';

export interface ToneProfile {
  id: ToneId;
  label: string;
  freqHz: number;
  color: string;
  glowColor: string;
  symbol: 'circle' | 'diamond' | 'triangle';
}

export const TONE_PROFILES: Record<ToneId, ToneProfile> = {
  grave: {
    id: 'grave',
    label: 'Tono Grave',
    freqHz: 220,
    color: '#6E9A8C',
    glowColor: '#A9CBBF',
    symbol: 'circle',
  },
  media: {
    id: 'media',
    label: 'Tono Medio',
    freqHz: 329.63,
    color: '#7D8EB8',
    glowColor: '#B8C4E3',
    symbol: 'diamond',
  },
  aguda: {
    id: 'aguda',
    label: 'Tono Agudo',
    freqHz: 493.88,
    color: '#C79B71',
    glowColor: '#E5C6A7',
    symbol: 'triangle',
  },
};

export const TONE_ORDER: ToneId[] = ['grave', 'media', 'aguda'];

export function getTargetToneForElapsed(elapsedSec: number): ToneId {
  // Shifts gently every 45 seconds to keep selective auditory attention fresh
  const index = Math.floor(Math.max(0, elapsedSec) / 45) % TONE_ORDER.length;
  return TONE_ORDER[index];
}

export interface LanternEvaluation {
  isMatch: boolean;
  pointsAwarded: number;
  nextStreak: number;
  feedbackLabel: string;
}

export function evaluateLanternPick(
  lanternToneId: ToneId,
  targetToneId: ToneId,
  currentStreak: number
): LanternEvaluation {
  if (lanternToneId === targetToneId) {
    const nextStreak = currentStreak + 1;
    const bonus = Math.min(25, nextStreak * 3);
    return {
      isMatch: true,
      pointsAwarded: 15 + bonus,
      nextStreak,
      feedbackLabel: 'Frecuencia armonizada',
    };
  }

  return {
    isMatch: false,
    pointsAwarded: 0,
    nextStreak: 0,
    feedbackLabel: 'Otro tono — escucha la guía',
  };
}
