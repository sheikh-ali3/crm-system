const Service = require('../models/serviceModel');
const Quotation = require('../models/quotationModel');
const User = require('../models/User');
const mongoose = require('mongoose');
const notificationController = require('./notificationController');

// Get all services (for both SuperAdmin and Admins)
exports.getAllServices = async (req, res) => {
  try {
    let query = {};
    
    // For non-superadmin users, only show active services
    if (req.user.role !== 'superadmin') {
      query.active = true;
    }
    
    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    let services = [];
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      services = mockDb.find('services', query);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Found ${services.length} services in mock DB`);
      }
    } else {
      services = await Service.find(query).sort({ createdAt: -1 });
    }
    
    res.status(200).json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
};

// Get a single service by ID
exports.getServiceById = async (req, res) => {
  try {
    let service;
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      service = mockDb.findById('services', req.params.id);
    } else {
      service = await Service.findById(req.params.id);
    }
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if service is inactive and user is not superadmin
    if (!service.active && req.user.role !== 'superadmin') {
      return res.status(404).json({ message: 'Service not found or inactive' });
    }
    
    res.status(200).json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Failed to fetch service', error: error.message });
  }
};

// Create a new service (SuperAdmin only)
exports.createService = async (req, res) => {
  try {
    const { name, description, price, category, icon, features, duration, active } = req.body;
    
    // Validate required fields
    if (!name || !description || price === undefined) {
      return res.status(400).json({ message: 'Name, description, and price are required' });
    }
    
    // Create service data object
    const serviceData = {
      name,
      description,
      price: parseFloat(price),
      category: category || 'General',
      icon: icon || '🔧',
      features: features || [],
      duration: duration || { unit: 'one-time' },
      active: active !== undefined ? active : true,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    let savedService;
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      savedService = mockDb.create('services', serviceData);
      if (process.env.NODE_ENV === 'development') {
        console.log('Service created in mock DB:', savedService._id);
      }
    } else {
      // Create service with current user as creator
      const newService = new Service(serviceData);
      savedService = await newService.save();
    }
    
    res.status(201).json({
      message: 'Service created successfully',
      service: savedService
    });
  } catch (error) {
    console.error('Service creation error:', error);
    res.status(500).json({ message: 'Failed to create service', error: error.message });
  }
};

// Update a service (SuperAdmin only)
exports.updateService = async (req, res) => {
  try {
    const { name, description, price, category, icon, features, duration, active } = req.body;
    
    let service;
    let updatedService;
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      service = mockDb.findById('services', req.params.id);
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Update service in mock DB
      updatedService = mockDb.update('services', req.params.id, {
        name: name || service.name,
        description: description || service.description,
        price: price !== undefined ? parseFloat(price) : service.price,
        category: category || service.category,
        icon: icon || service.icon,
        features: features || service.features,
        duration: duration || service.duration,
        active: active !== undefined ? active : service.active,
        updatedAt: new Date()
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Service updated in mock DB:', updatedService._id);
      }
    } else {
      // Validate service existence
      service = await Service.findById(req.params.id);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Update service
      updatedService = await Service.findByIdAndUpdate(
        req.params.id,
        {
          name: name || service.name,
          description: description || service.description,
          price: price !== undefined ? parseFloat(price) : service.price,
          category: category || service.category,
          icon: icon || service.icon,
          features: features || service.features,
          duration: duration || service.duration,
          active: active !== undefined ? active : service.active,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
    }
    
    res.status(200).json({
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Failed to update service', error: error.message });
  }
};

// Delete a service (SuperAdmin only)
exports.deleteService = async (req, res) => {
  try {
    let service;
    let quotationCount = 0;
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      service = mockDb.findById('services', req.params.id);
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Check for quotations with this service
      quotationCount = mockDb.find('quotations', { serviceId: req.params.id }).length;
      
      if (quotationCount > 0) {
        // Mark as inactive instead of deleting
        const updatedService = mockDb.update('services', req.params.id, { 
          active: false, 
          updatedAt: new Date() 
        });
        
        return res.status(200).json({
          message: 'Service has existing quotations. Marked as inactive instead of deleting.',
          service: updatedService,
          quotationCount
        });
      }
      
      // Delete the service
      mockDb.delete('services', req.params.id);
      console.log('Service deleted from mock DB:', req.params.id);
    } else {
      service = await Service.findById(req.params.id);
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Check if there are quotations for this service
      quotationCount = await Quotation.countDocuments({ serviceId: req.params.id });
      
      if (quotationCount > 0) {
        // If service has quotations, just mark it as inactive instead of deleting
        const updatedService = await Service.findByIdAndUpdate(
          req.params.id,
          { active: false, updatedAt: new Date() },
          { new: true }
        );
        
        return res.status(200).json({
          message: 'Service has existing quotations. Marked as inactive instead of deleting.',
          service: updatedService,
          quotationCount
        });
      }
      
      // No quotations, safe to delete
      await Service.findByIdAndDelete(req.params.id);
    }
    
    res.status(200).json({
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
};

// Get quotation requests for a specific Admin
exports.getAdminQuotations = async (req, res) => {
  try {
    let quotations = [];
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      
      // Get quotations for this admin from mock DB
      quotations = mockDb.find('quotations', { adminId: req.user.id });
      
      // Populate service data
      quotations = quotations.map(quotation => {
        const service = mockDb.findById('services', quotation.serviceId);
        
        return {
          ...quotation,
          serviceId: service ? {
            _id: service._id,
            name: service.name,
            price: service.price,
            category: service.category
          } : quotation.serviceId
        };
      });
      
      // Filter by status if specified
      if (req.query.status) {
        quotations = quotations.filter(q => q.status === req.query.status);
      }
      
      console.log(`Found ${quotations.length} quotations for admin in mock DB`);
    } else {
      // Build query for this admin
      let query = { adminId: req.user.id };
      
      // Status filter
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      // Get quotations from database with populated references
      quotations = await Quotation.find(query)
        .sort({ createdAt: -1 })
        .populate('serviceId', 'name price category');
    }
    
    res.status(200).json(quotations);
  } catch (error) {
    console.error('Error fetching admin quotations:', error);
    res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
  }
};

// Request quotation for a service (Admin only)
exports.requestQuotation = async (req, res) => {
  try {
    const { requestDetails, customRequirements, requestedPrice, enterpriseDetails } = req.body;
    const serviceId = req.params.serviceId;
    
    let service;
    let savedQuotation;
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      
      // Find service in mock DB
      service = mockDb.findById('services', serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Get admin data
      const admin = mockDb.findById('users', req.user.id);
      
      // Create quotation data
      const quotationData = {
        serviceId,
        adminId: req.user.id,
        requestDetails,
        customRequirements,
        requestedPrice: requestedPrice ? parseFloat(requestedPrice) : null,
        enterpriseDetails: enterpriseDetails || {
          companyName: admin?.profile?.companyName || `${admin?.profile?.fullName || 'Enterprise'} Company`,
          contactPerson: admin?.profile?.fullName || '',
          email: admin?.email || '',
          phone: admin?.profile?.phone || ''
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save quotation to mock DB
      savedQuotation = mockDb.create('quotations', quotationData);
      console.log('Quotation created in mock DB:', savedQuotation._id);
      return res.status(201).json(savedQuotation);
    } else {
      // Validate service existence
      service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Validate required fields
      if (!requestDetails) {
        return res.status(400).json({ message: 'Request details are required' });
      }
      
      // Create new quotation request
      const newQuotation = new Quotation({
        serviceId,
        adminId: req.user.id,
        requestDetails,
        customRequirements,
        requestedPrice: requestedPrice ? parseFloat(requestedPrice) : undefined,
        enterpriseDetails: enterpriseDetails || {
          companyName: req.user.enterprise?.companyName || '',
          contactPerson: req.user.profile?.fullName || '',
          email: req.user.email || '',
          phone: req.user.profile?.phone || ''
        },
        status: 'pending'
      });
      
      savedQuotation = await newQuotation.save();
      return res.status(201).json(savedQuotation);
    }
  } catch (error) {
    console.error('Error requesting quotation:', error);
    res.status(500).json({ message: 'Failed to request quotation', error: error.message });
  }
};

// Get all quotation requests (SuperAdmin)
exports.getAllQuotations = async (req, res) => {
  try {
    let quotations = [];
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      
      // Get all quotations from mock DB
      quotations = mockDb.find('quotations', {});
      
      // Populate service and admin data
      quotations = quotations.map(quotation => {
        const service = mockDb.findById('services', quotation.serviceId);
        const admin = mockDb.findById('users', quotation.adminId);
        
        return {
          ...quotation,
          serviceId: service ? {
            _id: service._id,
            name: service.name,
            price: service.price,
            category: service.category
          } : quotation.serviceId,
          adminId: admin ? {
            _id: admin._id,
            email: admin.email,
            profile: admin.profile
          } : quotation.adminId
        };
      });
      
      // Filter by status if specified
      if (req.query.status) {
        quotations = quotations.filter(q => q.status === req.query.status);
      }
      
      console.log(`Found ${quotations.length} quotations in mock DB`);
    } else {
      // Build query
      let query = {};
      
      // Status filter
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      // Get quotations from database with populated references
      quotations = await Quotation.find(query)
        .sort({ createdAt: -1 })
        .populate('serviceId', 'name price category')
        .populate('adminId', 'email profile');
    }
    
    res.status(200).json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
  }
};

// Update quotation status (SuperAdmin only)
exports.updateQuotationStatus = async (req, res) => {
  try {
    const { status, finalPrice, superadminNotes, proposedDeliveryDate, rejectionReason } = req.body;
    const quotationId = req.params.id;
    
    let quotation;
    let updatedQuotation;
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      
      // Find quotation in mock DB
      quotation = mockDb.findById('quotations', quotationId);
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      // Validate status transitions
      if (quotation.status === 'completed') {
        return res.status(400).json({ message: 'Completed quotations cannot be modified' });
      }
      
      // Validate required fields based on status
      if (status === 'approved' && !finalPrice) {
        return res.status(400).json({ message: 'Final price is required when approving a quotation' });
      }
      
      if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required when rejecting a quotation' });
      }
      
      // Create update data
      const updateData = {
        status: status || quotation.status,
        finalPrice: finalPrice !== undefined ? parseFloat(finalPrice) : quotation.finalPrice,
        superadminNotes: superadminNotes || quotation.superadminNotes || '',
        updatedAt: new Date()
      };
      
      // Add status-specific fields
      if (status === 'approved') {
        updateData.proposedDeliveryDate = proposedDeliveryDate ? new Date(proposedDeliveryDate) : new Date();
        updateData.approvedDate = new Date();
      }
      
      if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason;
      }
      
      if (status === 'completed') {
        updateData.completedDate = new Date();
      }
      
      // Update quotation in mock DB
      updatedQuotation = mockDb.update('quotations', quotationId, updateData);
      console.log('Quotation updated in mock DB:', updatedQuotation._id);
      
      // Create notification for the admin who requested the quotation
      try {
        if (quotation.adminId) {
          // Get service info for better notification message
          const service = mockDb.findById('services', quotation.serviceId);
          const serviceName = service?.name || 'your requested service';
          
          // Create notification message based on status
          let message = '';
          let notificationType = 'info';
          
          switch (status) {
            case 'approved':
              message = `Your quotation for ${serviceName} has been approved with a final price of $${finalPrice}`;
              notificationType = 'success';
              break;
            case 'rejected':
              message = `Your quotation for ${serviceName} has been rejected. Reason: ${rejectionReason}`;
              notificationType = 'error';
              break;
            case 'completed':
              message = `Your quotation for ${serviceName} has been marked as completed`;
              notificationType = 'success';
              break;
            default:
              message = `Your quotation for ${serviceName} has been updated to ${status}`;
          }
          
          // Create notification in mock DB
          mockDb.create('notifications', {
            userId: quotation.adminId,
            message,
            title: `Quotation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            type: notificationType,
            read: false,
            relatedTo: {
              model: 'Quotation',
              id: quotation._id
            },
            link: `/admin/services?tab=quotations`,
            createdAt: new Date()
          });
          
          console.log(`Created notification for admin ${quotation.adminId} about quotation update`);
        }
      } catch (notificationError) {
        console.error('Error creating notification for admin (mock):', notificationError);
        // Don't fail the main operation if notification creation fails
      }
    } else {
      // Find quotation in real DB
      quotation = await Quotation.findById(quotationId);
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      // Validate status transitions
      if (quotation.status === 'completed') {
        return res.status(400).json({ message: 'Completed quotations cannot be modified' });
      }
      
      // Validate required fields based on status
      if (status === 'approved' && !finalPrice) {
        return res.status(400).json({ message: 'Final price is required when approving a quotation' });
      }
      
      if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required when rejecting a quotation' });
      }
      
      // Create update data
      const updateData = {
        status: status || quotation.status,
        finalPrice: finalPrice !== undefined ? parseFloat(finalPrice) : quotation.finalPrice,
        superadminNotes: superadminNotes || quotation.superadminNotes || '',
        updatedAt: new Date()
      };
      
      // Add status-specific fields
      if (status === 'approved') {
        updateData.proposedDeliveryDate = proposedDeliveryDate ? new Date(proposedDeliveryDate) : new Date();
        updateData.approvedDate = new Date();
      }
      
      if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason;
      }
      
      if (status === 'completed') {
        updateData.completedDate = new Date();
      }
      
      // Update quotation
      updatedQuotation = await Quotation.findByIdAndUpdate(
        quotationId,
        updateData,
        { new: true, runValidators: true }
      ).populate('serviceId').populate('adminId', 'email profile');
      
      // Create notification for the admin who requested the quotation
      try {
        if (quotation.adminId) {
          // Get service info for better notification message
          const Service = require('../models/serviceModel');
          const service = await Service.findById(quotation.serviceId);
          const serviceName = service?.name || 'your requested service';
          
          // Create notification message based on status
          let message = '';
          let notificationType = 'info';
          
          switch (status) {
            case 'approved':
              message = `Your quotation for ${serviceName} has been approved with a final price of $${finalPrice}`;
              notificationType = 'success';
              break;
            case 'rejected':
              message = `Your quotation for ${serviceName} has been rejected. Reason: ${rejectionReason}`;
              notificationType = 'error';
              break;
            case 'completed':
              message = `Your quotation for ${serviceName} has been marked as completed`;
              notificationType = 'success';
              break;
            default:
              message = `Your quotation for ${serviceName} has been updated to ${status}`;
          }
          
          // Create notification for the admin
          await notificationController.createNotification({
            userId: quotation.adminId,
            message,
            title: `Quotation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            type: notificationType,
            relatedTo: {
              model: 'Quotation',
              id: quotation._id
            },
            link: `/admin/services?tab=quotations`
          });
          
          console.log(`Created notification for admin ${quotation.adminId} about quotation update`);
        }
      } catch (notificationError) {
        console.error('Error creating notification for admin:', notificationError);
        // Don't fail the main operation if notification creation fails
      }
    }
    
    res.status(200).json({
      message: 'Quotation updated successfully',
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ message: 'Failed to update quotation', error: error.message });
  }
};

// Get service statistics
exports.getServiceStats = async (req, res) => {
  try {
    let stats = {};
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      const mockDb = require('../utils/mockDb');
      
      // Get services
      const services = mockDb.find('services', {});
      
      // Get quotations
      const quotations = mockDb.find('quotations', {});
      
      // Calculate statistics
      stats = {
        totalServices: services.length,
        activeServices: services.filter(s => s.active).length,
        totalQuotations: quotations.length,
        quotationsByStatus: {
          pending: quotations.filter(q => q.status === 'pending').length,
          approved: quotations.filter(q => q.status === 'approved').length,
          rejected: quotations.filter(q => q.status === 'rejected').length,
          completed: quotations.filter(q => q.status === 'completed').length
        },
        servicesByCategory: {}
      };
      
      // Group services by category
      services.forEach(service => {
        const category = service.category || 'Uncategorized';
        if (!stats.servicesByCategory[category]) {
          stats.servicesByCategory[category] = 0;
        }
        stats.servicesByCategory[category]++;
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Retrieved service stats from mock DB');
      }
    } else {
      // Get services count
      const totalServices = await Service.countDocuments();
      const activeServices = await Service.countDocuments({ active: true });
      
      // Get quotations count
      const totalQuotations = await Quotation.countDocuments();
      const pendingQuotations = await Quotation.countDocuments({ status: 'pending' });
      const approvedQuotations = await Quotation.countDocuments({ status: 'approved' });
      const rejectedQuotations = await Quotation.countDocuments({ status: 'rejected' });
      const completedQuotations = await Quotation.countDocuments({ status: 'completed' });
      
      // Get services by category
      const servicesByCategory = await Service.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);
      
      // Format the category data
      const categoryData = {};
      servicesByCategory.forEach(item => {
        categoryData[item._id || 'Uncategorized'] = item.count;
      });
      
      // Compile statistics
      stats = {
        totalServices,
        activeServices,
        totalQuotations,
        quotationsByStatus: {
          pending: pendingQuotations,
          approved: approvedQuotations,
          rejected: rejectedQuotations,
          completed: completedQuotations
        },
        servicesByCategory: categoryData
      };
    }
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching service statistics:', error);
    
    // Return default stats structure on error
    res.status(200).json({
      totalServices: 0,
      activeServices: 0,
      totalQuotations: 0,
      quotationsByStatus: {
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0
      },
      servicesByCategory: {}
    });
  }
}; 