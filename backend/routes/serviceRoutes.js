const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Service routes
// Services CRUD for SuperAdmin
router.post('/', authenticateToken, authorizeRole('superadmin'), serviceController.createService);
router.get('/superadmin/quotations', authenticateToken, authorizeRole('superadmin'), serviceController.getAllQuotations);
router.put('/superadmin/quotations/:id', authenticateToken, authorizeRole('superadmin'), serviceController.updateQuotationStatus);
router.get('/superadmin', authenticateToken, authorizeRole('superadmin'), serviceController.getAllServices);
router.get('/superadmin/:id', authenticateToken, authorizeRole('superadmin'), serviceController.getServiceById);
router.put('/:id', authenticateToken, authorizeRole('superadmin'), serviceController.updateService);
router.delete('/:id', authenticateToken, authorizeRole('superadmin'), serviceController.deleteService);

// Admin service routes - read only
router.get('/admin', authenticateToken, authorizeRole('admin'), serviceController.getAllServices);
router.get('/admin/:id', authenticateToken, authorizeRole('admin'), serviceController.getServiceById);

// Quotation routes
router.post('/admin/:serviceId/quotation', authenticateToken, authorizeRole('admin'), serviceController.requestQuotation);
router.get('/admin/quotations', authenticateToken, authorizeRole('admin'), serviceController.getAdminQuotations);
router.post('/:serviceId/quotation', authenticateToken, authorizeRole('admin'), serviceController.requestQuotation);

// Service statistics for SuperAdmin
router.get('/superadmin/stats/summary', authenticateToken, authorizeRole('superadmin'), serviceController.getServiceStats);

// Place generic /:id route after all specific routes
router.get('/:id', authenticateToken, authorizeRole('superadmin'), serviceController.getServiceById);

module.exports = router; 