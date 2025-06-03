const Customer = require('../models/customer');
const Activity = require('../models/activity');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Get all customers (filtered by user role and assigned admin)
exports.getAllCustomers = async (req, res) => {
  try {
    let query = {};
    
    // If admin, only show their assigned customers
    if (req.user.role === 'admin') {
      query.assignedTo = req.user.id;
    }
    
    const customers = await Customer.find(query)
      .populate('assignedTo', 'email profile.fullName')
      .sort({ createdAt: -1 });
      
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch customers',
      error: error.message 
    });
  }
};

// Get single customer by ID (with permission check)
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedTo', 'email profile.fullName');
      
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Check if admin has access to this customer
    if (req.user.role === 'admin' && customer.assignedTo && 
        customer.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have access to this customer' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch customer',
      error: error.message 
    });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      address,
      status,
      source,
      notes,
      assignedTo,
    } = req.body;
    
    // Check if customer with same email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }
    
    // Build customer object
    const customerData = {
      firstName,
      lastName,
      email,
      phone,
      company,
      address,
      status: status || 'new',
      source: source || 'direct',
      notes,
      assignedTo: assignedTo || req.user.id,
      createdBy: req.user.id,
      lastActivity: new Date()
    };
    
    // Create customer in database
    const customer = await Customer.create(customerData);
    
    // Create activity log
    await Activity.create({
      type: 'customer_created',
      user: {
        id: req.user.id,
        name: req.user.email
      },
      description: `Created customer ${firstName} ${lastName}`,
      entity: {
        type: 'customer',
        id: customer._id
      },
      timestamp: new Date()
    });
    
    res.status(201).json({ 
      success: true,
      message: 'Customer created successfully',
      customer 
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create customer',
      error: error.message 
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the customer first to check permissions
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Check if admin has access to update this customer
    if (req.user.role === 'admin' && 
        customer.assignedTo && 
        customer.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this customer' });
    }
    
    // Update the last activity timestamp
    updateData.lastActivity = new Date();
    
    // Update the customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id, 
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'email profile.fullName');
    
    // Create activity log
    await Activity.create({
      type: 'customer_updated',
      user: {
        id: req.user.id,
        name: req.user.email
      },
      description: `Updated customer ${customer.firstName} ${customer.lastName}`,
      details: JSON.stringify(updateData),
      entity: {
        type: 'customer',
        id: customer._id
      },
      timestamp: new Date()
    });
    
    res.json({ 
      success: true,
      message: 'Customer updated successfully',
      customer: updatedCustomer 
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update customer',
      error: error.message 
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the customer first to check permissions
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Check if admin has access to delete this customer
    if (req.user.role === 'admin' && 
        customer.assignedTo && 
        customer.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this customer' });
    }
    
    // Delete the customer
    await Customer.findByIdAndDelete(id);
    
    // Create activity log
    await Activity.create({
      type: 'customer_deleted',
      user: {
        id: req.user.id,
        name: req.user.email
      },
      description: `Deleted customer ${customer.firstName} ${customer.lastName}`,
      entity: {
        type: 'customer',
        id: customer._id
      },
      timestamp: new Date()
    });
    
    res.json({ 
      success: true,
      message: 'Customer deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete customer',
      error: error.message 
    });
  }
};

// Get customer statistics
exports.getCustomerStats = async (req, res) => {
  try {
    let matchStage = {};
    
    // If admin, only include their assigned customers
    if (req.user.role === 'admin') {
      matchStage.assignedTo = new ObjectId(req.user.id);
    }
    
    const stats = await Customer.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // Count by status
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
          ],
          // Count by source
          sourceCounts: [
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
          ],
          // Count by creation month/year
          timeline: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ],
          // Total customer count
          totalCount: [
            { $count: 'total' }
          ],
          // Count deals
          totalDeals: [
            { $match: { 'deals': { $exists: true, $not: { $size: 0 } } } },
            { $count: 'total' }
          ],
          // Sum deal values
          totalValue: [
            { $unwind: { path: '$deals', preserveNullAndEmptyArrays: false } },
            { $group: { _id: null, total: { $sum: '$deals.value' } } }
          ]
        }
      }
    ]);
    
    // Format the results
    const result = {
      totalCustomers: stats[0].totalCount[0]?.total || 0,
      totalDeals: stats[0].totalDeals[0]?.total || 0,
      totalValue: stats[0].totalValue[0]?.total || 0,
      byStatus: stats[0].statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bySource: stats[0].sourceCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      timeline: stats[0].timeline.map(item => ({
        year: item._id.year,
        month: item._id.month,
        count: item.count
      }))
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch customer statistics',
      error: error.message 
    });
  }
};

// Get recent customer activity
exports.getRecentActivity = async (req, res) => {
  try {
    let query = { 'entity.type': 'customer' };
    
    // If admin, only include activities related to their customers
    if (req.user.role === 'admin') {
      // First get IDs of customers assigned to this admin
      const customers = await Customer.find({ assignedTo: req.user.id }).select('_id');
      const customerIds = customers.map(c => c._id.toString());
      
      // Add customer filter to query
      query['entity.id'] = { $in: customerIds };
    }
    
    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching customer activity:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch customer activity',
      error: error.message 
    });
  }
};

// Add a deal to a customer
exports.addDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, value, status, expectedCloseDate, description } = req.body;
    
    // Find the customer first to check permissions
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Check if admin has access to update this customer
    if (req.user.role === 'admin' && 
        customer.assignedTo && 
        customer.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to add deals to this customer' });
    }
    
    // Create the new deal
    const newDeal = {
      title,
      value: parseFloat(value) || 0,
      status: status || 'new',
      expectedCloseDate,
      description,
      createdAt: new Date(),
      createdBy: req.user.id
    };
    
    // Add the deal to the customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { 
        $push: { deals: newDeal },
        $set: { lastActivity: new Date() }
      },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'email profile.fullName');
    
    // Create activity log
    await Activity.create({
      type: 'deal_added',
      user: {
        id: req.user.id,
        name: req.user.email
      },
      description: `Added new deal "${title}" to ${customer.firstName} ${customer.lastName}`,
      details: JSON.stringify(newDeal),
      entity: {
        type: 'customer',
        id: customer._id
      },
      timestamp: new Date()
    });
    
    res.json({ 
      success: true,
      message: 'Deal added successfully',
      customer: updatedCustomer 
    });
  } catch (error) {
    console.error('Error adding deal:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to add deal',
      error: error.message 
    });
  }
}; 