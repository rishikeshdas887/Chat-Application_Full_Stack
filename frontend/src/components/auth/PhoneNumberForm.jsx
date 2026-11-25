import React, { useState } from 'react';

const PhoneNumberForm = ({ onRequestOtp, onBack, isLoading, error }) => {
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [validationError, setValidationError] = useState('');

  const normalizePhone = (input) => {
    let raw = input.trim().replace(/[\s\-()]/g, '');
    if (/^\d{10}$/.test(raw)) {
      raw = `+91${raw}`;
    } else if (/^0\d{10}$/.test(raw)) {
      raw = `+91${raw.substring(1)}`;
    } else if (!raw.startsWith('+') && /^\d{11,15}$/.test(raw)) {
      raw = `+${raw}`;
    }
    return raw;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanNumber = normalizePhone(phoneNumber);

    if (!cleanNumber || cleanNumber === '+91') {
      setValidationError('Please enter your mobile phone number.');
      return;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(cleanNumber)) {
      setValidationError('Enter a valid mobile phone number with country code (e.g., +919876543210).');
      return;
    }

    setValidationError('');
    onRequestOtp(cleanNumber);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
          Continue with Phone
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Enter your phone number to continue with your Authenticator app.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="phone-input"
          style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', display: 'flex', gap: '4px' }}
        >
          Phone Number <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="phone-input"
            type="tel"
            autoFocus
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="+919876543210"
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
              letterSpacing: '0.02em',
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
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Include country code (e.g. +91 for India, +1 for US/Canada)
        </span>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
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
              Connecting...
            </>
          ) : (
            'Continue to Authenticator'
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

export default PhoneNumberForm;
