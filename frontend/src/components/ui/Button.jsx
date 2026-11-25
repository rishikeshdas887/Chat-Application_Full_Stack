import React, { useState } from 'react';

const variantMap = {
  primary: {
    background: '#4f46e5',
    color: '#ffffff',
    border: '1px solid #4338ca',
    hoverBg: '#4338ca',
    boxShadow: '0 1px 2px 0 rgba(79, 70, 229, 0.3)',
  },
  secondary: {
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    hoverBg: '#f8fafc',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  subtle: {
    background: '#eef2ff',
    color: '#4338ca',
    border: '1px solid transparent',
    hoverBg: '#e0e7ff',
    boxShadow: 'none',
  },
  danger: {
    background: '#ef4444',
    color: '#ffffff',
    border: '1px solid #dc2626',
    hoverBg: '#dc2626',
    boxShadow: '0 1px 2px 0 rgba(239, 68, 68, 0.25)',
  },
  ghost: {
    background: 'transparent',
    color: '#64748b',
    border: '1px solid transparent',
    hoverBg: 'rgba(0, 0, 0, 0.05)',
    boxShadow: 'none',
  },
};

const sizeStyles = {
  sm: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '6px',
    gap: '6px',
  },
  md: {
    padding: '8px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    gap: '8px',
  },
  lg: {
    padding: '11px 20px',
    fontSize: '15px',
    borderRadius: '10px',
    gap: '10px',
  },
};

const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  fullWidth = false,
  icon,
  style = {},
}) => {
  const [hovered, setHovered] = useState(false);

  const conf = variantMap[variant] || variantMap.primary;
  const sz = sizeStyles[size] || sizeStyles.md;

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    fontWeight: 500,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    outline: 'none',
    ...sz,
    background: hovered && !disabled && !loading ? conf.hoverBg : conf.background,
    color: conf.color,
    border: conf.border,
    boxShadow: hovered && !disabled ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : conf.boxShadow,
    transform: hovered && !disabled && !loading ? 'translateY(-1px)' : 'none',
    ...style,
  };

  return (
    <button
      type={type}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading ? (
        <span
          style={{
            width: size === 'sm' ? 12 : 16,
            height: size === 'sm' ? 12 : 16,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'btnSpin 0.6s linear infinite',
          }}
        />
      ) : icon ? (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      ) : null}
      {children}
      <style>{`@keyframes btnSpin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
};

export default Button;
