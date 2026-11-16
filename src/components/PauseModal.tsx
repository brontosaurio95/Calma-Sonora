import { formatCountdown } from '../game/session';

interface PauseModalProps {
  gameTitle: string;
  remainingSeconds: number;
  onResume: () => void;
  onRestart: () => void;
  onGoToBreathing: () => void;
  onReturnTitle: () => void;
}

export function PauseModal({
  gameTitle,
  remainingSeconds,
  onResume,
  onRestart,
  onGoToBreathing,
  onReturnTitle,
}: PauseModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="fixed inset-0 z-30 flex items-center justify-center p-6 bg-[#24302C]/25"
    >
      <div className="w-full max-w-md p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-soft)] shadow-[0_12px_36px_rgba(36,48,44,0.12)]">
        <p className="text-xs text-[var(--ink-muted)] mb-1">
          {gameTitle} · {formatCountdown(remainingSeconds)} restantes
        </p>
        <h2 id="pause-title" className="font-display text-2xl font-semibold text-[var(--ink-primary)] mb-3">
          Sesión en pausa
        </h2>
        <p className="text-sm text-[var(--ink-secondary)] leading-relaxed mb-6">
          Tómate un instante si lo necesitas. Puedes continuar el ejercicio, reiniciar los 15 minutos o pasar directamente al minuto de respiración por tiempos.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--accent-sage)] hover:bg-[var(--accent-sage-hover)] text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Continuar
          </button>

          <button
            type="button"
            onClick={onGoToBreathing}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--bg-sage)] hover:bg-[#D9E3DD] text-[var(--ink-primary)] text-sm font-medium transition-colors cursor-pointer"
          >
            Ir a respiración por tiempos (1 min)
          </button>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onRestart}
              className="min-h-[42px] px-3 py-2 rounded-xl border border-[var(--border-soft)] text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
            >
              Reiniciar 15:00
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="min-h-[42px] px-3 py-2 rounded-xl border border-[var(--border-soft)] text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
