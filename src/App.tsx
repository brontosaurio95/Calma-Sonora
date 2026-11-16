import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { EcosCanvas } from './canvas/EcosCanvas';
import { FrecuenciaCanvas } from './canvas/FrecuenciaCanvas';
import { PulsoCanvas } from './canvas/PulsoCanvas';
import { BreathingScreen } from './components/BreathingScreen';
import { CompleteScreen } from './components/CompleteScreen';
import { GameHudBottom, GameHudTop } from './components/GameHud';
import { PauseModal } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import {
  getBreathingPhase,
  MINIGAMES,
  parseSessionParams,
} from './game/session';
import type { AppState, BreathingPhase, MinigameId, SessionStats } from './game/types';

export default function App() {
  const initialParams = useMemo(
    () =>
      typeof window !== 'undefined'
        ? parseSessionParams(window.location.search)
        : parseSessionParams(''),
    []
  );

  const [appState, setAppState] = useState<AppState>(() => {
    if (initialParams.startBreathing) return 'breathing';
    if (initialParams.autostart) return 'playing';
    return 'title';
  });

  const [activeGameId, setActiveGameId] = useState<MinigameId>(initialParams.gameId);
  const [runKey, setRunKey] = useState(1);
  const [muted, setMuted] = useState(false);

  const [gameRemainingSec, setGameRemainingSec] = useState(initialParams.gameDurationSec);
  const [breathRemainingSec, setBreathRemainingSec] = useState(initialParams.breathDurationSec);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [statusHint, setStatusHint] = useState('');
  const [breathingCompleted, setBreathingCompleted] = useState(false);

  const lastBreathPhaseRef = useRef<BreathingPhase | null>(null);
  const focusedSecondsRef = useRef(0);

  const activeGame = useMemo(
    () => MINIGAMES.find((g) => g.id === activeGameId) ?? MINIGAMES[0],
    [activeGameId]
  );

  // Mirror state machine to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = appState;
  }, [appState]);

  // Manage soft ambient audio bed lifecycle
  useEffect(() => {
    if (appState === 'playing' && !muted) {
      soundEngine.startAmbientBed();
    } else {
      soundEngine.stopAmbientBed();
    }
  }, [appState, muted]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const startGame = useCallback(
    (gameId: MinigameId) => {
      soundEngine.unlock();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setActiveGameId(gameId);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setStatusHint('');
      setBreathingCompleted(false);
      focusedSecondsRef.current = 0;
      setGameRemainingSec(initialParams.gameDurationSec);
      setRunKey((k) => k + 1);
      setAppState('playing');
    },
    [initialParams.gameDurationSec]
  );

  const enterBreathing = useCallback(
    (completedNaturalGame = false) => {
      soundEngine.stopAmbientBed();
      if (completedNaturalGame) {
        focusedSecondsRef.current = initialParams.gameDurationSec;
      }
      lastBreathPhaseRef.current = null;
      setBreathRemainingSec(initialParams.breathDurationSec);
      setBreathingCompleted(false);
      setAppState('breathing');
    },
    [initialParams.breathDurationSec, initialParams.gameDurationSec]
  );

  const returnToTitle = useCallback(() => {
    soundEngine.stopAmbientBed();
    setAppState('title');
  }, []);

  // Game countdown timer (15 minutes default)
  useEffect(() => {
    if (appState !== 'playing') return;

    let lastTick = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTick) / 1000;
      lastTick = now;
      focusedSecondsRef.current += delta;

      setGameRemainingSec((prev) => {
        const next = prev - delta;
        if (next <= 0) {
          window.clearInterval(interval);
          enterBreathing(true);
          return 0;
        }
        return next;
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [appState, enterBreathing]);

  // 1-minute paced breathing countdown timer
  useEffect(() => {
    if (appState !== 'breathing') return;

    let lastTick = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTick) / 1000;
      lastTick = now;

      setBreathRemainingSec((prev) => {
        const next = prev - delta;
        if (next <= 0) {
          window.clearInterval(interval);
          setBreathingCompleted(true);
          setAppState('complete');
          return 0;
        }
        const elapsed = Math.max(0, initialParams.breathDurationSec - next);
        const phaseInfo = getBreathingPhase(elapsed, initialParams.breathDurationSec);
        if (lastBreathPhaseRef.current !== phaseInfo.phase) {
          lastBreathPhaseRef.current = phaseInfo.phase;
          soundEngine.playBreathCue(phaseInfo.phase);
        }
        return next;
      });
    }, 80);

    // Trigger initial inhale cue immediately
    const initialPhase = getBreathingPhase(0, initialParams.breathDurationSec);
    lastBreathPhaseRef.current = initialPhase.phase;
    soundEngine.playBreathCue(initialPhase.phase);

    return () => window.clearInterval(interval);
  }, [appState, initialParams.breathDurationSec]);

  // Global keyboard controls (Title start, Pause, Mute)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (appState === 'title') {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startGame(activeGameId);
        }
        return;
      }

      if (appState === 'playing') {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setAppState('paused');
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          toggleMute();
        }
        return;
      }

      if (appState === 'paused') {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setAppState('playing');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [appState, activeGameId, startGame, toggleMute]);

  const handleScoreUpdate = useCallback((nextScore: number, nextStreak: number, hint: string) => {
    setScore(nextScore);
    setStreak(nextStreak);
    setBestStreak((prev) => Math.max(prev, nextStreak));
    setStatusHint(hint);
  }, []);

  if (appState === 'title') {
    return (
      <TitleScreen
        muted={muted}
        onToggleMute={toggleMute}
        onStartGame={startGame}
      />
    );
  }

  if (appState === 'breathing') {
    return (
      <BreathingScreen
        remainingSeconds={breathRemainingSec}
        totalDurationSeconds={initialParams.breathDurationSec}
        muted={muted}
        onToggleMute={toggleMute}
        onFinishEarly={() => {
          setBreathingCompleted(false);
          setAppState('complete');
        }}
      />
    );
  }

  if (appState === 'complete') {
    const stats: SessionStats = {
      gameId: activeGameId,
      score,
      streak,
      bestStreak,
      focusedSeconds: focusedSecondsRef.current,
      breathingCompleted,
    };
    return (
      <CompleteScreen
        stats={stats}
        onRepeatBreathing={() => enterBreathing(false)}
        onReturnTitle={returnToTitle}
      />
    );
  }

  const isPaused = appState === 'paused';

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[var(--bg-canvas)] flex flex-col items-center justify-between p-4 sm:p-6 gap-3">
      <GameHudTop
        game={activeGame}
        remainingSeconds={gameRemainingSec}
        totalDurationSeconds={initialParams.gameDurationSec}
        score={score}
        streak={streak}
        muted={muted}
        onToggleMute={toggleMute}
        onPause={() => setAppState('paused')}
        onGoToBreathing={() => enterBreathing(false)}
      />

      <div className="w-full max-w-5xl flex-1 min-h-0 flex items-center justify-center">
        <div
          className="w-full aspect-video rounded-2xl overflow-hidden border border-[var(--border-soft)] shadow-[0_8px_30px_rgba(36,48,44,0.06)]"
          style={{ maxWidth: 'min(100%, calc((100vh - 185px) * 16 / 9))' }}
        >
          {activeGameId === 'ecos' && (
            <EcosCanvas key={`ecos-${runKey}`} paused={isPaused} onScoreUpdate={handleScoreUpdate} />
          )}
          {activeGameId === 'pulso' && (
            <PulsoCanvas key={`pulso-${runKey}`} paused={isPaused} onScoreUpdate={handleScoreUpdate} />
          )}
          {activeGameId === 'frecuencia' && (
            <FrecuenciaCanvas
              key={`frecuencia-${runKey}`}
              paused={isPaused}
              onScoreUpdate={handleScoreUpdate}
            />
          )}
        </div>
      </div>

      <GameHudBottom statusHint={statusHint} controlsHint={activeGame.controlsHint} />

      {isPaused && (
        <PauseModal
          gameTitle={activeGame.title}
          remainingSeconds={gameRemainingSec}
          onResume={() => setAppState('playing')}
          onRestart={() => startGame(activeGameId)}
          onGoToBreathing={() => enterBreathing(false)}
          onReturnTitle={returnToTitle}
        />
      )}
    </main>
  );
}
