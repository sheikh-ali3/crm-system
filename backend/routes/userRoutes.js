const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin, isSuperAdmin } = require('../middleware/roleMiddleware');

// @route   GET api/users
// @desc    Get all users
// @access  Private/SuperAdmin
router.get('/', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private/SuperAdmin or Self
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is requesting their own data or is a superadmin
    if (req.user.id !== req.params.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to access this user data' });
    }
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/users
// @desc    Create a new user
// @access  Private/SuperAdmin
router.post('/', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { email, password, profile, role } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    user = new User({
      email,
      password,
      profile,
      role: role || 'admin' // Default to admin if not specified
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private/SuperAdmin or Self
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is updating their own data or is a superadmin
    if (req.user.id !== req.params.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }
    
    const { email, profile, role } = req.body;
    const updateData = {};
    
    if (email) updateData.email = email;
    if (profile) updateData.profile = profile;
    
    // Only superadmin can update roles
    if (role && req.user.role === 'superadmin') {
      updateData.role = role;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private/SuperAdmin
router.delete('/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.findByIdAndRemove(req.params.id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
