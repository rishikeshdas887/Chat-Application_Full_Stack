import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChatContext } from '../hooks/useChatContext';
import useWebSocket from '../hooks/useWebSocket';
import * as messageApi from '../api/messageApi';
import * as conversationApi from '../api/conversationApi';
import Sidebar from '../components/layout/Sidebar';
import ChatHeader from '../components/layout/ChatHeader';
import MessageThread from '../components/chat/MessageThread';
import MessageInput from '../components/layout/MessageInput';
import NewConversationModal from '../components/chat/NewConversationModal';
import ManageParticipantsModal from '../components/chat/ManageParticipantsModal';
import JoinConversationModal from '../components/chat/JoinConversationModal';
import UserProfileModal from '../components/chat/UserProfileModal';
import AiSummaryPanel from '../components/chat/AiSummaryPanel';
import DropzoneOverlay from '../components/chat/DropzoneOverlay';
import ImageLightboxModal from '../components/chat/ImageLightboxModal';
import useAiSummarizer from '../hooks/useAiSummarizer';
import useFileSelector from '../hooks/useFileSelector';
import { uploadAttachment } from '../services/fileUploadService';

const normalizeMessage = (msg) => {
  return {
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId ?? msg.sender?.id,
    senderUsername: msg.senderUsername ?? msg.sender?.username,
    conversationId: msg.conversationId ?? msg.conversation?.id,
    createdAt: msg.createdAt,
    type: msg.type || 'TEXT',
  };
};

const ChatPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    participantMap,
    isLoadingConversations,
    loadSavedConversations,
    setActiveConversation,
    addConversation,
    addMessage,
    setMessages,
    setParticipants,
  } = useChatContext();

  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const selectionGenRef = useRef(0);

  // Universal Cross-Platform File Selector hook (Images, Docs, Camera, Drag & Drop, Paste)
  const fileSelector = useFileSelector();

  // Privacy-first on-device AI summarizer hook
  const summarizer = useAiSummarizer({
    conversationId: activeConversation?.id,
    messages,
  });

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Load saved conversations for the logged in user
  useEffect(() => {
    if (user?.userId) {
      loadSavedConversations(user.userId);
    }
  }, [user?.userId, loadSavedConversations]);

  // Handle incoming STOMP message
  const handleWsMessage = useCallback(
    (rawPayload) => {
      const normalized = normalizeMessage(rawPayload);
      addMessage(normalized);
    },
    [addMessage]
  );

  // Initialize WebSocket STOMP client
  const { connectionStatus, sendMessage: wsSend } = useWebSocket({
    token: user?.token || null,
    conversationId: activeConversation?.id || null,
    onMessage: handleWsMessage,
  });

  // Select a conversation and load history & participants independently
  const handleSelectConversation = useCallback(
    (conv) => {
      const currentGen = ++selectionGenRef.current;
      setActiveConversation(conv);
      setIsMobileSidebarOpen(false);
      setMessagesLoading(true);

      // Load message history independently
      messageApi
        .getMessages(conv.id)
        .then((msgs) => {
          if (selectionGenRef.current !== currentGen) return;
          const normalizedMsgs = (msgs || []).map(normalizeMessage);
          setMessages(conv.id, normalizedMsgs);
        })
        .catch((err) => {
          if (selectionGenRef.current !== currentGen) return;
          console.warn('Failed to load message history:', err);
          setMessages(conv.id, []);
        })
        .finally(() => {
          if (selectionGenRef.current === currentGen) {
            setMessagesLoading(false);
          }
        });

      // Load participants independently
      conversationApi
        .getParticipants(conv.id)
        .then((parts) => {
          if (selectionGenRef.current !== currentGen) return;
          setParticipants(conv.id, parts || []);
        })
        .catch((err) => {
          if (selectionGenRef.current !== currentGen) return;
          console.warn('Failed to load participant list:', err);
          setParticipants(conv.id, []);
        });
    },
    [setActiveConversation, setMessages, setParticipants]
  );

  // Auto-select first conversation on initial load if none is selected
  useEffect(() => {
    let timer;
    if (!activeConversation && conversations.length > 0 && !messagesLoading) {
      timer = setTimeout(() => {
        handleSelectConversation(conversations[0]);
      }, 0);
    }
    return () => clearTimeout(timer);
  }, [conversations, activeConversation, messagesLoading, handleSelectConversation]);

  // Send message handler (prefers WebSocket, with REST fallback)
  const handleSend = async (content, type = 'TEXT') => {
    if (!activeConversation || !user) return;

    // 1. Try sending via WebSocket
    const sentViaWs = wsSend(content, type);

    // 2. If WebSocket is not connected, use REST API
    if (!sentViaWs) {
      try {
        const saved = await messageApi.sendMessageRest(
          activeConversation.id,
          user.userId,
          content,
          type
        );
        addMessage(normalizeMessage(saved));
      } catch (err) {
        console.warn('REST fallback failed, applying optimistic local message:', err);
        const localMsg = {
          id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          conversationId: activeConversation.id,
          senderId: user.userId,
          senderUsername: user.username || 'You',
          content: content,
          type: type,
          createdAt: new Date().toISOString(),
        };
        addMessage(localMsg);
      }
    }
  };

  // Send attachments handler (Uploads via service, then transmits metadata)
  const handleSendAttachments = async (attachments, caption) => {
    if (!activeConversation || !user || !attachments || attachments.length === 0) return;

    for (const att of attachments) {
      try {
        // Upload file or prepare fallback dataUrl payload
        const uploadResult = await uploadAttachment(
          att,
          activeConversation.id,
          (progress) => {
            // Can update per-attachment progress if needed
          }
        );

        const finalDataUrl = uploadResult?.dataUrl || att.dataUrl;
        const finalRemoteUrl = uploadResult?.remoteUrl || finalDataUrl;

        const payloadObj = {
          attachment: {
            name: att.name,
            originalName: att.originalName || att.name,
            size: att.size,
            type: att.type,
            category: att.category,
            dataUrl: finalDataUrl,
            remoteUrl: finalRemoteUrl,
            thumbnail: uploadResult?.thumbnail || att.thumbnail,
            isImage: att.isImage || att.category === 'IMAGE',
          },
          caption: caption || '',
        };

        const msgType = att.isImage ? 'IMAGE' : 'FILE';
        await handleSend(JSON.stringify(payloadObj), msgType);
      } catch (err) {
        console.error('Failed to send attachment:', err);
      }
    }
  };

  const handleConversationCreated = (conv) => {
    addConversation(conv, user?.userId);
    handleSelectConversation(conv);
    setShowNewConvModal(false);
  };

  const handleConversationJoined = (conv) => {
    addConversation(conv, user?.userId);
    handleSelectConversation(conv);
    setShowJoinModal(false);
  };

  const handleParticipantAdded = (participant) => {
    if (!activeConversation) return;
    const currentList = participantMap[activeConversation.id] || [];
    setParticipants(activeConversation.id, [...currentList, participant]);
  };

  const handleParticipantRemoved = (userId) => {
    if (!activeConversation) return;
    const currentList = participantMap[activeConversation.id] || [];
    setParticipants(
      activeConversation.id,
      currentList.filter((p) => p.userId !== userId)
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const currentParticipants = activeConversation
    ? participantMap[activeConversation.id] || []
    : [];

  if (!isAuthenticated) return null;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        user={user}
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        onSelectConversation={handleSelectConversation}
        onNewConversation={() => setShowNewConvModal(true)}
        onOpenById={() => setShowJoinModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        connectionStatus={connectionStatus}
        isLoading={isLoadingConversations}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Canvas */}
      <main
        onDragOver={fileSelector.handleDragOver}
        onDragLeave={fileSelector.handleDragLeave}
        onDrop={fileSelector.handleDrop}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-chat, #f8fafc)',
          position: 'relative',
        }}
      >
        {/* Glowing Drag-and-Drop Overlay */}
        <DropzoneOverlay isDragging={fileSelector.isDragging} />

        {!activeConversation ? (
          /* Empty / Unselected State */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px) saturate(190%)',
                WebkitBackdropFilter: 'blur(20px) saturate(190%)',
                borderRadius: '24px',
                padding: '48px 40px',
                maxWidth: '460px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  marginBottom: '20px',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                }}
              >
                💬
              </div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  margin: '0 0 8px',
                }}
              >
                Start a Conversation
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: 1.6,
                  margin: '0 0 24px',
                }}
              >
                Find a user by phone or username to start chatting.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowNewConvModal(true)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  + Start a Conversation
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  🔗 Open by ID
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat Conversation Area */
          <>
            <ChatHeader
              conversation={activeConversation}
              participants={currentParticipants}
              connectionStatus={connectionStatus}
              onManageParticipants={() => setShowParticipantsModal(true)}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
              onToggleAiSummary={() => setIsAiSummaryOpen((prev) => !prev)}
              isAiSummaryOpen={isAiSummaryOpen}
              isAiSummaryGenerating={summarizer.isGenerating}
              hasAiSummary={Boolean(summarizer.summary)}
            />

            <div
              style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  height: '100%',
                }}
              >
                <MessageThread
                  messages={messages}
                  currentUserId={user?.userId}
                  isLoading={messagesLoading}
                  onSelectImage={(img) => setActiveLightboxImage(img)}
                />

                <MessageInput
                  onSend={handleSend}
                  onSendAttachments={handleSendAttachments}
                  fileSelector={fileSelector}
                  disabled={false}
                />
              </div>

              <AiSummaryPanel
                isOpen={isAiSummaryOpen}
                onClose={() => setIsAiSummaryOpen(false)}
                conversationName={activeConversation?.name}
                summarizer={summarizer}
              />
            </div>
          </>
        )}
      </main>

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        image={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
      />

      {/* Modals */}
      <NewConversationModal
        isOpen={showNewConvModal}
        onClose={() => setShowNewConvModal(false)}
        onConversationCreated={handleConversationCreated}
        currentUserId={user?.userId}
      />

      {activeConversation && (
        <ManageParticipantsModal
          isOpen={showParticipantsModal}
          onClose={() => setShowParticipantsModal(false)}
          conversation={activeConversation}
          participants={currentParticipants}
          currentUserId={user?.userId}
          onParticipantAdded={handleParticipantAdded}
          onParticipantRemoved={handleParticipantRemoved}
        />
      )}

      <JoinConversationModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        currentUserId={user?.userId}
        onConversationJoined={handleConversationJoined}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default ChatPage;
