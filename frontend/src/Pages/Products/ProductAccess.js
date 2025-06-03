import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductAccess.css';

const ProductAccess = () => {
  const { accessLink } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/access/${accessLink}`
        );
        setProduct(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Invalid or expired access link. Please contact your administrator.');
      } finally {
        setLoading(false);
      }
    };

    if (accessLink) {
      fetchProduct();
    }
  }, [accessLink]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Here you would typically handle the email submission
    // For example, send it to the backend to register interest
    setSubmitted(true);
    
    // For demo purposes, we'll just show a success message
    setTimeout(() => {
      navigate('/');
    }, 5000);
  };

  if (loading) {
    return (
      <div className="product-access-container">
        <div className="product-access-card loading">
          <div className="loading-spinner"></div>
          <p>Loading product information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-access-container">
        <div className="product-access-card error">
          <div className="error-icon">⚠️</div>
          <h2>Access Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Return to Home</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="product-access-container">
        <div className="product-access-card success">
          <div className="success-icon">✅</div>
          <h2>Thank You!</h2>
          <p>Your interest in "{product.name}" has been registered.</p>
          <p>A representative will contact you soon with access details.</p>
          <p>You will be redirected to the home page in a few seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-access-container">
      <div className="product-access-card">
        <div className="product-icon">{product?.icon || '📋'}</div>
        <h1>{product?.name || 'Product'}</h1>
        <p className="product-description">{product?.description || 'No description available'}</p>
        
        <div className="access-form">
          <h3>Request Access</h3>
          <p>Enter your email to gain access to this product:</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
              />
            </div>
            <button type="submit" className="access-button">
              Request Access
            </button>
          </form>
          
          <p className="privacy-note">
            Your email will only be used to provide you access to this product.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductAccess; 