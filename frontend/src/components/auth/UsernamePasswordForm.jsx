import React, { useState } from 'react';

const UsernamePasswordForm = ({ onLogin, onBack, isLoading, error }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setValidationError('Please enter your username or registered phone number.');
      return;
    }
    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }
    setValidationError('');
    onLogin(identifier.trim(), password);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
          Sign In
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Enter your registered username or phone number and password.
        </p>
      </div>

      {/* Username / Phone input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="identifier-input"
          style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', display: 'flex', gap: '4px' }}
        >
          Username or Phone Number <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          id="identifier-input"
          type="text"
          autoFocus
          autoComplete="username"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (validationError) setValidationError('');
          }}
          placeholder="e.g. AlexMorgan or +919876543210"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${validationError ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
            color: '#ffffff',
            fontSize: '15px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            if (!validationError) e.target.style.borderColor = '#6366f1';
          }}
          onBlur={(e) => {
            if (!validationError) e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
        />
      </div>

      {/* Password input with show/hide toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="password-input"
          style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', display: 'flex', gap: '4px' }}
        >
          Password <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="password-input"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="Enter your password"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 42px 12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${validationError ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
              color: '#ffffff',
              fontSize: '15px',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              if (!validationError) e.target.style.borderColor = '#6366f1';
            }}
            onBlur={(e) => {
              if (!validationError) e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: '4px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {(validationError || error) && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{validationError || error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 18px',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.backgroundColor = '#4338ca';
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.currentTarget.style.backgroundColor = '#4f46e5';
          }}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Choose another sign-in method
        </button>
      </div>
    </form>
  );
};

export default UsernamePasswordForm;
