/*
 * ChatPage.jsx
 * This is the real-time messaging page used by all roles (admin, doctor, patient).
 * It shows a list of conversations on the left and the full message thread on the right.
 * Users can send messages to any other registered user in the system.
 */

import { useState, useEffect, useRef, useContext } from 'react';
import { FiSend, FiSmile, FiPaperclip, FiTrash2 } from 'react-icons/fi';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { AlertContext } from '../contexts/AlertContext';
import * as chatService from '../services/chatService';
import { useAuth } from '../hooks/useAuth';

export default function ChatPage() {
  // selectedConversation holds the conversation object currently open in the chat panel.
  const [selectedConversation, setSelectedConversation] = useState(null);
  // message is the text currently typed in the message input box.
  const [message, setMessage] = useState('');
  // conversations is the full list of conversations this user is part of.
  const [conversations, setConversations] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { error: showError } = useContext(AlertContext);
  // user is used to determine which messages were sent by "me" (right-aligned vs. left-aligned).
  const { user } = useAuth();
  const messagesContainerRef = useRef(null);

  /*
   * Runs when the component mounts (and whenever user changes, though that's rare).
   * Loads all conversations for the current user. Automatically opens the first one.
   */
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const data = await chatService.getConversations();
        setConversations(data);
        // Automatically open the most recent conversation so the user sees something immediately.
        if (data.length > 0) {
          const first = data[0];
          setSelectedConversation(first);
          // Auto-opening a conversation counts as "reading" it — mark those messages as read.
          if (first.unread_count > 0) {
            chatService.markAsRead(first.other_participant.user_id).catch(console.error);
            // Clear the badge in local state without waiting for the API to respond.
            setConversations(prev => prev.map((c, i) => i === 0 ? { ...c, unread_count: 0 } : c));
          }
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        showError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [showError, user]);

  /*
   * handleSelectConversation — Opens a conversation and marks any unread messages
   * from the other participant as read in both the database and local state.
   * This is the root cause fix: previously clicking a conversation only updated
   * local state but never called the markAsRead API, so is_read stayed False forever.
   */
  const handleSelectConversation = async (conv) => {
    setSelectedConversation(conv);
    // Only hit the API if there are actually unread messages to clear.
    if (conv.unread_count > 0) {
      try {
        await chatService.markAsRead(conv.other_participant.user_id);
        // Immediately clear the red unread badge in the sidebar for this conversation.
        setConversations(prev => prev.map(c =>
          c.other_participant.user_id === conv.other_participant.user_id
            ? { ...c, unread_count: 0 }
            : c
        ));
      } catch (err) {
        // Not critical enough to show an error toast — log silently.
        console.error('Failed to mark messages as read:', err);
      }
    }
  };

  // Sends the typed message to the other participant in the selected conversation.
  // Updates the local state immediately so the new message appears without a page refresh.
  const handleSendMessage = async () => {
    // Only send if the message box is not empty and a conversation is selected.
    if (message.trim() && selectedConversation) {
      try {
        const otherUser = selectedConversation.other_participant;
        const response = await chatService.sendMessage(otherUser.user_id, message.trim());
        const newMessage = response.data || response;

        // Append the new message to the correct conversation in the list.
        setConversations(prev => prev.map(conv => {
          if (conv.other_participant.user_id === otherUser.user_id) {
            return {
              ...conv,
              messages: [...conv.messages, newMessage],
              last_message_time: newMessage.timestamp
            };
          }
          return conv;
        }));

        // Re-sort the conversation list so the one with the newest message floats to the top.
        setConversations(prev => [...prev].sort((a, b) =>
          new Date(b.last_message_time) - new Date(a.last_message_time)
        ));

        // Clear the input box after sending.
        setMessage('');

        // Also update the currently open conversation so the new message appears in the chat panel.
        setSelectedConversation(prev => {
          if (prev && prev.other_participant.user_id === otherUser.user_id) {
            return {
              ...prev,
              messages: [...prev.messages, newMessage],
              last_message_time: newMessage.timestamp
            };
          }
          return prev;
        });
      } catch (err) {
        showError('Failed to send message');
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      const markDeleted = (msgs) =>
        msgs.map((m) => (m.message_id === messageId ? { ...m, is_deleted: true } : m));
      setConversations((prev) =>
        prev.map((conv) => ({ ...conv, messages: markDeleted(conv.messages) }))
      );
      setSelectedConversation((prev) => ({ ...prev, messages: markDeleted(prev.messages) }));
    } catch (err) {
      showError('Failed to delete message');
    }
  };

  // Scroll only the chat container to the bottom whenever the conversation or its messages change.
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [selectedConversation?.other_participant?.user_id, selectedConversation?.messages?.length]);

  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 mb-2">Live Chat</h1>
        <p className="text-secondary-600">Connect with healthcare professionals</p>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-4 gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
        {/* Conversations List */}
        <Card className="md:col-span-1 overflow-y-auto flex-shrink-0 h-64 md:h-auto">
          <h2 className="text-lg font-bold text-secondary-900 mb-3">All Users</h2>
          <input
            type="text"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full mb-3 px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="space-y-3">
            {conversations.filter((c) =>
              c.other_participant.username.toLowerCase().includes(userSearch.toLowerCase())
            ).length > 0 ? (
              conversations.filter((c) =>
                c.other_participant.username.toLowerCase().includes(userSearch.toLowerCase())
              ).map((conv) => {
                const otherUser = conv.other_participant;
                const hasMessages = conv.messages && conv.messages.length > 0;
                return (
                  <button
                    key={otherUser.user_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg transition-colors
                      ${selectedConversation?.other_participant.user_id === otherUser.user_id 
                        ? 'bg-primary-100 border border-primary-300' 
                        : 'hover:bg-secondary-100'
                      }
                    `}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {otherUser.profile_picture_url ? (
                          <img src={otherUser.profile_picture_url} alt={otherUser.username} className="w-full h-full object-cover" />
                        ) : (
                          otherUser.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          otherUser.account_status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      ></div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-secondary-900">{otherUser.username}</p>
                        {conv.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary-500">
                        {otherUser.role}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-secondary-500 text-sm">
                {userSearch ? 'No users match your search' : 'No users available'}
              </p>
            )}
          </div>
        </Card>

        {/* Chat Box */}
        <Card className="md:col-span-3 flex flex-col flex-1 min-h-0">
          {selectedConversation ? (
            <>
              <div className="pb-4 border-b border-secondary-200 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {selectedConversation.other_participant.profile_picture_url ? (
                      <img src={selectedConversation.other_participant.profile_picture_url} alt={selectedConversation.other_participant.username} className="w-full h-full object-cover" />
                    ) : (
                      selectedConversation.other_participant.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900">{selectedConversation.other_participant.username}</h3>
                    <p className="text-xs text-secondary-500 flex items-center gap-2">
                      <span className={selectedConversation.other_participant.account_status === 'active' ? 'text-green-500' : 'text-gray-400'}>●</span>
                      {selectedConversation.other_participant.account_status === 'active' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-4 px-2">
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  <>
                    {selectedConversation.messages.map((msg, idx) => {
                      const msgs = selectedConversation.messages;
                      const msgDate = new Date(msg.timestamp).toDateString();
                      const prevMsgDate = idx > 0 ? new Date(msgs[idx - 1].timestamp).toDateString() : null;
                      const showSeparator = msgDate !== prevMsgDate;
                      return (
                        <div key={msg.message_id || idx}>
                          {showSeparator && (
                            <div className="flex items-center gap-2 my-3">
                              <div className="flex-1 h-px bg-secondary-200" />
                              <span className="text-xs text-secondary-400 font-medium px-2">
                                {formatDateSeparator(msg.timestamp)}
                              </span>
                              <div className="flex-1 h-px bg-secondary-200" />
                            </div>
                          )}
                          <div className={`flex items-end gap-1 group ${msg.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}>
                            {/* Trash icon left of bubble for sender's own messages */}
                            {msg.sender_id === user?.user_id && !msg.is_deleted && (
                              <button
                                onClick={() => handleDeleteMessage(msg.message_id)}
                                className="hidden group-hover:flex p-1 rounded text-secondary-400 hover:text-red-500 transition-colors flex-shrink-0"
                                title="Delete message"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            )}
                            <div
                              className={`
                                max-w-xs px-4 py-2 rounded-lg
                                ${msg.is_deleted
                                  ? 'bg-secondary-100 border border-secondary-300'
                                  : msg.sender_id === user?.user_id
                                    ? 'bg-primary-600 text-white rounded-br-none'
                                    : 'bg-secondary-100 text-secondary-900 rounded-bl-none'
                                }
                              `}
                            >
                              {msg.is_deleted ? (
                                <p className="text-sm italic text-secondary-400">This message was deleted</p>
                              ) : (
                                <p className={`text-sm ${msg.sender_id === user?.user_id ? 'text-white' : 'text-secondary-900'}`}>
                                  {msg.message_text}
                                </p>
                              )}
                              <p className={`text-xs mt-1 ${msg.is_deleted ? 'text-secondary-400' : msg.sender_id === user?.user_id ? 'text-primary-100' : 'text-secondary-500'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
</>
                ) : (
                  <div className="flex items-center justify-center h-full text-secondary-500">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
                  <FiPaperclip size={20} className="text-secondary-600" />
                </button>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
                  <FiSmile size={20} className="text-secondary-600" />
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendMessage}
                  icon={FiSend}
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-secondary-500">Select a conversation to start</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
