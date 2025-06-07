import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import { AuthDataContext } from '../context/AuthContext';
import { UserDataContext } from '../context/userContext';
import ConnectionButton from '../components/ConnectionButton';

const Network = () => {
  const { serverUrl, currentUser } = useContext(AuthDataContext);
  const { connections, connectionRequests, acceptConnectionRequest, rejectConnectionRequest } = useContext(UserDataContext);

  const [activeTab, setActiveTab] = useState('connections');
  const [suggestedConnections, setSuggestedConnections] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch network data based on active tab
  useEffect(() => {
    const fetchNetworkData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError('');

        // Fetch data based on active tab
        if (activeTab === 'suggestions') {
          const response = await axios.get(`${serverUrl}/api/connections/suggestions/${currentUser._id}`);
          setSuggestedConnections(response.data);
        } else if (activeTab === 'followers') {
          const response = await axios.get(`${serverUrl}/api/connections/followers/${currentUser._id}`);
          setFollowers(response.data);
        } else if (activeTab === 'following') {
          const response = await axios.get(`${serverUrl}/api/connections/following/${currentUser._id}`);
          setFollowing(response.data);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();
  }, [serverUrl, currentUser, activeTab]);

  // Handle connection request
  const handleConnectionRequest = async (targetUserId) => {
    try {
      const response = await axios.post(`${serverUrl}/api/connections/request`, {
        userId: currentUser._id,
        targetUserId
      });

      // Remove from suggestions
      setSuggestedConnections(prev =>
        prev.filter(user => user._id !== targetUserId)
      );

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error sending connection request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send connection request'
      };
    }
  };

  // Handle accept connection request
  const handleAcceptRequest = async (requesterId) => {
    const result = await acceptConnectionRequest(requesterId);
    if (!result.success) {
      setError(result.message);
    }
  };

  // Handle reject connection request
  const handleRejectRequest = async (requesterId) => {
    const result = await rejectConnectionRequest(requesterId);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex overflow-x-auto">
                <button
                  className={`${
                    activeTab === 'connections'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('connections')}
                >
                  My Connections ({connections.length})
                </button>
                <button
                  className={`${
                    activeTab === 'requests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('requests')}
                >
                  Pending Requests ({connectionRequests.length})
                </button>
                <button
                  className={`${
                    activeTab === 'suggestions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('suggestions')}
                >
                  Suggestions
                </button>
                <button
                  className={`${
                    activeTab === 'followers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('followers')}
                >
                  Followers
                </button>
                <button
                  className={`${
                    activeTab === 'following'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('following')}
                >
                  Following
                </button>
              </nav>
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

            <div className="p-4">
              {activeTab === 'connections' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Connections</h3>
                  {connections.length === 0 ? (
                    <p className="text-gray-500">You don't have any connections yet.</p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {connections.map(connection => (
                        <li key={connection._id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                          <div className="w-full flex items-center justify-between p-6 space-x-6">
                            <div className="flex-1 truncate">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-gray-900 text-sm font-medium truncate">
                                  {connection.firstName} {connection.lastName}
                                </h3>
                                <span className="flex-shrink-0 inline-block px-2 py-0.5 text-green-800 text-xs font-medium bg-green-100 rounded-full">
                                  Connected
                                </span>
                              </div>
                              <p className="mt-1 text-gray-500 text-sm truncate">{connection.headline || 'LinkedIn Member'}</p>
                            </div>
                            <img className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" src={connection.profileImage || 'https://via.placeholder.com/40'} alt="" />
                          </div>
                          <div>
                            <div className="-mt-px flex divide-x divide-gray-200">
                              <div className="w-0 flex-1 flex">
                                <Link
                                  to={`/profile/${connection._id}`}
                                  className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500"
                                >
                                  <span className="ml-3">View Profile</span>
                                </Link>
                              </div>
                              <div className="-ml-px w-0 flex-1 flex">
                                <Link
                                  to={`/messages/${connection._id}`}
                                  className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500"
                                >
                                  <span className="ml-3">Message</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'requests' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Requests</h3>
                  {connectionRequests.length === 0 ? (
                    <p className="text-gray-500">You don't have any pending connection requests.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {connectionRequests.map(request => (
                        <li key={request._id} className="py-4 flex">
                          <img className="h-10 w-10 rounded-full" src={request.profileImage || 'https://via.placeholder.com/40'} alt="" />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {request.firstName} {request.lastName}
                              </p>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleAcceptRequest(request._id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(request._id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Ignore
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">{request.headline || 'LinkedIn Member'}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'suggestions' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">People You May Know</h3>
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : suggestedConnections.length === 0 ? (
                    <p className="text-gray-500">No suggestions available at the moment.</p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {suggestedConnections.map(user => (
                        <li key={user._id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                          <div className="w-full flex items-center justify-between p-6 space-x-6">
                            <div className="flex-1 truncate">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-gray-900 text-sm font-medium truncate">
                                  {user.firstName} {user.lastName}
                                </h3>
                                {user.mutualConnectionsCount > 0 && (
                                  <span className="flex-shrink-0 inline-block px-2 py-0.5 text-blue-800 text-xs font-medium bg-blue-100 rounded-full">
                                    {user.mutualConnectionsCount} mutual
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-gray-500 text-sm truncate">{user.headline || 'LinkedIn Member'}</p>
                            </div>
                            <img className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" src={user.profileImage || 'https://via.placeholder.com/40'} alt="" />
                          </div>
                          <div>
                            <div className="-mt-px flex divide-x divide-gray-200">
                              <div className="w-0 flex-1 flex">
                                <Link
                                  to={`/profile/${user._id}`}
                                  className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500"
                                >
                                  <span className="ml-3">View Profile</span>
                                </Link>
                              </div>
                              <div className="-ml-px w-0 flex-1 flex">
                                <button
                                  onClick={() => handleConnectionRequest(user._id)}
                                  className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-blue-700 font-medium border border-transparent rounded-br-lg hover:text-blue-500"
                                >
                                  <span className="ml-3">Connect</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'followers' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">People Following You</h3>
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : followers.length === 0 ? (
                    <p className="text-gray-500">You don't have any followers yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {followers.map(follower => (
                        <li key={follower._id} className="py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <img className="h-12 w-12 rounded-full" src={follower.profileImage || 'https://via.placeholder.com/48'} alt="" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-900">{follower.firstName} {follower.lastName}</h3>
                              <p className="text-sm text-gray-500">{follower.headline || 'LinkedIn Member'}</p>
                            </div>
                          </div>
                          <div>
                            <ConnectionButton targetUserId={follower._id} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'following' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">People You Follow</h3>
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : following.length === 0 ? (
                    <p className="text-gray-500">You're not following anyone yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {following.map(followedUser => (
                        <li key={followedUser._id} className="py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <img className="h-12 w-12 rounded-full" src={followedUser.profileImage || 'https://via.placeholder.com/48'} alt="" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-900">{followedUser.firstName} {followedUser.lastName}</h3>
                              <p className="text-sm text-gray-500">{followedUser.headline || 'LinkedIn Member'}</p>
                            </div>
                          </div>
                          <div>
                            <ConnectionButton targetUserId={followedUser._id} initialConnectionStatus="following" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Network;
