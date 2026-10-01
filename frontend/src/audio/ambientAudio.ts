import type { AudioProfile } from '../domain/skins';

const defaultProfile: AudioProfile = { water: 0.42, swell: 0.18, ambient: '낮은 물결' };

export class AmbientAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private oscillators: OscillatorNode[] = [];
  private noise?: AudioBufferSourceNode;
  private waterGain?: GainNode;
  private swellGain?: GainNode;
  private noiseGain?: GainNode;
  private profile: AudioProfile = defaultProfile;
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  start(profile: AudioProfile = this.profile): boolean {
    this.profile = profile;
    if (!this.enabled) return false;
    if (this.oscillators.length > 0) {
      this.applyProfile(profile);
      return true;
    }
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
      this.context ??= new AudioContextClass();
      void this.context.resume?.();
      const master = this.context.createGain();
      const water = this.context.createOscillator();
      const swell = this.context.createOscillator();
      const waterGain = this.context.createGain();
      const swellGain = this.context.createGain();
      water.type = 'sine';
      swell.type = 'triangle';
      water.connect(waterGain).connect(master);
      swell.connect(swellGain).connect(master);
      water.start();
      swell.start();
      this.oscillators = [water, swell];

      // Keep the bed long enough that the browser is not repeating a short,
      // obviously detectable loop during a normal focus block.
      const buffer = this.context.createBuffer(1, this.context.sampleRate * 16, this.context.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < channel.length; index += 1) channel[index] = (Math.random() * 2 - 1) * 0.2;
      const noise = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const noiseGain = this.context.createGain();
      noise.buffer = buffer;
      noise.loop = true;
      filter.type = 'lowpass';
      filter.frequency.value = 720;
      noise.connect(filter).connect(noiseGain).connect(master);
      noise.start();
      this.noise = noise;

      master.gain.setValueAtTime(0, this.context.currentTime);
      master.gain.linearRampToValueAtTime(0.012, this.context.currentTime + 1.2);
      this.master = master;
      this.waterGain = waterGain;
      this.swellGain = swellGain;
      this.noiseGain = noiseGain;
      this.applyProfile(profile);
      master.connect(this.context.destination);
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  setProfile(profile: AudioProfile) {
    this.profile = profile;
    if (this.oscillators.length > 0) this.applyProfile(profile);
  }

  stop() {
    const now = this.context?.currentTime ?? 0;
    try {
      this.master?.gain.setTargetAtTime(0, now, 0.08);
      this.oscillators.forEach((oscillator) => oscillator.stop(now + 0.12));
      this.noise?.stop(now + 0.12);
      this.oscillators.forEach((oscillator) => oscillator.disconnect());
      this.noise?.disconnect();
      this.master?.disconnect();
    } catch {
      // AudioContext cleanup can be called after an interruption.
    }
    this.oscillators = [];
    this.noise = undefined;
    this.waterGain = undefined;
    this.swellGain = undefined;
    this.noiseGain = undefined;
    this.master = undefined;
  }

  dispose() {
    this.stop();
    void this.context?.close();
    this.context = undefined;
  }

  private applyProfile(profile: AudioProfile) {
    const [water, swell] = this.oscillators;
    if (!water || !swell || !this.context) return;
    water.frequency.setTargetAtTime(78 + profile.water * 18, this.context.currentTime, 0.2);
    swell.frequency.setTargetAtTime(112 + profile.swell * 64, this.context.currentTime, 0.2);
    if (this.waterGain) this.waterGain.gain.setTargetAtTime(0.35 + profile.water * 0.2, this.context.currentTime, 0.18);
    if (this.swellGain) this.swellGain.gain.setTargetAtTime(0.08 + profile.swell * 0.12, this.context.currentTime, 0.18);
    if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(0.003 + profile.water * 0.006, this.context.currentTime, 0.18);
  }
}
