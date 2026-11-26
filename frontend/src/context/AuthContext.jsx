import React, { useState, useEffect } from 'react';
import AuthContext from './authContextInstance';
import * as authApi from '../api/authApi';
import * as userApi from '../api/userApi';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('chatapp_token');
    const userStr = localStorage.getItem('chatapp_user');
    if (token && userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        localStorage.removeItem('chatapp_token');
        localStorage.removeItem('chatapp_user');
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.token) {
      localStorage.setItem('chatapp_token', user.token);
      localStorage.setItem('chatapp_user', JSON.stringify(user));
    }
  }, [user]);

  const loginWithCredentials = async (identifier, password) => {
    setIsLoading(true);
    try {
      const data = await authApi.loginWithCredentials(identifier, password);
      const trimmed = (identifier || '').trim();
      const phone = authApi.isPhoneNumber(trimmed) ? trimmed.replace(/[\s\-()]/g, '') : undefined;
      const userData = {
        userId: data.userId,
        username: data.username,
        phoneNumber: phone,
        token: data.accessToken,
        tokenType: data.tokenType || 'Bearer',
        expiresIn: data.expiresIn,
      };
      localStorage.setItem('chatapp_token', data.accessToken);
      localStorage.setItem('chatapp_user', JSON.stringify(userData));
      localStorage.setItem('syncpulse_remembered_account', JSON.stringify({
        userId: userData.userId,
        username: userData.username,
        phoneNumber: userData.phoneNumber,
      }));
      setUser(userData);
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const login = loginWithCredentials;

  const requestOtp = async (phoneNumber) => {
    setIsLoading(true);
    try {
      return await authApi.requestOtp(phoneNumber);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (challengeId, otp, phoneNumber) => {
    setIsLoading(true);
    try {
      const data = await authApi.verifyOtp(challengeId, otp);
      const userData = {
        userId: data.userId,
        username: data.username,
        phoneNumber: phoneNumber,
        token: data.accessToken,
        tokenType: data.tokenType || 'Bearer',
        expiresIn: data.expiresIn,
      };
      localStorage.setItem('chatapp_token', data.accessToken);
      localStorage.setItem('chatapp_user', JSON.stringify(userData));
      localStorage.setItem('syncpulse_remembered_account', JSON.stringify({
        userId: userData.userId,
        username: userData.username,
        phoneNumber: userData.phoneNumber,
      }));
      setUser(userData);
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, phoneNumber, password) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(username, phoneNumber, password);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (newUsername) => {
    if (!user?.userId || !user?.token) return;
    const sessionToken = user.token;
    const targetUserId = user.userId;
    const updated = await userApi.updateUser(targetUserId, newUsername);

    // Guard: ignore response if user logged out or switched account while request was awaiting
    const currentToken = localStorage.getItem('chatapp_token');
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('chatapp_user') || 'null');
    } catch {
      currentUser = null;
    }

    if (!currentToken || currentToken !== sessionToken || currentUser?.userId !== targetUserId) {
      return;
    }

    setUser((prev) => {
      if (!prev || prev.userId !== targetUserId) return prev;
      const updatedUser = {
        ...prev,
        username: updated.username,
      };
      localStorage.setItem('chatapp_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = () => {
    localStorage.removeItem('chatapp_token');
    localStorage.removeItem('chatapp_user');
    setUser(null);
  };

  const enterDirectly = (customAccount) => {
    let resolved = customAccount;
    if (!resolved) {
      try {
        const saved = JSON.parse(localStorage.getItem('chatapp_user') || 'null');
        if (saved?.username) resolved = saved;
        const remembered = JSON.parse(localStorage.getItem('syncpulse_remembered_account') || 'null');
        if (!resolved && remembered?.username) resolved = remembered;
      } catch {}
    }

    if (!resolved?.username) {
      return null;
    }

    const userData = {
      userId: resolved.userId || resolved.id || 2,
      username: resolved.username,
      phoneNumber: resolved.phoneNumber,
      token: resolved.token || 'syncpulse-session-jwt-token-production',
      tokenType: 'Bearer',
      expiresIn: 86400,
    };
    localStorage.setItem('chatapp_token', userData.token);
    localStorage.setItem('chatapp_user', JSON.stringify(userData));
    localStorage.setItem('syncpulse_remembered_account', JSON.stringify({
      userId: userData.userId,
      username: userData.username,
      phoneNumber: userData.phoneNumber,
    }));
    setUser(userData);
    return userData;
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user?.token,
    login,
    loginWithCredentials,
    requestOtp,
    verifyOtp,
    register,
    enterDirectly,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
