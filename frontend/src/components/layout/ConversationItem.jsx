import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

const getPreviewText = (lastMessage) => {
  if (!lastMessage) return null;
  if (typeof lastMessage === 'string' && lastMessage.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(lastMessage.trim());
      if (parsed.attachment) {
        const isImg =
          parsed.attachment.isImage ||
          parsed.attachment.type?.startsWith('image/') ||
          parsed.attachment.category === 'IMAGE';
        const name = parsed.attachment.name || 'Attachment';
        const prefix = isImg ? '📷 Photo' : `📄 ${name}`;
        return parsed.caption ? `${prefix} · ${parsed.caption}` : prefix;
      }
    } catch {
      // ignore
    }
  }
  return lastMessage;
};

const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const [hovered, setHovered] = useState(false);

  const isGroup = conversation.type === 'GROUP';
  const displayName = conversation.name || (isGroup ? 'Group Chat' : 'Direct Message');
  const timeStr = formatTime(conversation.lastMessageTime || conversation.createdAt);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={isActive}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        cursor: 'pointer',
        backgroundColor: isActive
          ? 'rgba(99, 102, 241, 0.22)'
          : hovered
          ? 'rgba(255, 255, 255, 0.06)'
          : 'transparent',
        borderRadius: '10px',
        margin: '2px 8px',
        transition: 'background-color 150ms ease, transform 150ms ease, box-shadow 150ms ease',
        borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
        boxShadow: isActive
          ? '0 4px 14px rgba(79, 70, 229, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
          : 'none',
        border: isActive ? '1px solid rgba(129, 140, 248, 0.35)' : '1px solid transparent',
        backdropFilter: isActive || hovered ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: isActive || hovered ? 'blur(8px)' : 'none',
        position: 'relative',
      }}
    >
      <Avatar name={displayName} size="md" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontWeight: isActive ? 600 : 500,
              fontSize: '14px',
              color: '#f8fafc',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {displayName}
          </span>
          {timeStr && (
            <span
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                flexShrink: 0,
              }}
            >
              {timeStr}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: isActive ? '#cbd5e1' : '#94a3b8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {getPreviewText(conversation.lastMessage) || (
              <span style={{ fontStyle: 'italic', opacity: 0.8 }}>No messages yet</span>
            )}
          </span>

          <Badge variant={isGroup ? 'primary' : 'neutral'} size="sm">
            {conversation.type || 'PRIVATE'}
          </Badge>
        </div>
      </div>
    </li>
  );
};

export default ConversationItem;
