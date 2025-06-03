const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TicketSchema = new Schema({
  ticketNo: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: ['Technical', 'Billing', 'Product', 'Service', 'Other'],
    default: 'Other'
  },
  relatedProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  relatedServices: [{
    type: String
  }],
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expectedCompletionDate: {
    type: Date
  },
  attachments: [{
    fileName: String,
    fileType: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    text: String,
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    postedAt: {
      type: Date,
      default: Date.now
    }
  }],
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  relatedTo: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  responses: [{
    message: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Auto-generate a ticket number before saving
TicketSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }
  
  try {
    // Get the current date components
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Find the count of tickets for the current month
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    
    // Generate the ticket number: TKT-YY-MM-XXXX
    this.ticketNo = `TKT-${year}-${month}-${(count + 1).toString().padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt timestamp before saving
TicketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema); 