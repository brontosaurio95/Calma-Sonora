import { Volume2, VolumeX } from 'lucide-react';
import { BreathingPixelArt } from '../canvas/BreathingPixelArt';
import { formatCountdown, getBreathingPhase } from '../game/session';

interface BreathingScreenProps {
  remainingSeconds: number;
  totalDurationSeconds: number;
  muted: boolean;
  onToggleMute: () => void;
  onFinishEarly: () => void;
}

export function BreathingScreen({
  remainingSeconds,
  totalDurationSeconds,
  muted,
  onToggleMute,
  onFinishEarly,
}: BreathingScreenProps) {
  const elapsed = Math.max(0, totalDurationSeconds - remainingSeconds);
  const info = getBreathingPhase(elapsed, totalDurationSeconds);
  const totalDots = info.phaseDuration;

  return (
    <main className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--ink-primary)] flex flex-col justify-between px-6 py-8 sm:px-10">
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--ink-muted)]">Cierre de sesión</p>
          <h1 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            Respiración por tiempos
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span
            data-testid="breathing-timer"
            className="font-mono-tabular text-2xl font-semibold text-[var(--ink-primary)] px-4 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)]"
          >
            {formatCountdown(remainingSeconds)}
          </span>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Activar guía sonora' : 'Silenciar guía sonora'}
            className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <section className="max-w-xl w-full mx-auto my-auto py-8 flex flex-col items-center text-center">
        <BreathingPixelArt phase={info.phase} phaseProgress={info.phaseProgress} />

        <div className="mt-8 space-y-2">
          <p className="text-xs font-medium text-[var(--ink-muted)]">
            Ciclo {info.cycleIndex} de {info.totalCycles} · Ritmo 4 · 2 · 6 segundos
          </p>
          <h2
            data-testid="breathing-phase-label"
            className="font-display text-3xl sm:text-4xl font-semibold text-[var(--ink-primary)]"
          >
            {info.label}
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)]">{info.instruction}</p>
        </div>

        {/* Visual timed beat count (1..phaseDuration) */}
        <div className="mt-6 flex items-center gap-3" aria-label={`Tiempo ${info.countInPhase} de ${totalDots}`}>
          {Array.from({ length: totalDots }, (_, i) => {
            const active = i + 1 <= info.countInPhase;
            return (
              <span
                key={i}
                className={`w-3 h-3 rounded-xs transition-colors ${
                  active ? 'bg-[var(--accent-sage)]' : 'bg-[var(--bg-sage)] border border-[var(--border-soft)]'
                }`}
              />
            );
          })}
          <span className="font-mono-tabular text-sm font-medium text-[var(--ink-secondary)] ml-2">
            {info.countInPhase} / {totalDots}s
          </span>
        </div>
      </section>

      <div className="max-w-3xl w-full mx-auto flex items-center justify-between gap-4 text-xs text-[var(--ink-muted)]">
        <span>Inhala 4s · Mantén 2s · Exhala 6s</span>
        <button
          type="button"
          onClick={onFinishEarly}
          className="px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-sage)] transition-colors cursor-pointer whitespace-nowrap"
        >
          Finalizar ahora
        </button>
      </div>
    </main>
  );
}
