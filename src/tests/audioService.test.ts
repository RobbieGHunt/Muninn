import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioService, sanitizeForSpeech, getPreferredSwedishVoice } from '../services/audioService';

describe('AudioService & Speech Sanitization', () => {
  let mockSpeechSynthesis: any;
  let mockAudioPlay: any;

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
        { name: 'Microsoft Sofie Online (Natural) - Swedish (Sweden)', lang: 'sv-SE' },
        { name: 'Microsoft Mattias Online (Natural) - Swedish (Sweden)', lang: 'sv-SE' },
        { name: 'Google svenska', lang: 'sv-SE' },
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

    mockAudioPlay = vi.fn().mockResolvedValue(undefined);
    (global as any).Audio = vi.fn().mockImplementation((url: string) => {
      const audioObj: any = {
        src: url,
        playbackRate: 1,
        volume: 1,
        play: mockAudioPlay,
        onplay: null,
        onended: null,
        onerror: null,
      };
      return audioObj;
    });
  });

  describe('sanitizeForSpeech', () => {
    it('converts slashes with spaces to natural pauses "... "', () => {
      expect(sanitizeForSpeech('ett hus / huset')).toBe('ett hus ... huset');
    });

    it('converts slashes without spaces to natural pauses "... "', () => {
      expect(sanitizeForSpeech('en/ett')).toBe('en ... ett');
    });

    it('converts multiple slashes into natural pauses', () => {
      expect(sanitizeForSpeech('sin / sitt / sina')).toBe('sin ... sitt ... sina');
    });

    it('removes brackets while keeping enclosed content', () => {
      expect(sanitizeForSpeech('(en) hund')).toBe('en hund');
      expect(sanitizeForSpeech('[ett] hus')).toBe('ett hus');
    });

    it('removes quotes and non-speech symbols', () => {
      expect(sanitizeForSpeech('"tack" #1')).toBe('tack 1');
    });

    it('handles empty string gracefully', () => {
      expect(sanitizeForSpeech('')).toBe('');
    });
  });

  describe('Neural/Natural AI Voice Selection', () => {
    it('prioritizes Microsoft Sofie Neural voice over other voices', () => {
      const voices = [
        { name: 'Alva', lang: 'sv-SE' },
        { name: 'Google svenska', lang: 'sv-SE' },
        { name: 'Microsoft Sofie Online (Natural) - Swedish (Sweden)', lang: 'sv-SE' },
        { name: 'Microsoft Mattias Online (Natural) - Swedish (Sweden)', lang: 'sv-SE' },
      ] as any[];

      const selected = getPreferredSwedishVoice(voices);
      expect(selected?.name).toBe('Microsoft Sofie Online (Natural) - Swedish (Sweden)');
    });

    it('prioritizes Microsoft Mattias Neural when Sofie is unavailable', () => {
      const voices = [
        { name: 'Alva', lang: 'sv-SE' },
        { name: 'Google svenska', lang: 'sv-SE' },
        { name: 'Microsoft Mattias Online (Natural) - Swedish (Sweden)', lang: 'sv-SE' },
      ] as any[];

      const selected = getPreferredSwedishVoice(voices);
      expect(selected?.name).toBe('Microsoft Mattias Online (Natural) - Swedish (Sweden)');
    });

    it('prioritizes Google svenska over basic legacy voices', () => {
      const voices = [
        { name: 'Alva', lang: 'sv-SE' },
        { name: 'Google svenska', lang: 'sv-SE' },
      ] as any[];

      const selected = getPreferredSwedishVoice(voices);
      expect(selected?.name).toBe('Google svenska');
    });

    it('selects requested voice name if explicitly passed', () => {
      const voices = [
        { name: 'Alva', lang: 'sv-SE' },
        { name: 'Microsoft Sofie Online (Natural) - Swedish (Sweden)', lang: 'sv-SE' },
      ] as any[];

      const selected = getPreferredSwedishVoice(voices, 'Alva');
      expect(selected?.name).toBe('Alva');
    });

    it('returns null if no Swedish voices exist', () => {
      const voices = [{ name: 'David', lang: 'en-US' }] as any[];
      expect(getPreferredSwedishVoice(voices)).toBeNull();
    });
  });

  describe('AudioService Functionality & Fallback', () => {
    it('detects Web Speech API support', () => {
      const audio = new AudioService();
      expect(audio.isSupported()).toBe(true);
    });

    it('sets and gets speech rate speed multiplier', () => {
      const audio = new AudioService();
      audio.setRate(1.25);
      expect(audio.getRate()).toBe(1.25);

      audio.setRate(3.0);
      expect(audio.getRate()).toBe(2.0);

      audio.setRate(0.1);
      expect(audio.getRate()).toBe(0.5);
    });

    it('speaks text using sanitized string and best available voice', async () => {
      const audio = new AudioService();
      await audio.speak('ett hus / huset');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const lastCallArg = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(lastCallArg.text).toBe('ett hus ... huset');
      expect(lastCallArg.voice.name).toBe('Microsoft Sofie Online (Natural) - Swedish (Sweden)');
    });

    it('attempts to play pre-rendered audio when audioUrl is provided', async () => {
      const audio = new AudioService();
      const playPromise = audio.speak('Hej', { audioUrl: 'https://example.com/audio.mp3' });
      expect((global as any).Audio).toHaveBeenCalledWith('https://example.com/audio.mp3');

      // Simulate audio end
      const audioInst = ((global as any).Audio as any).mock.results[0].value;
      if (audioInst.onended) audioInst.onended();

      await playPromise;
    });

    it('falls back seamlessly to Web Speech Synthesis if audioUrl fails', async () => {
      mockAudioPlay.mockRejectedValueOnce(new Error('Audio playback failed'));

      const audio = new AudioService();
      await audio.speak('tack / var så god', { audioUrl: 'https://example.com/invalid.mp3' });

      // HTML Audio was created, but failed, causing fallback to Web Speech Synthesis
      expect((global as any).Audio).toHaveBeenCalledWith('https://example.com/invalid.mp3');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const lastCallArg = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(lastCallArg.text).toBe('tack ... var så god');
    });

    it('stops ongoing speech and audio', () => {
      const audio = new AudioService();
      audio.stop();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });
});
