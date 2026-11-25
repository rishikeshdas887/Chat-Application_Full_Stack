import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

const OtpVerificationStep = ({
  phoneNumber,
  challengeId,
  totpSecret = '',
  qrUri = '',
  qrImageUrl = '',
  onVerifyOtp,
  onResendOtp,
  onBack,
  isLoading = false,
  externalError = '',
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [expiryCountdown, setExpiryCountdown] = useState(600); // 10 minutes session TTL
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState(qrImageUrl || '');
  const [copiedKey, setCopiedKey] = useState(false);
  const [showQrSection, setShowQrSection] = useState(true);

  const inputRefs = useRef([]);

  // Set QR Code data URL from qrImageUrl or generate from qrUri
  useEffect(() => {
    if (qrImageUrl) {
      setQrDataUrl(qrImageUrl);
    } else if (qrUri) {
      QRCode.toDataURL(qrUri, {
        width: 170,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [qrImageUrl, qrUri]);

  // 10-Minute Expiry Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setExpiryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [challengeId]);

  // 60-Second Resend Cooldown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Submit handler
  const submitCode = useCallback(
    (codeDigits) => {
      const code = codeDigits.join('');
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        setError('Please enter all 6 digits.');
        return;
      }
      if (expiryCountdown <= 0) {
        setError('This session has expired. Please refresh or request a new code.');
        return;
      }
      setError('');
      onVerifyOtp(code);
    },
    [expiryCountdown, onVerifyOtp]
  );

  // Handle single digit change
  const handleChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    const updated = [...digits];
    if (cleanValue.length > 1) {
      const chars = cleanValue.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (i < 6) updated[i] = c;
      });
      setDigits(updated);
      const nextIdx = Math.min(chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      if (chars.length === 6) {
        submitCode(updated);
      }
      return;
    }

    updated[index] = cleanValue.slice(-1);
    setDigits(updated);
    if (error) setError('');

    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && cleanValue) {
      const allFilled = updated.every((d) => d !== '');
      if (allFilled) {
        submitCode(updated);
      }
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const updated = [...digits];
        updated[index - 1] = '';
        setDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle clipboard paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasteData) return;

    const chars = pasteData.slice(0, 6).split('');
    const updated = [...digits];
    chars.forEach((char, i) => {
      if (i < 6) updated[i] = char;
    });
    setDigits(updated);

    const focusIndex = Math.min(chars.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (chars.length === 6) {
      submitCode(updated);
    }
  };

  // Copy TOTP Secret Key
  const handleCopyKey = () => {
    if (!totpSecret) return;
    navigator.clipboard.writeText(totpSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Handle Resend / Regenerate
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError('');
    setDigits(['', '', '', '', '', '']);
    setResendCooldown(60);
    setExpiryCountdown(600);
    if (onResendOtp) {
      await onResendOtp();
    }
    inputRefs.current[0]?.focus();
  };

  const formatExpiry = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            color: '#818cf8',
          }}
        >
          {/* Authenticator / Shield Icon */}
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
          Authenticator App OTP
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Enter the 6-digit verification code from your <strong style={{ color: '#e2e8f0' }}>Google Authenticator</strong> or <strong style={{ color: '#e2e8f0' }}>Microsoft Authenticator</strong> app.
        </p>
      </div>

      {/* TOTP Setup Card (QR Code & Secret Key) */}
      {(qrDataUrl || totpSecret) && (
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setShowQrSection((prev) => !prev)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                Scan QR or enter key in Authenticator app
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 500 }}>
              {showQrSection ? 'Hide ▲' : 'Show ▼'}
            </span>
          </div>

          {showQrSection && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                paddingTop: '6px',
              }}
            >
              {qrDataUrl && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '8px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={qrDataUrl}
                    alt="Authenticator QR Code"
                    style={{ width: '140px', height: '140px', display: 'block' }}
                  />
                </div>
              )}

              {totpSecret && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Secret Setup Key
                    </span>
                    <span
                      data-testid="totp-secret-key"
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        letterSpacing: '0.08em',
                        color: '#a5b4fc',
                        fontWeight: 600,
                      }}
                    >
                      {totpSecret}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyKey}
                    style={{
                      background: copiedKey ? '#10b981' : 'rgba(99, 102, 241, 0.2)',
                      color: copiedKey ? '#ffffff' : '#818cf8',
                      border: '1px solid ' + (copiedKey ? '#10b981' : 'rgba(99, 102, 241, 0.4)'),
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {copiedKey ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              )}

              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                Open Google Authenticator → tap <strong style={{ color: '#fff' }}>+</strong> → choose <strong style={{ color: '#fff' }}>Scan a QR code</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6-Digit Code Inputs */}
      <div
        className="otp-inputs-wrapper"
        style={{
          display: 'flex',
          gap: 'clamp(4px, 1.5vw, 8px)',
          justifyContent: 'center',
          marginTop: '4px',
          width: '100%',
        }}
        onPaste={handlePaste}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            className="otp-digit-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isLoading || expiryCountdown <= 0}
            style={{
              width: 'clamp(36px, 11vw, 46px)',
              height: 'clamp(44px, 12vw, 52px)',
              textAlign: 'center',
              fontSize: 'clamp(18px, 5vw, 22px)',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1.5px solid ${
                digit ? '#6366f1' : error ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'
              }`,
              borderRadius: '10px',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: digit ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none',
              flexShrink: 0,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#818cf8';
              e.target.style.boxShadow = '0 0 12px rgba(129, 140, 248, 0.4)';
              e.target.select();
            }}
            onBlur={(e) => {
              e.target.style.borderColor = digit ? '#6366f1' : 'rgba(255, 255, 255, 0.15)';
              e.target.style.boxShadow = digit ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none';
            }}
          />
        ))}
      </div>

      {/* Expiry & Resend Timers */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          padding: '0 4px',
        }}
      >
        <span style={{ color: expiryCountdown < 60 ? '#f87171' : '#94a3b8' }}>
          {expiryCountdown > 0 ? (
            <>Session expires in <span style={{ fontWeight: 600 }}>{formatExpiry(expiryCountdown)}</span></>
          ) : (
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Session expired</span>
          )}
        </span>

        {resendCooldown > 0 ? (
          <span style={{ color: '#64748b' }}>
            New key in {resendCooldown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#818cf8',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Regenerate Key
          </button>
        )}
      </div>


      {/* Error Message Display */}
      {(error || externalError) && (
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
          <span>{error || externalError}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2px' }}>
        <button
          type="button"
          onClick={() => submitCode(digits)}
          disabled={isLoading || digits.join('').length !== 6 || expiryCountdown <= 0}
          style={{
            width: '100%',
            padding: '12px 18px',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor:
              isLoading || digits.join('').length !== 6 || expiryCountdown <= 0
                ? 'not-allowed'
                : 'pointer',
            opacity:
              isLoading || digits.join('').length !== 6 || expiryCountdown <= 0 ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
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
              Verifying...
            </>
          ) : (
            'Verify & Sign In'
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
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>
    </div>
  );
};

export default OtpVerificationStep;
