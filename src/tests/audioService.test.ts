import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioService } from '../services/audioService';

describe('AudioService', () => {
  let mockSpeechSynthesis: any;

  beforeEach(() => {
    mockSpeechSynthesis = {
      speaking: false,
      paused: false,
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      speak: vi.fn((utterance) => {
        if (utterance.onstart) utterance.onstart();
        if (utterance.onend) utterance.onend();
      }),
      getVoices: vi.fn(() => [
        { name: 'Alva', lang: 'sv-SE' },
        { name: 'David', lang: 'en-US' },
      ]),
      onvoiceschanged: null,
    };

    (global as any).window = (global as any).window || {};
    (global as any).window.speechSynthesis = mockSpeechSynthesis;
    (global as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
      text,
      lang: '',
      rate: 1,
      pitch: 1,
      volume: 1,
      voice: null,
      onstart: null,
      onend: null,
      onerror: null,
    }));
  });

  it('detects Web Speech API support', () => {
    const audio = new AudioService();
    expect(audio.isSupported()).toBe(true);
  });

  it('filters Swedish voices correctly', () => {
    const audio = new AudioService();
    const swedishVoices = audio.getSwedishVoices();
    expect(swedishVoices).toHaveLength(1);
    expect(swedishVoices[0].name).toBe('Alva');
  });

  it('sets and gets speech rate speed multiplier', () => {
    const audio = new AudioService();
    audio.setRate(1.25);
    expect(audio.getRate()).toBe(1.25);

    // Clamps out of bounds speed rates
    audio.setRate(3.0);
    expect(audio.getRate()).toBe(2.0);

    audio.setRate(0.1);
    expect(audio.getRate()).toBe(0.5);
  });

  it('speaks text with Swedish locale', async () => {
    const audio = new AudioService();
    await audio.speak('Tack');
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  });

  it('stops ongoing speech', () => {
    const audio = new AudioService();
    audio.stop();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });
});
