import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [portalInfo, setPortalInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if we're on a subdomain login page
    const fetchPortalInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/portal-info`);
        if (response.data && response.data.portal) {
          setPortalInfo(response.data.portal);
          document.title = `${response.data.portal.companyName} - Login`;
        }
      } catch (error) {
        console.log('Not on a subdomain or portal not found');
      }
    };
    
    fetchPortalInfo();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/login`, formData);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Redirect based on role
      if (response.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.data.role === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        {portalInfo ? (
          // Enterprise-specific login
          <div className="enterprise-login-header">
            {portalInfo.companyLogo ? (
              <img 
                src={portalInfo.companyLogo} 
                alt={`${portalInfo.companyName} logo`} 
                className="enterprise-logo" 
              />
            ) : (
              <div className="enterprise-logo-placeholder">
                {portalInfo.companyName.charAt(0)}
              </div>
            )}
            <h1>{portalInfo.companyName}</h1>
            <p className="login-subtitle">Enterprise Portal</p>
          </div>
        ) : (
          // Regular login
          <div className="login-header">
            <h1>MOAQA</h1>
            <p className="login-subtitle">CRM & Business Management</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          <div className="login-links">
            <a href="/forgot-password">Forgot password?</a>
            {!portalInfo && <a href="/contact">Request access</a>}
          </div>
        </form>
        
        <div className="login-footer">
          {portalInfo ? (
            <p>Powered by MOAQA Business Solutions</p>
          ) : (
            <p>&copy; {new Date().getFullYear()} MOAQA. All rights reserved.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 