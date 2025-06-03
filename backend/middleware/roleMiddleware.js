// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    return next();
  }

  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

// Middleware to check if user is a superadmin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'superadmin') {
    return next();
  }

  return res.status(403).json({ message: 'Access denied. SuperAdmin privileges required.' });
};

module.exports = { isAdmin, isSuperAdmin };
