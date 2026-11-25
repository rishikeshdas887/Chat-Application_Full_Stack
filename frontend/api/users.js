const registeredUsers = global.registeredUsers || new Map([
  ['+916297799544', { id: 2, username: 'Rishikesh', phoneNumber: '+916297799544' }]
]);
global.registeredUsers = registeredUsers;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST /api/users - Register
  if (req.method === 'POST') {
    const { username, phoneNumber, password } = req.body || {};
    const cleanPhone = (phoneNumber || '').trim().replace(/[\s\-()]/g, '');

    if (!cleanPhone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (registeredUsers.has(cleanPhone)) {
      return res.status(409).json({
        error: 'Number Already Present in Database',
        message: 'Number Already Present in Database',
      });
    }

    const userId = Date.now();
    const cleanUsername = (username || '').trim() || `User_${cleanPhone.slice(-4)}`;
    const userRecord = {
      id: userId,
      userId,
      username: cleanUsername,
      phoneNumber: cleanPhone,
      createdAt: new Date().toISOString(),
    };

    registeredUsers.set(cleanPhone, userRecord);

    return res.status(200).json(userRecord);
  }

  if (req.method === 'GET') {
    return res.status(200).json(Array.from(registeredUsers.values()));
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
