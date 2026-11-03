import { useState, useEffect, useCallback } from 'react';
import { macroSpeech, SpeechState, PlayAnalysisSpeechOptions } from '../utils/speechSynthesis';

export function useMacroSpeech() {
  const [speechState, setSpeechState] = useState<SpeechState>(() => macroSpeech.getState());

  useEffect(() => {
    const unsubscribe = macroSpeech.subscribe((newState) => {
      setSpeechState({ ...newState });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const playAnalysis = useCallback((options: PlayAnalysisSpeechOptions) => {
    macroSpeech.playAnalysis(options);
  }, []);

  const pause = useCallback(() => {
    macroSpeech.pause();
  }, []);

  const resume = useCallback(() => {
    macroSpeech.resume();
  }, []);

  const stop = useCallback(() => {
    macroSpeech.stop();
  }, []);

  const setRate = useCallback((rate: number) => {
    macroSpeech.setRate(rate);
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    macroSpeech.setVoice(voice);
  }, []);

  const nextSentence = useCallback(() => {
    macroSpeech.nextSentence();
  }, []);

  const previousSentence = useCallback(() => {
    macroSpeech.previousSentence();
  }, []);

  return {
    ...speechState,
    playAnalysis,
    pause,
    resume,
    stop,
    setRate,
    setVoice,
    nextSentence,
    previousSentence,
  };
}
