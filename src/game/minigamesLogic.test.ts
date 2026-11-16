import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ECHO_PADS,
  evaluateBeatHit,
  evaluateEchoInput,
  evaluateLanternPick,
  generateEchoSequence,
  getForestBpm,
  getTargetSequenceLength,
  getTargetToneForElapsed,
} from './minigamesLogic';

test('Ecos en el Estanque has 4 stereo-panned pads and scales sequence length smoothly', () => {
  assert.equal(ECHO_PADS.length, 4);
  assert.ok(ECHO_PADS[0].pan < 0 && ECHO_PADS[3].pan > 0);
  assert.equal(getTargetSequenceLength(0), 2);
  assert.equal(getTargetSequenceLength(3), 3);
  assert.equal(getTargetSequenceLength(6), 4);
  assert.equal(getTargetSequenceLength(12), 5);

  const seq = generateEchoSequence(4, () => 0.25);
  assert.equal(seq.length, 4);
  for (const padIdx of seq) {
    assert.ok(padIdx >= 0 && padIdx < 4);
  }
});

test('evaluateEchoInput handles partial steps, sequence completion, and gentle reset', () => {
  const seq = [0, 2, 1];
  const step0 = evaluateEchoInput(seq, 0, 0, 1);
  assert.equal(step0.matched, true);
  assert.equal(step0.sequenceCompleted, false);
  assert.equal(step0.nextStep, 1);
  assert.equal(step0.pointsAwarded, 5);

  const wrong = evaluateEchoInput(seq, 1, 3, 2);
  assert.equal(wrong.matched, false);
  assert.equal(wrong.nextStep, 0);
  assert.equal(wrong.nextStreak, 0);

  const stepFinal = evaluateEchoInput(seq, 2, 1, 1);
  assert.equal(stepFinal.matched, true);
  assert.equal(stepFinal.sequenceCompleted, true);
  assert.equal(stepFinal.nextStreak, 2);
  assert.ok(stepFinal.pointsAwarded > 20);
});

test('Pulso del Bosque evaluates timing windows and gently scales BPM', () => {
  assert.equal(getForestBpm(0), 72);
  assert.equal(getForestBpm(8), 76);
  assert.equal(getForestBpm(100), 88);

  const perfectNearZero = evaluateBeatHit(0.05, 0);
  assert.equal(perfectNearZero.judgment, 'perfect');
  assert.equal(perfectNearZero.nextStreak, 1);

  const perfectWrap = evaluateBeatHit(0.92, 5);
  assert.equal(perfectWrap.judgment, 'perfect');
  assert.equal(perfectWrap.nextStreak, 6);

  const good = evaluateBeatHit(0.2, 1);
  assert.equal(good.judgment, 'good');

  const miss = evaluateBeatHit(0.5, 4);
  assert.equal(miss.judgment, 'soft_miss');
  assert.equal(miss.nextStreak, 0);
  assert.equal(miss.pointsAwarded, 0);
});

test('Frecuencia Serena rotates target tone every 45s and scores matches accurately', () => {
  assert.equal(getTargetToneForElapsed(0), 'grave');
  assert.equal(getTargetToneForElapsed(45), 'media');
  assert.equal(getTargetToneForElapsed(90), 'aguda');
  assert.equal(getTargetToneForElapsed(135), 'grave');

  const match = evaluateLanternPick('media', 'media', 2);
  assert.equal(match.isMatch, true);
  assert.equal(match.nextStreak, 3);
  assert.ok(match.pointsAwarded > 15);

  const nonMatch = evaluateLanternPick('grave', 'media', 3);
  assert.equal(nonMatch.isMatch, false);
  assert.equal(nonMatch.nextStreak, 0);
  assert.equal(nonMatch.pointsAwarded, 0);
});
