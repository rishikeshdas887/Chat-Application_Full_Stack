/**
 * useAiSummarizer.js
 *
 * Hook to manage private, on-device AI conversation summarization.
 * Maintains summaries strictly in browser memory (useRef) to ensure zero persistent storage
 * and zero third-party cloud data transmission.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  checkWebGPUSupport,
  checkOllamaAvailable,
  summarizeWithWebLLM,
  summarizeWithOllama,
  generateLocalHeuristicSummary,
  queryLocalChatAssistant,
  DEFAULT_MODEL_ID,
  WEBLLM_MODELS,
} from '../services/localAiService';

export const useAiSummarizer = ({ conversationId, messages = [] }) => {
  // In-memory state for generated summaries per conversation
  // Kept exclusively in React memory — never stored in localStorage, IndexedDB, or database
  const [summariesMap, setSummariesMap] = useState({});

  // Active conversation's summary derived cleanly from in-memory state
  const summary = (conversationId && summariesMap[conversationId]) || null;

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null); // { text, progress }
  const [error, setError] = useState(null);

  // Settings
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [selectedEngine, setSelectedEngine] = useState('heuristic'); // 'webllm' | 'ollama' | 'heuristic'
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [anonymize, setAnonymize] = useState(false);

  // System capabilities
  const [webGpuStatus, setWebGpuStatus] = useState({ supported: false, checking: true });
  const [ollamaStatus, setOllamaStatus] = useState({ available: false, models: [], checking: true });

  const debounceTimerRef = useRef(null);
  const prevMessageCountRef = useRef(messages.length);
  const generateSummaryRef = useRef(null);

  // Probe WebGPU and Ollama capabilities on mount
  useEffect(() => {
    let mounted = true;

    const probeEngines = async () => {
      // 1. Check WebGPU
      const gpuResult = await checkWebGPUSupport();
      if (!mounted) return;
      setWebGpuStatus({ ...gpuResult, checking: false });

      // 2. Check Ollama
      const ollamaResult = await checkOllamaAvailable();
      if (!mounted) return;
      setOllamaStatus({ ...ollamaResult, checking: false });

      // Default engine selection logic: WebLLM if WebGPU available, else Ollama if running, else Heuristic
      if (gpuResult.supported) {
        setSelectedEngine('webllm');
      } else if (ollamaResult.available) {
        setSelectedEngine('ollama');
        if (ollamaResult.models.length > 0) {
          setSelectedModel(ollamaResult.models[0]);
        }
      } else {
        setSelectedEngine('heuristic');
      }
    };

    probeEngines();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Core generator function
   */
  const generateSummary = useCallback(
    async (force = false) => {
      if (!conversationId) return;

      const validMessages = (messages || []).filter((m) => m.content && m.content.trim());
      if (validMessages.length === 0) {
        setError('Cannot summarize an empty conversation.');
        return;
      }

      // Check if we already have an identical message count summarized unless forced
      const existing = summariesMap[conversationId];
      if (!force && existing && existing.messageCountAnalyzed === validMessages.length) {
        return;
      }

      setIsGenerating(true);
      setError(null);
      setProgress({ text: 'Preparing conversation analysis...', progress: 0 });

      try {
        let result;

        if (selectedEngine === 'webllm') {
          result = await summarizeWithWebLLM(
            validMessages,
            selectedModel,
            anonymize,
            (progressReport) => {
              setProgress({
                text: progressReport.text || 'Loading local model weights...',
                progress: Math.round((progressReport.progress || 0) * 100),
              });
            }
          );
        } else if (selectedEngine === 'ollama') {
          setProgress({ text: `Connecting to local Ollama (${selectedModel})...`, progress: 50 });
          result = await summarizeWithOllama(validMessages, selectedModel, anonymize);
        } else {
          // Local Heuristic
          setProgress({ text: 'Analyzing text patterns locally...', progress: 80 });
          result = generateLocalHeuristicSummary(validMessages);
        }

        // Store exclusively in memory
        setSummariesMap((prev) => ({ ...prev, [conversationId]: result }));
      } catch (err) {
        // If WebLLM or Ollama fails (e.g. Ollama model not pulled, or WebGPU out of memory), fall back safely to Heuristic
        try {
          const fallbackResult = generateLocalHeuristicSummary(validMessages);
          fallbackResult.fallbackNotice = `${selectedEngine === 'ollama' ? 'Ollama' : 'WebGPU'} notice (${err.message}). Showing on-device pattern summary.`;
          setSummariesMap((prev) => ({ ...prev, [conversationId]: fallbackResult }));
          setError(null);
          return;
        } catch {
          // ignore
        }
        setError(err?.message || 'Failed to generate local AI summary.');
      } finally {
        setIsGenerating(false);
        setProgress(null);
      }
    },
    [conversationId, messages, selectedEngine, selectedModel, anonymize, summariesMap]
  );

  useEffect(() => {
    generateSummaryRef.current = generateSummary;
  }, [generateSummary]);

  // Auto-generate initial summary for conversation if autoSummarize is on
  useEffect(() => {
    if (!autoSummarize || !conversationId) return;
    const validCount = (messages || []).filter((m) => m.content && m.content.trim()).length;
    if (validCount > 0 && !summariesMap[conversationId] && !isGenerating) {
      const initTimer = setTimeout(() => {
        generateSummary(false);
      }, 600);
      return () => clearTimeout(initTimer);
    }
  }, [conversationId, autoSummarize, messages, summariesMap, isGenerating, generateSummary]);

  /**
   * Debounced automatic summarization when new messages arrive
   */
  useEffect(() => {
    if (!autoSummarize || !conversationId) return;

    const currentCount = (messages || []).filter((m) => m.content && m.content.trim()).length;
    if (currentCount < 1) return;

    // Only trigger if message count increased
    if (currentCount > prevMessageCountRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (generateSummaryRef.current) {
          generateSummaryRef.current(true);
        }
      }, 2500); // 2.5s debounce to let rapid typing settle
    }

    prevMessageCountRef.current = currentCount;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [messages.length, autoSummarize, conversationId]);

  /**
   * Clear current conversation summary from memory
   */
  const clearSummary = useCallback(() => {
    if (conversationId) {
      setSummariesMap((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    }
  }, [conversationId]);

  /**
   * Ask local AI assistant about the conversation
   */
  const askLocalAi = useCallback(
    (userPrompt) => {
      const validMessages = (messages || []).filter((m) => m.content && m.content.trim());
      const currentSummary = (conversationId && summariesMap[conversationId]) || null;
      return queryLocalChatAssistant(validMessages, userPrompt, currentSummary);
    },
    [messages, conversationId, summariesMap]
  );

  return {
    summary,
    isGenerating,
    progress,
    error,
    autoSummarize,
    setAutoSummarize,
    selectedEngine,
    setSelectedEngine,
    selectedModel,
    setSelectedModel,
    anonymize,
    setAnonymize,
    webGpuStatus,
    ollamaStatus,
    availableModels: WEBLLM_MODELS,
    generateSummary,
    clearSummary,
    askLocalAi,
  };
};

export default useAiSummarizer;
