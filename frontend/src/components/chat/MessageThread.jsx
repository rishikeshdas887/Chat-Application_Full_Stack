import React, { useEffect, useRef, useState, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import Skeleton from '../ui/Skeleton';

const getDayInfo = (dateStr) => {
  if (!dateStr) return { key: 'earlier', label: 'Earlier' };
  const d = new Date(dateStr);
  const now = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const key = `${year}-${month}-${day}`;

  if (d.toDateString() === now.toDateString()) return { key, label: 'Today' };
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return { key, label: 'Yesterday' };

  const currentYear = now.getFullYear();
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  if (year !== currentYear) {
    options.year = 'numeric';
  }
  return { key, label: d.toLocaleDateString([], options) };
};

const MessageThread = ({
  messages = [],
  currentUserId,
  isLoading = false,
  onSelectImage,
}) => {
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevLoadingRef = useRef(isLoading);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Group messages by day
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentKey = null;
    let currentLabel = '';
    let currentList = [];

    messages.forEach((msg) => {
      const { key, label } = getDayInfo(msg.createdAt);
      if (key !== currentKey) {
        if (currentList.length > 0) {
          groups.push({ key: currentKey, label: currentLabel, items: currentList });
        }
        currentKey = key;
        currentLabel = label;
        currentList = [msg];
      } else {
        currentList.push(msg);
      }
    });

    if (currentList.length > 0) {
      groups.push({ key: currentKey, label: currentLabel, items: currentList });
    }

    return groups;
  }, [messages]);

  // Track scroll position
  const handleScroll = (e) => {
    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceToBottom < 100;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottom(!nearBottom);
  };

  const scrollToBottom = (behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    isNearBottomRef.current = true;
    setShowScrollBottom(false);
  };

  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = isLoading;
    if (isLoading) return;

    const lastMsg = messages[messages.length - 1];
    const isSentByMe = lastMsg && currentUserId && String(lastMsg.senderId) === String(currentUserId);

    if (wasLoading) {
      scrollToBottom('instant');
    } else if (isNearBottomRef.current || isSentByMe) {
      scrollToBottom('smooth');
    }
  }, [messages, isLoading, currentUserId]);

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: 'var(--bg-chat, #0b1120)',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Skeleton width="36px" height="36px" borderRadius="50%" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '50%' }}>
            <Skeleton width="30%" height="12px" />
            <Skeleton width="100%" height="48px" borderRadius="12px" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '45%', alignItems: 'flex-end' }}>
            <Skeleton width="100%" height="56px" borderRadius="12px" />
            <Skeleton width="20%" height="10px" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Skeleton width="36px" height="36px" borderRadius="50%" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '60%' }}>
            <Skeleton width="40%" height="12px" />
            <Skeleton width="100%" height="64px" borderRadius="12px" />
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-chat, #0b1120)',
          padding: '24px',
          textAlign: 'center',
          gap: '14px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            color: '#818cf8',
          }}
        >
          ⚡
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main, #f8fafc)' }}>
          Start the conversation
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', maxWidth: '340px', margin: 0, lineHeight: 1.5 }}>
          Type a message, paste images directly from your clipboard, or attach files using the attachment icon.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-chat, #0b1120)',
      }}
    >
      {/* Scrollable Message List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0',
        }}
      >
        {groupedMessages.map((group) => (
          <div key={group.key}>
            {/* Day Separator Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '16px 0 12px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted, #94a3b8)',
                  backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.08))',
                  border: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04))',
                }}
              >
                {group.label}
              </span>
            </div>

            {/* Group items */}
            {group.items.map((msg, idx) => {
              const isOwn = currentUserId && String(msg.senderId) === String(currentUserId);
              const prevMsg = group.items[idx - 1];
              const showSender = !prevMsg || String(prevMsg.senderId) !== String(msg.senderId);

              return (
                <MessageBubble
                  key={msg.id ?? `${group.key}-${idx}`}
                  message={msg}
                  isOwn={isOwn}
                  showSender={showSender}
                  onSelectImage={onSelectImage}
                />
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} style={{ height: '8px' }} />
      </div>

      {/* Floating Jump to latest button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            backgroundColor: 'var(--bg-card, #111827)',
            color: 'var(--text-main, #f8fafc)',
            border: '1px solid var(--border-light, rgba(255, 255, 255, 0.15))',
            borderRadius: '9999px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 500,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
          }}
        >
          <span>↓ Jump to latest</span>
        </button>
      )}
    </div>
  );
};

export default MessageThread;
