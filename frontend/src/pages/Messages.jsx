import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import { AuthDataContext } from '../Context/AuthContext.jsx';
import io from 'socket.io-client';

const Messages = () => {
  const { serverUrl, currentUser } = useContext(AuthDataContext);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io(serverUrl.split('/api')[0]);
    setSocket(newSocket);

    // Join user's room for private messages
    newSocket.emit('join', currentUser._id);

    // Listen for new messages
    newSocket.on('receive_message', (message) => {
      // Update conversations when a new message is received
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(
          conv => conv._id === message.conversation
        );

        if (conversationIndex !== -1) {
          // Update existing conversation
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            lastMessage: message,
            unreadCount: updatedConversations[conversationIndex].unreadCount + 1
          };

          // Move this conversation to the top
          const conversation = updatedConversations.splice(conversationIndex, 1)[0];
          updatedConversations.unshift(conversation);
        }

        return updatedConversations;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser, serverUrl]);

  // Fetch user's conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/messages/conversations/${currentUser._id}`);
        setConversations(response.data);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [serverUrl, currentUser]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // Otherwise show full date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get message preview text
  const getMessagePreview = (message) => {
    if (!message) return 'No messages yet';

    // Truncate long messages
    if (message.text.length > 50) {
      return message.text.substring(0, 50) + '...';
    }

    return message.text;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h1 className="text-lg font-medium text-gray-900">Messages</h1>
            </div>

            {error && (
              <div className="bg-red-50 p-4 border-l-4 border-red-400">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any conversations yet. Start by connecting with other users.
                </p>
                <div className="mt-6">
                  <Link
                    to="/network"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Find Connections
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <li key={conversation._id}>
                    <Link
                      to={`/messages/${conversation._id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <img
                                className="h-12 w-12 rounded-full"
                                src={conversation.participant.profileImage || 'https://via.placeholder.com/40'}
                                alt={`${conversation.participant.firstName} ${conversation.participant.lastName}`}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <h3 className="text-sm font-medium text-gray-900">
                                  {conversation.participant.firstName} {conversation.participant.lastName}
                                </h3>
                                {conversation.unreadCount > 0 && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                {getMessagePreview(conversation.lastMessage)}
                              </p>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="text-sm text-gray-500">
                              {conversation.lastMessage ? formatDate(conversation.lastMessage.createdAt) : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
