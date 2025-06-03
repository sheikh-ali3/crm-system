const bcrypt = require('bcryptjs');

// In-memory database for testing and development
class MockDatabase {
  constructor() {
    this.collections = {
      users: [],
      customers: [],
      services: [],
      quotations: []
    };
    
    this.counters = {
      users: 1,
      customers: 1,
      services: 1,
      quotations: 1
    };
    
    // Initialize with default data
    this.initializeData();
  }
  
  // Initialize with default data
  async initializeData() {
    // Create a super admin user
    const superadminPassword = await bcrypt.hash('superadmin123', 10);
    this.collections.users.push({
      _id: this.generateId('users'),
      email: 'superadmin@example.com',
      password: superadminPassword,
      role: 'superadmin',
      profile: {
        fullName: 'Super Admin',
        phone: '+18005551234',
        department: 'Management',
        joinDate: new Date('2022-01-01'),
        status: 'active'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create admin users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminpasswordHash = await bcrypt.hash('adminpassword', 10);
    const admins = [
      {
        email: 'admin@example.com',
        password: adminpasswordHash, // Different password for this admin
        fullName: 'Main Admin',
        department: 'Administration',
        joinDate: new Date('2022-01-15')
      },
      {
        email: 'sales@example.com',
        password: adminPassword,
        fullName: 'Sales Manager',
        department: 'Sales',
        joinDate: new Date('2022-03-15')
      },
      {
        email: 'marketing@example.com',
        password: adminPassword,
        fullName: 'Marketing Manager',
        department: 'Marketing',
        joinDate: new Date('2022-04-10')
      },
      {
        email: 'support@example.com',
        password: adminPassword,
        fullName: 'Support Manager',
        department: 'Customer Support',
        joinDate: new Date('2022-02-20')
      }
    ];
    
    for (const admin of admins) {
      const adminId = this.generateId('users');
      this.collections.users.push({
        _id: adminId,
        email: admin.email,
        password: admin.password || adminPassword,
        role: 'admin',
        permissions: {
          crmAccess: true
        },
        profile: {
          fullName: admin.fullName,
          phone: this.generateRandomPhone(),
          department: admin.department,
          joinDate: admin.joinDate,
          status: 'active'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create customers for each admin
      this.createCustomersForAdmin(adminId, 5);
    }
    
    // Initialize sample services
    this.initializeSampleServices();
    
    console.log('Mock database initialized with sample data');
    console.log(`- Users: ${this.collections.users.length}`);
    console.log(`- Customers: ${this.collections.customers.length}`);
  }
  
  // Initialize sample services
  initializeSampleServices() {
    const sampleServices = [
      {
        name: 'Web Development',
        description: 'Professional website development services including responsive design, CMS integration, and e-commerce solutions.',
        price: 2500,
        category: 'IT',
        icon: '💻',
        features: [
          { name: 'Responsive Design', included: true },
          { name: 'CMS Integration', included: true },
          { name: 'SEO Optimization', included: true },
          { name: 'E-commerce Support', included: false }
        ],
        duration: {
          value: 30,
          unit: 'days'
        },
        active: true
      },
      {
        name: 'UI/UX Design',
        description: 'User interface and user experience design services to create intuitive, engaging, and visually appealing digital products.',
        price: 1800,
        category: 'Design',
        icon: '🎨',
        features: [
          { name: 'User Research', included: true },
          { name: 'Wireframing', included: true },
          { name: 'Prototyping', included: true },
          { name: 'User Testing', included: true }
        ],
        duration: {
          value: 15,
          unit: 'days'
        },
        active: true
      },
      {
        name: 'SEO Optimization',
        description: 'Search engine optimization services to improve your website visibility, increase organic traffic, and achieve higher rankings.',
        price: 1200,
        category: 'Marketing',
        icon: '🔍',
        features: [
          { name: 'Keyword Research', included: true },
          { name: 'On-page SEO', included: true },
          { name: 'Technical SEO', included: true },
          { name: 'Link Building', included: false }
        ],
        duration: {
          value: 3,
          unit: 'months'
        },
        active: true
      },
      {
        name: 'Mobile App Development',
        description: 'Custom mobile application development for iOS and Android platforms with focus on performance and user experience.',
        price: 4500,
        category: 'IT',
        icon: '📱',
        features: [
          { name: 'Cross-platform Development', included: true },
          { name: 'Native App Development', included: true },
          { name: 'App Store Deployment', included: true },
          { name: 'Backend Integration', included: true }
        ],
        duration: {
          value: 45,
          unit: 'days'
        },
        active: true
      },
      {
        name: 'Content Marketing',
        description: 'Strategic content creation and distribution to attract and engage your target audience and drive profitable customer action.',
        price: 1500,
        category: 'Marketing',
        icon: '📝',
        features: [
          { name: 'Content Strategy', included: true },
          { name: 'Blog Writing', included: true },
          { name: 'Social Media Content', included: true },
          { name: 'Email Marketing', included: false }
        ],
        duration: {
          value: 1,
          unit: 'months'
        },
        active: true
      }
    ];

    // Add services to the database
    for (const service of sampleServices) {
      const serviceId = this.generateId('services');
      this.collections.services.push({
        _id: serviceId,
        ...service,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create sample quotation requests
    const admins = this.collections.users.filter(user => user.role === 'admin');
    if (admins.length > 0 && this.collections.services.length > 0) {
      const statuses = ['pending', 'approved', 'rejected', 'completed'];
      
      for (let i = 0; i < 10; i++) {
        const admin = admins[Math.floor(Math.random() * admins.length)];
        const service = this.collections.services[Math.floor(Math.random() * this.collections.services.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const quotation = {
          _id: this.generateId('quotations'),
          adminId: admin._id,
          serviceId: service._id,
          status,
          requestedPrice: Math.round(service.price * (0.8 + Math.random() * 0.4)),
          finalPrice: status === 'approved' || status === 'completed' ? Math.round(service.price * (0.9 + Math.random() * 0.3)) : null,
          requestDetails: `Request for ${service.name} service with custom requirements`,
          customRequirements: `Sample custom requirements for ${service.name}`,
          enterpriseDetails: {
            companyName: `${admin.profile.fullName}'s Company`,
            industry: 'Technology'
          },
          superadminNotes: status !== 'pending' ? 'Sample notes from superadmin' : '',
          rejectionReason: status === 'rejected' ? 'Sample rejection reason' : '',
          proposedDeliveryDate: status === 'approved' || status === 'completed' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          completedDate: status === 'completed' ? new Date() : null,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        };
        
        this.collections.quotations.push(quotation);
      }
    }
  }
  
  // Helper to create customers for an admin
  createCustomersForAdmin(adminId, count) {
    const statuses = ['lead', 'customer', 'inactive'];
    const companies = [
      'Tech Solutions Inc', 'Global Marketing', 'Innovative Systems', 
      'Apex Corporation', 'Sunrise Enterprises', 'Eagle Consulting'
    ];
    
    for (let i = 0; i < count; i++) {
      const id = this.generateId('customers');
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const customer = {
        _id: id,
        name: `Customer ${id}`,
        email: `customer${id}@example.com`,
        phone: this.generateRandomPhone(),
        company: companies[Math.floor(Math.random() * companies.length)],
        status,
        assignedTo: adminId,
        notes: `Sample notes for customer ${id}`,
        source: '',
        potentialValue: Math.floor(1000 + Math.random() * 5000),
        conversionProbability: 'medium',
        deals: [],
        lastContact: this.generateRandomDate(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add deals for some customers
      if (status === 'customer' && Math.random() > 0.5) {
        customer.deals = [
          {
            title: 'Initial Contract',
            value: Math.floor(1000 + Math.random() * 9000),
            status: 'won',
            closingDate: this.generateRandomDate()
          }
        ];
      }
      
      this.collections.customers.push(customer);
    }
  }
  
  // Generate a unique ID for a collection
  generateId(collection) {
    const id = this.counters[collection]++;
    return id.toString();
  }
  
  // Generate a random phone number
  generateRandomPhone() {
    return `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  }
  
  // Generate a random date within the last year
  generateRandomDate() {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()));
  }
  
  // Find all documents in a collection with optional filter
  findAll(collection, filter = {}) {
    if (!this.collections[collection]) {
      return [];
    }
    
    // Very simple filter implementation
    return this.collections[collection].filter(item => {
      for (const key in filter) {
        // Handle special cases like $ne (not equal)
        if (typeof filter[key] === 'object' && filter[key].$ne !== undefined) {
          if (item[key] === filter[key].$ne) return false;
        } 
        // Regular equality check
        else if (item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
  }
  
  // Alias for findAll to match MongoDB API
  find(collection, filter = {}) {
    return this.findAll(collection, filter);
  }
  
  // Find one document in a collection with filter
  findOne(collection, filter = {}) {
    const results = this.findAll(collection, filter);
    return results.length > 0 ? results[0] : null;
  }
  
  // Find document by ID
  findById(collection, id) {
    return this.findOne(collection, { _id: id });
  }
  
  // Create a new document
  create(collection, data) {
    if (!this.collections[collection]) {
      throw new Error(`Collection "${collection}" does not exist`);
    }
    
    const now = new Date();
    const newItem = {
      ...data,
      _id: this.generateId(collection),
      createdAt: now,
      updatedAt: now
    };
    
    this.collections[collection].push(newItem);
    return newItem;
  }
  
  // Update a document
  update(collection, id, data) {
    if (!this.collections[collection]) {
      throw new Error(`Collection "${collection}" does not exist`);
    }
    
    const index = this.collections[collection].findIndex(item => item._id === id);
    if (index === -1) {
      return null;
    }
    
    const updatedItem = {
      ...this.collections[collection][index],
      ...data,
      updatedAt: new Date()
    };
    
    this.collections[collection][index] = updatedItem;
    return updatedItem;
  }
  
  // Delete a document
  delete(collection, id) {
    if (!this.collections[collection]) {
      throw new Error(`Collection "${collection}" does not exist`);
    }
    
    const index = this.collections[collection].findIndex(item => item._id === id);
    if (index === -1) {
      return null;
    }
    
    const deletedItem = this.collections[collection][index];
    this.collections[collection].splice(index, 1);
    return deletedItem;
  }
  
  // Count documents
  count(collection, filter = {}) {
    return this.findAll(collection, filter).length;
  }
  
  // Delete all documents in a collection
  deleteAll(collection) {
    if (!this.collections[collection]) {
      throw new Error(`Collection "${collection}" does not exist`);
    }
    
    const count = this.collections[collection].length;
    this.collections[collection] = [];
    return count;
  }
}

// Create and export a singleton instance
const mockDb = new MockDatabase();
module.exports = mockDb; 