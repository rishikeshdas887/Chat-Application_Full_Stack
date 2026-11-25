/**
 * localAiService.js
 *
 * Privacy-First On-Device AI Summarizer Service
 * ---------------------------------------------
 * STRICT PRIVACY PRINCIPLES:
 * 1. 100% on-device/local execution.
 * 2. ZERO network requests to OpenAI, Google Gemini, Anthropic Claude, or third-party cloud AI.
 * 3. In-memory summary storage only. No persistence to database or localStorage.
 * 4. Zero telemetry, tracking, or content logging.
 *
 * Supported Local Engines:
 * - WebLLM (In-Browser WebGPU execution via @mlc-ai/web-llm dynamically loaded)
 * - Localhost Ollama (Self-hosted local inference at http://localhost:11434)
 * - Local On-Device Heuristic Fallback (Runs entirely client-side when WebGPU is unavailable)
 */

export const WEBLLM_MODELS = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 360M (Fast & Light)',
    description: '~376 MB VRAM • Recommended for quick browser inference',
    default: true,
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 0.5B (Balanced)',
    description: '~940 MB VRAM • Great balance of speed and clarity',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B (High Quality)',
    description: '~1.6 GB VRAM • In-depth reasoning and synthesis',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B (Instruct)',
    description: '~880 MB VRAM • Meta Llama 3.2 on-device',
  },
];

export const DEFAULT_MODEL_ID = WEBLLM_MODELS[0].id;

// Engine singleton state
let activeEngine = null;
let currentLoadedModelId = null;
let isInitializing = false;

/**
 * Check if the browser supports WebGPU
 */
export const checkWebGPUSupport = async () => {
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    return {
      supported: false,
      reason: 'WebGPU is not enabled or supported in this browser. Use Chrome/Edge/Firefox with WebGPU enabled or use local Ollama.',
    };
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        reason: 'No suitable WebGPU adapter found on this device.',
      };
    }
    return { supported: true, adapterInfo: adapter.info || null };
  } catch (err) {
    return {
      supported: false,
      reason: err?.message || 'Failed to initialize WebGPU adapter.',
    };
  }
};

/**
 * Check if a local Ollama instance is reachable on http://localhost:11434
 */
export const checkOllamaAvailable = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return { available: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  }
};

/**
 * Initialize or reuse the WebLLM engine singleton (Dynamically imported for ultra-fast page load)
 */
export const getOrInitWebLLMEngine = async (modelId = DEFAULT_MODEL_ID, onProgress = null) => {
  if (activeEngine && currentLoadedModelId === modelId) {
    return activeEngine;
  }

  if (isInitializing) {
    throw new Error('Another model initialization is already in progress. Please wait.');
  }

  isInitializing = true;
  try {
    // Dynamically load @mlc-ai/web-llm so initial chat loading is instantaneous
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

    // Unload previous engine if changing models
    if (activeEngine) {
      try {
        await activeEngine.unload();
      } catch {
        // Ignore unload error
      }
      activeEngine = null;
      currentLoadedModelId = null;
    }

    const engine = await CreateMLCEngine(modelId, {
      initProgressCallback: (progressReport) => {
        if (typeof onProgress === 'function') {
          onProgress(progressReport);
        }
      },
    });

    activeEngine = engine;
    currentLoadedModelId = modelId;
    return engine;
  } finally {
    isInitializing = false;
  }
};

/**
 * Format conversation messages into a clean prompt string
 * With optional user pseudonymization to prevent personal names in model prompt
 */
export const prepareConversationTranscript = (messages = [], anonymize = false) => {
  if (!messages || messages.length === 0) return { transcript: '', nameMap: {} };

  const nameMap = {};
  let userCounter = 1;

  const lines = messages
    .filter((m) => m.content && m.content.trim())
    .map((m) => {
      const rawSender = m.senderUsername || `User_${m.senderId || 'Anon'}`;
      let senderDisplay = rawSender;

      if (anonymize) {
        if (!nameMap[rawSender]) {
          nameMap[rawSender] = `Participant ${userCounter++}`;
        }
        senderDisplay = nameMap[rawSender];
      }

      const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const prefix = timeStr ? `[${timeStr}] ${senderDisplay}:` : `${senderDisplay}:`;
      return `${prefix} ${m.content.trim()}`;
    });

  return {
    transcript: lines.join('\n'),
    nameMap,
    messageCount: lines.length,
  };
};

