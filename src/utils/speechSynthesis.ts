/**
 * Web Speech API Controller for Macro Analyst Copilot
 * Provides speech synthesis to read aloud comparative macroeconomic analyses.
 * Handles sentence-by-sentence queueing to prevent browser 15s timeout bugs,
 * voice selection, rate adjustments, pause/resume, and real-time state tracking.
 */

export interface SpeechState {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  currentSentenceIndex: number;
  totalSentences: number;
  currentSentenceText: string;
  rate: number;
  selectedVoiceName: string | null;
  availableVoices: SpeechSynthesisVoice[];
  activeMessageId: string | null;
}

export interface PlayAnalysisSpeechOptions {
  messageId: string;
  scenarioTitle: string;
  entityAName: string;
  entityBName: string;
  executiveThesis: string[];
  keyMechanisms?: Array<{
    title: string;
    entityAResponse: string;
    entityBResponse: string;
    divergenceFactor: string;
  }>;
  policyRecommendations?: {
    entityA: string;
    entityB: string;
  };
  rate?: number;
  voiceName?: string | null;
  preferredLang?: string; // 'vi-VN' or 'en-US'
  onStateChange?: (state: Partial<SpeechState>) => void;
}

/**
 * Strips markdown symbols, asterisks, brackets, and code-like formatting
 * so that synthesis reads smooth, natural language.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text** -> text
    .replace(/\*(.*?)\*/g, '$1') // Italic *text* -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Markdown links [text](url) -> text
    .replace(/#{1,6}\s+/g, '') // Headings # -> empty
    .replace(/`{1,3}.*?`{1,3}/gs, '') // Code blocks -> empty
    .replace(/[•\-\*]\s+/g, '') // Bullet symbols
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\$(\d+(?:\.\d+)?)\s*B/gi, '$1 billion dollars') // $3890B -> 3890 billion dollars
    .replace(/\$(\d+(?:\.\d+)?)\s*T/gi, '$1 trillion dollars') // $3.8T -> 3.8 trillion dollars
    .replace(/\$(\d+(?:\.\d+)?)\s*k/gi, '$1 thousand dollars') // $45k -> 45 thousand dollars
    .replace(/bps/gi, 'basis points')
    .replace(/CAGR/gi, 'compound annual growth rate')
    .replace(/GDP/gi, 'G D P')
    .replace(/CPI/gi, 'C P I')
    .replace(/HDI/gi, 'H D I')
    .trim();
}

