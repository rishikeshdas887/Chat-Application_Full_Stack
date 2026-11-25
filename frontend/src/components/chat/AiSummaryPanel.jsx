/**
 * AiSummaryPanel.jsx
 *
 * Dedicated glassmorphic side drawer for Privacy-First On-Device AI Summaries & Interactive Chat.
 * Highlights:
 * - 100% Client-side local execution (WebLLM / Localhost Ollama / Local Heuristic).
 * - Continuous summary update toggle.
 * - Prominent Consensus Conclusion & Multilingual Decisions Extraction.
 * - Interactive Local AI Chat Box for asking arbitrary questions about the conversation with rapid speed.
 * - 100% private in-browser memory — zero cloud leakage.
 */

import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

// Helper to format bold **text** and line breaks cleanly
const renderFormattedText = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <div key={lIdx} style={{ minHeight: line.trim() ? 'auto' : '6px', marginBottom: '3px' }}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} style={{ fontWeight: 700, color: '#0f172a' }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </div>
    );
  });
};

const AiSummaryPanel = ({
  isOpen,
  onClose,
  conversationName,
  summarizer,
}) => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'chat'
  const [showSettings, setShowSettings] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'init',
      sender: 'ai',
      text: 'Hello! I am your local AI assistant running directly on your device. Ask me anything about this conversation — decisions, conclusions, tasks, or summaries.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  const {
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
    availableModels,
    generateSummary,
    askLocalAi,
  } = summarizer;

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, isAiThinking]);

  if (!isOpen) return null;

  const handleSendChat = (promptText = null) => {
    const text = (promptText || chatInput).trim();
    if (!text) return;

    const userMsgId = 'user_' + Date.now();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text, timestamp: nowTime },
    ]);

    if (!promptText) {
      setChatInput('');
    }

    setIsAiThinking(true);

    // Instant local evaluation
    setTimeout(() => {
      try {
        const answer = askLocalAi ? askLocalAi(text) : 'Local AI analyzer ready.';
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'ai_' + Date.now(),
            sender: 'ai',
            text: answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } catch (err) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'ai_' + Date.now(),
            sender: 'ai',
            text: `Local analysis notice: ${err?.message || 'Unable to process query.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsAiThinking(false);
      }
    }, 50);
  };

  const quickPrompts = [
    { label: '⚡ Full Summary', prompt: 'Give me a complete executive summary of this chat' },
    { label: '🎯 Decisions & Conclusion', prompt: 'What are all the decisions and the final conclusion?' },
    { label: '✅ Action Items', prompt: 'What action items and pending tasks were identified?' },
    { label: '❓ Open Questions', prompt: 'What open questions remain unresolved in this conversation?' },
    { label: '👥 Participants', prompt: 'Who participated in this chat and what did they contribute?' },
  ];

  return (
    <aside
      data-testid="ai-summary-drawer"
      className="ai-summary-drawer"
      style={{
        width: '430px',
        maxWidth: '100vw',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(24px) saturate(190%)',
        WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        borderLeft: '1px solid rgba(226, 232, 240, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.08)',
        zIndex: 20,
        position: 'relative',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}
          >
            ✨
          </div>
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              AI Assistant
            </h3>
            <span
              style={{
                fontSize: '11px',
                color: '#64748b',
                display: 'block',
                marginTop: '1px',
              }}
            >
              {conversationName ? `Chat: ${conversationName}` : 'Active Conversation'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: showSettings ? '#e0e7ff' : '#f1f5f9',
              color: showSettings ? '#4338ca' : '#475569',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            title="Configure Local Inference Engine"
          >
            ⚙️ Engine
          </button>
          <button
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'background-color 0.15s ease',
            }}
            title="Close Summary Panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Top Tab Switcher */}
      <div
        style={{
          display: 'flex',
          padding: '0 16px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          gap: '4px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'summary' ? '2.5px solid #4f46e5' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'summary' ? '#4f46e5' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
        >
          <span>📊</span> Summary & Decisions
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('chat');
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'chat' ? '2.5px solid #4f46e5' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'chat' ? '#4f46e5' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
        >
          <span>💬</span> Chat with AI
        </button>
      </div>

      {/* Engine Settings Drawer */}
      {showSettings && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '13px',
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '10px' }}>
            Local Inference Engine
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Engine Selector */}
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Execution Mode
              </label>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '12px',
                }}
              >
                <option value="webllm" disabled={!webGpuStatus.supported}>
                  WebGPU On-Device (WebLLM) {!webGpuStatus.supported ? '(No WebGPU)' : '⚡ Active'}
                </option>
                <option value="ollama" disabled={!ollamaStatus.available}>
                  Local Ollama (localhost:11434) {!ollamaStatus.available ? '(Offline)' : '🟢 Ready'}
                </option>
                <option value="heuristic">
                  Local Rule-Based Pattern NLP (Instant, No GPU needed)
                </option>
              </select>
            </div>

            {/* Model Selector if WebLLM */}
            {selectedEngine === 'webllm' && (
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  WebLLM Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '12px',
                  }}
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Model Selector if Ollama */}
            {selectedEngine === 'ollama' && (
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Ollama Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '12px',
                  }}
                >
                  {ollamaStatus.models.length > 0 ? (
                    ollamaStatus.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  ) : (
                    <option value="qwen2.5:3b">qwen2.5:3b (default)</option>
                  )}
                </select>
              </div>
            )}

            {/* Anonymize Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                  Pseudonymize Names
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                  Mask names during local analysis
                </span>
              </div>
              <input
                type="checkbox"
                checked={anonymize}
                onChange={(e) => setAnonymize(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SUMMARY & DECISIONS VIEW */}
      {activeTab === 'summary' && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Action Controls: Auto-update toggle & Regenerate */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="auto-summarize-toggle"
                checked={autoSummarize}
                onChange={(e) => setAutoSummarize(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label
                htmlFor="auto-summarize-toggle"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                }}
              >
                Auto-update on new messages
              </label>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => generateSummary(true)}
              disabled={isGenerating}
              icon={isGenerating ? <Spinner size="sm" /> : <span>🔄</span>}
            >
              {isGenerating ? 'Analyzing...' : 'Regenerate'}
            </Button>
          </div>

          {/* Progress Bar during Model Loading / WebLLM Init */}
          {isGenerating && progress && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e0e7ff',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#4338ca' }}>
                  {progress.text || 'Processing locally on-device...'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1' }}>
                  {progress.progress}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e0e7ff',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(5, progress.progress)}%`,
                    height: '100%',
                    backgroundColor: '#4f46e5',
                    borderRadius: '3px',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#b91c1c',
                fontSize: '12px',
                display: 'flex',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Fallback Notice if WebLLM fell back */}
          {summary?.fallbackNotice && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                color: '#b45309',
                fontSize: '11px',
              }}
            >
              ℹ️ {summary.fallbackNotice}
            </div>
          )}

          {/* Summary Sections or Empty State */}
          {!summary && !isGenerating ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💡</div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>
                No Summary Generated Yet
              </h4>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 18px 0', lineHeight: 1.5 }}>
                Generate an AI summary with key points, decisions, and action items locally on your device.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => generateSummary(true)}
                icon={<span>✨</span>}
              >
                Generate Summary
              </Button>
            </div>
          ) : summary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Consensus Conclusion of Decisions (PROMINENT) */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1.5px solid #86efac',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#166534',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>🎯</span>
                  <span>Conclusion of Decisions</span>
                </div>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '12px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#14532d',
                    lineHeight: 1.5,
                  }}
                >
                  {summary.decisionConclusion || 'All discussed items were analyzed. No formal decisions recorded yet.'}
                </div>

                {summary.decisions && summary.decisions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                      Decisions Log ({summary.decisions.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {summary.decisions.map((dec, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #dcfce7',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '12.5px',
                            color: '#14532d',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                          }}
                        >
                          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                          <span style={{ flex: 1 }}>{dec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Overview */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>🌐</span>
                  <span>Conversation Overview</span>
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#334155',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {summary.overview || 'Overview unavailable.'}
                </p>
              </div>

              {/* 3. Key Discussion Points */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>💡</span>
                  <span>Key Discussion Points</span>
                </div>
                {summary.keyPoints && summary.keyPoints.length > 0 ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '18px',
                      fontSize: '12.5px',
                      color: '#334155',
                      lineHeight: 1.6,
                    }}
                  >
                    {summary.keyPoints.map((pt, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>
                        {pt}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No major discussion points identified.
                  </div>
                )}
              </div>

              {/* 4. Action Items & Deadlines */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>📋</span>
                  <span>Action Items & Tasks</span>
                </div>
                {summary.actionItems && summary.actionItems.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {summary.actionItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: '#0f172a',
                            marginBottom: '4px',
                          }}
                        >
                          {item.task}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                          {item.assignee && item.assignee !== 'Unassigned' && (
                            <span
                              style={{
                                backgroundColor: '#e0e7ff',
                                color: '#3730a3',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 500,
                              }}
                            >
                              👤 {item.assignee}
                            </span>
                          )}
                          {item.deadline && item.deadline !== 'None' && (
                            <span
                              style={{
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 500,
                              }}
                            >
                              ⏱️ {item.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No pending action items found.
                  </div>
                )}
              </div>

              {/* 5. Unresolved Questions */}
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1px solid #fde68a',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#92400e',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>❓</span>
                  <span>Unresolved Questions</span>
                </div>
                {summary.unresolvedQuestions && summary.unresolvedQuestions.length > 0 ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '18px',
                      fontSize: '12.5px',
                      color: '#78350f',
                      lineHeight: 1.5,
                    }}
                  >
                    {summary.unresolvedQuestions.map((q, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>
                        {q}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '12px', color: '#b45309', fontStyle: 'italic' }}>
                    No unresolved questions identified.
                  </div>
                )}
              </div>

              {/* Action shortcut to switch to Chat */}
              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setActiveTab('chat');
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  icon={<span>💬</span>}
                >
                  Ask AI About This Conversation
                </Button>
              </div>

              {/* Footer / Metadata */}
              <div
                style={{
                  paddingTop: '8px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '11px',
                  color: '#64748b',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Engine:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {summary.engineUsed || selectedEngine}
                  </span>
                </div>
                {summary.modelUsed && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Model:</span>
                    <span style={{ fontFamily: 'monospace', color: '#475569' }}>
                      {summary.modelUsed}
                    </span>
                  </div>
                )}
                {summary.generatedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Last Updated:</span>
                    <span>{new Date(summary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: INTERACTIVE LOCAL AI CHAT BOX */}
      {activeTab === 'chat' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Quick 1-Tap Prompt Chips */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendChat(qp.prompt)}
                disabled={isAiThinking}
                style={{
                  padding: '5px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 150ms ease',
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Interactive Chat History Thread */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '88%',
                      padding: '10px 14px',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      backgroundColor: isUser ? '#4f46e5' : '#ffffff',
                      color: isUser ? '#ffffff' : '#1e293b',
                      border: isUser ? 'none' : '1px solid #e2e8f0',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {!isUser && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#4f46e5',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        <span>✨</span> Local Assistant
                      </div>
                    )}
                    <div>{isUser ? msg.text : renderFormattedText(msg.text)}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#94a3b8',
                      marginTop: '3px',
                      padding: '0 4px',
                    }}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isAiThinking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                <Spinner size="sm" />
                <span style={{ fontSize: '12px', color: '#6366f1', fontStyle: 'italic' }}>
                  Analyzing conversation locally...
                </span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Composer Input Row */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              flexShrink: 0,
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about decisions, topics, action items..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiThinking}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4f46e5')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!chatInput.trim() || isAiThinking}
                icon={<span>🚀</span>}
              >
                Ask
              </Button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Press Enter to ask • Runs 100% locally on your machine
              </span>
              {chatMessages.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    setChatMessages([
                      {
                        id: 'init',
                        sender: 'ai',
                        text: 'Chat history cleared. What else would you like to know about this conversation?',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ])
                  }
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    fontSize: '10px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear History
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AiSummaryPanel;