/**
 * System prompt strictly demanding valid JSON with required keys
 */
const SYSTEM_PROMPT = `You are a private, privacy-preserving AI assistant that summarizes chat conversations.
Analyze the provided conversation transcript and extract:
1. "overview": A concise 1 to 2 sentence summary of the conversation context and current state.
2. "keyPoints": Array of strings (3 to 6 major discussion points).
3. "decisions": Array of strings (any agreed decisions, conclusions, or choices made).
4. "decisionConclusion": A definitive 1 to 2 sentence conclusion synthesizing all finalized choices and agreed outcomes.
5. "actionItems": Array of objects: [{"task": string, "assignee": string, "deadline": string}]. Use "Unassigned" and "None" if unspecified.
6. "unresolvedQuestions": Array of strings (open questions, uncertainties, or pending responses).

You must respond ONLY with a valid JSON object matching this schema without any preamble or commentary:
{
  "overview": "...",
  "keyPoints": ["..."],
  "decisions": ["..."],
  "decisionConclusion": "...",
  "actionItems": [{"task": "...", "assignee": "...", "deadline": "..."}],
  "unresolvedQuestions": ["..."]
}`;

/**
 * Safely parse JSON from model response, handling markdown blocks if present
 */
export const parseModelJsonOutput = (rawOutput) => {
  if (!rawOutput) return null;

  let cleaned = rawOutput.trim();

  // Strip markdown code fences if output wrapped in ```json ... ```
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    const lastFence = cleaned.lastIndexOf('```');
    if (firstNewline !== -1 && lastFence > firstNewline) {
      cleaned = cleaned.substring(firstNewline + 1, lastFence).trim();
    }
  }

  // Attempt direct JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    return sanitizeSummaryStructure(parsed);
  } catch {
    // If strict JSON parse failed, try extracting JSON substring between first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const sub = cleaned.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(sub);
        return sanitizeSummaryStructure(parsed);
      } catch {
        // Fall back to text extraction
      }
    }
  }

  // Fallback: parse plain text sections
  return parseMarkdownSectionsFallback(rawOutput);
};

/**
 * Ensure summary object conforms to required fields
 */
const sanitizeSummaryStructure = (obj) => {
  const decisions = Array.isArray(obj.decisions)
    ? obj.decisions.filter((s) => typeof s === 'string' && s.trim())
    : [];

  let decisionConclusion =
    typeof obj.decisionConclusion === 'string' && obj.decisionConclusion.trim()
      ? obj.decisionConclusion.trim()
      : '';

  if (!decisionConclusion && decisions.length > 0) {
    if (decisions.length === 1) {
      decisionConclusion = `Concluded: ${decisions[0].replace(/^[^:]+:\s*/, '')}`;
    } else {
      decisionConclusion = `The participants agreed on: ${decisions.map((d) => d.replace(/^[^:]+:\s*/, '')).join('; ')}.`;
    }
  } else if (!decisionConclusion) {
    decisionConclusion = 'No formal decisions recorded yet in this discussion.';
  }

  return {
    overview: typeof obj.overview === 'string' && obj.overview.trim() ? obj.overview.trim() : 'No overview available.',
    keyPoints: Array.isArray(obj.keyPoints) ? obj.keyPoints.filter((s) => typeof s === 'string' && s.trim()) : [],
    decisions,
    decisionConclusion,
    actionItems: Array.isArray(obj.actionItems)
      ? obj.actionItems.map((item) => {
          if (typeof item === 'string') {
            return { task: item, assignee: 'Unassigned', deadline: 'None' };
          }
          return {
            task: item?.task || 'Unspecified task',
            assignee: item?.assignee || 'Unassigned',
            deadline: item?.deadline || 'None',
          };
        })
      : [],
    unresolvedQuestions: Array.isArray(obj.unresolvedQuestions)
      ? obj.unresolvedQuestions.filter((s) => typeof s === 'string' && s.trim())
      : [],
  };
};

/**
 * Regex-based markdown text section parser if model didn't return valid JSON
 */