/**
 * Splits text into individual sentences for clean utterance streaming.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  // Split on punctuation followed by whitespace or line break
  const rawSentences = text.split(/(?<=[.?!;:\n])\s+/);
  return rawSentences
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && /[a-zA-Z0-9\u00C0-\u1EF9]/.test(s));
}

class MacroSpeechController {
  private utteranceQueue: string[] = [];
  private currentIndex = 0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeMessageId: string | null = null;
  private currentRate = 1.0;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isPaused = false;
  private isSpeaking = false;
  private listeners: Array<(state: SpeechState) => void> = [];
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.updateVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.updateVoices();
      };
    }
  }

  private updateVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.cachedVoices = window.speechSynthesis.getVoices();
    this.notify();
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    return this.cachedVoices;
  }

  public getState(): SpeechState {
    return {
      isSupported: this.isSupported(),
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      currentSentenceIndex: this.currentIndex,
      totalSentences: this.utteranceQueue.length,
      currentSentenceText: this.utteranceQueue[this.currentIndex] || '',
      rate: this.currentRate,
      selectedVoiceName: this.selectedVoice?.name || null,
      availableVoices: this.cachedVoices,
      activeMessageId: this.activeMessageId,
    };
  }

  public subscribe(listener: (state: SpeechState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  /**
   * Finds the best voice for the text language.
   * Prioritizes high quality / natural voices, checking for Vietnamese if requested.
   */
  public findBestVoice(preferredLang: string = 'auto', voiceName?: string | null): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    if (voiceName) {
      const match = voices.find((v) => v.name === voiceName);
      if (match) return match;
    }

    if (preferredLang.startsWith('vi') || preferredLang === 'vi-VN') {
      const viVoice = voices.find((v) => v.lang.toLowerCase().includes('vi'));
      if (viVoice) return viVoice;
    }

    // Default to natural English voices
    const preferredEnglish = voices.find(
      (v) =>
        (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Jenny'))) ||
        v.default
    );

    return preferredEnglish || voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  }

  /**
   * Compiles the briefing text and starts playback sentence by sentence
   */
  public playAnalysis(options: PlayAnalysisSpeechOptions) {
    if (!this.isSupported()) return;

    this.stop(); // Stop any active playback

    const {
      messageId,
      scenarioTitle,
      entityAName,
      entityBName,
      executiveThesis,
      keyMechanisms,
      policyRecommendations,
      rate = 1.0,
      voiceName,
      preferredLang = 'auto',
    } = options;

    // Detect if content or preference is Vietnamese
    const sampleText = `${scenarioTitle} ${executiveThesis.join(' ')}`;
    const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(sampleText);
    const langToUse = preferredLang !== 'auto' ? preferredLang : hasVietnameseChars ? 'vi-VN' : 'en-US';

    this.selectedVoice = this.findBestVoice(langToUse, voiceName);
    this.currentRate = rate;
    this.activeMessageId = messageId;

    // Build the narrative sections
    const scriptParts: string[] = [];

    if (langToUse.startsWith('vi')) {
      scriptParts.push(`Tóm tắt phân tích kinh tế vĩ mô: ${cleanTextForSpeech(scenarioTitle)}.`);
      scriptParts.push(`So sánh giữa ${entityAName} và ${entityBName}.`);
    } else {
      scriptParts.push(`Macroeconomic Intelligence Briefing: ${cleanTextForSpeech(scenarioTitle)}.`);
      scriptParts.push(`Comparative analysis between ${entityAName} and ${entityBName}.`);
    }

    // Add Executive Thesis paragraphs
    executiveThesis.forEach((para) => {
      scriptParts.push(cleanTextForSpeech(para));
    });

    // Add Key Transmission Mechanisms if available
    if (keyMechanisms && keyMechanisms.length > 0) {
      if (langToUse.startsWith('vi')) {
        scriptParts.push('Các kênh truyền dẫn và phân hóa cấu trúc chính:');
        keyMechanisms.slice(0, 3).forEach((m) => {
          scriptParts.push(
            `Kênh ${cleanTextForSpeech(m.title)}: ${entityAName} ${cleanTextForSpeech(m.entityAResponse)}. ${entityBName} ${cleanTextForSpeech(m.entityBResponse)}.`
          );
        });
      } else {
        scriptParts.push('Key transmission channels and structural divergence factors:');
        keyMechanisms.slice(0, 3).forEach((m) => {
          scriptParts.push(
            `Channel ${cleanTextForSpeech(m.title)}: For ${entityAName}, ${cleanTextForSpeech(m.entityAResponse)}. For ${entityBName}, ${cleanTextForSpeech(m.entityBResponse)}.`
          );
        });
      }
    }

    // Add Policy Recommendations if available
    if (policyRecommendations) {
      if (langToUse.startsWith('vi')) {
        scriptParts.push(
          `Khuyến nghị chính sách: Đối với ${entityAName}, ${cleanTextForSpeech(policyRecommendations.entityA)}. Đối với ${entityBName}, ${cleanTextForSpeech(policyRecommendations.entityB)}.`
        );
      } else {
        scriptParts.push(
          `Policy recommendations: For ${entityAName}, ${cleanTextForSpeech(policyRecommendations.entityA)}. For ${entityBName}, ${cleanTextForSpeech(policyRecommendations.entityB)}.`
        );
      }
    }

    // Chunk into sentences
    const fullText = scriptParts.join(' ');
    this.utteranceQueue = splitIntoSentences(fullText);
    this.currentIndex = 0;
    this.isSpeaking = true;
    this.isPaused = false;

    this.notify();
    this.speakCurrentSentence();
  }

  private speakCurrentSentence() {
    if (!this.isSupported() || this.currentIndex >= this.utteranceQueue.length) {
      this.stop();
      return;
    }

    const sentence = this.utteranceQueue[this.currentIndex];
    const utterance = new SpeechSynthesisUtterance(sentence);

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
      utterance.lang = this.selectedVoice.lang;
    }
    utterance.rate = this.currentRate;

    utterance.onend = () => {
      if (!this.isSpeaking) return;
      this.currentIndex += 1;
      this.notify();
      if (this.currentIndex < this.utteranceQueue.length) {
        this.speakCurrentSentence();
      } else {
        this.stop();
      }
    };

    utterance.onerror = (e) => {
      // Ignore user cancellation errors
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      console.warn('Speech synthesis utterance error:', e);
      this.currentIndex += 1;
      if (this.currentIndex < this.utteranceQueue.length) {
        this.speakCurrentSentence();
      } else {
        this.stop();
      }
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    this.notify();
  }

  public pause() {
    if (!this.isSupported() || !this.isSpeaking) return;
    window.speechSynthesis.pause();
    this.isPaused = true;
    this.notify();
  }

  public resume() {
    if (!this.isSupported() || !this.isSpeaking) return;
    window.speechSynthesis.resume();
    this.isPaused = false;
    this.notify();
  }

  public stop() {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.utteranceQueue = [];
    this.currentUtterance = null;
    this.activeMessageId = null;
    this.notify();
  }

  public setRate(rate: number) {
    this.currentRate = rate;
    this.notify();
    // If currently speaking, restart current sentence with the new rate
    if (this.isSpeaking && !this.isPaused) {
      window.speechSynthesis.cancel();
      this.speakCurrentSentence();
    }
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
    this.notify();
    if (this.isSpeaking && !this.isPaused) {
      window.speechSynthesis.cancel();
      this.speakCurrentSentence();
    }
  }

  public nextSentence() {
    if (!this.isSpeaking || this.currentIndex >= this.utteranceQueue.length - 1) return;
    window.speechSynthesis.cancel();
    this.currentIndex += 1;
    this.speakCurrentSentence();
  }

  public previousSentence() {
    if (!this.isSpeaking || this.currentIndex <= 0) return;
    window.speechSynthesis.cancel();
    this.currentIndex = Math.max(0, this.currentIndex - 1);
    this.speakCurrentSentence();
  }
}

// Global singleton instance for audio playback across the application
export const macroSpeech = new MacroSpeechController();
