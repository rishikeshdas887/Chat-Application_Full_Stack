import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SignInMethodSelector from '../components/auth/SignInMethodSelector';
import PhoneNumberForm from '../components/auth/PhoneNumberForm';
import OtpVerificationStep from '../components/auth/OtpVerificationStep';

import RegisterForm from '../components/auth/RegisterForm';

const CURRENT_YEAR = new Date().getFullYear();

const AuthPage = () => {
  // Modes: 'select' (Screen 1) | 'phone' | 'otp' | 'register'
  const [authStep, setAuthStep] = useState('select');
  const [currentPhone, setCurrentPhone] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [totpData, setTotpData] = useState({ secret: '', qrUri: '', qrImageUrl: '', isNewSetup: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { requestOtp, verifyOtp, register, loginWithCredentials, enterDirectly, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleDirectEnter = (account) => {
    enterDirectly(account);
    navigate('/chat', { replace: true });
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const extractErrorMessage = (err, fallback = 'Failed to process request. Please try again.') => {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
      return 'Unable to connect to server. Please check your network connection or backend status.';
    }
    if (err?.response?.status === 405) {
      return 'Authentication endpoint is not accepting requests on this server (HTTP 405).';
    }
    if (err?.response?.status === 429) {
      const msg = err?.response?.data?.error || err?.response?.data?.message;
      return msg || 'Too many OTP requests. Please wait a moment before trying again.';
    }
    if (err?.response?.status === 502 || err?.response?.status === 504) {
      const msg = err?.response?.data?.error || err?.response?.data?.message;
      return msg || 'SMS gateway is temporarily unavailable. Please retry shortly.';
    }
    // Duplicate phone number on registration → friendly message
    if (err?.response?.status === 409) {
      return 'Number Already Present in Database';
    }
    const data = err?.response?.data;
    if (typeof data === 'string' && data.trim().length > 0 && !data.includes('<!DOCTYPE') && !data.includes('<html')) {
      // Check for duplicate phone in string body
      if (data.toLowerCase().includes('phone') && (data.toLowerCase().includes('already') || data.toLowerCase().includes('duplicate'))) {
        return 'Number Already Present in Database';
      }
      return data.trim();
    }
    if (data && typeof data === 'object') {
      const errorStr = data.error && typeof data.error === 'string' ? data.error.trim() : '';
      const msgStr = data.message && typeof data.message === 'string' ? data.message.trim() : '';
      const combined = errorStr || msgStr;
      if (combined && (combined.toLowerCase().includes('phone') && (combined.toLowerCase().includes('already') || combined.toLowerCase().includes('duplicate')))) {
        return 'Number Already Present in Database';
      }
      if (errorStr) return errorStr;
      if (msgStr) return msgStr;
      const values = Object.values(data).filter((v) => typeof v === 'string' && v.trim().length > 0);
      if (values.length > 0) return values.join('; ');
    }
    if (err?.message && typeof err.message === 'string' && err.message.trim() && err.message !== 'Error') {
      return err.message.trim();
    }
    return fallback;
  };

  // 1. Send OTP Request
  const handleRequestOtp = async (phone) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await requestOtp(phone);
      if (!res || !res.challengeId) {
        throw new Error('Invalid response from authentication server. Please try again.');
      }
      setCurrentPhone(phone);
      setChallengeId(res.challengeId);
      setTotpData({
        secret: res.totpSecret || '',
        qrUri: res.qrUri || '',
        qrImageUrl: res.qrImageUrl || '',
        isNewSetup: res.isNewSetup || false,
      });
      setAuthStep('otp');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send verification code. Please check your number.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Resend OTP Request
  const handleResendOtp = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await requestOtp(currentPhone);
      setChallengeId(res.challengeId);
      if (res.totpSecret) {
        setTotpData({
          secret: res.totpSecret,
          qrUri: res.qrUri || '',
          qrImageUrl: res.qrImageUrl || '',
          isNewSetup: res.isNewSetup || false,
        });
      }
      return res;
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to resend OTP. Please wait before retrying.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP and Sign In
  const handleVerifyOtp = async (code) => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      await verifyOtp(challengeId, code, currentPhone);
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid or expired OTP. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };


  // 5. Account Registration
  const handleRegister = async (username, phone, password) => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await register(username, phone, password);
    } catch (err) {
      setError(extractErrorMessage(err, 'Registration failed. This phone or username may already be in use.'));
      setIsLoading(false);
      return;
    }

    setSuccessMessage('Account created successfully! Entering chat...');
    try {
      if (loginWithCredentials) {
        await loginWithCredentials(username, password);
      } else {
        enterDirectly({ username, phoneNumber: phone });
      }
      navigate('/chat', { replace: true });
    } catch {
      enterDirectly({ username, phoneNumber: phone });
      navigate('/chat', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0d14',
        color: '#f8fafc',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Background Ambient Glows */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '560px',
            height: '560px',
            backgroundColor: '#4f46e5',
            filter: 'blur(120px)',
            opacity: 0.22,
            top: '-120px',
            left: '-100px',
            borderRadius: '9999px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            backgroundColor: '#7c3aed',
            filter: 'blur(130px)',
            opacity: 0.18,
            top: '35%',
            right: '-140px',
            borderRadius: '9999px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '450px',
            height: '450px',
            backgroundColor: '#3b82f6',
            filter: 'blur(110px)',
            opacity: 0.12,
            bottom: '-100px',
            left: '25%',
            borderRadius: '9999px',
          }}
        />
      </div>

      {/* Top Navigation Header */}
      <header
        className="auth-header-bar"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: 'clamp(14px, 3vw, 24px) clamp(16px, 4vw, 32px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                fill="#818cf8"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              SyncPulse
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '4px',
                padding: '2px 6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Cloud
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '12px',
              color: '#cbd5e1',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#34d399',
                boxShadow: '0 0 8px #34d399',
              }}
            />
            <span>Local &amp; Cloud Sync</span>
          </div>
        </div>
      </header>

      {/* Main Content Card */}
      <main
        className="auth-main"
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(12px, 3vw, 24px) clamp(10px, 3vw, 16px)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Glass Card Container */}
          <div
            className="auth-glass-card"
            style={{
              backgroundColor: 'rgba(17, 24, 39, 0.72)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: 'clamp(20px, 5vw, 32px) clamp(16px, 5vw, 28px)',
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
              position: 'relative',
            }}
          >
            {/* Top Soft Gradient Border Accent */}
            <div
              style={{
                position: 'absolute',
                top: '-1px',
                left: '20%',
                right: '20%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
              }}
            />

            {/* Success message banner */}
            {successMessage && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  color: '#4ade80',
                  fontSize: '13px',
                }}
              >
                {successMessage}
              </div>
            )}

            {/* Screen 1: Choose Sign-in Method */}
            {authStep === 'select' && (
              <SignInMethodSelector
                onSelectMethod={(method) => {
                  setError('');
                  setAuthStep(method);
                }}
                onDirectEnter={handleDirectEnter}
              />
            )}

            {/* Step 2A: Phone Number Input */}
            {authStep === 'phone' && (
              <PhoneNumberForm
                onRequestOtp={handleRequestOtp}
                onDirectEnter={handleDirectEnter}
                onBack={() => {
                  setError('');
                  setAuthStep('select');
                }}
                isLoading={isLoading}
                error={error}
              />
            )}

            {/* Step 2B: 6-Digit OTP Verification (TOTP Authenticator) */}
            {authStep === 'otp' && (
              <OtpVerificationStep
                phoneNumber={currentPhone}
                challengeId={challengeId}
                totpSecret={totpData.secret}
                qrUri={totpData.qrUri}
                qrImageUrl={totpData.qrImageUrl}
                onVerifyOtp={handleVerifyOtp}
                onResendOtp={handleResendOtp}
                onBack={() => {
                  setError('');
                  setAuthStep('phone');
                }}
                isLoading={isLoading}
                externalError={error}
              />
            )}


            {/* Registration Form */}
            {authStep === 'register' && (
              <RegisterForm
                onSubmit={handleRegister}
                onDirectEnter={handleDirectEnter}
                onBackToSignIn={() => {
                  setError('');
                  setAuthStep('select');
                }}
                isLoading={isLoading}
                error={error}
              />
            )}
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        © {CURRENT_YEAR} SyncPulse Technologies Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthPage;
