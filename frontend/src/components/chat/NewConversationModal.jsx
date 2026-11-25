import React, { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import * as userApi from '../../api/userApi';
import * as conversationApi from '../../api/conversationApi';

const NewConversationModal = ({
  isOpen,
  onClose,
  onConversationCreated,
  currentUserId,
}) => {
  const [type, setType] = useState('PRIVATE'); // 'PRIVATE' | 'GROUP'
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('AUTO'); // 'AUTO' | 'PHONE' | 'ID'
  const [foundUser, setFoundUser] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const createdConvRef = useRef(null);
  const searchGenRef = useRef(0);

  const handleClose = () => {
    searchGenRef.current += 1;
    setIsSearching(false);
    createdConvRef.current = null;
    setType('PRIVATE');
    setName('');
    setSearchQuery('');
    setFoundUser(null);
    setSearchError('');
    setCreateError('');
    onClose();
  };

  const handleFindUser = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    const currentGen = ++searchGenRef.current;
    setIsSearching(true);
    setSearchError('');
    setFoundUser(null);

    try {
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
      setSearchError('User not found. Check phone number (e.g. +919876543210) or username.');
    } finally {
      if (searchGenRef.current === currentGen) {
        setIsSearching(false);
      }
    }
  };

  const handleCreate = async () => {
    if (type === 'GROUP' && !name.trim()) {
      setCreateError('Group name is required.');
      return;
    }

    if (type === 'PRIVATE' && !foundUser) {
      setCreateError('A recipient user is required for a direct message. Search and select a user above.');
      return;
    }

    if (isSearching) {
      setCreateError('Please wait for the recipient search to finish.');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      // 1. Create conversation record or reuse if identical draft retry
      const defaultName = name.trim() || (foundUser ? foundUser.username : 'Direct Chat');
      const draftKey = `${type}:${defaultName}:${foundUser?.id || ''}`;
      let conv = null;

      if (createdConvRef.current && createdConvRef.current.draftKey === draftKey) {
        conv = createdConvRef.current.conv;
      } else {
        conv = await conversationApi.createConversation(type, defaultName);
        createdConvRef.current = { conv, draftKey };
      }

      // 2. Add current user as participant and verify membership
      if (currentUserId && conv.id) {
        try {
          await conversationApi.addParticipant(conv.id, currentUserId);
        } catch (pErr) {
          console.warn('Current user participant record warning:', pErr);
        }

        let isCreatorPart = false;
        try {
          isCreatorPart = await conversationApi.isParticipant(conv.id, currentUserId);
        } catch {
          isCreatorPart = false;
        }

        if (!isCreatorPart) {
          setCreateError(
            `Conversation #${conv.id} was created, but failed to verify creator membership.`
          );
          return;
        }
      }

      // 3. Add recipient if found
      if (foundUser && conv.id) {
        try {
          await conversationApi.addParticipant(conv.id, foundUser.id);
        } catch (recipientErr) {
          // Verify if recipient is actually a participant
          let isPart = false;
          try {
            isPart = await conversationApi.isParticipant(conv.id, foundUser.id);
          } catch {
            isPart = false;
          }

          if (!isPart) {
            setCreateError(
              `Conversation #${conv.id} was created, but failed to add ${foundUser.username} as member. Error: ${recipientErr.response?.data?.error || recipientErr.message
              }`
            );
            return;
          }
        }
      }

      createdConvRef.current = null;
      onConversationCreated(conv);
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.name || 'Failed to create conversation.';
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Conversation"
      subtitle="Start a direct private message or group chat"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Conversation Type Segmented Switch */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
            Conversation Type
          </label>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '4px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => setType('PRIVATE')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: type === 'PRIVATE' ? '#ffffff' : 'transparent',
                color: type === 'PRIVATE' ? '#4f46e5' : '#64748b',
                boxShadow: type === 'PRIVATE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              💬 Direct Message
            </button>
            <button
              type="button"
              onClick={() => setType('GROUP')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: type === 'GROUP' ? '#ffffff' : 'transparent',
                color: type === 'GROUP' ? '#4f46e5' : '#64748b',
                boxShadow: type === 'GROUP' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              👥 Group Chat
            </button>
          </div>
        </div>

        {/* Conversation Name */}
        <Input
          label={type === 'GROUP' ? 'Group Name' : 'Conversation Name (Optional)'}
          placeholder={type === 'GROUP' ? 'e.g., Engineering Team' : 'Optional alias or note'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required={type === 'GROUP'}
        />

        {/* Find Participant */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
            {type === 'GROUP' ? 'Add Initial Member (by Phone or Username)' : 'Direct Message Recipient (by Phone or Username)'}
          </label>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Phone (+919876543210) or username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFindUser();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleFindUser}
              loading={isSearching}
              disabled={!searchQuery.trim()}
            >
              Find
            </Button>
          </div>

          {searchError && (
            <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{searchError}</p>
          )}

          {foundUser && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px 14px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Avatar name={foundUser.username} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
                  {foundUser.username}
                </div>
                <div style={{ fontSize: '11px', color: '#15803d' }}>
                  {foundUser.phoneNumber}
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
                ✓ Selected
              </span>
            </div>
          )}
        </div>

        {createError && (
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
            {createError}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            loading={isCreating}
            disabled={isCreating || isSearching || (type === 'PRIVATE' && !foundUser)}
          >
            Create Conversation
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NewConversationModal;
