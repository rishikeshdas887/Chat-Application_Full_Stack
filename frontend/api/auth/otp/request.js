import { generate2FA } from './totpService.js';

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

  const { phoneNumber } = req.body || {};
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const accountId = String(phoneNumber).trim();

  // Generate 2FA Secret & QR Code using otplib & qrcode
  const twoFa = await generate2FA(accountId);
  const secret = twoFa.secret;
  const qrImageUrl = twoFa.qrImageUrl;
  const qrUri = twoFa.otpauth;

  // Save to in-memory store
  userSecrets.set(accountId, secret);

  // Embed signed/encoded challenge token for stateless persistence across serverless invocations
  const payload = {
    phoneNumber: accountId,
    secret,
    expiresAt: Date.now() + 600 * 1000,
  };
  const challengeId = 'ch_' + Buffer.from(JSON.stringify(payload)).toString('base64url');

  return res.status(200).json({
    challengeId,
    expiresIn: 600,
    resendAfter: 60,
    message: 'OTP request accepted',
    totpSecret: secret,
    qrUri,
    qrImageUrl,
    isNewSetup: true,
  });
}
