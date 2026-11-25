import { verifyOTP } from './totpService.js';

const userSecrets = global.userSecrets || new Map();
global.userSecrets = userSecrets;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { challengeId, otp, phoneNumber } = req.body || {};
  if (!challengeId || !otp) {
    return res.status(400).json({ error: 'Challenge ID and OTP are required' });
  }

  const cleanOtp = String(otp).trim();
  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return res.status(400).json({ error: 'OTP must be a 6-digit numeric code' });
  }

  // Retrieve secret from challengeId or in-memory map
  let secret = '';
  let accountId = phoneNumber ? String(phoneNumber).trim() : '';

  if (challengeId.startsWith('ch_')) {
    try {
      const decodedJson = Buffer.from(challengeId.slice(3), 'base64url').toString('utf8');
      const parsed = JSON.parse(decodedJson);
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        return res.status(401).json({ error: 'OTP challenge has expired. Please request a new code.' });
      }
      secret = parsed.secret;
      if (!accountId) accountId = parsed.phoneNumber;
    } catch {
      // ignore
    }
  }

  if (!secret && accountId) {
    secret = userSecrets.get(accountId);
  }

  // Verify code with otplib
  const isValid = verifyOTP(cleanOtp, secret);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid 6-digit Authenticator code. Please check your app.' });
  }

  const cleanPhone = accountId.replace(/[\s\-()]/g, '');
  const isOwner = cleanPhone.endsWith('6297799544');
  const digits = cleanPhone.replace(/\D/g, '');
  const username = isOwner
    ? 'Rishikesh'
    : (digits.length >= 4 ? 'User_' + digits.slice(-4) : 'SyncPulse User');

  return res.status(200).json({
    accessToken: 'syncpulse-session-jwt-token-production',
    tokenType: 'Bearer',
    expiresIn: 3600,
    userId: isOwner ? 2 : Math.floor(1000 + Math.random() * 9000),
    username: username,
    phoneNumber: cleanPhone,
  });
}
