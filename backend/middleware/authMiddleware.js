const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Authentication failed: No token provided in Authorization header');
      }
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (process.env.NODE_ENV === 'development') {
      console.log('Token validation attempt');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (process.env.NODE_ENV === 'development') {
      console.log('Token successfully verified for user:', { id: decoded.id, role: decoded.role });
    }
    
    // Add user info to request
    req.user = decoded;
    
    // Check if we're using mock database
    if (process.env.USE_MOCK_DB === 'true') {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock DB for user authentication');
      }
      
      // For mock DB, we can skip further checks in development mode
      if (process.env.NODE_ENV === 'development') {
        // In development, we'll consider the token valid if it can be decoded
        return next();
      }
      
      // For mock DB, verify the user exists in mock data
      const mockDb = require('../utils/mockDb');
      const mockUser = mockDb.findOne('users', { _id: decoded.id });
      
      if (!mockUser) {
        if (process.env.NODE_ENV === 'development') {
          console.log('User not found in mock DB:', decoded.id);
        }
        return res.status(401).json({ message: 'User not found in mock database. Please log in again.' });
      }
      
      // Add additional user data that might be needed
      req.user.permissions = mockUser.permissions;
      return next();
    }
    
    // If using real DB, verify the user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('User not found in database:', decoded.id);
      }
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
};

// Middleware to check user role
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ 
        message: `Access denied. ${role} role required.` 
      });
    }
    
    next();
  };
};

// Middleware to check CRM access for admins
const checkCrmAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // SuperAdmin always has access
    if (req.user.role === 'superadmin') {
      return next();
    }
    
    // For other roles, check permissions
    if (req.user.role === 'admin') {
      // If using mock DB
      if (process.env.USE_MOCK_DB === 'true') {
        const mockDb = require('../utils/mockDb');
        const admin = mockDb.findOne('users', { _id: req.user.id });
        
        if (!admin || !admin.permissions || !admin.permissions.crmAccess) {
          return res.status(403).json({ message: 'You do not have access to the CRM.' });
        }
        
        return next();
      }
      
      // If using real DB
      const admin = await User.findById(req.user.id);
      if (!admin || !admin.permissions || !admin.permissions.crmAccess) {
        return res.status(403).json({ message: 'You do not have access to the CRM.' });
      }
    }
    
    // Users don't have access
    if (req.user.role === 'user') {
      return res.status(403).json({ message: 'Users do not have access to the CRM.' });
    }
    
    next();
  } catch (error) {
    console.error('CRM access check error:', error);
    res.status(500).json({ message: 'Internal server error checking CRM access.' });
  }
};

module.exports = { authenticateToken, authorizeRole, checkCrmAccess };
