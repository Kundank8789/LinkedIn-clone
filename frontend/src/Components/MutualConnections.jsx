import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthDataContext } from '../context/AuthContext';

const MutualConnections = ({ userId }) => {
  const { serverUrl, currentUser } = useContext(AuthDataContext);
  const [mutualConnections, setMutualConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMutualConnections = async () => {
      if (!currentUser || !userId) return;

      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/connections/mutual/${currentUser._id}/${userId}`);
        setMutualConnections(response.data);
      } catch (err) {
        console.error('Error fetching mutual connections:', err);
        setError('Failed to load mutual connections');
      } finally {
        setLoading(false);
      }
    };

    fetchMutualConnections();
  }, [serverUrl, currentUser, userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        {error}
      </div>
    );
  }

  if (mutualConnections.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No mutual connections found.
      </div>
    );
  }

  return (
    <div className="py-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Mutual Connections</h3>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mutualConnections.map(connection => (
          <li key={connection._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <img 
                src={connection.profileImage || 'https://via.placeholder.com/40'} 
                alt={`${connection.firstName} ${connection.lastName}`}
                className="h-10 w-10 rounded-full mr-3"
              />
              <div>
                <Link 
                  to={`/profile/${connection._id}`}
                  className="text-sm font-medium text-gray-900 hover:underline"
                >
                  {connection.firstName} {connection.lastName}
                </Link>
                <p className="text-xs text-gray-500">{connection.headline || 'LinkedIn Member'}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MutualConnections;
