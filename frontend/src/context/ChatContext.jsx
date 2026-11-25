import React, { useState, useCallback, useMemo, useRef } from 'react';
import ChatContext from './chatContextInstance';
import * as conversationApi from '../api/conversationApi';

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversationState] = useState(null);
  const [messagesByConv, setMessagesByConv] = useState({});
  const [participantMap, setParticipantMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const removedIdsRef = useRef(new Set());

  const loadSavedConversations = useCallback(async (userId) => {
    if (!userId) return;
    setIsLoadingConversations(true);
    try {
      const storageKey = `syncpulse_conv_ids_${userId}`;
      let savedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(savedIds)) {
        savedIds = [];
      }
      // Prune legacy mock ID 1 so new or existing users don't see the mock chat
      savedIds = savedIds.filter((id) => id !== 1);
      localStorage.setItem(storageKey, JSON.stringify(savedIds));

      if (savedIds.length > 0) {
        const results = await Promise.allSettled(
          savedIds.map((id) => conversationApi.getConversation(id))
        );
        const validConvs = [];
        const notFoundIds = new Set();

        results.forEach((res, index) => {
          if (res.status === 'fulfilled' && res.value?.id) {
            validConvs.push(res.value);
          } else if (res.status === 'rejected' && res.reason?.response?.status === 404) {
            notFoundIds.add(savedIds[index]);
          }
        });

        // Reconcile with latest conversations state (preserves concurrent additions and respects removals during load)
        setConversations((prev) => {
          const map = new Map();
          validConvs.forEach((c) => {
            if (!removedIdsRef.current.has(c.id)) {
              map.set(c.id, c);
            }
          });
          prev.forEach((c) => {
            if (!removedIdsRef.current.has(c.id) && !notFoundIds.has(c.id)) {
              const existing = map.get(c.id);
              map.set(c.id, existing ? { ...existing, ...c } : c);
            }
          });
          return Array.from(map.values());
        });

        // Update storage by pruning only definitively 404-ed IDs
        if (notFoundIds.size > 0) {
          const latestStorage = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const pruned = latestStorage.filter((id) => !notFoundIds.has(id));
          localStorage.setItem(storageKey, JSON.stringify(pruned));
        }
      }
    } catch (err) {
      console.warn('Could not load saved conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const saveConversationIdForUser = useCallback((userId, convId) => {
    if (!userId || !convId) return;
    try {
      const storageKey = `syncpulse_conv_ids_${userId}`;
      const savedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!savedIds.includes(convId)) {
        const nextIds = [convId, ...savedIds];
        localStorage.setItem(storageKey, JSON.stringify(nextIds));
      }
    } catch (err) {
      console.warn('Could not save conversation ID:', err);
    }
  }, []);

  const setActiveConversation = useCallback((conv) => {
    setActiveConversationState(conv);
  }, []);

  const addConversation = useCallback((conv, userId) => {
    if (conv?.id) {
      removedIdsRef.current.delete(conv.id);
    }
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === conv.id);
      if (exists) {
        return prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c));
      }
      return [conv, ...prev];
    });
    if (userId && conv.id) {
      saveConversationIdForUser(userId, conv.id);
    }
  }, [saveConversationIdForUser]);

  const updateConversation = useCallback((id, updates) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    setActiveConversationState((curr) =>
      curr && curr.id === id ? { ...curr, ...updates } : curr
    );
  }, []);

  const removeConversation = useCallback((id, userId) => {
    removedIdsRef.current.add(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveConversationState((curr) => (curr && curr.id === id ? null : curr));
    if (userId) {
      try {
        const storageKey = `syncpulse_conv_ids_${userId}`;
        const savedIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const filtered = savedIds.filter((cid) => cid !== id);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      } catch (err) {
        console.warn('Could not remove conversation ID:', err);
      }
    }
  }, []);

  // Scope messages by conversation ID
  const addMessage = useCallback((message) => {
    const convId = message.conversationId;
    if (!convId) return;

    setMessagesByConv((prev) => {
      const convMsgs = prev[convId] || [];
      const exists = convMsgs.find((m) => m.id === message.id);
      if (exists) return prev;
      const nextMsgs = [...convMsgs, message].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      return {
        ...prev,
        [convId]: nextMsgs,
      };
    });

    // Update preview only if incoming message is newer than or equal to existing preview
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const incomingIso = message.createdAt || new Date().toISOString();
        const incomingTime = new Date(incomingIso).getTime();
        const existingTime = c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0;
        if (incomingTime >= existingTime) {
          return {
            ...c,
            lastMessage: message.content,
            lastMessageTime: incomingIso,
          };
        }
        return c;
      })
    );
  }, []);

  // Set messages for a specific conversation ID
  const setConversationMessages = useCallback((convId, msgs) => {
    setMessagesByConv((prev) => {
      const existing = prev[convId] || [];
      // Reconcile and deduplicate with any messages that arrived live during loading
      const map = new Map();
      (msgs || []).forEach((m) => map.set(m.id, m));
      existing.forEach((m) => {
        if (!map.has(m.id)) {
          map.set(m.id, m);
        }
      });
      const merged = Array.from(map.values()).sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      return {
        ...prev,
        [convId]: merged,
      };
    });
  }, []);

  const setParticipants = useCallback((convId, participants) => {
    setParticipantMap((prev) => ({ ...prev, [convId]: participants }));
  }, []);

  // Compute messages for the active conversation
  const activeConversationId = activeConversation?.id;
  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return messagesByConv[activeConversationId] || [];
  }, [activeConversationId, messagesByConv]);

  const value = {
    conversations,
    activeConversation,
    messages: activeMessages,
    messagesByConv,
    participantMap,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    isLoadingConversations,
    loadSavedConversations,
    setActiveConversation,
    addConversation,
    updateConversation,
    removeConversation,
    addMessage,
    setMessages: setConversationMessages,
    setParticipants,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
