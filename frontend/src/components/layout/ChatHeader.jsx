import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import useTheme from '../../hooks/useTheme';
import ShinyText from '../ui/reactbits/ShinyText';

const ChatHeader = ({
  conversation,
  participants = [],
  connectionStatus = 'connected',
  onManageParticipants,
  onToggleMobileSidebar,
  onToggleAiSummary,
  isAiSummaryOpen = false,
  isAiSummaryGenerating = false,
  hasAiSummary = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  if (!conversation) return null;

  const isGroup = conversation.type === 'GROUP';
  const displayName = conversation.name || (isGroup ? 'Group Conversation' : 'Direct Chat');

  const handleCopyId = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(String(conversation.id));
        setCopied(true);
        setCopyFailed(false);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  };

  const statusColors = {
    connected: '#10b981',
    connecting: '#f59e0b',
    disconnected: '#94a3b8',
    error: '#ef4444',
  };

  return (
    <header
      className="chat-header-bar"
      style={{
        height: '68px',
        backgroundColor: 'var(--bg-header, rgba(17, 24, 39, 0.85))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        boxShadow: 'var(--shadow-xs, 0 4px 20px -4px rgba(0, 0, 0, 0.04))',
        zIndex: 10,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Left: Avatar & Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-subtle, rgba(255, 255, 255, 0.08))',
              color: 'var(--text-main, #f8fafc)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
            title="Toggle Sidebar"
          >
            ☰
          </button>
        )}

        <div style={{ position: 'relative' }}>
          <Avatar name={displayName} size="md" />
          <span
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: statusColors[connectionStatus] || statusColors.disconnected,
              border: '2px solid var(--bg-card, #111827)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-main, #f8fafc)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>

            <Badge variant={isGroup ? 'primary' : 'neutral'} size="sm">
              {conversation.type || 'PRIVATE'}
            </Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              {participants.length > 0
                ? `${participants.length} ${participants.length === 1 ? 'member' : 'members'}`
                : 'Members list'}
            </span>
            <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '10px' }}>•</span>
            <span style={{ fontSize: '11px', color: statusColors[connectionStatus] || '#94a3b8' }}>
              {connectionStatus === 'connected' ? 'Live WebSocket' : connectionStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions & Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            backgroundColor: 'var(--bg-subtle, rgba(255, 255, 255, 0.08))',
            border: '1px solid var(--border-light, rgba(255, 255, 255, 0.12))',
            color: 'var(--text-main, #f8fafc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '15px',
            transition: 'all 0.15s ease',
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* AI Summary Toggle */}
        <button
          type="button"
          onClick={onToggleAiSummary}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '9px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backgroundColor: isAiSummaryOpen
              ? 'rgba(79, 70, 229, 0.2)'
              : 'var(--bg-subtle, rgba(255, 255, 255, 0.08))',
            color: isAiSummaryOpen ? '#818cf8' : 'var(--text-main, #f8fafc)',
            border: isAiSummaryOpen
              ? '1px solid rgba(99, 102, 241, 0.5)'
              : '1px solid var(--border-light, rgba(255, 255, 255, 0.12))',
          }}
          title="Toggle Privacy-First Local AI Summary"
        >
          <span>✨</span>
          <span className="desktop-text">
            <ShinyText
              text="AI Summary"
              color={isAiSummaryOpen ? '#818cf8' : 'currentColor'}
              shineColor="#ffffff"
              speed={3}
            />
          </span>
          {isAiSummaryGenerating && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#818cf8',
              }}
            />
          )}
          {hasAiSummary && !isAiSummaryGenerating && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
          )}
        </button>

        {/* Manage Members */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onManageParticipants}
          icon={<span>👥</span>}
        >
          <span className="desktop-text">Members</span>
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
