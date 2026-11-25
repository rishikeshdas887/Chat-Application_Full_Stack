import React from 'react';

const variantMap = {
  primary: {
    bg: '#eef2ff',
    color: '#4f46e5',
    border: 'rgba(79, 70, 229, 0.2)',
  },
  success: {
    bg: '#ecfdf5',
    color: '#059669',
    border: 'rgba(16, 185, 129, 0.2)',
  },
  warning: {
    bg: '#fffbeb',
    color: '#d97706',
    border: 'rgba(245, 158, 11, 0.2)',
  },
  danger: {
    bg: '#fef2f2',
    color: '#dc2626',
    border: 'rgba(239, 68, 68, 0.2)',
  },
  neutral: {
    bg: '#f1f5f9',
    color: '#475569',
    border: 'rgba(148, 163, 184, 0.2)',
  },
};

const Badge = ({ children, variant = 'primary', size = 'sm', className = '' }) => {
  const conf = variantMap[variant] || variantMap.primary;
  const isSm = size === 'sm';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSm ? '2px 8px' : '4px 10px',
        fontSize: isSm ? '11px' : '12px',
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: conf.bg,
        color: conf.color,
        border: `1px solid ${conf.border}`,
        letterSpacing: '0.02em',
        lineHeight: 1.2,
        userSelect: 'none',
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
