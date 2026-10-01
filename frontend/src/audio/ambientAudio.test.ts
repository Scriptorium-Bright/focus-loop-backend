import { describe, expect, it, vi } from 'vitest';
import { AmbientAudio } from './ambientAudio';

describe('AmbientAudio', () => {
  it('falls back to silence when Web Audio is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);
    const audio = new AmbientAudio();

    expect(audio.start()).toBe(false);
    expect(() => audio.stop()).not.toThrow();
    audio.dispose();
  });

  it('does not attempt playback while sound is disabled', () => {
    const audio = new AmbientAudio();
    audio.setEnabled(false);

    expect(audio.start()).toBe(false);
  });
});
