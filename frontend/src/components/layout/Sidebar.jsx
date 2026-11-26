import React, { useState, useMemo } from 'react';
import Avatar from '../ui/Avatar';
import ConversationList from './ConversationList';
import ShinyText from '../ui/reactbits/ShinyText';

const Sidebar = ({
  user,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onOpenById,
  onOpenProfile,
  onLogout,
  connectionStatus = 'disconnected',
  isLoading = false,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'DIRECT' | 'GROUP'
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Type filter
      if (filter === 'DIRECT' && conv.type === 'GROUP') return false;
      if (filter === 'GROUP' && conv.type !== 'GROUP') return false;

      // Text search
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchName = conv.name && conv.name.toLowerCase().includes(q);
      const matchId = String(conv.id).includes(q);
      const matchLastMsg = conv.lastMessage && conv.lastMessage.toLowerCase().includes(q);
      return matchName || matchId || matchLastMsg;
    });
  }, [conversations, filter, search]);

  const statusColors = {
    connected: '#10b981',
    connecting: '#f59e0b',
    disconnected: '#94a3b8',
    error: '#ef4444',
  };

  const statusLabels = {
    connected: 'Live Sync',
    connecting: 'Connecting...',
    disconnected: 'Offline',
    error: 'Reconnecting',
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
        />
      )}

      <aside
        className={`syncpulse-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: '320px',
          minWidth: '320px',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 50,
          position: 'relative',
          transition: 'transform 250ms ease-in-out',
        }}
      >
        {/* Top Workspace Header */}
        <div
          style={{
            padding: '18px 20px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              ⚡
            </div>
            <ShinyText
              text="SyncPulse"
              color="#f8fafc"
              shineColor="#818cf8"
              speed={3.5}
              style={{
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Live Status indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                padding: '4px 8px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 500,
                color: '#e2e8f0',
              }}
              title={`WebSocket Status: ${connectionStatus}`}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: statusColors[connectionStatus] || statusColors.disconnected,
                  boxShadow:
                    connectionStatus === 'connected'
                      ? '0 0 8px #10b981'
                      : 'none',
                }}
              />
              <span>{statusLabels[connectionStatus] || 'Offline'}</span>
            </div>

            {/* Mobile close button */}
            {isMobileOpen && (
              <button
                onClick={onCloseMobile}
                aria-label="Close sidebar"
                style={{
                  color: '#94a3b8',
                  fontSize: '16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* User Section with Profile and Logout */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: isProfileHovered ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
            transition: 'background-color 150ms ease',
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={onOpenProfile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenProfile();
              }
            }}
            aria-label="View user profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: 1,
              cursor: 'pointer',
              minWidth: 0,
            }}
            onMouseEnter={() => setIsProfileHovered(true)}
            onMouseLeave={() => setIsProfileHovered(false)}
            title="Click to view/edit profile"
          >
            <Avatar name={user?.username || ''} size="md" showPresence isOnline />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#f8fafc',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.username || 'User'}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.phoneNumber || 'Online'}
              </div>
            </div>
          </div>

          {/* Action icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onOpenProfile}
              title="Account Settings"
              aria-label="Account Settings"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <span>⚙️</span>
              <span style={{ fontSize: '11px' }}>Settings</span>
            </button>
            <button
              onClick={onLogout}
              title="Log Out"
              aria-label="Log Out"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                cursor: 'pointer',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.color = '#f87171';
              }}
            >
              <span>⎋</span>
              <span style={{ fontSize: '11px' }}>Log Out</span>
            </button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ padding: '12px 16px 8px', display: 'flex', gap: '8px' }}>
          <button
            onClick={onNewConversation}
            style={{
              flex: 1,
              padding: '9px 12px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 150ms ease',
              boxShadow: '0 1px 2px rgba(79, 70, 229, 0.3)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4338ca')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
          >
            <span style={{ fontSize: '15px', fontWeight: 600 }}>+</span>
            New Chat
          </button>

          <button
            onClick={onOpenById}
            title="Open conversation by ID"
            style={{
              padding: '9px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')
            }
          >
            <span>🔗</span>
            Join ID
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '4px 16px 8px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                color: '#64748b',
                fontSize: '13px',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              style={{
                width: '100%',
                padding: '8px 28px 8px 30px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '4px 16px 8px',
            gap: '6px',
          }}
        >
          {['ALL', 'DIRECT', 'GROUP'].map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: isActive ? '#a5b4fc' : '#94a3b8',
                  transition: 'all 150ms ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {tab === 'ALL' ? 'All' : tab === 'DIRECT' ? 'Direct' : 'Groups'}
              </button>
            );
          })}
        </div>

        {/* Scrollable Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ConversationList
            conversations={filteredConversations}
            activeId={activeConversationId}
            onSelect={onSelectConversation}
            isLoading={isLoading}
            onNewConversation={onNewConversation}
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
