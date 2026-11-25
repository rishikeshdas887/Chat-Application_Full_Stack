import axios from 'axios';
import { generate2FA, verifyOTP } from '../services/totpAuthService';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chatapp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Determine if explicit demo mode is active via build configuration.
 */
export const isExplicitDemoMode = () => {
  return import.meta.env.VITE_DEMO_MODE === 'true';
};

const getParticipantRoster = (convId) => {
  const key = `syncpulse_participants_${convId}`;
  const stored = sessionStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return [];
};

const getRegisteredAccounts = () => {
  try {
    const list = JSON.parse(
      localStorage.getItem('syncpulse_registered_accounts') ||
      localStorage.getItem('syncpulse_registered_users') ||
      '[]'
    );
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const saveRegisteredAccount = (account) => {
  try {
    const list = getRegisteredAccounts();
    const cleanPhone = (account.phoneNumber || '').trim().replace(/[\s\-()]/g, '');
    const filtered = list.filter((u) => u.phoneNumber !== cleanPhone);
    filtered.push({ ...account, phoneNumber: cleanPhone });
    localStorage.setItem('syncpulse_registered_accounts', JSON.stringify(filtered));
  } catch {
    // ignore
  }
};

const saveParticipantRoster = (convId, roster) => {
  const key = `syncpulse_participants_${convId}`;
  sessionStorage.setItem(key, JSON.stringify(roster));
};

/**
 * Standalone mock handler for cloud static hosts when demo mode is active.
 */
const handleMockFallback = async (config) => {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  let body = {};
  if (config.data) {
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch {
      body = {};
    }
  }

  // 1a. Auth OTP Request: POST /api/auth/otp/request
  if (url.includes('/api/auth/otp/request') && method === 'post') {
    const phone = (body.phoneNumber || '').trim() || '+916297799544';
    sessionStorage.setItem('syncpulse_last_challenge_phone', phone);
    const challengeId = 'cloud-demo-ch-' + Date.now();
    let secret = '';
    let qrImageUrl = '';
    let otpauth = '';
    try {
      const twoFa = await generate2FA(phone);
      secret = twoFa.secret;
      qrImageUrl = twoFa.qrImageUrl;
      otpauth = twoFa.otpauth;
      sessionStorage.setItem(`syncpulse_totp_${phone}`, secret);
      sessionStorage.setItem('syncpulse_last_challenge_secret', secret);
    } catch (e) {
      console.warn('Fallback 2FA generation error:', e);
    }
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: {
        challengeId,
        expiresIn: 600,
        resendAfter: 60,
        message: 'OTP request accepted',
        totpSecret: secret,
        qrUri: otpauth,
        qrImageUrl,
        isNewSetup: true,
      },
    };
  }

  // 1b. Auth OTP Verify: POST /api/auth/otp/verify
  if (url.includes('/api/auth/otp/verify') && method === 'post') {
    let phone = (body.phoneNumber || '').trim();
    if (!phone) {
      try {
        phone = sessionStorage.getItem('syncpulse_last_challenge_phone') || '';
      } catch {
        phone = '';
      }
    }
    const inputOtp = String(body.otp || '').trim();
    const secret =
      sessionStorage.getItem('syncpulse_last_challenge_secret') ||
      (phone ? sessionStorage.getItem(`syncpulse_totp_${phone}`) : '');

    const isValid = verifyOTP(inputOtp, secret);
    if (!isValid) {
      const err = new Error('Invalid 6-digit Authenticator code. Please check Google Authenticator.');
      err.response = {
        status: 401,
        data: { error: 'Invalid 6-digit Authenticator code. Please check Google Authenticator.' },
      };
      throw err;
    }

    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const registered = getRegisteredAccounts();
    const existing = registered.find((u) => u.phoneNumber === cleanPhone);

    let finalUsername = '';
    let finalUserId = 5;

    if (existing && existing.username) {
      finalUsername = existing.username;
      finalUserId = existing.id || existing.userId || 5;
    } else if (cleanPhone && cleanPhone.endsWith('6297799544')) {
      finalUsername = 'Rishikesh';
      finalUserId = 2;
    } else if (cleanPhone) {
      const digits = cleanPhone.replace(/\D/g, '');
      finalUsername = `User_${digits.length >= 4 ? digits.slice(-4) : digits}`;
      finalUserId = Math.floor(1000 + Math.random() * 9000);
      saveRegisteredAccount({
        id: finalUserId,
        userId: finalUserId,
        username: finalUsername,
        phoneNumber: cleanPhone,
        createdAt: new Date().toISOString(),
      });
    } else {
      finalUsername = 'SyncPulse User';
      finalUserId = 5;
    }

    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: {
        accessToken: 'syncpulse-session-jwt-token-production',
        tokenType: 'Bearer',
        expiresIn: 3600,
        userId: finalUserId,
        username: finalUsername,
        phoneNumber: cleanPhone,
      },
    };
  }

  // 1c. Auth Login: POST /api/auth/login
  if (url.includes('/api/auth/login') && method === 'post') {
    const identifier = (body.username || body.phoneNumber || '').trim();
    const cleanPhone = identifier.replace(/[\s\-()]/g, '');
    const registered = getRegisteredAccounts();
    const existing = registered.find(
      (u) => u.phoneNumber === cleanPhone || (u.username && u.username.toLowerCase() === identifier.toLowerCase())
    );

    let loginUsername = '';
    let loginUserId = 5;

    if (existing) {
      loginUsername = existing.username;
      loginUserId = existing.id || existing.userId || 5;
    } else if (cleanPhone.endsWith('6297799544')) {
      loginUsername = 'Rishikesh';
      loginUserId = 2;
    } else {
      loginUsername = body.username || (cleanPhone ? `User_${cleanPhone.slice(-4)}` : 'SyncPulse User');
    }

    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: {
        accessToken: 'syncpulse-session-jwt-token-production',
        tokenType: 'Bearer',
        expiresIn: 3600,
        userId: loginUserId,
        username: loginUsername,
        phoneNumber: cleanPhone,
      },
    };
  }

  // 2. Auth Register: POST /api/users
  if (url.includes('/api/users') && method === 'post') {
    const cleanPhone = (body.phoneNumber || '').trim().replace(/[\s\-()]/g, '');
    const registered = getRegisteredAccounts();
    const isDuplicate = registered.some((u) => u.phoneNumber === cleanPhone) || cleanPhone.endsWith('6297799544');

    if (isDuplicate) {
      const err = new Error('Number Already Present in Database');
      err.response = {
        status: 409,
        data: {
          error: 'Number Already Present in Database',
          message: 'Number Already Present in Database',
        },
      };
      throw err;
    }

    const newUserId = Date.now();
    const newUser = {
      id: newUserId,
      userId: newUserId,
      username: (body.username || '').trim() || `User_${cleanPhone.slice(-4)}`,
      phoneNumber: cleanPhone,
      createdAt: new Date().toISOString(),
    };
    saveRegisteredAccount(newUser);

    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: newUser,
    };
  }

  // 3. User update: PUT /api/users/:id or GET /api/users/:id
  const userByIdMatch = url.match(/\/api\/users\/(\d+)$/);
  if (userByIdMatch) {
    const requestedId = Number(userByIdMatch[1]);
    const registered = getRegisteredAccounts();
    const found = registered.find((u) => u.id === requestedId || u.userId === requestedId);

    if (method === 'get') {
      if (found) {
        return {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config,
          data: found,
        };
      }
      const err = new Error('User not found');
      err.response = { status: 404, data: { error: 'User not found' } };
      throw err;
    }

    if (method === 'put') {
      let currentUser = null;
      try {
        currentUser = JSON.parse(localStorage.getItem('chatapp_user') || 'null');
      } catch {
        currentUser = null;
      }
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
        data: {
          id: requestedId,
          username: body.username || currentUser?.username || 'User',
          phoneNumber: currentUser?.phoneNumber || '+916297799544',
        },
      };
    }
  }

  // 4a. User by phone: GET /api/users/phone
  if (url.includes('/api/users/phone') && method === 'get') {
    const rawPhone = (config.params?.phoneNumber || '').trim();
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, '');
    const registered = getRegisteredAccounts();
    const match = registered.find(
      (u) =>
        u.phoneNumber === cleanPhone ||
        u.phoneNumber.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '') ||
        (u.username && u.username.toLowerCase() === rawPhone.toLowerCase())
    );
    if (match) {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
        data: match,
      };
    }
    const err = new Error('User not found');
    err.response = { status: 404, data: { error: 'User not found' } };
    throw err;
  }

  // 4b. User search: GET /api/users
  if (url.includes('/api/users') && method === 'get') {
    const q = (config.params?.query || config.params?.q || '').trim().toLowerCase();
    const registered = getRegisteredAccounts();
    if (!q) {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
        data: registered,
      };
    }
    const filtered = registered.filter(
      (u) =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.phoneNumber && u.phoneNumber.includes(q)) ||
        String(u.id) === q ||
        String(u.userId) === q
    );
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: filtered,
    };
  }

  // 5. Get Messages: GET /api/conversations/:id/messages
  const msgMatch = url.match(/\/api\/conversations\/(\d+)\/messages/);
  if (msgMatch && method === 'get') {
    const convId = Number(msgMatch[1]);
    const stored = sessionStorage.getItem(`syncpulse_msgs_${convId}`);
    if (stored) {
      try {
        return {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config,
          data: JSON.parse(stored),
        };
      } catch {
        // proceed
      }
    }
    // No mock messages - return empty list for real empty conversations
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: [],
    };
  }

  // 6. Send Message: POST /api/conversations/:id/messages
  if (msgMatch && method === 'post') {
    const convId = Number(msgMatch[1]);
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('chatapp_user') || 'null');
    } catch {
      currentUser = null;
    }
    const senderId = currentUser?.userId || 2;
    const senderUsername = currentUser?.username || 'Rishikesh';

    const newMsg = {
      id: Date.now(),
      conversationId: convId,
      senderId,
      senderUsername,
      content: body.content || '',
      type: body.type || 'TEXT',
      createdAt: new Date().toISOString(),
    };

    const stored = JSON.parse(sessionStorage.getItem(`syncpulse_msgs_${convId}`) || '[]');
    stored.push(newMsg);
    // Propagate storage failure if setItem fails
    sessionStorage.setItem(`syncpulse_msgs_${convId}`, JSON.stringify(stored));

    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: newMsg,
    };
  }

  // 7. Remove Participant: DELETE /api/conversations/:id/participants/:userId
  const removePartMatch = url.match(/\/api\/conversations\/(\d+)\/participants\/(\d+)/);
  if (removePartMatch && method === 'delete') {
    const convId = Number(removePartMatch[1]);
    const removeUid = Number(removePartMatch[2]);
    const roster = getParticipantRoster(convId);
    const updated = roster.filter((p) => p.userId !== removeUid);
    saveParticipantRoster(convId, updated);
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: { success: true },
    };
  }

  // 8. Get Participants: GET /api/conversations/:id/participants
  const partCheckMatch = url.match(/\/api\/conversations\/(\d+)\/participants\/(\d+)\/check/);
  if (partCheckMatch && method === 'get') {
    const convId = Number(partCheckMatch[1]);
    const userId = Number(partCheckMatch[2]);
    const roster = getParticipantRoster(convId);
    const isMember = roster.some((p) => p.userId === userId || p.id === userId);
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: isMember,
    };
  }

  const partMatch = url.match(/\/api\/conversations\/(\d+)\/participants/);
  if (partMatch && method === 'get') {
    const convId = Number(partMatch[1]);
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: getParticipantRoster(convId),
    };
  }

  // 9. Add Participant: POST /api/conversations/:id/participants
  if (partMatch && method === 'post') {
    const convId = Number(partMatch[1]);
    const userId = Number(config.params?.userId || 1);
    const roster = getParticipantRoster(convId);
    const existing = roster.find((p) => p.userId === userId);

    let resolvedUsername = `User_${userId}`;
    const registered = getRegisteredAccounts();
    const matchReg = registered.find((u) => u.id === userId || u.userId === userId);
    if (matchReg) {
      resolvedUsername = matchReg.username;
    } else {
      try {
        const curUser = JSON.parse(localStorage.getItem('chatapp_user') || 'null');
        if (curUser && (curUser.id === userId || curUser.userId === userId)) {
          resolvedUsername = curUser.username;
        }
      } catch {
        // ignore
      }
    }

    const newParticipant = existing || {
      userId,
      username: resolvedUsername,
      role: 'MEMBER',
    };
    if (!existing) {
      roster.push(newParticipant);
      saveParticipantRoster(convId, roster);
    }
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: newParticipant,
    };
  }

  // 10. Get Single Conversation: GET /api/conversations/:id
  const convSingleMatch = url.match(/\/api\/conversations\/(\d+)$/);
  if (convSingleMatch && method === 'get') {
    const convId = Number(convSingleMatch[1]);
    const storedConv = sessionStorage.getItem(`syncpulse_conv_${convId}`);
    if (storedConv) {
      try {
        return {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config,
          data: JSON.parse(storedConv),
        };
      } catch {
        // ignore
      }
    }
    const err = new Error('Conversation not found');
    err.response = { status: 404, data: { error: 'Conversation not found' } };
    throw err;
  }

  // 11. Create Conversation: POST /api/conversations
  if (url.includes('/api/conversations') && method === 'post') {
    const newConv = {
      id: Date.now(),
      name: body.name || 'Project Discussion',
      type: body.type || 'GROUP',
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem(`syncpulse_conv_${newConv.id}`, JSON.stringify(newConv));
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      data: newConv,
    };
  }

  return null;
};

apiClient.interceptors.response.use(
  async (response) => {
    if (isExplicitDemoMode() && typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      const fallback = await handleMockFallback(response.config);
      if (fallback) return fallback;
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token if server explicitly returns 401 Unauthorized, except on login / otp verify attempts
      const reqUrl = error.config?.url || '';
      const isAuthAttempt = reqUrl.includes('/api/auth/login') || reqUrl.includes('/api/auth/otp/verify');
      if (!isAuthAttempt) {
        localStorage.removeItem('chatapp_token');
        localStorage.removeItem('chatapp_user');
      }
      return Promise.reject(error);
    }

    // Fallback for static cloud hosting when external backend is not configured or returns 405
    const isCloudStaticOr405 =
      error.response?.status === 405 ||
      (error.response?.status === 404 && error.config?.url?.startsWith('/api/')) ||
      (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'));

    if (isCloudStaticOr405 || isExplicitDemoMode()) {
      const fallback = await handleMockFallback(error.config);
      if (fallback) return Promise.resolve(fallback);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
