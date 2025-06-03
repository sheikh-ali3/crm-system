const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Product CRUD operations - SuperAdmin only
router.post('/products', authenticateToken, authorizeRole('superadmin'), productController.createProduct);
router.get('/products/admin', authenticateToken, authorizeRole('superadmin'), productController.getAllProducts);
router.get('/products/:id', authenticateToken, authorizeRole('superadmin'), productController.getProductById);
router.put('/products/:id', authenticateToken, authorizeRole('superadmin'), productController.updateProduct);
router.delete('/products/:id', authenticateToken, authorizeRole('superadmin'), productController.deleteProduct);
router.post('/products/:id/regenerate-link', authenticateToken, authorizeRole('superadmin'), productController.regenerateAccessLink);

// Admin product access management - SuperAdmin only
router.post('/admins/:adminId/products/:productId/grant', authenticateToken, authorizeRole('superadmin'), productController.grantProductAccess);
router.post('/admins/:adminId/products/:productId/revoke', authenticateToken, authorizeRole('superadmin'), productController.revokeProductAccess);
router.get('/admins/:adminId/products', authenticateToken, authorizeRole('superadmin'), productController.getAdminProducts);

// Product analytics - SuperAdmin only
router.get('/products/:id/analytics', authenticateToken, authorizeRole('superadmin'), productController.getProductAnalytics);

// Protected routes - Admin and SuperAdmin access
router.get('/products', authenticateToken, productController.getAllProducts);

// Public route - Access products via link
router.get('/products/access/:accessLink', productController.getProductByAccessLink);

module.exports = router;
