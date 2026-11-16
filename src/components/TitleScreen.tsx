import { Volume2, VolumeX } from 'lucide-react';
import { MINIGAMES } from '../game/session';
import type { MinigameId } from '../game/types';
import { PixelEmblem } from './PixelEmblem';

interface TitleScreenProps {
  muted: boolean;
  onToggleMute: () => void;
  onStartGame: (gameId: MinigameId) => void;
}

export function TitleScreen({ muted, onToggleMute, onStartGame }: TitleScreenProps) {
  return (
    <main className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--ink-primary)] flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PixelEmblem kind="brand" size={28} />
          <span className="font-display text-lg font-semibold tracking-tight text-[var(--ink-primary)] whitespace-nowrap">
            Calma Sonora
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] text-sm font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-sage)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{muted ? 'Sonido silenciado' : 'Sonido activo'}</span>
        </button>
      </div>

      <section className="max-w-5xl w-full mx-auto my-auto py-8">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-medium text-[var(--ink-muted)] mb-3">
            Atención sostenida · Circuito auditivo · 15 minutos + 1 minuto de respiración
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink-primary)] leading-tight [text-wrap:balance] mb-4">
            Un espacio sereno para enfocar tu oído y descansar la mente
          </h1>
          <p className="text-base text-[var(--ink-secondary)] leading-relaxed">
            Elige un minijuego en pixel art. Cada sesión dura 15 minutos con sonidos suaves y reglas simples, y finaliza automáticamente con 1 minuto de respiración por tiempos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MINIGAMES.map((game, idx) => (
            <article
              key={game.id}
              className="flex flex-col justify-between p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-soft)] shadow-[0_2px_12px_rgba(36,48,44,0.04)]"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-sage)] flex items-center justify-center">
                    <PixelEmblem kind={game.id} size={32} />
                  </div>
                  <span className="font-mono-tabular text-xs font-medium text-[var(--ink-muted)]">
                    {game.durationMinutes}:00 min
                  </span>
                </div>

                <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)] mb-2">
                  {game.title}
                </h2>
                <p className="text-sm text-[var(--ink-secondary)] leading-relaxed mb-4">
                  {game.subtitle}
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border-soft)] flex flex-col gap-4">
                <p className="text-xs text-[var(--ink-muted)] leading-snug">
                  {game.neuralFocus}
                </p>
                <button
                  type="button"
                  data-start={idx === 0 ? 'true' : undefined}
                  onClick={() => onStartGame(game.id)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--accent-sage)] hover:bg-[var(--accent-sage-hover)] text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  Comenzar ({game.durationMinutes} min)
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--ink-muted)]">
        <span>Recomendado usar auriculares a volumen cómodo y suave</span>
        <span>Pulsa Enter para iniciar · Esc para pausar en cualquier momento</span>
      </footer>
    </main>
  );
}
