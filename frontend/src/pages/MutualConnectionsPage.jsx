import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import { AuthDataContext } from '../context/AuthContext';

const MutualConnectionsPage = () => {
  const { userId } = useParams();
  const { serverUrl, currentUser } = useContext(AuthDataContext);
  
  const [mutualConnections, setMutualConnections] = useState([]);
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch mutual connections and target user data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !userId) return;

      try {
        setLoading(true);
        setError('');
        
        // Fetch data in parallel
        const [connectionsResponse, userResponse] = await Promise.all([
          axios.get(`${serverUrl}/api/connections/mutual/${currentUser._id}/${userId}`),
          axios.get(`${serverUrl}/api/profile/${userId}`)
        ]);
        
        setMutualConnections(connectionsResponse.data);
        setTargetUser(userResponse.data.user);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load mutual connections');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serverUrl, currentUser, userId]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">
                {loading ? 'Loading...' : (
                  <>
                    Mutual Connections with {targetUser?.firstName} {targetUser?.lastName}
                  </>
                )}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {mutualConnections.length} shared connections
              </p>
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
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : mutualConnections.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No mutual connections found.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {mutualConnections.map(connection => (
                    <li key={connection._id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                      <div className="w-full flex items-center justify-between p-6 space-x-6">
                        <div className="flex-1 truncate">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-gray-900 text-sm font-medium truncate">
                              {connection.firstName} {connection.lastName}
                            </h3>
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
                              className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-blue-700 font-medium border border-transparent rounded-br-lg hover:text-blue-500"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MutualConnectionsPage;
