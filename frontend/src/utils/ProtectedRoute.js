import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserInfo } from '../services/authService';

/**
 * ProtectedRoute component - Provides authentication protection for routes
 * 
 * This component checks if the user is authenticated and has the correct role
 * before rendering the child component. If authentication fails, it redirects
 * to the login page.
 * 
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - The child component to render if authentication succeeds
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @returns {JSX.Element} The protected component or redirect
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        setIsAllowed(false);
        setIsChecking(false);
        return;
      }

      // If no specific roles are required, allow access
      if (!allowedRoles || allowedRoles.length === 0) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      // Check if user has the required role
      const userInfo = getUserInfo();
      if (userInfo && allowedRoles.includes(userInfo.role)) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      // User doesn't have the required role
      setIsAllowed(false);
      setIsChecking(false);
    };

    checkAuth();
  }, [allowedRoles, location.pathname]);

  // While checking, you could show a loading spinner
  if (isChecking) {
    return <div>Loading...</div>;
  }

  // If not allowed, redirect to appropriate login page
  if (!isAllowed) {
    const userInfo = getUserInfo();
    
    // If user is logged in but doesn't have permission, redirect to their dashboard
    if (userInfo) {
      switch (userInfo.role) {
        case 'superadmin':
          return <Navigate to="/superadmin" replace />;
        case 'admin':
          return <Navigate to="/admin" replace />;
        case 'user':
          return <Navigate to="/user" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
    
    // If trying to access superadmin routes, redirect to superadmin login
    if (allowedRoles.includes('superadmin')) {
      return <Navigate to="/superadmin/login" replace />;
    }
    
    // Default login page for other roles
    return <Navigate to="/login" replace />;
  }

  // If allowed, render the children
  return children;
};

export default ProtectedRoute; 