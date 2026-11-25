import React from 'react';

const GRADIENTS = [
  'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
  'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
  'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
];

const getGradient = (name = '') => {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return GRADIENTS[code % GRADIENTS.length];
};

const getInitials = (name = '') => {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const chars = Array.from(parts[0]);
    return chars.slice(0, 2).join('').toUpperCase();
  }
  const firstChars = Array.from(parts[0]);
  const lastChars = Array.from(parts[parts.length - 1]);
  return ((firstChars[0] || '') + (lastChars[0] || '')).toUpperCase();
};

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 60,
};

const fontSizeMap = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 22,
};

const Avatar = ({ name = '', size = 'md', isOnline, showPresence = false, className = '' }) => {
  const px = sizeMap[size] || sizeMap.md;
  const fs = fontSizeMap[size] || fontSizeMap.md;
  const background = getGradient(name);
  const initials = getInitials(name);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: px,
        height: px,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: background,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: fs,
          fontWeight: 600,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          letterSpacing: '-0.02em',
        }}
      >
        {initials}
      </div>
      {showPresence && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: Math.max(8, px * 0.28),
            height: Math.max(8, px * 0.28),
            borderRadius: '50%',
            backgroundColor: isOnline ? '#10b981' : '#94a3b8',
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
          }}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
