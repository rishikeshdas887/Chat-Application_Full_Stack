import apiClient from './apiClient';

/**
 * Creates a new conversation.
 * @param {'PRIVATE' | 'GROUP'} type
 * @param {string} [name]
 */
export const createConversation = async (type, name) => {
  const payload = { type };
  if (name && name.trim()) {
    payload.name = name.trim();
  }
  const response = await apiClient.post('/api/conversations', payload);
  return response.data;
};

/**
 * Fetches a single conversation by ID.
 * @param {number|string} id
 */
export const getConversation = async (id) => {
  const response = await apiClient.get(`/api/conversations/${id}`);
  return response.data;
};

/**
 * Updates a conversation name and/or type.
 * @param {number|string} id
 * @param {string} name
 * @param {'PRIVATE' | 'GROUP'} type
 */
export const updateConversation = async (id, name, type) => {
  const response = await apiClient.put(`/api/conversations/${id}`, { name, type });
  return response.data;
};

/**
 * Deletes a conversation.
 * @param {number|string} id
 */
export const deleteConversation = async (id) => {
  const response = await apiClient.delete(`/api/conversations/${id}`);
  return response.data;
};

/**
 * Adds a participant to a conversation.
 * @param {number|string} conversationId
 * @param {number|string} userId
 */
export const addParticipant = async (conversationId, userId) => {
  const response = await apiClient.post(
    `/api/conversations/${conversationId}/participants`,
    null,
    { params: { userId } }
  );
  return response.data;
};

/**
 * Lists participants of a conversation.
 * @param {number|string} conversationId
 */
export const getParticipants = async (conversationId) => {
  const response = await apiClient.get(`/api/conversations/${conversationId}/participants`);
  return response.data;
};

/**
 * Checks if a user is a participant of a conversation.
 * @param {number|string} conversationId
 * @param {number|string} userId
 */
export const isParticipant = async (conversationId, userId) => {
  const response = await apiClient.get(
    `/api/conversations/${conversationId}/participants/${userId}/check`
  );
  return response.data;
};

/**
 * Removes a participant from a conversation.
 * @param {number|string} conversationId
 * @param {number|string} userId
 */
export const removeParticipant = async (conversationId, userId) => {
  const response = await apiClient.delete(
    `/api/conversations/${conversationId}/participants/${userId}`
  );
  return response.data;
};
