import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechRecognitionOptions {
  initialLanguage?: string;
  onTranscriptChange?: (transcript: string, isFinal: boolean) => void;
  onFinalResult?: (finalText: string) => void;
}

export function useSpeechRecognition({
  initialLanguage = 'vi-VN',
  onTranscriptChange,
  onFinalResult,
}: UseSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onFinalResultRef = useRef(onFinalResult);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
    onFinalResultRef.current = onFinalResult;
  }, [onTranscriptChange, onFinalResult]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Speech recognition stop error:', err);
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (customLang?: string) => {
      if (typeof window === 'undefined') return;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setErrorMessage('Trình duyệt của bạn không hỗ trợ Web Speech Recognition API.');
        return;
      }

      // Stop any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      setErrorMessage(null);
      isManuallyStoppedRef.current = false;

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = customLang || language;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const text = res[0]?.transcript || '';
            if (res.isFinal) {
              currentFinal += text;
            } else {
              currentInterim += text;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => {
              const updated = prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim();
              onFinalResultRef.current?.(updated);
              onTranscriptChangeRef.current?.(updated, true);
              return updated;
            });
            setInterimTranscript('');
          } else {
            setInterimTranscript(currentInterim);
            onTranscriptChangeRef.current?.(currentInterim, false);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage('Quyền truy cập micro đã bị từ chối. Vui lòng cho phép micro trong cài đặt trình duyệt.');
            setIsListening(false);
          } else if (event.error === 'no-speech') {
            // Keep listening or allow user to speak
          } else if (event.error === 'network') {
            setErrorMessage('Lỗi kết nối mạng khi xử lý giọng nói.');
            setIsListening(false);
          } else if (event.error !== 'aborted') {
            setErrorMessage(`Lỗi nhận dạng giọng nói: ${event.error}`);
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          // If not manually stopped, keep listening if continuous, or finish
          if (isManuallyStoppedRef.current) {
            setIsListening(false);
          } else {
            // Check if we should auto-restart or stop
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setErrorMessage(err.message || 'Không thể khởi động nhận dạng giọng nói.');
        setIsListening(false);
      }
    },
    [language]
  );

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    language,
    setLanguage,
    startListening,
    stopListening,
    resetTranscript,
    errorMessage,
  };
}
