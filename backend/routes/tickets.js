const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Ticket = require('../models/Ticket');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');
const websocketService = require('../services/websocketService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/tickets/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    files: 5 // Maximum 5 files per ticket
  }
});

// Create a new ticket (Both admin and regular users)
router.post('/', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    // Log the incoming request
    console.log('Received ticket creation request:', {
      body: req.body,
      files: req.files ? req.files.length : 0,
      user: req.user ? { id: req.user.id, role: req.user.role } : null
    });

    // Validate required fields
    const requiredFields = ['name', 'email', 'subject', 'department', 'relatedTo', 'message'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Process file attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    })) : [];

    // For regular users, set adminId to their own ID
    // For admins, they can specify a different adminId if needed
    const adminId = req.user.role === 'admin' ? (req.body.adminId || req.user.id) : req.user.id;

    // Create new ticket
    const ticket = new Ticket({
      adminId: adminId,
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      department: req.body.department,
      relatedTo: req.body.relatedTo,
      message: req.body.message,
      attachments: attachments,
      submittedBy: req.user.id,
      status: 'Open',
      priority: req.body.priority || 'Medium',
      category: req.body.category || 'Other'
    });

    // Save ticket
    const savedTicket = await ticket.save();
    console.log('Ticket saved successfully:', savedTicket._id);
    
    // Populate user details
    await savedTicket.populate([
      { path: 'adminId', select: 'email profile.fullName' },
      { path: 'submittedBy', select: 'email profile.fullName' }
    ]);

    // Emit WebSocket event for new ticket
    websocketService.notifyEnterpriseAdmins('ticket_created', savedTicket);
    websocketService.notifyUser(savedTicket.submittedBy._id, 'ticket_created_by_user', savedTicket);
    
    console.log('Ticket populated with user details');
    res.status(201).json(savedTicket);
  } catch (error) {
    console.error('Error creating ticket:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      console.log('Validation error details:', error.errors);
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.name === 'MongoError' && error.code === 11000) {
      console.log('Duplicate ticket number error');
      return res.status(400).json({
        message: 'Duplicate ticket number. Please try again.'
      });
    }

    res.status(500).json({
      message: 'Error creating ticket',
      error: error.message
    });
  }
});

// Get all tickets (Superadmin only)
router.get('/', authenticateToken, authorizeRole('superadmin'), async (req, res) => {
  try {
    console.log('GET /api/tickets called by user:', req.user);
    const tickets = await Ticket.find()
      .populate('adminId', 'email profile.fullName')
      .populate('submittedBy', 'email profile.fullName enterprise.companyName')
      .sort({ createdAt: -1 });
    console.log('Tickets found:', tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get tickets for specific admin
router.get('/admin', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    console.log('GET /api/tickets/admin called by user:', req.user);
    const tickets = await Ticket.find({ adminId: req.user.id })
      .populate('submittedBy', 'email profile.fullName')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching admin tickets:', {
      user: req.user,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: error.message });
  }
});

