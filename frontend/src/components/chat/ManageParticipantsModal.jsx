import React, { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import * as userApi from '../../api/userApi';
import * as conversationApi from '../../api/conversationApi';

const ManageParticipantsModal = ({
  isOpen,
  onClose,
  conversation,
  participants = [],
  currentUserId,
  onParticipantAdded,
  onParticipantRemoved,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('AUTO'); // 'AUTO' | 'PHONE' | 'ID'
  const [foundUser, setFoundUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const searchGenRef = useRef(0);

  const handleClose = () => {
    searchGenRef.current += 1;
    setIsSearching(false);
    setSearchQuery('');
    setFoundUser(null);
    setError('');
    setSuccess('');
    onClose();
  };

  const handleFindUser = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    const currentGen = ++searchGenRef.current;
    setIsSearching(true);
    setError('');
    setSuccess('');
    setFoundUser(null);

    try {
      // First try phone or username
      let user = null;
      try {
        user = await userApi.getUserByPhone(q);
      } catch (phoneErr) {
        if (/^\d+$/.test(q)) {
          user = await userApi.getUserById(Number(q));
        } else {
          throw phoneErr;
        }
      }
      if (searchGenRef.current !== currentGen) return;
      if (user) {
        setFoundUser(user);
        return;
      }
    } catch {
      if (searchGenRef.current !== currentGen) return;
      setError('User not found. Check phone number (e.g. +919876543210) or username.');
    } finally {
      if (searchGenRef.current === currentGen) {
        setIsSearching(false);
      }
    }
  };

  const handleModeChange = (mode) => {
    searchGenRef.current += 1;
    setSearchMode(mode);
    setFoundUser(null);
    setIsSearching(false);
    setError('');
  };

  const handleQueryChange = (val) => {
    searchGenRef.current += 1;
    setSearchQuery(val);
    setFoundUser(null);
    setIsSearching(false);
    setError('');
  };

  const handleAddParticipant = async () => {
    if (!foundUser || !conversation?.id) return;
    const additionGen = searchGenRef.current;
    setIsAdding(true);
    setError('');
    setSuccess('');

    try {
      const added = await conversationApi.addParticipant(conversation.id, foundUser.id);
      setSuccess(`Added ${foundUser.username} to this conversation!`);
      if (searchGenRef.current === additionGen) {
        setFoundUser(null);
        setSearchQuery('');
      }
      onParticipantAdded(added);
    } catch (err) {
      setError(err.response?.data?.error || 'User is already a participant or could not be added.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (participant) => {
    if (!conversation?.id || !participant?.userId) return;
    const uid = participant.userId;
    setRemovingIds((prev) => new Set(prev).add(uid));
    setError('');
    setSuccess('');

    try {
      await conversationApi.removeParticipant(conversation.id, uid);
      setSuccess(`Removed ${participant.username || 'member'}.`);
      onParticipantRemoved(uid);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove participant.');
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Conversation Members"
      subtitle={`Manage members for #${conversation?.id} (${conversation?.name || conversation?.type})`}
      maxWidth="520px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Add new member section */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              Add Participant by Phone or Username
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFindUser();
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Phone (+919876543210) or username..."
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              loading={isSearching}
              disabled={!searchQuery.trim()}
            >
              Lookup
            </Button>
          </form>

          {foundUser && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar name={foundUser.username} size="sm" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    {foundUser.username}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {foundUser.phoneNumber}
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddParticipant}
                loading={isAdding}
              >
                Add Member
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#dc2626',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#16a34a',
            }}
          >
            {success}
          </div>
        )}

        {/* Existing Members list */}
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Current Members ({participants.length})</span>
          </div>

          {participants.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
              No participant records found for this conversation.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            >
              {participants.map((p) => {
                const isMe = currentUserId && String(p.userId) === String(currentUserId);
                return (
                  <div
                    key={p.id || p.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={p.username || 'Member'} size="sm" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                          {p.username || `User #${p.userId}`} {isMe && '(You)'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {p.role || 'Member'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant={p.role === 'ADMIN' ? 'primary' : 'neutral'} size="sm">
                        {p.role || 'MEMBER'}
                      </Badge>
                      {!isMe && (
                        <button
                          onClick={() => handleRemove(p)}
                          disabled={removingIds.has(p.userId)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                            padding: '4px 8px',
                            borderRadius: '4px',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = 'transparent')
                          }
                        >
                          {removingIds.has(p.userId) ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="secondary" onClick={handleClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ManageParticipantsModal;
