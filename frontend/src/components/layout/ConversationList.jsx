import React from 'react';
import ConversationItem from './ConversationItem';
import Skeleton from '../ui/Skeleton';

const ConversationList = ({
  conversations = [],
  activeId,
  onSelect,
  isLoading = false,
  onNewConversation,
}) => {
  if (isLoading) {
    return (
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton width="40px" height="40px" borderRadius="50%" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton width="60%" height="14px" />
              <Skeleton width="85%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#94a3b8',
        }}
      >
        <span style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.8 }}>💬</span>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0', marginBottom: '6px' }}>
          No conversations found
        </p>
        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
          Start a new conversation or open an existing one with its ID.
        </p>
        {onNewConversation && (
          <button
            onClick={onNewConversation}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#4f46e5',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            }}
          >
            + Start a Conversation
          </button>
        )}
      </div>
    );
  }

  return (
    <ul style={{ padding: '6px 0', margin: 0, listStyle: 'none' }}>
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeId}
          onClick={() => onSelect(conv)}
        />
      ))}
    </ul>
  );
};

export default ConversationList;
