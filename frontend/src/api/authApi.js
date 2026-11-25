import apiClient from './apiClient';

/**
 * Checks if the identifier is an international phone number (E.164).
 */
export const isPhoneNumber = (val) => {
  if (!val) return false;
  const clean = val.trim().replace(/[\s\-()]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(clean);
};

/**
 * Authenticates user with username or phone number and password.
 * @param {string} identifier - Registered username or international phone number
 * @param {string} password - User password
 * @returns {Promise<{accessToken: string, tokenType: string, expiresIn: number, userId: number, username: string}>}
 */
export const loginWithCredentials = async (identifier, password) => {
  const trimmed = (identifier || '').trim();
  const isPhone = isPhoneNumber(trimmed);
  const payload = isPhone
    ? { phoneNumber: trimmed.replace(/[\s\-()]/g, ''), password }
    : { username: trimmed, password };

  const response = await apiClient.post('/api/auth/login', payload);
  return response.data;
};

/**
 * Backward-compatible login method alias.
 */
export const login = loginWithCredentials;

/**
 * Requests an OTP for phone-number authentication.
 * @param {string} phoneNumber - E.164 format (e.g. +919876543210)
 * @returns {Promise<{challengeId: string, expiresIn: number, resendAfter: number, message: string}>}
 */
export const requestOtp = async (phoneNumber) => {
  const response = await apiClient.post('/api/auth/otp/request', { phoneNumber });
  return response.data;
};

/**
 * Verifies the 6-digit OTP challenge and completes authentication.
 * @param {string} challengeId - UUID challenge identifier from requestOtp
 * @param {string} otp - 6-digit numeric OTP code
 * @returns {Promise<{accessToken: string, tokenType: string, expiresIn: number, userId: number, username: string}>}
 */
export const verifyOtp = async (challengeId, otp, phoneNumber) => {
  const payload = { challengeId, otp };
  if (phoneNumber) payload.phoneNumber = phoneNumber;
  const response = await apiClient.post('/api/auth/otp/verify', payload);
  return response.data;
};

/**
 * Registers a new user account.
 * @param {string} username - 3 to 40 characters
 * @param {string} phoneNumber - E.164 format (+[1-9]\d{7,14})
 * @param {string} password - 8 to 72 characters
 * @returns {Promise<{id: number, username: string, phoneNumber: string, createdAt: string}>}
 */
export const register = async (username, phoneNumber, password) => {
  const response = await apiClient.post('/api/users', { username, phoneNumber, password });
  return response.data;
};
