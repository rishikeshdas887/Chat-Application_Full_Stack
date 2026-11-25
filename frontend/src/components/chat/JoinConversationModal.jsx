import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import * as conversationApi from '../../api/conversationApi';

const JoinConversationModal = ({
  isOpen,
  onClose,
  currentUserId,
  onConversationJoined,
}) => {
  const [convIdInput, setConvIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setConvIdInput('');
    setError('');
    onClose();
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const id = convIdInput.trim();
    if (!id || isNaN(Number(id))) {
      setError('Please enter a valid numeric Conversation ID.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Fetch conversation details
      const conv = await conversationApi.getConversation(Number(id));

      // 2. Ensure current user is a participant
      if (currentUserId) {
        try {
          await conversationApi.addParticipant(conv.id, currentUserId);
        } catch (addErr) {
          // Verify if user is already a participant
          let isPart = false;
          try {
            isPart = await conversationApi.isParticipant(conv.id, currentUserId);
          } catch {
            isPart = false;
          }

          if (!isPart) {
            setError(
              addErr.response?.data?.error ||
                'Could not join conversation: membership could not be verified.'
            );
            return;
          }
        }
      }

      onConversationJoined(conv);
      handleClose();
    } catch (err) {
      setError(
        err.response?.status === 404
          ? `Conversation #${id} not found.`
          : 'Could not open conversation. Please check the ID.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Open Conversation by ID"
      subtitle="Access any conversation by entering its ID"
      maxWidth="420px"
    >
      <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Conversation ID"
          placeholder="e.g. 1"
          value={convIdInput}
          onChange={(e) => setConvIdInput(e.target.value)}
          required
          autoFocus
        />

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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Open Conversation
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default JoinConversationModal;
