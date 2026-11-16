import { formatCountdown, MINIGAMES } from '../game/session';
import type { SessionStats } from '../game/types';
import { PixelEmblem } from './PixelEmblem';

interface CompleteScreenProps {
  stats: SessionStats;
  onRepeatBreathing: () => void;
  onReturnTitle: () => void;
}

export function CompleteScreen({
  stats,
  onRepeatBreathing,
  onReturnTitle,
}: CompleteScreenProps) {
  const game = MINIGAMES.find((g) => g.id === stats.gameId) ?? MINIGAMES[0];

  return (
    <main className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--ink-primary)] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-soft)] shadow-[0_6px_24px_rgba(36,48,44,0.06)] text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-[var(--bg-sage)] flex items-center justify-center">
          <PixelEmblem kind={stats.gameId} size={36} />
        </div>

        <p className="text-xs text-[var(--ink-muted)] mb-2">
          {game.title} · Sesión completada
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink-primary)] mb-3">
          Buen trabajo descansando tu atención
        </h1>
        <p className="text-sm text-[var(--ink-secondary)] leading-relaxed mb-7">
          Has dedicado este tiempo a enfocar tus sentidos en sonidos reales y ritmo sereno, cerrando con respiración pausada.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-7 text-left">
          <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-soft)]">
            <div className="text-[11px] text-[var(--ink-muted)]">Enfoque</div>
            <div className="font-mono-tabular text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
              {formatCountdown(stats.focusedSeconds)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-soft)]">
            <div className="text-[11px] text-[var(--ink-muted)]">Armonía</div>
            <div className="font-mono-tabular text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
              {Math.round(stats.score)} pts
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-soft)]">
            <div className="text-[11px] text-[var(--ink-muted)]">Respiración</div>
            <div className="font-mono-tabular text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
              {stats.breathingCompleted ? '1:00 min' : 'Omitida'}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onRepeatBreathing}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--bg-sage)] hover:bg-[#D9E3DD] text-[var(--ink-primary)] text-sm font-medium transition-colors cursor-pointer"
          >
            Repetir respiración (1 min)
          </button>
          <button
            type="button"
            data-start="true"
            onClick={onReturnTitle}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--accent-sage)] hover:bg-[var(--accent-sage-hover)] text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Elegir minijuego
          </button>
        </div>
      </div>
    </main>
  );
}
