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
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. ${roles.join(' or ')} role required.` 
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