const parseMarkdownSectionsFallback = (text) => {
  const result = {
    overview: '',
    keyPoints: [],
    decisions: [],
    actionItems: [],
    unresolvedQuestions: [],
  };

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let currentSection = 'overview';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('key point') || lower.includes('discussion')) {
      currentSection = 'keyPoints';
      continue;
    } else if (lower.includes('decision') || lower.includes('agreed')) {
      currentSection = 'decisions';
      continue;
    } else if (lower.includes('action item') || lower.includes('tasks') || lower.includes('todo')) {
      currentSection = 'actionItems';
      continue;
    } else if (lower.includes('unresolved') || lower.includes('question') || lower.includes('pending')) {
      currentSection = 'unresolvedQuestions';
      continue;
    }

    const itemClean = line.replace(/^[-*•\d.)\]]\s*/, '').trim();
    if (!itemClean) continue;

    if (currentSection === 'overview') {
      result.overview += (result.overview ? ' ' : '') + itemClean;
    } else if (currentSection === 'keyPoints') {
      result.keyPoints.push(itemClean);
    } else if (currentSection === 'decisions') {
      result.decisions.push(itemClean);
    } else if (currentSection === 'actionItems') {
      result.actionItems.push({ task: itemClean, assignee: 'Unassigned', deadline: 'None' });
    } else if (currentSection === 'unresolvedQuestions') {
      result.unresolvedQuestions.push(itemClean);
    }
  }

  if (!result.overview) {
    result.overview = lines.slice(0, 2).join(' ') || 'Conversation summarized locally.';
  }

  return sanitizeSummaryStructure(result);
};

/**
 * Rule-based local heuristic summarizer (Runs 100% in browser JS when no WebGPU/Ollama)
 * Fast, zero-memory, instant response, 100% on-device private.
 */
