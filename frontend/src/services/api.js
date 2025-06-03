import axios from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with auth header
const authAxios = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Authentication services
export const login = async (email, password) => {
  return axios.post(`${API_URL}/auth/login`, { email, password });
};

export const superAdminLogin = async (email, password) => {
  return axios.post(`${API_URL}/superadmin/login`, { email, password });
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Admin management services
export const fetchAdmins = async () => {
  return authAxios().get(`${API_URL}/superadmin/admins`);
};

export const createAdmin = async (adminData) => {
  return authAxios().post(`${API_URL}/superadmin/admins`, adminData);
};

export const updateAdmin = async (adminId, adminData) => {
  return authAxios().put(`${API_URL}/superadmin/admins/${adminId}`, adminData);
};

export const deleteAdmin = async (adminId) => {
  return authAxios().delete(`${API_URL}/superadmin/admins/${adminId}`);
};

// Product management services
export const fetchProducts = async () => {
  return authAxios().get(`${API_URL}/superadmin/products`);
};

export const createProduct = async (productData) => {
  return authAxios().post(`${API_URL}/superadmin/products`, productData);
};

export const updateProduct = async (productId, productData) => {
  return authAxios().put(`${API_URL}/superadmin/products/${productId}`, productData);
};

export const deleteProduct = async (productId) => {
  return authAxios().delete(`${API_URL}/superadmin/products/${productId}`);
};

export const regenerateProductLink = async (productId) => {
  return authAxios().post(`${API_URL}/superadmin/products/${productId}/regenerate-link`);
};

// Product access management
export const grantProductAccess = async (adminId, productId) => {
  return authAxios().post(`${API_URL}/superadmin/admins/${adminId}/products/${productId}/grant`);
};

export const revokeProductAccess = async (adminId, productId) => {
  return authAxios().post(`${API_URL}/superadmin/admins/${adminId}/products/${productId}/revoke`);
};

// Product analytics
export const getProductAnalytics = async (productId) => {
  return authAxios().get(`${API_URL}/superadmin/products/${productId}/analytics`);
};

// User management for admins
export const fetchUsers = async () => {
  return authAxios().get(`${API_URL}/admin/users`);
};

export const createUser = async (userData) => {
  return authAxios().post(`${API_URL}/admin/users`, userData);
};

export const updateUser = async (userId, userData) => {
  return authAxios().put(`${API_URL}/admin/users/${userId}`, userData);
};

export const deleteUser = async (userId) => {
  return authAxios().delete(`${API_URL}/admin/users/${userId}`);
};

// Access product by link
export const accessProductByLink = async (accessLink) => {
  return axios.get(`${API_URL}/products/access/${accessLink}`);
};

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';

// Pages for different roles
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

const App = () => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Fetch the user's role from localStorage or sessionStorage
    const token = localStorage.getItem('token'); // Assuming JWT token is saved in localStorage
    if (token) {
      // Decode the token to extract the role
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decodedToken.role); // Set the role based on the JWT
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<h1>Welcome to CRM</h1>} />
        {userRole === 'superadmin' && (
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
        )}
        {userRole === 'admin' && (
          <Route path="/admin" element={<AdminDashboard />} />
        )}
        {userRole === 'user' && (
          <Route path="/user" element={<UserDashboard />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
