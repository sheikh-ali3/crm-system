# CRM System Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Setup Instructions](#setup-instructions)
4. [Dependencies](#dependencies)
5. [Directory Structure](#directory-structure)
6. [Frontend Components](#frontend-components)
7. [Backend Components](#backend-components)
8. [API Documentation](#api-documentation)
9. [Database Schema](#database-schema)
10. [Authentication & Authorization](#authentication--authorization)
11. [UI Component Library](#ui-component-library)
12. [Development Workflow](#development-workflow)
13. [Deployment Guide](#deployment-guide)
14. [Maintenance and Troubleshooting](#maintenance-and-troubleshooting)

## Project Overview
The CRM (Customer Relationship Management) system is a web-based application built using the MERN stack (MongoDB, Express.js, React.js, Node.js). It provides functionality for managing customer relationships, admin users, and various business operations.

### Key Features
- Multi-level user authentication (Super Admin, Admin, User)
- Customer management system with full CRUD operations
- Lead management and conversion
- Admin user management with granular permissions
- Role-based access control to CRM features
- Secure JWT-based authentication
- Responsive design for desktop and mobile
- Statistics and reporting dashboard

## System Architecture

### Frontend
- React.js (v19.0.0) for UI components and state management
- React Router (v7.4.0) for navigation and route protection
- Axios for API calls and request handling
- Styled Components for component styling
- Material UI for enhanced UI elements
- Custom UI component library for consistent design

### Backend
- Node.js with Express.js for API server
- MongoDB for database storage
- Mongoose for data modeling and schema validation
- JWT for authentication and authorization
- Bcrypt for secure password hashing
- Custom middleware for permission management

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v6 or higher) or yarn package manager
- Git

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crm-system.git
cd crm-system
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Set up environment variables:
Create a .env file in the backend directory:
```
MONGO_URI=mongodb://localhost:27017/crm-system
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
USE_MOCK_DB=false
```

Create a .env file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:5000
```

5. Seed the database with initial data (creates a default super admin):
```bash
cd backend
npm run seed
```

6. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

7. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Default Super Admin Credentials
- Email: superadmin@example.com
- Password: superadmin123

## Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@mui/material": "^7.0.0",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.8.4",
    "date-fns": "^4.1.0",
    "react": "^19.0.0",
    "react-beautiful-dnd": "^13.1.1",
    "react-dom": "^19.0.0",
    "react-redux": "^9.2.0",
    "react-router-dom": "^7.4.0",
    "react-scripts": "5.0.1",
    "redux": "^5.0.1",
    "styled-components": "^6.1.16",
    "web-vitals": "^2.1.4"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "body-parser": "^2.2.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.13.2"
  }
}
```

## Directory Structure

```
crm-system/
├── frontend/
│   ├── public/
│   └── src/
│       ├── Components/
│       │   ├── UI/
│       │   │   ├── Button/
│       │   │   │   ├── Button.js
│       │   │   │   └── index.js
│       │   │   └── ... (other UI components)
│       │   ├── Layout/
│       │   ├── Auth/
│       │   └── Dashboard/
│       ├── Pages/
│       │   ├── HomePage.js
│       │   ├── LoginPage.js
│       │   ├── SuperAdminLogin.js
│       │   ├── SuperAdminDashboard.js
│       │   ├── AdminDashboard.js
│       │   ├── UserDashboard.js
│       │   └── CRM/
│       │       ├── CustomerManagement.js
│       │       ├── LeadManagement.js
│       │       ├── DealManagement.js
│       │       └── CRM.css
│       ├── utils/
│       │   └── theme.js
│       ├── hooks/
│       ├── services/
│       ├── redux/
│       ├── App.js
│       └── index.js
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Customer.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── utils/
│   │   └── mockDb.js
│   ├── scripts/
│   │   ├── seedData.js
│   │   ├── testConnection.js
│   │   └── dbManager.js
│   ├── server.js
│   └── .env
└── docs/
    ├── README.md
    └── CRM_System_Documentation.md
```

## Frontend Components

### App.js
The main application component that handles routing:
```javascript
// Routes configuration for public and protected routes
- Public routes: /, /login, /superadmin/login
- Protected routes: /superadmin, /admin, /user
- CRM routes: /crm/customers, /crm/leads, /crm/deals
```

### Pages

#### HomePage.js
- Landing page component
- Features overview
- Navigation to login options

#### LoginPage.js
- User and admin authentication
- Form validation with error handling
- Token storage and management
- Redirect logic based on user role

#### SuperAdminLogin.js
- Super admin specific authentication
- Secure login form with validation
- JWT token management
- Redirects to SuperAdminDashboard on success

#### SuperAdminDashboard.js
Features:
- Admin management (create, update, delete)
- CRM system overview dashboard
- Admin permission management
- Grant/revoke CRM access functionality
- Statistics and metrics visualization
- Customer data overview by admin

#### AdminDashboard.js
Features:
- User management for regular users
- CRM functionality (if access granted)
- Statistical overview of customers and deals
- Responsive UI with multiple view modes
- Role-based UI rendering

#### UserDashboard.js
- Basic user interface
- Task management
- Profile management

#### CRM/CustomerManagement.js
Features:
- Complete customer CRUD operations
- List/grid view toggle
- Sorting and filtering options
- Search functionality
- Form validation
- Customer assignment to admins (for superadmin)
- Role-based access control

#### CRM/LeadManagement.js
- Lead tracking and management
- Lead-to-customer conversion
- Lead source tracking
- Potential value calculation

#### CRM/DealManagement.js
- Deal tracking and pipeline management
- Deal valuation and probability
- Deal status updates
- Customer association

### UI Component Library

#### Button Component
A comprehensive button component with multiple variants:
- Primary, Secondary, Outline, Text, and Danger variants
- Multiple sizes (sm, md, lg)
- Support for icons (start/end)
- Disabled state handling
- Full-width option

#### Theme System
A centralized theme configuration (utils/theme.js) that defines:
- Color palette with primary, secondary, and status colors
- Typography settings (font family, sizes, weights)
- Spacing system
- Border styles and radiuses
- Shadow definitions
- Z-index hierarchy
- Transition timings
- Responsive breakpoints

## Backend Components

### Server Configuration (server.js)
Core server functionality:
- Express application setup
- Middleware configuration
- Database connection with error handling
- Route definitions for all API endpoints
- Authentication and authorization checks
- Error handling and response formatting

### Models

#### User.js
```javascript
// User schema definition
{
  email: String (required, unique),
  password: String (hashed),
  role: String (enum: ['superadmin', 'admin', 'user']),
  profile: {
    fullName: String,
    phone: String,
    department: String,
    joinDate: Date,
    status: String
  },
  permissions: {
    crmAccess: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Customer.js
```javascript
// Customer schema definition
{
  name: String (required),
  email: String (required),
  phone: String,
  company: String,
  status: String (enum: ['lead', 'customer', 'inactive']),
  assignedTo: ObjectId (ref: 'User', required),
  notes: String,
  source: String (enum: ['website', 'referral', 'social', 'email', 'event', 'other']),
  potentialValue: Number,
  conversionProbability: Number,
  deals: [{ type: ObjectId, ref: 'Deal' }],
  activities: [{
    type: String,
    description: String,
    date: Date,
    performedBy: ObjectId
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Middleware

#### authMiddleware.js
Key middleware functions:
- `authenticateToken`: Verifies JWT token from Authorization header
- `authorizeRole`: Ensures user has required role for access
- `checkCrmAccess`: Verifies user has CRM permissions

### Scripts

#### seedData.js
- Creates initial super admin account if not exists
- Seeds sample customer data for testing
- Generates mock activities and deals

#### dbManager.js
Database utility script with commands:
- `--stats`: Display database statistics
- `--create-superadmin`: Create default super admin account

#### testConnection.js
- Tests MongoDB connection
- Validates environment configuration
- Reports database status

## API Documentation

### Authentication Endpoints

#### POST /login
```json
Request:
{
  "email": "string",
  "password": "string"
}

Response:
{
  "token": "string",
  "user": {
    "_id": "string",
    "email": "string",
    "role": "string",
    "permissions": {
      "crmAccess": boolean
    }
  }
}
```

#### POST /superadmin/login
```json
Request:
{
  "email": "string",
  "password": "string"
}

Response:
{
  "token": "string",
  "user": {
    "_id": "string",
    "email": "string",
    "role": "superadmin"
  }
}
```

### Admin Management Endpoints

#### POST /superadmin/create-admin
```json
Request:
{
  "email": "string",
  "password": "string",
  "profile": {
    "fullName": "string",
    "phone": "string",
    "department": "string"
  },
  "permissions": {
    "crmAccess": boolean
  }
}

Response:
{
  "message": "Admin created successfully",
  "admin": {
    "_id": "string",
    "email": "string",
    "role": "admin",
    "permissions": {
      "crmAccess": boolean
    }
  }
}
```

#### PUT /superadmin/admins/:id
```json
Request:
{
  "email": "string", // optional
  "password": "string", // optional
  "profile": { // optional
    "fullName": "string",
    "phone": "string",
    "department": "string"
  },
  "permissions": { // optional
    "crmAccess": boolean
  }
}

Response:
{
  "message": "Admin updated successfully",
  "admin": {
    "_id": "string",
    "email": "string",
    "permissions": {
      "crmAccess": boolean
    }
  }
}
```

### CRM Endpoints

#### GET /crm/customers
```json
Response:
{
  "customers": [
    {
      "_id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "company": "string",
      "status": "string",
      "source": "string",
      "assignedTo": {
        "_id": "string",
        "email": "string",
        "profile": {
          "fullName": "string"
        }
      },
      "potentialValue": number,
      "conversionProbability": number,
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

#### POST /crm/customers
```json
Request:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "company": "string",
  "status": "string",
  "assignedTo": "string", // User ID
  "notes": "string",
  "source": "string",
  "potentialValue": number,
  "conversionProbability": number
}

Response:
{
  "message": "Customer created successfully",
  "customer": {
    "_id": "string",
    "name": "string",
    "email": "string",
    // other customer fields
  }
}
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,
  role: String,
  profile: {
    fullName: String,
    phone: String,
    department: String,
    joinDate: Date,
    status: String
  },
  permissions: {
    crmAccess: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Customers Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  company: String,
  status: String,
  assignedTo: ObjectId (ref: 'User'),
  notes: String,
  source: String,
  potentialValue: Number,
  conversionProbability: Number,
  deals: [ObjectId],
  activities: [{
    type: String,
    description: String,
    date: Date,
    performedBy: ObjectId
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication & Authorization

### JWT Implementation
- Token generation with user role and permissions
- Token verification middleware
- Role-based access control through middleware
- Permission-based feature access (e.g., CRM access)

### Permission System
- SuperAdmin: Full system access
- Admin: Can have CRM access granted or revoked
- User: Basic access only

### Security Measures
- Password hashing using bcrypt
- JWT secret key stored in environment variables
- CORS configuration for API protection
- Input validation on all forms
- Secure HTTP headers
- Request rate limiting

## UI Component Library

### Recent UI Improvements
1. **Theme System**: Centralized configuration for consistent design
   - Color palette with semantic naming
   - Typography system with standardized sizes
   - Spacing system for consistent layout
   - Shadows, borders, and other design tokens

2. **Button Component**: Reusable, flexible button implementation
   - Multiple variants: Primary, Secondary, Outline, Text, Danger
   - Size variations
   - Icon support
   - State handling (disabled, loading)

3. **Planned Improvements**:
   - Form input components
   - Card components
   - Modal system
   - Table components
   - Alert/notification system

### Best Practices Implemented
- Component composition for reusability
- Prop validation with meaningful defaults
- Consistent naming conventions
- Accessibility considerations
- Responsive design patterns
- Performance optimizations
- Code splitting for faster loading

## Development Workflow

### Local Development
```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server
cd frontend
npm start
```

### Managing the Database
```bash
# View database statistics
cd backend
npm run db:stats

# Create default superadmin (if needed)
npm run db:create-superadmin

# Seed the database with test data
npm run seed
```

### Testing
```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## Deployment Guide

### Production Setup

1. Build frontend for production:
```bash
cd frontend
npm run build
```

2. Set up production environment variables:
Backend .env file:
```
NODE_ENV=production
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=strong_production_secret
PORT=5000
```

3. Deploy backend:
```bash
cd backend
npm install --production
npm start
```

4. Set up a web server (NGINX example):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. Set up SSL with Let's Encrypt
6. Use a process manager like PM2:
```bash
pm2 start backend/server.js --name crm-backend
```

### Migrating to a New Server
1. Clone the repository on the new server
2. Install dependencies for both frontend and backend
3. Build the frontend for production
4. Set up environment variables
5. Transfer the MongoDB data
6. Configure web server and SSL
7. Start the application with a process manager

## Maintenance and Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check MongoDB service is running
   - Verify MONGO_URI in .env file
   - Check network connectivity
   - Run `npm run test-connection` to validate

2. **Authentication Issues**
   - Check JWT_SECRET in .env file
   - Verify token expiration settings
   - Clear browser cache and cookies
   - Check for CORS issues

3. **Permission Errors**
   - Verify user role in database
   - Check permissions object structure
   - Review middleware for correct checks
   - Use SuperAdmin account to fix permissions

### Performance Optimization
- Enable MongoDB indexing
- Implement frontend code splitting
- Use caching strategies for API responses
- Optimize image and asset loading
- Consider server-side rendering for initial load

### Security Best Practices
- Regularly update dependencies
- Use security headers (Helmet.js)
- Implement rate limiting
- Set up brute force protection
- Regularly back up database
- Log and monitor for suspicious activity

## Recent Updates and Implementations

1. **CRM Access Permission System**
   - SuperAdmin can grant/revoke CRM access to admins
   - Middleware verifies permissions for all CRM routes
   - UI dynamically adjusts based on permissions

2. **UI Component Library**
   - Standardized theme system
   - Reusable button component
   - Planning for additional component development

3. **Authentication Enhancements**
   - Improved token validation
   - Better error handling
   - More detailed logging
   - Consistent response formatting

4. **Customer Management Improvements**
   - Admin assignment handling
   - Required field validation
   - List/grid view toggle
   - Sorting and filtering capabilities

## Future Enhancements
1. Email integration for notifications
2. Document/file upload functionality
3. Advanced reporting and analytics
4. Mobile application development
5. Calendar and scheduling features
6. Task assignment and tracking
7. Integration with third-party services
8. Multi-language support
9. Dark mode implementation
10. Offline capability

## Contact Information
For questions or support, please contact:
- Technical Support: support@example.com
- Development Team: dev@example.com 