export const generateLocalHeuristicSummary = (messages = []) => {
  if (!messages || messages.length === 0) {
    return {
      overview: 'No messages in conversation to summarize.',
      keyPoints: [],
      decisions: [],
      actionItems: [],
      unresolvedQuestions: [],
      engineUsed: 'Local Heuristic (Rule-Based)',
      modelUsed: 'Client-Side NLP Rule-Set',
      generatedAt: new Date().toISOString(),
    };
  }

  const senders = new Set();
  const questions = [];
  const decisions = [];
  const actionItems = [];
  const keyPoints = [];

  const decisionKeywords = [
    // English
    'agree', 'agreed', 'decide', 'decided', 'approved', "let's go with", 'confirmed', 'settled',
    'resolved', 'will use', 'we will go', 'final', 'concluded', 'verdict', 'chosen', 'selected',
    'done with', 'decision:', 'decision', 'agreed upon', 'finalized', 'closing with',
    // Hindi / Hinglish
    'faisla', 'pakka', 'teh hua', 'yahi karenge', 'final hai', 'agree hoon', 'hum karenge',
    'confirm hai', 'chalo yehi karte hai', 'thik hai done', 'sahi hai done', 'pakka hai', 'done deal',
    // Spanish
    'de acuerdo', 'decidido', 'confirmado', 'aprobado', 'conclusión', 'elegido',
    // French
    "d'accord", 'décidé', 'confirmé', 'approuvé', 'conclusion',
    // German
    'einverstanden', 'entschieden', 'bestätigt', 'abgemacht', 'fazit'
  ];
  const actionKeywords = ['todo', 'will do', 'need to', 'please', 'action:', 'task', 'by tomorrow', 'by monday', 'by friday', 'assign', 'follow up'];
  const deadlineKeywords = ['by tomorrow', 'by today', 'by monday', 'by friday', 'by next week', 'asap', 'by end of day', 'eod'];

  messages.forEach((msg) => {
    const text = (msg.content || '').trim();
    if (!text) return;

    const sender = msg.senderUsername || `User ${msg.senderId || ''}`;
    senders.add(sender);

    const lower = text.toLowerCase();

    // 1. Unresolved questions
    if (text.includes('?') || lower.startsWith('who ') || lower.startsWith('what ') || lower.startsWith('when ') || lower.startsWith('where ') || lower.startsWith('why ') || lower.startsWith('how ') || lower.startsWith('can we ') || lower.startsWith('could you ')) {
      questions.push(`${sender}: "${text}"`);
    }

    // 2. Decisions (Multilingual)
    if (decisionKeywords.some((kw) => lower.includes(kw))) {
      decisions.push(`${sender}: ${text}`);
    }

    // 3. Action items
    if (actionKeywords.some((kw) => lower.includes(kw))) {
      let deadline = 'None';
      for (const dkw of deadlineKeywords) {
        if (lower.includes(dkw)) {
          deadline = dkw;
          break;
        }
      }
      actionItems.push({
        task: text,
        assignee: sender,
        deadline,
      });
    }

    // 4. Key points (substantial messages)
    if (text.length > 25 && !text.includes('?') && !lower.startsWith('hello') && !lower.startsWith('hi ') && !lower.startsWith('hey')) {
      if (keyPoints.length < 5) {
        keyPoints.push(`${sender}: ${text}`);
      }
    }
  });

  const participantsList = Array.from(senders).join(', ');
  const overview = `Discussion between ${participantsList || 'participants'} covering ${messages.length} message${messages.length === 1 ? '' : 's'}. Key points involve collaborative updates and coordination.`;

  // Synthesize definitive Conclusion of Decisions
  let decisionConclusion = '';
  if (decisions.length > 0) {
    if (decisions.length === 1) {
      decisionConclusion = `Concluded: ${decisions[0].replace(/^[^:]+:\s*/, '')}`;
    } else {
      decisionConclusion = `Final Decisions Summary: The participants agreed on ${decisions.length} core items: ${decisions.map((d) => d.replace(/^[^:]+:\s*/, '')).join('; ')}.`;
    }
  } else {
    decisionConclusion = 'No formal decisions recorded yet in this discussion.';
  }

  return {
    overview,
    keyPoints: keyPoints.slice(0, 5),
    decisions: decisions.slice(0, 6),
    decisionConclusion,
    actionItems: actionItems.slice(0, 5),
    unresolvedQuestions: questions.slice(0, 4),
    engineUsed: 'Local Heuristic (Rule-Based)',
    modelUsed: 'Client-Side NLP Rule-Set',
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Interactive on-device AI assistant for arbitrary queries about the conversation.
 * 100% Client-Side Local Execution — Zero Network Calls, Zero Cloud Sharing.
 *
 * @param {Array} messages - Chat message objects
 * @param {string} userPrompt - User's custom question or request
 * @param {Object} currentSummary - Cached summary object if available
 * @returns {string} Instant local response
 */
export const queryLocalChatAssistant = (messages = [], userPrompt = '', currentSummary = null) => {
  if (!messages || messages.length === 0) {
    return 'There are no messages in this conversation yet to analyze.';
  }

  const prompt = (userPrompt || '').trim().toLowerCase();
  if (!prompt) return 'Please enter a question or request.';

  const validMsgs = messages.filter((m) => m.content && m.content.trim());
  const summary = currentSummary || generateLocalHeuristicSummary(validMsgs);

  // 1. Decisions & Conclusions
  if (
    prompt.includes('decision') ||
    prompt.includes('conclusion') ||
    prompt.includes('faisla') ||
    prompt.includes('agreed') ||
    prompt.includes('verdict') ||
    prompt.includes('settled')
  ) {
    if (!summary.decisions || summary.decisions.length === 0) {
      return 'No formal decisions or agreements were found in this chat.';
    }
    return `🎯 **Conclusion of Decisions**:\n${summary.decisionConclusion}\n\n**All Decisions Recorded**:\n${summary.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;
  }

  // 2. Action items & Tasks
  if (prompt.includes('action') || prompt.includes('task') || prompt.includes('todo') || prompt.includes('assign')) {
    if (!summary.actionItems || summary.actionItems.length === 0) {
      return 'No explicit action items or tasks were detected in this conversation.';
    }
    return `✅ **Action Items & Tasks**:\n` + summary.actionItems.map((item, i) => `${i + 1}. ${item.task} (Owner: ${item.assignee}, Due: ${item.deadline})`).join('\n');
  }

  // 3. Overview / Full Summary
  if (prompt.includes('summar') || prompt.includes('overview') || prompt.includes('wrap up') || prompt.includes('recap')) {
    let out = `⚡ **Executive Summary**:\n${summary.overview}\n\n`;
    if (summary.decisions && summary.decisions.length > 0) {
      out += `🎯 **Conclusion**:\n${summary.decisionConclusion}\n\n`;
    }
    if (summary.keyPoints && summary.keyPoints.length > 0) {
      out += `📌 **Key Points**:\n${summary.keyPoints.map((k) => `• ${k}`).join('\n')}\n\n`;
    }
    if (summary.actionItems && summary.actionItems.length > 0) {
      out += `📋 **Action Items** (${summary.actionItems.length}):\n${summary.actionItems.map((a) => `• ${a.task} [${a.assignee}]`).join('\n')}`;
    }
    return out.trim();
  }

  // 4. Questions / Unresolved
  if (prompt.includes('question') || prompt.includes('open') || prompt.includes('unresolved') || prompt.includes('pending') || prompt.includes('doubt')) {
    if (!summary.unresolvedQuestions || summary.unresolvedQuestions.length === 0) {
      return 'All questions appear to have been addressed, or no open questions were asked.';
    }
    return `❓ **Open & Unresolved Questions**:\n${summary.unresolvedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  }

  // 5. Query about specific participant
  const participants = Array.from(new Set(validMsgs.map((m) => (m.senderUsername || '').toLowerCase()).filter(Boolean)));
  const matchedParticipant = participants.find((p) => p && prompt.includes(p));
  if (matchedParticipant) {
    const userMsgs = validMsgs.filter((m) => (m.senderUsername || '').toLowerCase() === matchedParticipant);
    const count = userMsgs.length;
    const sample = userMsgs.slice(-3).map((m) => `"${m.content}"`).join('\n• ');
    return `👤 **${matchedParticipant}** posted ${count} message${count === 1 ? '' : 's'}:\n• ${sample}`;
  }

  // 6. Topic Keyword Search across messages
  const stopWords = new Set(['what', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'with', 'from', 'about', 'does', 'have', 'were', 'tell', 'show', 'type', 'want', 'said']);
  const keywords = prompt.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
  
  if (keywords.length > 0) {
    const matchingMsgs = validMsgs.filter((m) => {
      const text = (m.content || '').toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });

    if (matchingMsgs.length > 0) {
      const highlights = matchingMsgs.slice(-4).map((m) => `${m.senderUsername || 'User'}: "${m.content}"`).join('\n\n');
      return `🔍 Found ${matchingMsgs.length} relevant message${matchingMsgs.length === 1 ? '' : 's'} regarding "${keywords.join(' ')}":\n\n${highlights}`;
    }
  }

  // 7. General fallback answer synthesized from chat context
  return `💡 **Local Analysis**:\nThe conversation currently contains ${validMsgs.length} messages.\n\n${summary.overview}\n\n🎯 **Decisions Status**: ${summary.decisionConclusion}`;
};

/**
 * Execute summarization via local WebLLM
 */
export const summarizeWithWebLLM = async (messages, modelId = DEFAULT_MODEL_ID, anonymize = false, onProgress = null) => {
  const { transcript } = prepareConversationTranscript(messages, anonymize);
  if (!transcript) {
    throw new Error('No readable conversation messages to summarize.');
  }

  const engine = await getOrInitWebLLMEngine(modelId, onProgress);

  const response = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Here is the conversation transcript to summarize:\n\n${transcript}` },
    ],
    temperature: 0.2,
    max_tokens: 768,
  });

  const rawText = response.choices?.[0]?.message?.content || '';
  const parsed = parseModelJsonOutput(rawText);

  return {
    ...parsed,
    engineUsed: 'WebGPU On-Device (WebLLM)',
    modelUsed: modelId,
    generatedAt: new Date().toISOString(),
    messageCountAnalyzed: messages.length,
  };
};

/**
 * Execute summarization via local Ollama (http://localhost:11434)
 */
export const summarizeWithOllama = async (messages, modelName = 'qwen2.5:3b', anonymize = false) => {
  const { transcript } = prepareConversationTranscript(messages, anonymize);
  if (!transcript) {
    throw new Error('No readable conversation messages to summarize.');
  }

  const prompt = `${SYSTEM_PROMPT}\n\nHere is the conversation transcript to summarize:\n\n${transcript}\n\nRespond with valid JSON:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Ollama request failed with HTTP status ${res.status}`);
    }

    const data = await res.json();
    const rawText = data.response || '';
    const parsed = parseModelJsonOutput(rawText);

    return {
      ...parsed,
      engineUsed: 'Localhost Ollama',
      modelUsed: modelName,
      generatedAt: new Date().toISOString(),
      messageCountAnalyzed: messages.length,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};
