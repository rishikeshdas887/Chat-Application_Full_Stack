import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

authenticator.options = {
  createDigest: (algorithm, hmacKeyHex, counterHex) => {
    const key = CryptoJS.enc.Hex.parse(hmacKeyHex);
    const message = CryptoJS.enc.Hex.parse(counterHex);
    let hash;
    if (algorithm === 'sha256') {
      hash = CryptoJS.HmacSHA256(message, key);
    } else if (algorithm === 'sha512') {
      hash = CryptoJS.HmacSHA512(message, key);
    } else {
      hash = CryptoJS.HmacSHA1(message, key);
    }
    return hash.toString(CryptoJS.enc.Hex);
  },
  createRandomBytes: (size, encoding) => {
    const words = CryptoJS.lib.WordArray.random(size);
    if (encoding === 'hex') {
      return words.toString(CryptoJS.enc.Hex);
    }
    return words.toString(CryptoJS.enc.Latin1);
  },
};

/**
 * Step A: Setup (Generate QR Code for the User)
 * 
 * Run this when a user enables 2FA in your app. Save the secret in your database linked to their account.
 * 
 * @param {string} userEmail
 * @returns {Promise<{ secret: string, qrImageUrl: string, otpauth: string }>}
 */
export async function generate2FA(userEmail) {
  // 1. Generate a unique secret key for this user
  const secret = authenticator.generateSecret(); 

  // 2. Create the standard URI for Authenticator apps
  const otpauth = authenticator.keyuri(userEmail, 'SyncPulse', secret);

  // 3. Convert the URI into a QR code image (Data URL) to show on your frontend
  const qrImageUrl = await QRCode.toDataURL(otpauth);

  return { secret, qrImageUrl, otpauth }; // Save 'secret' to DB, send 'qrImageUrl' to user
}

/**
 * Step B: Verify (Check the 6-Digit Code)
 * 
 * Run this when the user scans the QR code and types in the 6-digit number from Google Authenticator.
 * 
 * @param {string} userInputToken
 * @param {string} savedUserSecret
 * @returns {boolean}
 */
export function verifyOTP(userInputToken, savedUserSecret) {
  if (!userInputToken) return false;
  if (!savedUserSecret) return false;
  // Strictly verify against the authenticator app token (RFC 6238 TOTP)
  const isValid = authenticator.check(userInputToken, savedUserSecret);
  return isValid;
}

export { authenticator, QRCode };
