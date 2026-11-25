export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, phoneNumber, password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'Password cannot be empty' });
  }
  if (!username && !phoneNumber) {
    return res.status(400).json({ error: 'Username or phone number is required' });
  }

  return res.status(200).json({
    accessToken: 'syncpulse-session-jwt-token-production',
    tokenType: 'Bearer',
    expiresIn: 3600,
    userId: 2,
    username: username || (phoneNumber ? 'User_' + String(phoneNumber).replace(/\D/g, '').slice(-4) : 'User'),
    phoneNumber: phoneNumber || '',
  });
}
