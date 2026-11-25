import apiClient from './apiClient';

/**
 * Fetches message history for a conversation.
 * @param {number|string} conversationId
 */
export const getMessages = async (conversationId) => {
  const response = await apiClient.get(`/api/conversations/${conversationId}/messages`);
  return response.data;
};

/**
 * Sends a message via REST endpoint (fallback or initial dispatch).
 * @param {number|string} conversationId
 * @param {number|string} userId
 * @param {string} content
 * @param {'TEXT' | 'IMAGE' | 'FILE'} type
 */
export const sendMessageRest = async (conversationId, userId, content, type = 'TEXT') => {
  const response = await apiClient.post(
    `/api/conversations/${conversationId}/messages`,
    { content, type },
    { params: { userId } }
  );
  return response.data;
};
