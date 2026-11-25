import apiClient from './apiClient';

/**
 * Retrieves a user by their unique ID.
 * @param {number|string} userId
 */
export const getUserById = async (userId) => {
  const response = await apiClient.get(`/api/users/${userId}`);
  return response.data;
};

/**
 * Finds a user by phone number.
 * @param {string} phoneNumber
 */
export const getUserByPhone = async (phoneNumber) => {
  const response = await apiClient.get('/api/users/phone', { params: { phoneNumber } });
  return response.data;
};

/**
 * Updates a user profile username.
 * @param {number|string} userId
 * @param {string} username
 */
export const updateUser = async (userId, username) => {
  const response = await apiClient.put(`/api/users/${userId}`, { username });
  return response.data;
};
