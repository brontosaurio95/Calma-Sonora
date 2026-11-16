import { Pause, Volume2, VolumeX, Wind } from 'lucide-react';
import { formatCountdown } from '../game/session';
import type { MinigameMeta } from '../game/types';

interface GameHudProps {
  game: MinigameMeta;
  remainingSeconds: number;
  totalDurationSeconds: number;
  score: number;
  streak: number;
  statusHint: string;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onGoToBreathing: () => void;
}

export function GameHudTop({
  game,
  remainingSeconds,
  totalDurationSeconds,
  score,
  streak,
  muted,
  onToggleMute,
  onPause,
  onGoToBreathing,
}: Omit<GameHudProps, 'statusHint'>) {
  const progressPct =
    totalDurationSeconds > 0
      ? Math.max(0, Math.min(100, ((totalDurationSeconds - remainingSeconds) / totalDurationSeconds) * 100))
      : 0;

  return (
    <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4">
      <div className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)]">
        <div className="text-xs text-[var(--ink-muted)]">{game.title}</div>
        <div className="flex items-baseline gap-4 mt-0.5">
          <span className="font-mono-tabular text-base font-semibold text-[var(--ink-primary)]" data-testid="hud-score">
            {Math.round(score)} pts
          </span>
          <span className="text-xs text-[var(--ink-secondary)] font-mono-tabular" data-testid="hud-streak">
            Racha {streak}
          </span>
        </div>
      </div>

      <div
        className="flex flex-col items-center px-5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)]"
        aria-live="off"
      >
        <span className="text-[11px] text-[var(--ink-muted)]">Tiempo restante</span>
        <span
          data-testid="hud-timer"
          className="font-mono-tabular text-xl font-semibold text-[var(--ink-primary)] tracking-tight"
        >
          {formatCountdown(remainingSeconds)}
        </span>
        <div className="w-28 h-1 rounded-full bg-[var(--bg-sage)] overflow-hidden mt-1">
          <div
            className="h-full bg-[var(--accent-sage)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onGoToBreathing();
          }}
          aria-label="Ir a respiración por tiempos"
          title="Ir a respiración (1 min)"
          className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[42px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-sage)] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Wind className="w-4 h-4" />
          <span className="hidden sm:inline">Respiración</span>
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
          className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-sage)] transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onPause();
          }}
          aria-label="Pausar juego"
          className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-sage)] transition-colors cursor-pointer"
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export function GameHudBottom({
  statusHint,
  controlsHint,
}: {
  statusHint: string;
  controlsHint: string;
}) {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
      <p
        data-testid="hud-feedback"
        className="px-4 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] text-xs sm:text-sm font-medium text-[var(--ink-primary)]"
      >
        {statusHint}
      </p>
      <p className="text-xs text-[var(--ink-muted)]">{controlsHint}</p>
    </div>
  );
}
