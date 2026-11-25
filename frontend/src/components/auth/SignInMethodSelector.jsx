import React from 'react';

const SignInMethodSelector = ({ onSelectMethod }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.025em',
            margin: '0 0 8px 0',
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Sign in or create a new account.
        </p>
      </div>

      {/* Auth Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* OPTION A: Continue with Phone & Authenticator */}
        <button
          type="button"
          onClick={() => onSelectMethod('phone')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 18px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            color: '#ffffff',
            outline: 'none',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(79, 70, 229, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Phone Icon Badge */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Option A Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                Continue with Phone &amp; Authenticator
              </span>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#64748b"
                viewBox="0 0 24 24"
                style={{ flexShrink: 0 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
              Sign in with Google Authenticator or Microsoft Authenticator (TOTP). Free &amp; instant.
            </p>
          </div>
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 4px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          <span style={{ fontSize: '12px', color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            or
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* OPTION B: Make an Account */}
        <button
          type="button"
          onClick={() => onSelectMethod('register')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 18px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            color: '#ffffff',
            outline: 'none',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(16, 185, 129, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Person Add Icon Badge */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>

          {/* Option B Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                Make an Account
              </span>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#64748b"
                viewBox="0 0 24 24"
                style={{ flexShrink: 0 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
              New here? Create your SyncPulse account in seconds.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SignInMethodSelector;
