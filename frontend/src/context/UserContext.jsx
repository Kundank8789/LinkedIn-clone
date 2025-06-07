import React, { useContext, useState, useEffect, createContext } from 'react';
import axios from 'axios';
import { AuthDataContext } from './AuthContext';

// Create the user context for user data
export const UserDataContext = createContext();

function UserContext({children}) {
  const [userData, setUserData] = useState(null);
  const [connections, setConnections] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { serverUrl, currentUser, isLoggedIn } = useContext(AuthDataContext);

  // Fetch user data when currentUser changes
  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      if (!isLoggedIn || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = currentUser._id;

        // Fetch user profile data
        const profileResponse = await axios.get(`${serverUrl}/api/profile/${userId}`);

        if (isMounted && profileResponse.data) {
          setUserData({
            ...currentUser,
            ...profileResponse.data
          });
        }

        // Fetch user connections
        const connectionsResponse = await axios.get(`${serverUrl}/api/connections/${userId}`);
        if (isMounted && connectionsResponse.data) {
          setConnections(connectionsResponse.data);
        }

        // Fetch connection requests
        const requestsResponse = await axios.get(`${serverUrl}/api/connections/requests/${userId}`);
        if (isMounted && requestsResponse.data) {
          setConnectionRequests(requestsResponse.data);
        }

        // Fetch user posts
        const postsResponse = await axios.get(`${serverUrl}/api/posts/user/${userId}`);
        if (isMounted && postsResponse.data) {
          setPosts(postsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [serverUrl, currentUser, isLoggedIn]);

  // Function to update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.post(`${serverUrl}/api/profile/update`, profileData);

      if (response.data.success) {
        // Update local user data
        setUserData(prev => ({
          ...prev,
          ...profileData
        }));

        return { success: true, message: 'Profile updated successfully' };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  // Function to create a new post
  const createPost = async (postData) => {
    try {
      const formData = new FormData();
      formData.append('userId', currentUser._id);
      formData.append('text', postData.text);

      if (postData.image) {
        formData.append('image', postData.image);
      }

      const response = await axios.post(`${serverUrl}/api/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add new post to state
      setPosts(prev => [response.data, ...prev]);

      return { success: true, post: response.data };
    } catch (error) {
      console.error('Error creating post:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create post'
      };
    }
  };

  // Function to send connection request
  const sendConnectionRequest = async (targetUserId) => {
    try {
      const response = await axios.post(`${serverUrl}/api/connections/request`, {
        userId: currentUser._id,
        targetUserId
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error sending connection request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send connection request'
      };
    }
  };

  // Function to accept connection request
  const acceptConnectionRequest = async (requesterId) => {
    try {
      const response = await axios.post(`${serverUrl}/api/connections/accept`, {
        userId: currentUser._id,
        requesterId
      });

      // Update local state
      setConnectionRequests(prev =>
        prev.filter(request => request._id !== requesterId)
      );

      // Fetch updated connections
      const connectionsResponse = await axios.get(`${serverUrl}/api/connections/${currentUser._id}`);
      setConnections(connectionsResponse.data);

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error accepting connection request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to accept connection request'
      };
    }
  };

  // Function to reject connection request
  const rejectConnectionRequest = async (requesterId) => {
    try {
      const response = await axios.post(`${serverUrl}/api/connections/reject`, {
        userId: currentUser._id,
        requesterId
      });

      // Update local state
      setConnectionRequests(prev =>
        prev.filter(request => request._id !== requesterId)
      );

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject connection request'
      };
    }
  };

  const value = {
    userData,
    connections,
    connectionRequests,
    posts,
    loading,
    updateProfile,
    createPost,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

export default UserContext