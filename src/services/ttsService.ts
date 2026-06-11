import axios from 'axios';
import { resolvePromptVariables } from '../features/ivr-flow/utils/resolveVariables';
import { useCallStore } from '../stores/useCallStore';

class TtsService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStopCallback: (() => void) | null = null;

  /**
   * Synthesize text to speech.
   * First attempts to consume the backend API /ivr/tts.
   * If it fails/offline, falls back to browser-native speechSynthesis.
   * 
   * @param text The voice prompt text (can contain variables like {{customer.name}})
   * @param language 'es' or 'en'
   * @param onLoading Called when processing/fetching starts
   * @param onPlay Called when audio playback actually starts
   * @param onStop Called when playback is stopped, completed, or failed
   */
  public async play(
    text: string,
    language: string,
    onLoading: () => void,
    onPlay: () => void,
    onStop: () => void
  ): Promise<void> {
    // 1. Stop any currently playing audio/synthesis
    this.stop();

    this.onStopCallback = onStop;
    onLoading();

    const cachedCall = useCallStore.getState().cachedCall;
    const resolvedPrompt = resolvePromptVariables(text, cachedCall);

    try {
      // 2. Consume AWS Polly / Google TTS API via backend
      const response = await axios.post(
        '/api/ivr/tts',
        {
          text: resolvedPrompt,
          language: language === 'es' ? 'es-ES' : 'en-US',
        },
        {
          headers: {
            'X-API-KEY': 'voicepay-secret-key-2024',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}`,
          },
          responseType: 'blob',
        }
      );

      // Create object URL from audio Blob
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.oncanplaythrough = () => {
        // Ensure this is still the active audio task
        if (this.currentAudio === audio) {
          onPlay();
          audio.play().catch((err) => {
            console.error('Audio playback failed:', err);
            this.stop();
          });
        }
      };

      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.stop();
        }
      };

      audio.onerror = () => {
        if (this.currentAudio === audio) {
          this.stop();
        }
      };
    } catch (error) {
      console.warn('Backend TTS API not available, falling back to local SpeechSynthesis', error);

      // Simulate network & API processing latency (e.g. 1000ms)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // If playback was cancelled during the simulated delay, return
      if (this.onStopCallback !== onStop) {
        return;
      }

      if (!('speechSynthesis' in window)) {
        console.error('Web Speech API is not supported in this browser.');
        this.stop();
        return;
      }

      // Initialize browser speech synthesis utterance
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(resolvedPrompt);
      this.currentUtterance = utterance;

      const voiceLang = language === 'es' ? 'es-ES' : 'en-US';
      utterance.lang = voiceLang;

      // Find matching browser voice
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(voiceLang.toLowerCase()) ||
          v.lang.toLowerCase().includes(language.toLowerCase())
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (this.currentUtterance === utterance) {
          onPlay();
        }
      };

      utterance.onend = () => {
        if (this.currentUtterance === utterance) {
          this.stop();
        }
      };

      utterance.onerror = () => {
        if (this.currentUtterance === utterance) {
          this.stop();
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Stop any active audio playback or speech synthesis and reset callbacks.
   */
  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.currentUtterance) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      this.currentUtterance = null;
    }
    if (this.onStopCallback) {
      const callback = this.onStopCallback;
      this.onStopCallback = null;
      // Defer callback execution to avoid updating React state synchronously within effects
      setTimeout(callback, 0);
    }
  }
}

export const ttsService = new TtsService();