// Update a ticket by ID (Superadmin and Admin can update)
router.put('/:id', authenticateToken, authorizeRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message, role } = req.body;
    const userRoleFromToken = req.user.role;

    console.log('Updating ticket: Request received', { 
      ticketId: id, 
      statusFromReq: status, 
      messageFromReq: message, 
      roleFromReqBody: role, 
      userRoleFromAuthToken: userRoleFromToken,
      authenticatedUserId: req.user.id,
      fullRequestBody: req.body,
      fullUserObject: req.user
    });

    if (!id) {
      return res.status(400).json({ message: 'Ticket ID is required' });
    }

    // Validate message if provided
    if (message && typeof message !== 'string') {
      return res.status(400).json({ message: 'Message must be a string' });
    }

    // Validate status if provided
    if (status && !['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const ticket = await Ticket.findById(id);
    console.log('Found ticket:', ticket ? ticket._id : 'not found');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Update status if provided
    if (status) {
      ticket.status = status;
    }

    // Add response if message is provided
    if (message && message.trim() !== '') {
      try {
        // Ensure all existing responses have a role field
        if (ticket.responses && ticket.responses.length > 0) {
          ticket.responses = ticket.responses.map(response => ({
            ...response.toObject(),
            role: response.role || userRoleFromToken
          }));
        }

        const newResponse = {
          message: message.trim(),
          role: role,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        console.log('Adding new response object:', newResponse);
        
        // Initialize responses array if it doesn't exist
        if (!ticket.responses) {
          ticket.responses = [];
        }
        
        ticket.responses.push(newResponse);
        console.log('Response added to ticket');

        // Create notification for the ticket submitter
        try {
          if (!ticket.submittedBy) {
            console.error('Ticket has no submittedBy field:', ticket);
            throw new Error('Ticket has no submittedBy field');
          }

          const notificationData = {
            userId: ticket.submittedBy,
            message: `New response added to your ticket: ${ticket.subject}`,
            type: 'info',
            title: 'Ticket Response',
            relatedTo: {
              model: 'Ticket',
              id: ticket._id
            }
          };
          
          console.log('Creating notification with data:', notificationData);
          await notificationController.createNotification(notificationData);
          console.log('Notification created successfully');
        } catch (notifyErr) {
          console.error('Failed to create notification for ticket response:', {
            error: notifyErr.message,
            stack: notifyErr.stack,
            ticket: ticket._id
          });
          // Don't fail the request if notification fails
        }
      } catch (responseErr) {
        console.error('Error adding response:', {
          error: responseErr.message,
          stack: responseErr.stack,
          ticket: ticket._id
        });
        return res.status(400).json({ 
          message: 'Error adding response',
          error: responseErr.message 
        });
      }
    }

    try {
      console.log('Saving ticket with responses:', {
        ticketId: ticket._id,
        responseCount: ticket.responses.length
      });
      
      const updatedTicket = await ticket.save();
      console.log('Ticket saved successfully:', updatedTicket._id);

      // Populate updated ticket to return full details
      await updatedTicket.populate([
        { path: 'adminId', select: 'email profile.fullName' },
        { path: 'submittedBy', select: 'email profile.fullName enterprise.companyName' }
      ]);
      console.log('Ticket populated successfully');

      // Emit WebSocket event for updated ticket
      try {
        websocketService.notifyEnterpriseAdmins('ticket_updated', updatedTicket);
        if (updatedTicket.submittedBy && updatedTicket.submittedBy._id) {
          websocketService.notifyUser(updatedTicket.submittedBy._id, 'ticket_updated_for_user', updatedTicket);
        }
        console.log('WebSocket notifications sent');
      } catch (wsError) {
        console.error('WebSocket notification error:', {
          error: wsError.message,
          stack: wsError.stack
        });
        // Don't fail the request if WebSocket notification fails
      }

      res.json(updatedTicket);
    } catch (saveErr) {
      console.error('Error saving ticket:', {
        error: saveErr.message,
        stack: saveErr.stack,
        ticket: ticket._id
      });
      return res.status(500).json({ 
        message: 'Error saving ticket',
        error: saveErr.message 
      });
    }
  } catch (error) {
    console.error('Error updating ticket:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
      user: req.user
    });
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Add response to ticket (Superadmin only)
router.post('/:ticketId/responses', authenticateToken, authorizeRole('superadmin'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.responses.push({
      message: req.body.message
    });

    await ticket.save();

    // Create notification for the admin who created the ticket
    try {
      await notificationController.createNotification({
        userId: ticket.adminId,
        message: `Superadmin responded to your ticket: ${ticket.subject}`,
        type: 'info',
        title: 'Ticket Response',
        relatedTo: { model: 'Ticket', id: ticket._id }
      });
    } catch (notifyErr) {
      console.error('Failed to create notification for ticket response:', notifyErr);
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update response (Superadmin only)
router.put('/:ticketId/responses/:responseId', authenticateToken, authorizeRole('superadmin'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const response = ticket.responses.id(req.params.responseId);
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    response.message = req.body.message;
    response.updatedAt = Date.now();

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete response (Superadmin only)
router.delete('/:ticketId/responses/:responseId', authenticateToken, authorizeRole('superadmin'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.responses.pull(req.params.responseId);
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a ticket by ID (Superadmin and Admin can delete)
router.delete('/:id', authenticateToken, authorizeRole('superadmin', 'admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.deleteOne();

    // Emit WebSocket event for deleted ticket
    websocketService.notifyEnterpriseAdmins('ticket_deleted', { id: req.params.id });
    websocketService.notifyUser(ticket.submittedBy._id, 'ticket_deleted_for_user', { id: req.params.id, subject: ticket.subject });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get ticket statistics
router.get('/stats', authenticateToken, authorizeRole('superadmin'), async (req, res) => {
  try {
    const total = await Ticket.countDocuments();
    const byStatus = {
      open: await Ticket.countDocuments({ status: 'Open' }),
      inProgress: await Ticket.countDocuments({ status: 'In Progress' }),
      resolved: await Ticket.countDocuments({ status: 'Resolved' }),
      closed: await Ticket.countDocuments({ status: 'Closed' })
    };
    const byPriority = {
      critical: await Ticket.countDocuments({ priority: 'Critical' }),
      high: await Ticket.countDocuments({ priority: 'High' }),
      medium: await Ticket.countDocuments({ priority: 'Medium' }),
      low: await Ticket.countDocuments({ priority: 'Low' })
    };

    res.json({
      total,
      byStatus,
      byPriority
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 