export type AppState = 'title' | 'playing' | 'paused' | 'breathing' | 'complete';

export type MinigameId = 'ecos' | 'pulso' | 'frecuencia';

export interface MinigameMeta {
  id: MinigameId;
  title: string;
  subtitle: string;
  neuralFocus: string;
  controlsHint: string;
  durationMinutes: number;
  accentColor: string;
}

export interface SessionStats {
  gameId: MinigameId;
  score: number;
  streak: number;
  bestStreak: number;
  focusedSeconds: number;
  breathingCompleted: boolean;
}

export type BreathingPhase = 'inhale' | 'hold' | 'exhale';

export interface BreathingPhaseInfo {
  phase: BreathingPhase;
  label: string;
  instruction: string;
  phaseElapsed: number;
  phaseDuration: number;
  phaseProgress: number;
  countInPhase: number;
  cycleIndex: number;
  totalCycles: number;
}
