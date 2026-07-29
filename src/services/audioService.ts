export interface AudioOptions {
  rate?: number; // 0.5 to 2.0 (default 1.0)
  pitch?: number; // 0.5 to 1.5 (default 1.0)
  volume?: number; // 0.0 to 1.0 (default 1.0)
  voiceName?: string;
  audioUrl?: string; // Pre-rendered audio URL/path
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent | Event | string) => void;
}

/**
 * Sanitizes Swedish text for speech synthesis:
 * - Converts '/' (and '\', '|') to natural pauses ('... ... ') so slash is never pronounced as 'streck' or 'snedstreck'.
 * - Cleans non-speech symbols while preserving Swedish letters (å, ä, ö, etc.) and basic punctuation.
 */
export function sanitizeForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Replace slashes, backslashes, and vertical bars with a longer natural pause indicator ' ... ... '
    .replace(/\s*[\/\\]+\s*/g, ' ... ... ')
    .replace(/\s*\|\s*/g, ' ... ... ')
    // Remove brackets/parentheses characters while retaining text inside
    .replace(/[\(\)\[\]\{\}]/g, ' ')
    // Remove special non-speech symbols that TTS engines read out loud
    .replace(/["'“”«»#$%\*+=\<\>~@_^]/g, ' ')
    // Clean up multiple dots or spaces (preserving the intentional '... ' pauses)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Selects the highest quality available Swedish voice based on a preference hierarchy:
 * 1. Microsoft Sofie Neural
 * 2. Microsoft Mattias Neural
 * 3. Other Neural / Natural AI Swedish voices
 * 4. Google svenska
 * 5. Standard Swedish voices (Alva, Klarafono, Oskar, etc.)
 */
export function getPreferredSwedishVoice(
  voices: SpeechSynthesisVoice[],
  requestedVoiceName?: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  if (requestedVoiceName) {
    const exactMatch = voices.find((v) => v.name === requestedVoiceName);
    if (exactMatch) return exactMatch;
    const partialMatch = voices.find((v) =>
      v.name.toLowerCase().includes(requestedVoiceName.toLowerCase())
    );
    if (partialMatch) return partialMatch;
  }

  const swedishVoices = voices.filter(
    (v) => v.lang.toLowerCase().startsWith('sv') || v.lang.toLowerCase().includes('sv')
  );

  if (swedishVoices.length === 0) return null;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    const isNeural = name.includes('neural') || name.includes('natural') || name.includes('online');

    if (name.includes('sofie') && isNeural) return 100;
    if (name.includes('mattias') && isNeural) return 90;
    if (name.includes('sofie')) return 85;
    if (name.includes('mattias')) return 80;
    if (isNeural) return 75;
    if (name.includes('google') && (name.includes('svenska') || v.lang.toLowerCase().includes('sv'))) return 70;
    if (name.includes('alva') || name.includes('klarafono') || name.includes('oskar')) return 60;
    if (v.lang.toLowerCase() === 'sv-se') return 50;
    return 10;
  };

  return swedishVoices.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || swedishVoices[0];
}

export class AudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private defaultRate: number = 1.0;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth && typeof this.synth.onvoiceschanged !== 'undefined') {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  /**
   * Loads and caches available speech synthesis voices.
   */
  private loadVoices(): void {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  /**
   * Returns true if Web Speech API is supported in the current environment.
   */
  public isSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Returns available Swedish (sv-SE / sv) voices.
   */
  public getSwedishVoices(): SpeechSynthesisVoice[] {
    this.loadVoices();
    return this.voices.filter(
      (v) => v.lang.toLowerCase().includes('sv') || v.lang.toLowerCase().includes('se')
    );
  }

  /**
   * Returns the best available Swedish voice based on Neural/Natural AI hierarchy.
   */
  public getBestSwedishVoice(requestedVoiceName?: string): SpeechSynthesisVoice | null {
    this.loadVoices();
    return getPreferredSwedishVoice(this.voices, requestedVoiceName);
  }

  /**
   * Helper function exposed on the class instance.
   */
  public sanitizeForSpeech(text: string): string {
    return sanitizeForSpeech(text);
  }

  /**
   * Sets default speech rate (e.g. 0.8 for slower pronunciation practice, 1.0 for standard speed).
   */
  public setRate(rate: number): void {
    this.defaultRate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * Gets current default speech rate.
   */
  public getRate(): number {
    return this.defaultRate;
  }

  /**
   * Stops any current ongoing audio playback (both HTML Audio and Web Speech Synthesis).
   */
  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pauses current audio playback.
   */
  public pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * Resumes paused audio playback.
   */
  public resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(() => {});
    }
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Speaks text or plays audio. If audioUrl is provided, attempts pre-rendered audio playback
   * with seamless fallback to Web Speech Synthesis using sanitized text.
   */
  public speak(text: string, options: AudioOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stop();

      const sanitized = sanitizeForSpeech(text);

      if (options.audioUrl && typeof Audio !== 'undefined') {
        const audio = new Audio(options.audioUrl);
        const rate = options.rate !== undefined ? options.rate : this.defaultRate;
        audio.playbackRate = rate;
        audio.volume = options.volume !== undefined ? options.volume : 1.0;

        let hasStarted = false;

        audio.onplay = () => {
          hasStarted = true;
          if (options.onStart) options.onStart();
        };

        audio.onended = () => {
          this.currentAudio = null;
          if (options.onEnd) options.onEnd();
          resolve();
        };

        const handleAudioError = (_errEvent: Event | string) => {
          this.currentAudio = null;
          // Fall back seamlessly to Web Speech Synthesis
          this.speakUtterance(sanitized, options, resolve, reject, hasStarted);
        };

        audio.onerror = (e) => handleAudioError(e);

        this.currentAudio = audio;

        audio.play().catch((err) => {
          handleAudioError(err);
        });
        return;
      }

      this.speakUtterance(sanitized, options, resolve, reject, false);
    });
  }

  /**
   * Internal helper to execute SpeechSynthesisUtterance playback.
   */
  private speakUtterance(
    text: string,
    options: AudioOptions,
    resolve: () => void,
    reject: (reason?: any) => void,
    alreadyTriggeredStart: boolean = false
  ): void {
    if (!this.isSupported() || !this.synth) {
      const errorMsg = 'Web Speech API is not supported in this browser environment.';
      if (options.onError) options.onError(errorMsg);
      return reject(new Error(errorMsg));
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'sv-SE';
    utterance.rate = options.rate !== undefined ? options.rate : this.defaultRate;
    utterance.pitch = options.pitch !== undefined ? options.pitch : 1.0;
    utterance.volume = options.volume !== undefined ? options.volume : 1.0;

    // Neural/Natural AI Voice selection
    this.loadVoices();
    const selectedVoice = getPreferredSwedishVoice(this.voices, options.voiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      if (!alreadyTriggeredStart && options.onStart) {
        options.onStart();
      }
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (options.onEnd) options.onEnd();
      resolve();
    };

    utterance.onerror = (event) => {
      this.currentUtterance = null;
      if (options.onError) options.onError(event);
      reject(event);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }
}

export const audioService = new AudioService();
