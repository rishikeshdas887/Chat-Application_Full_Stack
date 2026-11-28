import React, { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import SpotlightCard from '../ui/reactbits/SpotlightCard';
import { useAuth } from '../../hooks/useAuth';

const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const editSessionRef = useRef(0);

  const handleModalClose = () => {
    editSessionRef.current += 1;
    setIsEditing(false);
    setIsLoading(false);
    setError('');
    setSuccess('');
    setUsername(user?.username || '');
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    const currentSession = editSessionRef.current;
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(username.trim());
      if (editSessionRef.current !== currentSession) return;
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      if (editSessionRef.current !== currentSession) return;
      setError(err.response?.data?.error || 'Failed to update username.');
    } finally {
      if (editSessionRef.current === currentSession) {
        setIsLoading(false);
      }
    }
  };

  const handleDirectLogout = () => {
    handleModalClose();
    logout();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Account Settings"
      subtitle="Manage your profile, preferences, and session"
      maxWidth="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* User Identity Card with Interactive Spotlight */}
        <SpotlightCard
          spotlightColor="rgba(99, 102, 241, 0.18)"
          intensity={0.65}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Avatar name={user?.username || ''} size="lg" showPresence isOnline />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#0f172a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.username}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              {user?.phoneNumber || 'No phone attached'}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                ● Active Account
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                ● Active Session
              </span>
            </div>
          </div>
        </SpotlightCard>

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

        {/* Display Name / Profile Section */}
        {isEditing ? (
          <form
            onSubmit={handleSave}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
            }}
          >
            <Input
              label="Update Display Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              helperText="3 to 40 characters"
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setUsername(user?.username || '');
                  setError('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={isLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                Display Username
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                {user?.username}
              </div>
            </div>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {
                setUsername(user?.username || '');
                setIsEditing(true);
                setError('');
                setSuccess('');
              }}
            >
              Edit
            </Button>
          </div>
        )}

        {/* Minimal Preferences */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              Message Notifications
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
              Play audio alert on new chat messages
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificationsEnabled((prev) => !prev)}
            style={{
              width: '42px',
              height: '24px',
              borderRadius: '9999px',
              backgroundColor: notificationsEnabled ? '#4f46e5' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 200ms ease',
              padding: 0,
            }}
            aria-label="Toggle notifications"
          >
            <span
              style={{
                display: 'block',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                position: 'absolute',
                top: '3px',
                left: notificationsEnabled ? '21px' : '3px',
                transition: 'left 200ms ease',
              }}
            />
          </button>
        </div>

        {/* Security & Direct Log Out Section */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fff1f2',
            border: '1px solid #ffe4e6',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#9f1239' }}>
              Sign Out of SyncPulse
            </div>
            <div style={{ fontSize: '12px', color: '#be123c', marginTop: '2px' }}>
              Safely end your session and clear local credentials.
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDirectLogout}
          >
            Log Out
          </Button>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserProfileModal;
