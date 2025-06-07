import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import { AuthDataContext } from '../context/AuthContext';
import io from 'socket.io-client';

const Conversation = () => {
  const { conversationId } = useParams();
  const { serverUrl, currentUser } = useContext(AuthDataContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io(serverUrl.split('/api')[0]);
    setSocket(newSocket);

    // Join user's room for private messages
    newSocket.emit('join', currentUser._id);

    // Listen for new messages
    newSocket.on('receive_message', (message) => {
      if (message.conversation === conversationId) {
        setMessages(prev => [...prev, message]);

        // Mark message as read
        markMessagesAsRead();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser, serverUrl, conversationId]);

  // Fetch conversation and messages
  useEffect(() => {
    const fetchConversation = async () => {
      if (!currentUser || !conversationId) return;

      try {
        setLoading(true);

        // Get conversation details
        const conversationResponse = await axios.post(
          `${serverUrl}/api/messages/conversation`, {
            userId: currentUser._id,
            recipientId: conversationId
          }
        );

        // Find the other participant
        const otherParticipant = conversationResponse.data.participants.find(
          p => p._id !== currentUser._id
        );

        setParticipant(otherParticipant);

        // Get messages
        const messagesResponse = await axios.get(
          `${serverUrl}/api/messages/conversation/${conversationResponse.data._id}?userId=${currentUser._id}&page=${page}&limit=20`
        );

        setMessages(messagesResponse.data.messages);
        setHasMore(page < messagesResponse.data.totalPages);

        // Mark messages as read
        markMessagesAsRead();
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [serverUrl, currentUser, conversationId, page]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      await axios.put(`${serverUrl}/api/messages/conversation/${conversationId}/read`, {
        userId: currentUser._id
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Load more messages
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);

      // Get current scroll position
      const container = messagesContainerRef.current;
      const scrollHeight = container.scrollHeight;

      // Get more messages
      const nextPage = page + 1;
      const messagesResponse = await axios.get(
        `${serverUrl}/api/messages/conversation/${conversationId}?userId=${currentUser._id}&page=${nextPage}&limit=20`
      );

      // Add new messages to the beginning
      setMessages(prev => [...messagesResponse.data.messages, ...prev]);
      setPage(nextPage);
      setHasMore(nextPage < messagesResponse.data.totalPages);

      // Maintain scroll position
      setTimeout(() => {
        container.scrollTop = container.scrollHeight - scrollHeight;
      }, 100);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const messageData = {
        conversationId,
        senderId: currentUser._id,
        recipientId: participant._id,
        text: newMessage.trim()
      };

      // Send message to server
      const response = await axios.post(`${serverUrl}/api/messages/send`, messageData);

      // Add message to state
      setMessages(prev => [...prev, response.data]);

      // Clear input
      setNewMessage('');

      // Emit message to socket
      if (socket) {
        socket.emit('private_message', {
          message: response.data,
          recipientId: participant._id
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  // Format time for display
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message groups
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  // Check if message is from a different day than previous message
  const isNewDay = (message, index) => {
    if (index === 0) return true;

    const currentDate = new Date(message.createdAt).toDateString();
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();

    return currentDate !== prevDate;
  };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg flex flex-col h-[calc(100vh-160px)]">
          {/* Conversation header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center">
            <Link to="/messages" className="mr-4 text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            {participant && (
              <div className="flex items-center">
                <img
                  className="h-10 w-10 rounded-full mr-3"
                  src={participant.profileImage || 'https://via.placeholder.com/40'}
                  alt={`${participant.firstName} ${participant.lastName}`}
                />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {participant.firstName} {participant.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">{participant.headline || ''}</p>
                </div>
              </div>
            )}
          </div>

          {/* Messages container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onScroll={(e) => {
              if (e.target.scrollTop === 0 && hasMore) {
                loadMoreMessages();
              }
            }}
          >
            {loadingMore && (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {messages.map((message, index) => (
              <React.Fragment key={message._id}>
                {isNewDay(message, index) && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-500">
                      {formatMessageDate(message.createdAt)}
                    </div>
                  </div>
                )}
                <div className={`flex ${message.sender._id === currentUser._id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                    message.sender._id === currentUser._id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 text-right ${
                      message.sender._id === currentUser._id ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="border-t border-gray-200 p-4">
            {error && (
              <div className="mb-2 text-sm text-red-600">{error}</div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 appearance-none border rounded-l-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md disabled:bg-blue-300"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
