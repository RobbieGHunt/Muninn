export interface AudioOptions {
  rate?: number; // 0.5 to 2.0 (default 1.0)
  pitch?: number; // 0.5 to 1.5 (default 1.0)
  volume?: number; // 0.0 to 1.0 (default 1.0)
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent | string) => void;
}

/**
 * Sanitizes Swedish vocabulary strings prior to speech synthesis.
 * Converts slashes ('/') to natural speech pauses ('... ') so the engine
 * never pronounces slashes as 'streck' or 'snedstreck'.
 */
export function sanitizeTextForSpeech(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // 1. Remove raw IPA phonetics if enclosed in /.../ containing non-ASCII IPA symbols
  sanitized = sanitized.replace(/\/[a-zɑ-ʒʊɵʏøɛæœɧɕŋːˈ\s/]+\//gi, '');

  // 2. Remove parenthetical annotations (e.g., "(en-ord)", "(ett-ord)", "(subject)", "(spoken 'dom')")
  sanitized = sanitized.replace(/\s*\([^)]*\)/g, '');
  sanitized = sanitized.replace(/\s*\[[^\]]*\]/g, '');

  // 3. Convert slash '/' between paired words into natural prosodic pauses "..."
  // Handled cases: "jag / mig", "du / dig", "en / ett", "sin / sitt / sina", "ett arbete / ett jobb", "ska/skola", etc.
  sanitized = sanitized.replace(/(\w+)\s*\/\s*(\w+)/g, '$1... $2');
  // Second pass for triple-slashes e.g. "sin / sitt / sina" => "sin... sitt... sina"
  sanitized = sanitized.replace(/\s*\/\s*/g, '... ');

  // 4. Convert common symbols to spoken Swedish equivalents
  sanitized = sanitized.replace(/\s*&\s*/g, ' och ');

  // 5. Clean up redundant ellipsis spaces, leading/trailing punctuation except final sentence enders
  sanitized = sanitized.replace(/\.{4,}/g, '...');
  sanitized = sanitized.replace(/\s*\.\.\.\s*/g, '... ');

  // 6. Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

export class AudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
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
   * Sanitizes input text before sending to speech synthesis engine.
   */
  public sanitizeText(text: string): string {
    return sanitizeTextForSpeech(text);
  }

  /**
   * Stops any current ongoing audio speech synthesis.
   */
  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pauses current audio playback.
   */
  public pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * Resumes paused audio playback.
   */
  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Speaks Swedish text using Web Speech Synthesis with Rikssvenska sanitization.
   */
  public speak(text: string, options: AudioOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported() || !this.synth) {
        const errorMsg = 'Web Speech API is not supported in this browser environment.';
        if (options.onError) options.onError(errorMsg);
        return reject(new Error(errorMsg));
      }

      // Stop previous utterance
      this.stop();

      const sanitizedText = this.sanitizeText(text);
      if (!sanitizedText) {
        if (options.onEnd) options.onEnd();
        return resolve();
      }

      const utterance = new SpeechSynthesisUtterance(sanitizedText);
      utterance.lang = 'sv-SE';
      utterance.rate = options.rate !== undefined ? options.rate : this.defaultRate;
      utterance.pitch = options.pitch !== undefined ? options.pitch : 1.0;
      utterance.volume = options.volume !== undefined ? options.volume : 1.0;

      // Voice selection
      const swedishVoices = this.getSwedishVoices();
      if (options.voiceName) {
        const matchingVoice = this.voices.find((v) => v.name === options.voiceName);
        if (matchingVoice) utterance.voice = matchingVoice;
      } else if (swedishVoices.length > 0) {
        // Pick preferred sv-SE voice if available
        const preferredVoice =
          swedishVoices.find(
            (v) => v.lang === 'sv-SE' || v.name.includes('Alva') || v.name.includes('Klarafono')
          ) || swedishVoices[0];
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        if (options.onStart) options.onStart();
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
    });
  }
}

export const audioService = new AudioService();
