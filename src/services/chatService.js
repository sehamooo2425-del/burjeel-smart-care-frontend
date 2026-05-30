/*
 * chatService.js — API functions for the in-app messaging / chat feature.
 *
 * Covers the REST API side of chat: loading conversation history, sending
 * messages via HTTP, and marking messages as read. The ChatPage component
 * calls these functions directly — there is no intermediate context layer.
 */

import api from './api';

/*
 * getConversations — Retrieves all conversations for the current user.
 * Each conversation includes the other participant's profile, the full message
 * history, and an unread message count. Returns [] instead of throwing so the
 * chat UI degrades gracefully when the server is unavailable.
 * @returns {Promise<Array>} List of conversation objects, or [] on error.
 */
export const getConversations = async () => {
  try {
    const response = await api.get('/chat/conversations/');
    // The api interceptor returns response.data, but some paths may return it nested again;
    // this fallback handles both shapes safely.
    return response.data || response;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

/*
 * sendMessage — Posts a new message to the server addressed to a specific user.
 * @param {string|number} receiverId - The user_id of the recipient.
 * @param {string}        content    - The text body of the message.
 * @returns {Promise<object>} The saved message record returned by the server.
 */
export const sendMessage = async (receiverId, content) => {
  const response = await api.post('/chat/messages/', {
    receiver_id: receiverId,
    message_text: content,
  });
  return response;
};

/*
 * markAsRead — Marks all unread messages from a specific sender as read.
 * Called whenever the user opens a conversation so the unread badge clears
 * and is_read is updated in the database.
 * @param {string|number} senderId - The user_id whose messages to mark read.
 * @returns {Promise<object>} Server confirmation of the update.
 */
export const markAsRead = async (senderId) => {
  const response = await api.put('/chat/messages/read', {
    sender_id: senderId,
  });
  return response;
};
