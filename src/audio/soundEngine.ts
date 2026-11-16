import type { BreathingPhase } from '../game/types';
import type { ToneId } from '../game/minigamesLogic';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.75;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.04);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public startAmbientBed(): void {
    if (
      typeof navigator !== 'undefined' &&
      'userActivation' in navigator &&
      !(navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
        ?.hasBeenActive
    ) {
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.ambientSource) return;

    try {
      // Soft pink-filtered water/wind noise bed (~0.025 gain) to gently anchor auditory attention
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        data[i] = (b0 + b1 + b2 + white * 0.018) * 0.25;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.7;

      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      gain.gain.setTargetAtTime(0.055, ctx.currentTime, 0.6);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      source.start();

      this.ambientSource = source;
      this.ambientGain = gain;
    } catch {
      // Ignore audio initialization failures in headless contexts
    }
  }

  public stopAmbientBed(): void {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
      } catch {
        // ignore
      }
    }
    const src = this.ambientSource;
    this.ambientSource = null;
    this.ambientGain = null;
    if (src) {
      setTimeout(() => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // ignore
        }
      }, 250);
    }
  }

  public playEchoTone(freqHz: number, pan: number, gentle = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freqHz, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freqHz * 2, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.value = 0.12;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);

    const peak = gentle ? 0.16 : 0.24;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.75);

    osc1.connect(filter);
    osc2.connect(overtoneGain);
    overtoneGain.connect(filter);
    filter.connect(gain);

    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gain.connect(this.masterGain);
    }

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);
  }

  public playSoftNudge(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(196, now);
    osc.frequency.exponentialRampToValueAtTime(174.6, now + 0.22);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playForestPulse(isAccentBeat: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = isAccentBeat ? 220 : 164.81;
    osc.frequency.setValueAtTime(baseFreq * 1.15, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.045);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isAccentBeat ? 0.22 : 0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.24);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playForestRespond(judgment: 'perfect' | 'good' | 'soft_miss', streak: number): void {
    if (judgment === 'soft_miss') {
      this.playSoftNudge();
      return;
    }
    const notes = [329.63, 392.0, 440.0, 523.25, 587.33];
    const freq = notes[streak % notes.length];
    this.playEchoTone(freq, 0, judgment === 'good');
  }

  public playFrequencyTone(toneId: ToneId, pan = 0, isPreview = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (toneId === 'grave') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now);
      filter.type = 'lowpass';
      filter.frequency.value = 600;
    } else if (toneId === 'media') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, now);
      sub.type = 'sine';
      sub.frequency.setValueAtTime(329.63, now);
      filter.type = 'lowpass';
      filter.frequency.value = 1100;
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(493.88, now);
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(987.77, now);
      filter.type = 'lowpass';
      filter.frequency.value = 2200;
    }

    const subGain = ctx.createGain();
    subGain.gain.value = toneId === 'aguda' ? 0.14 : 0.2;

    const peak = isPreview ? 0.14 : 0.2;
    const duration = isPreview ? 0.45 : 0.55;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(filter);
    sub.connect(subGain);
    subGain.connect(filter);
    filter.connect(gain);

    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gain.connect(this.masterGain);
    }

    osc.start(now);
    sub.start(now);
    osc.stop(now + duration + 0.05);
    sub.stop(now + duration + 0.05);
  }

  public playBreathCue(phase: BreathingPhase): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    if (phase === 'inhale') {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(293.66, now + 3.6);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 1.4);
      gain.gain.linearRampToValueAtTime(0.001, now + 3.8);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 3.9);
    } else if (phase === 'hold') {
      osc.frequency.setValueAtTime(293.66, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.3);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.85);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.95);
    } else {
      osc.frequency.setValueAtTime(293.66, now);
      osc.frequency.linearRampToValueAtTime(196.0, now + 5.6);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.085, now + 0.8);
      gain.gain.linearRampToValueAtTime(0.001, now + 5.8);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 5.9);
    }
  }
}

export const soundEngine = new SoundEngine();
