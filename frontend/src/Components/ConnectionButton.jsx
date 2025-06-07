import React, { useState, useEffect, useContext } from 'react';
import { AuthDataContext } from '../context/AuthContext';
import axios from 'axios';

const ConnectionButton = ({ targetUserId, initialConnectionStatus, onStatusChange }) => {
  const { serverUrl, currentUser } = useContext(AuthDataContext);
  const [connectionStatus, setConnectionStatus] = useState(initialConnectionStatus || 'none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialConnectionStatus) {
      setConnectionStatus(initialConnectionStatus);
    } else if (currentUser && targetUserId) {
      checkConnectionStatus();
    }
  }, [currentUser, targetUserId, initialConnectionStatus]);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${serverUrl}/api/connections/status/${currentUser._id}/${targetUserId}`);
      setConnectionStatus(response.data.status);
      
      // Notify parent component about the status
      if (onStatusChange) {
        onStatusChange(response.data.status);
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
      setError('Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${serverUrl}/api/connections/request`, {
        userId: currentUser._id,
        targetUserId
      });
      
      setConnectionStatus('pending_sent');
      
      // Notify parent component about the status change
      if (onStatusChange) {
        onStatusChange('pending_sent');
      }
      
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error sending connection request:', err);
      setError(err.response?.data?.message || 'Failed to send connection request');
      return { success: false, message: err.response?.data?.message || 'Failed to send connection request' };
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${serverUrl}/api/connections/accept`, {
        userId: currentUser._id,
        requesterId: targetUserId
      });
      
      setConnectionStatus('connected');
      
      // Notify parent component about the status change
      if (onStatusChange) {
        onStatusChange('connected');
      }
      
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error accepting connection request:', err);
      setError(err.response?.data?.message || 'Failed to accept connection request');
      return { success: false, message: err.response?.data?.message || 'Failed to accept connection request' };
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${serverUrl}/api/connections/reject`, {
        userId: currentUser._id,
        requesterId: targetUserId
      });
      
      setConnectionStatus('none');
      
      // Notify parent component about the status change
      if (onStatusChange) {
        onStatusChange('none');
      }
      
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error rejecting connection request:', err);
      setError(err.response?.data?.message || 'Failed to reject connection request');
      return { success: false, message: err.response?.data?.message || 'Failed to reject connection request' };
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${serverUrl}/api/connections/remove`, {
        userId: currentUser._id,
        connectionId: targetUserId
      });
      
      setConnectionStatus('none');
      
      // Notify parent component about the status change
      if (onStatusChange) {
        onStatusChange('none');
      }
      
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error removing connection:', err);
      setError(err.response?.data?.message || 'Failed to remove connection');
      return { success: false, message: err.response?.data?.message || 'Failed to remove connection' };
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${serverUrl}/api/connections/follow`, {
        userId: currentUser._id,
        targetUserId
      });
      
      // Update the connection status if the user is following but not connected
      if (connectionStatus === 'none') {
        setConnectionStatus('following');
      } else if (connectionStatus === 'connected') {
        setConnectionStatus('connected_following');
      }
      
      // Notify parent component about the status change
      if (onStatusChange) {
        onStatusChange(connectionStatus === 'none' ? 'following' : 'connected_following');
      }
      
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error following user:', err);
      setError(err.response?.data?.message || 'Failed to follow user');
      return { success: false, message: err.response?.data?.message || 'Failed to follow user' };
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${serverUrl}/api/connections/unfollow`, {
        userId: currentUser._id,
        targetUserId
      });
      
      // Update the connection status if the user is following but not connected
      if (connectionStatus === 'following') {
        setConnectionStatus('none');
      } else if (connectionStatus === 'connected_following') {
        setConnectionStatus('connected');
      }
      
      // Notify parent component about the status change
      if (onStatusChange) {
        onStatusChange(connectionStatus === 'following' ? 'none' : 'connected');
      }
      
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError(err.response?.data?.message || 'Failed to unfollow user');
      return { success: false, message: err.response?.data?.message || 'Failed to unfollow user' };
    } finally {
      setLoading(false);
    }
  };

  // Render different buttons based on connection status
  const renderButton = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleRemove}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processing...' : 'Remove Connection'}
            </button>
            <button
              onClick={handleFollow}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-md shadow-sm text-blue-500 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processing...' : 'Follow'}
            </button>
          </div>
        );
        
      case 'connected_following':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleRemove}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processing...' : 'Remove Connection'}
            </button>
            <button
              onClick={handleUnfollow}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-500 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {loading ? 'Processing...' : 'Unfollow'}
            </button>
          </div>
        );
        
      case 'following':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processing...' : 'Connect'}
            </button>
            <button
              onClick={handleUnfollow}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-500 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {loading ? 'Processing...' : 'Unfollow'}
            </button>
          </div>
        );
        
      case 'pending_sent':
        return (
          <button
            disabled={true}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-500 bg-gray-100 cursor-not-allowed"
          >
            Pending
          </button>
        );
        
      case 'pending_received':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processing...' : 'Accept'}
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processing...' : 'Ignore'}
            </button>
          </div>
        );
        
      case 'none':
      default:
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processing...' : 'Connect'}
            </button>
            <button
              onClick={handleFollow}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-md shadow-sm text-blue-500 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processing...' : 'Follow'}
            </button>
          </div>
        );
    }
  };

  if (error) {
    return (
      <div className="text-red-500 text-sm mb-2">
        {error}
        <button
          onClick={checkConnectionStatus}
          className="text-blue-500 ml-2 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return renderButton();
};

export default ConnectionButton;
