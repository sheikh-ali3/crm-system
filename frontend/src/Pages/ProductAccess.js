import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductAccess.css';

const ProductAccess = () => {
  const { accessLink } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [verifyingAccess, setVerifyingAccess] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // Validate the access link
  useEffect(() => {
    const validateAccessLink = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${apiUrl}/products/access/${accessLink}`);
        
        if (response.data.success) {
          setProduct(response.data.product);
          
          // If user is logged in, verify their access
          const token = localStorage.getItem('token');
          if (token) {
            verifyProductAccess(response.data.product.productId, token);
          }
        } else {
          setError('Invalid access link');
        }
      } catch (err) {
        console.error('Error validating access link:', err);
        setError(err.response?.data?.message || 'Invalid or expired access link');
      } finally {
        setLoading(false);
      }
    };
    
    if (accessLink) {
      validateAccessLink();
    }
  }, [accessLink]);

  // Verify user's access to the product
  const verifyProductAccess = async (productId, token) => {
    try {
      setVerifyingAccess(true);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(
        `${apiUrl}/products/verify/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Redirect to the appropriate product
        redirectToProduct(productId);
      } else {
        setError('You do not have access to this product');
      }
    } catch (err) {
      console.error('Error verifying product access:', err);
      setError(err.response?.data?.message || 'Failed to verify product access');
    } finally {
      setVerifyingAccess(false);
    }
  };

  // Handle login and product access verification
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/login`, { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setIsLoggedIn(true);
        
        // Verify product access
        if (product) {
          verifyProductAccess(product.productId, response.data.token);
        }
      } else {
        setError('Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  // Redirect to the appropriate product
  const redirectToProduct = (productId) => {
    switch (productId) {
      case 'crm':
        navigate('/admin/crm');
        break;
      case 'hrm':
        navigate('/admin/hrm');
        break;
      case 'job-portal':
        navigate('/admin/job-portal');
        break;
      case 'job-board':
        navigate('/admin/job-board');
        break;
      case 'project-management':
        navigate('/admin/projects');
        break;
      default:
        navigate('/admin/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="product-access-container">
        <div className="product-access-card">
          <div className="loading-spinner"></div>
          <p>Validating access link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-access-container">
        <div className="product-access-card error">
          <h2>Access Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Go to Homepage</button>
        </div>
      </div>
    );
  }

  if (verifyingAccess) {
    return (
      <div className="product-access-container">
        <div className="product-access-card">
          <div className="loading-spinner"></div>
          <p>Verifying your access...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-access-container">
        <div className="product-access-card error">
          <h2>Product Not Found</h2>
          <p>The requested product does not exist or the access link is invalid.</p>
          <button onClick={() => navigate('/')}>Go to Homepage</button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-access-container">
      <div className="product-access-card">
        <div className="product-icon">{product.icon || '📊'}</div>
        <h2>{product.name}</h2>
        <p className="product-description">{product.description}</p>
        
        {!isLoggedIn ? (
          <>
            <p>Please log in to access this product</p>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" placeholder="Enter your password" />
              </div>
              <button type="submit" className="login-button">Login</button>
            </form>
          </>
        ) : (
          <button 
            onClick={() => verifyProductAccess(product.productId, localStorage.getItem('token'))}
            className="access-button"
          >
            Access {product.name}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductAccess; 