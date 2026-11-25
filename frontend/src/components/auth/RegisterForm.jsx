import React, { useState } from 'react';

const RegisterForm = ({ onSubmit, onBackToSignIn, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPending = isLoading || isSubmitting;

  const validate = () => {
    const errs = {};
    const u = username.trim();
    const p = phoneNumber.trim().replace(/[\s\-()]/g, '');

    if (!u) {
      errs.username = 'Username is required.';
    } else if (u.length < 3 || u.length > 40) {
      errs.username = 'Username must be between 3 and 40 characters.';
    }

    if (!p) {
      errs.phoneNumber = 'Phone number is required.';
    } else if (!p.startsWith('+')) {
      errs.phoneNumber = 'Please include country code starting with + (e.g. +919876543210 or +12025550123).';
    } else if (!/^\+[1-9]\d{7,14}$/.test(p)) {
      errs.phoneNumber = 'Enter a valid international phone number in E.164 format (e.g. +919876543210).';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8 || password.length > 72) {
      errs.password = 'Password must be between 8 and 72 characters.';
    }

    return { errs, cleanPhone: p };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isSubmitting) return;

    const { errs, cleanPhone } = validate();
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(username.trim(), cleanPhone, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
          Create an Account
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Join SyncPulse to start chatting with instant sync and local AI.
        </p>
      </div>

      {/* Username */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="reg-username"
          style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', display: 'flex', gap: '4px' }}
        >
          Username <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          id="reg-username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (validationErrors.username) {
              setValidationErrors((prev) => ({ ...prev, username: '' }));
            }
          }}
          placeholder="e.g. AlexMorgan"
          disabled={isPending}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${validationErrors.username ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
            color: '#ffffff',
            fontSize: '15px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {validationErrors.username && (
          <span style={{ fontSize: '12px', color: '#f87171' }}>{validationErrors.username}</span>
        )}
      </div>

      {/* Phone Number */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="reg-phone"
          style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', display: 'flex', gap: '4px' }}
        >
          Phone Number <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          id="reg-phone"
          type="tel"
          autoComplete="tel"
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            if (validationErrors.phoneNumber) {
              setValidationErrors((prev) => ({ ...prev, phoneNumber: '' }));
            }
          }}
          placeholder="+919876543210"
          disabled={isPending}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${validationErrors.phoneNumber ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
            color: '#ffffff',
            fontSize: '15px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {validationErrors.phoneNumber && (
          <span style={{ fontSize: '12px', color: '#f87171' }}>{validationErrors.phoneNumber}</span>
        )}
      </div>

      {/* Password */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="reg-password"
          style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', display: 'flex', gap: '4px' }}
        >
          Password <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: '' }));
              }
            }}
            placeholder="At least 8 characters"
            disabled={isPending}
            style={{
              width: '100%',
              padding: '12px 42px 12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${validationErrors.password ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
              color: '#ffffff',
              fontSize: '15px',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
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
        {validationErrors.password && (
          <span style={{ fontSize: '12px', color: '#f87171' }}>{validationErrors.password}</span>
        )}
      </div>

      {error && (
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
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            width: '100%',
            padding: '12px 18px',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
          }}
        >
          {isPending ? 'Creating Account...' : 'Create Account'}
        </button>

        <button
          type="button"
          onClick={onBackToSignIn}
          disabled={isPending}
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
          }}
        >
          Already have an account? Sign In
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
