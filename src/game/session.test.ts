import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BREATHING_DURATION_SEC,
  DEFAULT_GAME_DURATION_SEC,
  formatCountdown,
  getBreathingPhase,
  MINIGAMES,
  parseSessionParams,
} from './session';

test('default durations match 15 minutes per game and 1 minute breathing', () => {
  assert.equal(DEFAULT_GAME_DURATION_SEC, 900);
  assert.equal(DEFAULT_BREATHING_DURATION_SEC, 60);
  assert.equal(MINIGAMES.length, 3);
  for (const game of MINIGAMES) {
    assert.equal(game.durationMinutes, 15);
  }
});

test('formatCountdown formats mm:ss accurately with zero padding', () => {
  assert.equal(formatCountdown(900), '15:00');
  assert.equal(formatCountdown(60), '01:00');
  assert.equal(formatCountdown(59.1), '01:00');
  assert.equal(formatCountdown(9.05), '00:10');
  assert.equal(formatCountdown(0), '00:00');
  assert.equal(formatCountdown(-5), '00:00');
});

test('parseSessionParams handles defaults and query overrides safely', () => {
  const defaults = parseSessionParams('');
  assert.equal(defaults.autostart, false);
  assert.equal(defaults.gameId, 'ecos');
  assert.equal(defaults.gameDurationSec, 900);
  assert.equal(defaults.breathDurationSec, 60);

  const custom = parseSessionParams('?autostart=1&game=2&duration=5&breathDuration=4');
  assert.equal(custom.autostart, true);
  assert.equal(custom.gameId, 'pulso');
  assert.equal(custom.gameDurationSec, 5);
  assert.equal(custom.breathDurationSec, 4);

  const invalidDuration = parseSessionParams('?game=frecuencia&duration=-10');
  assert.equal(invalidDuration.gameId, 'frecuencia');
  assert.equal(invalidDuration.gameDurationSec, 900);
});

test('getBreathingPhase cycles smoothly through 4s inhale, 2s hold, 6s exhale across 60s', () => {
  const p0 = getBreathingPhase(0, 60);
  assert.equal(p0.phase, 'inhale');
  assert.equal(p0.label, 'Inhala despacio');
  assert.equal(p0.countInPhase, 1);
  assert.equal(p0.cycleIndex, 1);
  assert.equal(p0.totalCycles, 5);

  const p4 = getBreathingPhase(4.5, 60);
  assert.equal(p4.phase, 'hold');
  assert.equal(p4.label, 'Mantén el aire');
  assert.equal(p4.countInPhase, 1);

  const p7 = getBreathingPhase(7.2, 60);
  assert.equal(p7.phase, 'exhale');
  assert.equal(p7.label, 'Exhala suave');
  assert.equal(p7.countInPhase, 2);

  const pCycle5 = getBreathingPhase(55, 60);
  assert.equal(pCycle5.phase, 'exhale');
  assert.equal(pCycle5.cycleIndex, 5);
});
