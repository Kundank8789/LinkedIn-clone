import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthDataContext } from '../Context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useContext(AuthDataContext);

  // If auth is still loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // If logged in, render the protected component
  return children;
};

export default ProtectedRoute;
