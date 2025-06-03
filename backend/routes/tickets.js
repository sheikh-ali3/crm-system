const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Ticket = require('../models/Ticket');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

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
    // Validate required fields
    const requiredFields = ['name', 'email', 'subject', 'department', 'relatedTo', 'message'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
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
    
    // Populate user details
    await savedTicket.populate([
      { path: 'adminId', select: 'email profile.fullName' },
      { path: 'submittedBy', select: 'email profile.fullName' }
    ]);

    res.status(201).json(savedTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.name === 'MongoError' && error.code === 11000) {
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
    const tickets = await Ticket.find()
      .populate('adminId', 'email profile.fullName')
      .populate('submittedBy', 'email profile.fullName')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get tickets for specific admin
router.get('/admin', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const tickets = await Ticket.find({ adminId: req.user.id })
      .populate('submittedBy', 'email profile.fullName')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    res.status(500).json({ message: error.message });
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

module.exports = router; 