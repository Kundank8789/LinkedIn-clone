import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the auth context for server URL and basic auth info
export const AuthDataContext = createContext();

function AuthContext({children}) {
  // Use the fixed port we set in the backend
  const [serverUrl, setServerUrl] = useState("http://localhost:54321");
  const [portDetectionComplete, setPortDetectionComplete] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios defaults
  axios.defaults.withCredentials = true;

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Only proceed if port detection is complete
        if (!portDetectionComplete) {
          return;
        }

        if (token) {
          // Set auth header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Verify token is valid
          const response = await axios.get(`${serverUrl}/api/user/me`);
          setCurrentUser(response.data);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        setToken(null);
        setIsLoggedIn(false);
        setCurrentUser(null);
        // Clear auth header
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [token, serverUrl, portDetectionComplete]);

  // Login function
  const login = async (userData) => {
    try {
      const response = await axios.post(`${serverUrl}/api/auth/login`, userData);
      const { token, user } = response.data;

      // Save token and set current user
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      setIsLoggedIn(true);

      // Set auth header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      // Make sure userName is included in the request
      if (!userData.userName && userData.email) {
        // Generate a userName from the email if not provided
        userData.userName = userData.email.split('@')[0];
      }

      const response = await axios.post(`${serverUrl}/api/auth/signup`, userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Signup failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed. Please try again.'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`);

      // Clear local storage and state
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      setIsLoggedIn(false);

      // Clear auth header
      delete axios.defaults.headers.common['Authorization'];

      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, message: 'Logout failed. Please try again.' };
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${serverUrl}/api/auth/forgot-password`, { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Forgot password request failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed. Please try again.'
      };
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await axios.post(`${serverUrl}/api/auth/reset-password`, { token, newPassword });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Password reset failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed. Please try again.'
      };
    }
  };

  const authValue = {
    serverUrl,
    currentUser,
    isLoggedIn,
    loading,
    token,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthDataContext.Provider value={authValue}>
      {children}
    </AuthDataContext.Provider>
  )
}

export default AuthContext