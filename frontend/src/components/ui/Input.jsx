import React, { useId } from 'react';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  name,
  id,
  icon,
  rightElement,
  autoComplete,
  className = '',
  autoFocus = false,
}) => {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const ariaDescribedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </span>
        </label>
      )}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
          style={{
            width: '100%',
            padding: icon ? '10px 14px 10px 38px' : '10px 14px',
            paddingRight: rightElement ? '42px' : '14px',
            borderRadius: '10px',
            border: error ? '1px solid #ef4444' : '1px solid rgba(203, 213, 225, 0.85)',
            background: disabled ? '#f1f5f9' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            fontSize: '14px',
            color: '#0f172a',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            opacity: disabled ? 0.7 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: '10px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <span id={errorId} role="alert" style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} style={{ fontSize: '12px', color: '#64748b' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};

export default Input;
