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
  return axios.post(`${API_URL}/api/auth/login`, { email, password });
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
  return authAxios().get('/superadmin/admins');
};

export const createAdmin = async (adminData) => {
  return authAxios().post('/superadmin/admins', adminData);
};

export const updateAdmin = async (adminId, adminData) => {
  return authAxios().put(`/superadmin/admins/${adminId}`, adminData);
};

export const deleteAdmin = async (adminId) => {
  return authAxios().delete(`/superadmin/admins/${adminId}`);
};

// Product management services
export const fetchProducts = async () => {
  return authAxios().get('/superadmin/products');
};

export const createProduct = async (productData) => {
  return authAxios().post('/superadmin/products', productData);
};

export const updateProduct = async (productId, productData) => {
  return authAxios().put(`/superadmin/products/${productId}`, productData);
};

export const deleteProduct = async (productId) => {
  return authAxios().delete(`/superadmin/products/${productId}`);
};

export const regenerateProductLink = async (productId) => {
  return authAxios().post(`/superadmin/products/${productId}/regenerate-link`);
};

// Product access management
export const grantProductAccess = async (adminId, productId) => {
  return authAxios().post(`/superadmin/admins/${adminId}/products/${productId}/grant`);
};

export const revokeProductAccess = async (adminId, productId) => {
  return authAxios().post(`/superadmin/admins/${adminId}/products/${productId}/revoke`);
};

// Product analytics
export const getProductAnalytics = async (productId) => {
  return authAxios().get(`/superadmin/products/${productId}/analytics`);
};

// User management for admins
export const fetchUsers = async () => {
  return authAxios().get('/admin/users');
};

export const createUser = async (userData) => {
  return authAxios().post('/admin/users', userData);
};

export const updateUser = async (userId, userData) => {
  return authAxios().put(`/admin/users/${userId}`, userData);
};

export const deleteUser = async (userId) => {
  return authAxios().delete(`/admin/users/${userId}`);
};

// Access product by link
export const accessProductByLink = async (accessLink) => {
  return axios.get(`/products/access/${accessLink}`);
};

// Service management services
export const fetchServices = async () => {
  return authAxios().get('/services/superadmin');
};

export const createService = async (serviceData) => {
  return authAxios().post('/services/superadmin', serviceData);
};

export const updateService = async (serviceId, serviceData) => {
  return authAxios().put(`/services/superadmin/${serviceId}`, serviceData);
};

export const deleteService = async (serviceId) => {
  return authAxios().delete(`/services/superadmin/${serviceId}`);
};

export const getServiceStats = async () => {
  return authAxios().get('/services/superadmin/stats/summary');
};
