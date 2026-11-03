import { useState, useCallback, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  Printer,
  RotateCcw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldAlert,
  Compass,
  Zap,
  MessageSquare,
  BarChart2,
  LineChart,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Headphones,
  Mic,
  MicOff,
  Languages,
} from 'lucide-react';
import {
  EconomicEntity,
  CopilotScenarioPreset,
  CopilotAnalysisResult,
  CopilotIndicatorProjection,
  CopilotChatMessage,
} from '../types';
import { COPILOT_SCENARIO_PRESETS, QUICK_PROMPT_SUGGESTIONS } from '../data/copilotPresets';
import { MacroMiniSparkline } from './MacroMiniSparkline';
import { MacroSentimentGauge } from './MacroSentimentGauge';
import {
  detectDiscussedIndicators,
  parseParagraphWithIndicators,
} from '../utils/indicatorDetection';
import { HistoricalMetricKey, HISTORICAL_METRIC_SPECS } from '../data/historicalExtendedData';
import { useMacroSpeech } from '../hooks/useMacroSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface MacroAnalystCopilotProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

export function MacroAnalystCopilot({ entityA, entityB }: MacroAnalystCopilotProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('stagflation-energy');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Chat message history
  const [messages, setMessages] = useState<CopilotChatMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Active highlighted indicator (if clicked from inline sparkline)
  const [focusedMetric, setFocusedMetric] = useState<HistoricalMetricKey | null>(null);

  // Web Speech API hook for reading aloud AI comparative analyses
  const {
    isSupported: isSpeechSupported,
    isSpeaking,
    isPaused,
    currentSentenceIndex,
    totalSentences,
    currentSentenceText,
    rate: speechRate,
    activeMessageId,
    playAnalysis,
    pause: pauseSpeech,
    resume: resumeSpeech,
    stop: stopSpeech,
    setRate: setSpeechRate,
  } = useMacroSpeech();

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  // Web Speech API hook for Speech Recognition (Microphone voice input)
  const [speechInputLang, setSpeechInputLang] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const baseQueryBeforeSpeechRef = useRef<string>('');

  const {
    isSupported: isSpeechRecSupported,
    isListening,
    startListening,
    stopListening,
    errorMessage: speechRecError,
  } = useSpeechRecognition({
    initialLanguage: speechInputLang,
    onTranscriptChange: (text) => {
      const base = baseQueryBeforeSpeechRef.current;
      setCustomQuery(base ? `${base} ${text}` : text);
    },
    onFinalResult: (finalText) => {
      const base = baseQueryBeforeSpeechRef.current;
      setCustomQuery(base ? `${base} ${finalText}` : finalText);
    },
  });

  const handleToggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      // Pause TTS speech if it is currently reading out loud so user can speak clearly
      if (isSpeaking && !isPaused) {
        pauseSpeech();
      }
      baseQueryBeforeSpeechRef.current = customQuery.trim();
      startListening(speechInputLang);
    }
  }, [isListening, stopListening, isSpeaking, isPaused, pauseSpeech, customQuery, startListening, speechInputLang]);

  const toggleSpeechInputLang = useCallback(() => {
    const nextLang = speechInputLang === 'vi-VN' ? 'en-US' : 'vi-VN';
    setSpeechInputLang(nextLang);
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(nextLang), 150);
    }
  }, [speechInputLang, isListening, stopListening, startListening]);

  // Run analysis and append to conversational history
  const runAnalysis = useCallback(
    async (queryToRun?: string, presetIdToRun?: string) => {
      const activePreset = COPILOT_SCENARIO_PRESETS.find(
        (p) => p.id === (presetIdToRun || selectedPresetId)
      );
      const query =
        (queryToRun !== undefined ? queryToRun : customQuery).trim() ||
        activePreset?.promptTemplate ||
        'General comparative stress test';

      // Append user message immediately
      const userMsgId = `user-${Date.now()}`;
      const userMsg: CopilotChatMessage = {
        id: userMsgId,
        sender: 'user',
        text: query,
        scenarioTitle: activePreset?.title,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setCustomQuery('');
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/copilot/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityA,
            entityB,
            query,
            presetId: presetIdToRun || selectedPresetId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data: CopilotAnalysisResult = await response.json();

        // Detect all discussed metrics across the analysis
        const combinedText = [
          data.scenarioTitle,
          ...data.executiveThesis,
          ...data.keyTransmissionMechanisms.map((m) => `${m.title} ${m.entityAResponse} ${m.entityBResponse}`),
        ].join(' ');

        const detectedFromText = detectDiscussedIndicators(combinedText);
        const serverDetected = data.discussedMultiYearMetrics || [];
        const uniqueMetrics = Array.from(new Set([...detectedFromText, ...serverDetected]));

        const assistantMsg: CopilotChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.executiveThesis.join('\n\n'),
          scenarioTitle: data.scenarioTitle,
          analysisResult: data,
          discussedMetrics: uniqueMetrics,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        console.warn('Copilot analysis fetch failed:', err);
        setError('Failed to complete real-time macro analysis. Please retry.');
      } finally {
        setLoading(false);
      }
    },
    [entityA, entityB, customQuery, selectedPresetId]
  );

  // Initialize with default preset on mount or entity change
  useEffect(() => {
    stopSpeech();
    setMessages([]);
    runAnalysis(undefined, 'stagflation-energy');
  }, [entityA.id, entityB.id, stopSpeech]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 1) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSelectPreset = (preset: CopilotScenarioPreset) => {
    stopSpeech();
    setSelectedPresetId(preset.id);
    runAnalysis(preset.promptTemplate, preset.id);
  };

  const handleSelectSuggestion = (prompt: string) => {
    stopSpeech();
    setSelectedPresetId('');
    runAnalysis(prompt, undefined);
  };

  const handleCopyMessage = (msg: CopilotChatMessage) => {
    if (!msg.analysisResult) {
      navigator.clipboard.writeText(msg.text);
      return;
    }

    const res = msg.analysisResult;
    const text = [
      `MACROECONOMIC INTELLIGENCE DOSSIER: ${entityA.name} vs ${entityB.name}`,
      `SCENARIO: ${res.scenarioTitle}`,
      `SOURCE: ${res.source === 'gemini_3_8_flash' ? 'Gemini 3.8 Flash' : 'Macroeconomic Reference Engine'}`,
      '',
      'EXECUTIVE THESIS:',
      ...res.executiveThesis,
      '',
      'KEY TRANSMISSION MECHANISMS:',
      ...res.keyTransmissionMechanisms.map(
        (m) =>
          `• ${m.title}:\n  ${entityA.shortName}: ${m.entityAResponse}\n  ${entityB.shortName}: ${m.entityBResponse}\n  Divergence: ${m.divergenceFactor}`
      ),
      '',
      'POLICY RECOMMENDATIONS:',
      `• ${entityA.shortName}: ${res.policyRecommendations.entityA}`,
      `• ${entityB.shortName}: ${res.policyRecommendations.entityB}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 2200);
  };

  const handleClearChat = () => {
    stopSpeech();
    setMessages([]);
    runAnalysis(undefined, selectedPresetId || 'stagflation-energy');
  };

  const startSpeechForMessage = useCallback(
    (msg: CopilotChatMessage) => {
      const result = msg.analysisResult;
      const thesis = result?.executiveThesis || (msg.text ? [msg.text] : []);
      playAnalysis({
        messageId: msg.id,
        scenarioTitle: msg.scenarioTitle || result?.scenarioTitle || 'Macroeconomic Comparative Synthesis',
        entityAName: entityA.name,
        entityBName: entityB.name,
        executiveThesis: thesis,
        keyMechanisms: result?.keyTransmissionMechanisms,
        policyRecommendations: result?.policyRecommendations,
        rate: speechRate,
      });
    },
    [entityA.name, entityB.name, playAnalysis, speechRate]
  );

  const handleToggleSpeech = useCallback(
    (msg: CopilotChatMessage) => {
      if (activeMessageId === msg.id) {
        if (isSpeaking) {
          if (isPaused) {
            resumeSpeech();
          } else {
            pauseSpeech();
          }
        } else {
          startSpeechForMessage(msg);
        }
      } else {
        startSpeechForMessage(msg);
      }
    },
    [activeMessageId, isSpeaking, isPaused, resumeSpeech, pauseSpeech, startSpeechForMessage]
  );

  const handleCycleRate = useCallback(() => {
    const rates = [1.0, 1.25, 1.5, 0.8];
    const nextIdx = (rates.indexOf(speechRate) + 1) % rates.length;
    setSpeechRate(rates[nextIdx]);
  }, [speechRate, setSpeechRate]);

  const renderImpactBadge = (
    vector: CopilotIndicatorProjection['entityAProjection']['impactVector'],
    deltaBps: string
  ) => {
    const isNegative = vector === 'negative';
    const isPositive = vector === 'positive';
    const isVolatile = vector === 'volatile';

    return (
      <span
        className={`inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums ${
          isPositive
            ? 'text-emerald-700 dark:text-emerald-400'
            : isNegative
            ? 'text-rose-700 dark:text-rose-400'
            : isVolatile
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-slate-600 dark:text-slate-400'
        }`}
      >
        {isPositive && <TrendingUp className="w-3 h-3" />}
        {isNegative && <TrendingDown className="w-3 h-3" />}
        {isVolatile && <Activity className="w-3 h-3" />}
        <span>{deltaBps}</span>
      </span>
    );
  };

  /**
   * Renders a narrative paragraph with automatically injected inline mini-sparklines
   * immediately following the discussion of specific indicators.
   */
  const renderParagraphWithSparklines = (paragraph: string, paraIndex: number) => {
    const segments = parseParagraphWithIndicators(paragraph);

    return (
      <p key={paraIndex} className="leading-relaxed">
        {segments.map((seg, idx) => {
          if (seg.type === 'text') {
            return <span key={idx}>{seg.content}</span>;
          }

          if (seg.type === 'indicator' && seg.metricKey) {
            return (
              <span key={idx} className="inline-block">
                <span className="font-semibold text-slate-900 dark:text-slate-100 underline decoration-indigo-300 dark:decoration-indigo-700 decoration-dotted underline-offset-2">
                  {seg.content}
                </span>
                <MacroMiniSparkline
                  size="inline"
                  metricKey={seg.metricKey}
                  entityA={entityA}
                  entityB={entityB}
                  timeRange="10y"
                  onSelectMetric={(key) => setFocusedMetric(key)}
                />
              </span>
            );
          }

          return null;
        })}
      </p>
    );
  };

  return (
    <div className="space-y-6">
      {/* Copilot Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 shrink-0">
              <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>AI Macro Analyst Copilot</span>
                <span aria-hidden="true">·</span>
                <span>Gemini 3.8 Flash</span>
                <span aria-hidden="true">·</span>
                <span>Auto-Generated Mini-Sparklines</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
                Conversational Macroeconomic Intelligence & Sparkline Trends
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Interactively query comparative economic dynamics between{' '}
                <strong className="text-slate-900 dark:text-slate-200">{entityA.name}</strong> and{' '}
                <strong className="text-slate-900 dark:text-slate-200">{entityB.name}</strong>. Whenever the AI analyzes multi-year indicators, comparative mini-sparklines are automatically embedded into the narrative with scrubbable 10-year trajectories.
              </p>
            </div>
          </div>

          {/* Active Comparison Chip Bar */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl text-xs shrink-0 self-start lg:self-auto border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-2xs font-semibold text-slate-900 dark:text-white">
              <span>{entityA.flag}</span>
              <span>{entityA.shortName}</span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">(${Math.round(entityA.nominalGdp)}B)</span>
            </div>
            <span className="text-slate-400 font-bold">vs</span>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-2xs font-semibold text-slate-900 dark:text-white">
              <span>{entityB.flag}</span>
              <span>{entityB.shortName}</span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">(${Math.round(entityB.nominalGdp)}B)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Crisis Stress-Test Rail */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Macroeconomic Stress-Test Presets</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Launch a calibrated scenario to evaluate comparative resilience across fiscal, monetary, and trade channels.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Discussion</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {COPILOT_SCENARIO_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/50 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span className="capitalize">{preset.category.replace('_', ' ')}</span>
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      {preset.severityLabel}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {preset.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className={`font-semibold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {isSelected ? 'Active Scenario' : 'Run Scenario'}
                  </span>
                  <ArrowRight className={`w-3 h-3 ${isSelected ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5' : 'text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Focused Metric Highlight Banner (if user clicked any inline sparkline) */}
      {focusedMetric && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold uppercase tracking-wider">
              <LineChart className="w-4 h-4" />
              <span>Focused Multi-Year Indicator: {HISTORICAL_METRIC_SPECS[focusedMetric]?.label}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {HISTORICAL_METRIC_SPECS[focusedMetric]?.description}
            </p>
          </div>
          <button
            onClick={() => setFocusedMetric(null)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
          >
            Dismiss Focus
          </button>
        </div>
      )}

      {/* Conversational Stream & Intelligence Output */}
      <div className="space-y-6">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-xs p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-4 text-[10px] text-indigo-200 mb-1">
                    <span className="font-semibold">{msg.scenarioTitle || 'Custom Macro Inquiry'}</span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          }

          // Assistant Output with Embedded Mini-Sparklines
          const result = msg.analysisResult;
          const discussedMetrics = msg.discussedMetrics || [];

          return (
            <div key={msg.id} className="space-y-6 animate-in fade-in duration-200">
              {/* Main Analysis Dossier Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs">
                {/* Dossier Header & Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Macro Analysis Synthesis</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px]">
                        {result?.source === 'gemini_3_8_flash' ? 'Gemini 3.8 Flash Live Reasoning' : 'Curated Macro Model'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" />
                        <span>{discussedMetrics.length} Multi-Year Sparklines</span>
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                      {msg.scenarioTitle || result?.scenarioTitle || 'Comparative Intelligence Synthesis'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Nghe tóm tắt (Web Speech API) */}
                    {isSpeechSupported && (
                      activeMessageId === msg.id && (isSpeaking || isPaused) ? (
                        <div
                          id={`speech-player-active-${msg.id}`}
                          className="flex items-center gap-1.5 p-1 bg-indigo-50/90 dark:bg-indigo-950/80 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs shadow-2xs"
                        >
                          <button
                            type="button"
                            onClick={isPaused ? resumeSpeech : pauseSpeech}
                            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title={isPaused ? 'Tiếp tục đọc tóm tắt' : 'Tạm dừng đọc tóm tắt'}
                          >
                            {isPaused ? (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                <span>Tiếp tục</span>
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3 fill-current" />
                                <span>Tạm dừng</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={stopSpeech}
                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Dừng đọc tóm tắt"
                            aria-label="Dừng đọc"
                          >
                            <Square className="w-3 h-3 fill-current" />
                          </button>

                          {/* Animated Voice Equalizer */}
                          {!isPaused && isSpeaking && (
                            <div className="flex items-end gap-0.5 h-3 px-1" title="Đang đọc tóm tắt AI...">
                              <span className="w-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse h-full" />
                              <span className="w-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse h-2/3 delay-75" />
                              <span className="w-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse h-4/5 delay-150" />
                              <span className="w-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse h-1/2 delay-100" />
                            </div>
                          )}

                          {totalSentences > 0 && (
                            <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 px-1 font-semibold whitespace-nowrap">
                              {currentSentenceIndex + 1}/{totalSentences}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={handleCycleRate}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="Tốc độ đọc (1.0x, 1.25x, 1.5x, 0.8x)"
                          >
                            {speechRate}x
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`listen-summary-btn-${msg.id}`}
                          onClick={() => handleToggleSpeech(msg)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
                          title="Nghe đọc to phân tích so sánh AI (Web Speech API)"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                          <span>Nghe tóm tắt</span>
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Briefing</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {/* Active Speech Live Sentence Display */}
                {activeMessageId === msg.id && currentSentenceText && (
                  <div className="mb-5 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200 animate-in fade-in duration-150">
                    <Headphones className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 mb-0.5">
                        <span className="uppercase tracking-wider">
                          Đang đọc tóm tắt AI · Câu {currentSentenceIndex + 1}/{totalSentences}
                        </span>
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/80 font-bold">
                          {speechRate}x tốc độ
                        </span>
                      </div>
                      <p className="font-medium leading-relaxed italic text-slate-800 dark:text-slate-200">
                        "{currentSentenceText}"
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Macroeconomic Confidence Sentiment Gauge */}
                <div className="mb-6">
                  <MacroSentimentGauge
                    entityA={entityA}
                    entityB={entityB}
                    analysisResult={result}
                  />
                </div>

                {/* Executive Comparative Thesis with INLINE SPARKLINE GENERATION */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>Executive Comparative Thesis</span>
                      <span className="text-[10px] font-normal lowercase text-slate-400">(with interactive sparklines)</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {entityA.shortName} (Indigo) vs {entityB.shortName} (Emerald)
                    </span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {result?.executiveThesis ? (
                      result.executiveThesis.map((para, pIdx) => (
                        <div
                          key={pIdx}
                          className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80"
                        >
                          {renderParagraphWithSparklines(para, pIdx)}
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        {renderParagraphWithSparklines(msg.text, 0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* AUTOMATICALLY GENERATED MULTI-YEAR INDICATOR SPARKLINE CARDS PANEL */}
                {discussedMetrics.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <LineChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          Discussed Multi-Year Indicator Trends (10Y Trajectories)
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Hover across curves to scrub exact values
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {discussedMetrics.map((key) => (
                        <MacroMiniSparkline
                          key={key}
                          metricKey={key}
                          entityA={entityA}
                          entityB={entityB}
                          timeRange="10y"
                          size="compact"
                          className={focusedMetric === key ? 'ring-2 ring-indigo-500' : ''}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Key Transmission Mechanisms */}
              {result?.keyTransmissionMechanisms && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Transmission Channels & Structural Divergence Factors
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {result.keyTransmissionMechanisms.map((mech, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                      >
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                            {mech.title}
                          </h5>

                          <div className="space-y-2 text-xs">
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400 mb-0.5 text-[11px]">
                                <span>{entityA.flag}</span>
                                <span>{entityA.shortName}:</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                {mech.entityAResponse}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/60">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 mb-0.5 text-[11px]">
                                <span>{entityB.flag}</span>
                                <span>{entityB.shortName}:</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                {mech.entityBResponse}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                          <strong className="text-slate-700 dark:text-slate-300">Divergence: </strong>
                          {mech.divergenceFactor}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projected Indicator Impact Matrix */}
              {result?.projections && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Projected Indicator Impact Matrix
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Estimated 12–24 month macroeconomic parameter shifts from baseline values under this scenario.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 font-bold">Indicator</th>
                          <th className="py-2.5 font-bold text-indigo-700 dark:text-indigo-400">
                            {entityA.flag} {entityA.shortName} Baseline
                          </th>
                          <th className="py-2.5 font-bold text-indigo-700 dark:text-indigo-400">
                            {entityA.shortName} Projected
                          </th>
                          <th className="py-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                            {entityB.flag} {entityB.shortName} Baseline
                          </th>
                          <th className="py-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                            {entityB.shortName} Projected
                          </th>
                          <th className="py-2.5 font-bold text-slate-700 dark:text-slate-300">
                            Divergence Takeaway
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {result.projections.map((proj, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                            <td className="py-3 font-semibold text-slate-900 dark:text-white">
                              {proj.indicator}
                            </td>
                            <td className="py-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                              {proj.entityAProjection.baseline}
                            </td>
                            <td className="py-3 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5">
                                <span>{proj.entityAProjection.projectedShift}</span>
                                {renderImpactBadge(proj.entityAProjection.impactVector, proj.entityAProjection.deltaBps)}
                              </div>
                            </td>
                            <td className="py-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                              {proj.entityBProjection.baseline}
                            </td>
                            <td className="py-3 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5">
                                <span>{proj.entityBProjection.projectedShift}</span>
                                {renderImpactBadge(proj.entityBProjection.impactVector, proj.entityBProjection.deltaBps)}
                              </div>
                            </td>
                            <td className="py-3 text-[11px] text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
                              {proj.divergenceTakeaway}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Asymmetric Vulnerabilities & Policy Recommendations */}
              {result?.asymmetricVulnerabilities && result?.policyRecommendations && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Entity A Policy Panel */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                      <span className="text-xl">{entityA.flag}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {entityA.name} Structural Stance
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          Debt: {entityA.publicDebtToGdp}% of GDP · Output: ${Math.round(entityA.nominalGdp)}B
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Asymmetric Vulnerabilities</span>
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                          {result.asymmetricVulnerabilities.entityA.map((vuln, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-rose-500 mt-0.5">•</span>
                              <span>{vuln}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" />
                          <span>Recommended Policy Priority</span>
                        </h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                          {result.policyRecommendations.entityA}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Entity B Policy Panel */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                      <span className="text-xl">{entityB.flag}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {entityB.name} Structural Stance
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          Debt: {entityB.publicDebtToGdp}% of GDP · Output: ${Math.round(entityB.nominalGdp)}B
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Asymmetric Vulnerabilities</span>
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                          {result.asymmetricVulnerabilities.entityB.map((vuln, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-rose-500 mt-0.5">•</span>
                              <span>{vuln}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" />
                          <span>Recommended Policy Priority</span>
                        </h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                          {result.policyRecommendations.entityB}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center animate-in fade-in duration-200">
            <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2.5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Synthesizing Macro Analysis & Sparkline Trends</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Extracting multi-year historical indicators, computing transmission elasticities, and drawing comparative sparklines via Gemini 3.8 Flash...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => runAnalysis()}
              className="font-semibold underline hover:text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Persistent Follow-up Chat & Query Console */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-md">
        <label htmlFor="copilot-input" className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Ask a Follow-up Question or Define Shock Scenario</span>
          </span>
          <span className="text-[10px] font-normal text-slate-400">
            Mini-sparklines will automatically generate for discussed indicators
          </span>
        </label>

        <div className="relative">
          {/* Microphone Permission or Network Error Banner */}
          {speechRecError && (
            <div className="mb-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{speechRecError}</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleVoiceInput()}
                className="text-[11px] font-bold underline hover:text-rose-950 dark:hover:text-rose-100 ml-2 cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Active Listening Voice Pulse Indicator Strip */}
          {isListening && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/70 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-900 dark:text-rose-200 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <span className="font-semibold flex items-center gap-1.5">
                  <span>Đang nghe ({speechInputLang === 'vi-VN' ? 'Tiếng Việt' : 'English'})...</span>
                  <span className="text-[11px] text-rose-700 dark:text-rose-300 font-normal hidden sm:inline">
                    Hãy đặt câu hỏi so sánh kinh tế qua micro
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    if (customQuery.trim() && !loading) {
                      runAnalysis();
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Dừng thu âm và gửi câu hỏi ngay lập tức"
                >
                  <Send className="w-3 h-3" />
                  <span>Dừng & Gửi</span>
                </button>

                <button
                  type="button"
                  onClick={stopListening}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              id="copilot-input"
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (isListening) {
                    stopListening();
                  }
                  if (customQuery.trim() && !loading) {
                    runAnalysis();
                  }
                }
              }}
              placeholder={
                isListening
                  ? `Đang lắng nghe... câu hỏi của bạn sẽ tự động điền vào đây theo giọng nói.`
                  : `Đặt câu hỏi so sánh hoặc nói qua Micro (ví dụ: 'So sánh lạm phát và nợ công từ 2015 đến nay')...`
              }
              className={`flex-1 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent leading-relaxed transition-all ${
                isListening
                  ? 'border-rose-400 dark:border-rose-700 ring-2 ring-rose-200 dark:ring-rose-950/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            />

            {/* Language Switcher for Voice Input */}
            {isSpeechRecSupported && (
              <button
                type="button"
                onClick={toggleSpeechInputLang}
                className="px-2 py-2.5 rounded-xl text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                title={`Đổi ngôn ngữ micro: Hiện tại là ${speechInputLang === 'vi-VN' ? 'Tiếng Việt' : 'English'}. Bấm để đổi sang ${speechInputLang === 'vi-VN' ? 'English (en-US)' : 'Tiếng Việt (vi-VN)'}.`}
                aria-label="Toggle speech input language"
              >
                {speechInputLang === 'vi-VN' ? 'VI' : 'EN'}
              </button>
            )}

            {/* Microphone Voice Input Button */}
            <button
              type="button"
              id="copilot-voice-input-btn"
              onClick={handleToggleVoiceInput}
              disabled={!isSpeechRecSupported}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-950/60 font-bold'
                  : 'bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800'
              }`}
              title={
                !isSpeechRecSupported
                  ? 'Trình duyệt không hỗ trợ Web Speech Recognition API'
                  : isListening
                  ? 'Nhấn để dừng thu âm micro'
                  : `Đặt câu hỏi qua Micro (Web Speech API - ${speechInputLang === 'vi-VN' ? 'Tiếng Việt' : 'English'})`
              }
              aria-label="Voice input with microphone"
            >
              {isListening ? (
                <>
                  <Mic className="w-4 h-4 animate-bounce" />
                  <span className="hidden sm:inline">Đang nghe...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Nói qua Micro</span>
                </>
              )}
            </button>

            {/* Send Query Button */}
            <button
              type="button"
              onClick={() => {
                if (isListening) stopListening();
                runAnalysis();
              }}
              disabled={loading || !customQuery.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Gửi câu hỏi phân tích"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Quick Inquiries:</span>
            {QUICK_PROMPT_SUGGESTIONS.slice(0, 4).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(prompt)}
                className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer truncate max-w-xs"
                title={prompt}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
