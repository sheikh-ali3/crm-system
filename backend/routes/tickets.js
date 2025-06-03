const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');
const superAuth = require('../middleware/superAuth');

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

// Create a new ticket (Admin only)
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    })) : [];

    const ticket = new Ticket({
      adminId: req.user._id,
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      department: req.body.department,
      relatedTo: req.body.relatedTo,
      message: req.body.message,
      attachments: attachments
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all tickets (Superadmin only)
router.get('/', superAuth, async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('adminId', 'email profile.fullName')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tickets for specific admin
router.get('/admin', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ adminId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add response to ticket (Superadmin only)
router.post('/:ticketId/responses', superAuth, async (req, res) => {
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
    res.status(400).json({ message: error.message });
  }
});

// Update response (Superadmin only)
router.put('/:ticketId/responses/:responseId', superAuth, async (req, res) => {
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
    res.status(400).json({ message: error.message });
  }
});

// Delete response (Superadmin only)
router.delete('/:ticketId/responses/:responseId', superAuth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.responses.pull(req.params.responseId);
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 