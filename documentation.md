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

## Project Overview
The CRM (Customer Relationship Management) system is a web-based application built using the MERN stack (MongoDB, Express.js, React.js, Node.js). It provides functionality for managing customer relationships, admin users, and various business operations.

### Key Features
- Multi-level user authentication (Super Admin, Admin, User)
- Customer management
- Admin user management
- Secure JWT-based authentication
- Responsive design

## System Architecture

### Frontend
- React.js for UI components
- React Router for navigation
- Axios for API calls
- CSS for styling

### Backend
- Node.js with Express.js
- MongoDB for database
- JWT for authentication
- Bcrypt for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn package manager

### Installation Steps

1. Clone the repository:
```bash
git clone [repository-url]
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
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

5. Start the servers:
Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm start
```

## Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.6.7",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.2.1"
  }
}
```

## Directory Structure

```
crm-system/
├── frontend/
│   ├── public/
│   └── src/
│       ├── Pages/
│       │   ├── HomePage.js
│       │   ├── LoginPage.js
│       │   ├── SuperAdminLogin.js
│       │   ├── SuperAdminDashboard.js
│       │   ├── AdminDashboard.js
│       │   ├── UserDashboard.js
│       │   └── CRM/
│       │       └── CustomerManagement.js
│       ├── components/
│       ├── App.js
│       └── index.js
└── backend/
    ├── models/
    │   ├── User.js
    │   └── Customer.js
    ├── routes/
    │   ├── auth.js
    │   └── crm.js
    ├── middleware/
    │   └── auth.js
    ├── server.js
    └── .env
```

## Frontend Components

### App.js
The main application component that handles routing:
```javascript
// Routes configuration for public and protected routes
- Public routes: /, /login, /superadmin/login
- Protected routes: /superadmin, /admin, /user
- CRM routes: /crm/customers
```

### Pages

#### HomePage.js
- Landing page component
- Features overview
- Navigation to login options

#### LoginPage.js
- User authentication
- Form validation
- Error handling
- Redirect logic based on user role

#### SuperAdminLogin.js
- Super admin authentication
- Secure login form
- JWT token management
- Session handling

#### SuperAdminDashboard.js
- Admin management
- System overview
- Admin creation interface
- Admin list view and management

#### AdminDashboard.js
- Customer overview
- Task management
- Performance metrics
- User management

#### UserDashboard.js
- Customer interaction interface
- Task view
- Activity logging
- Profile management

#### CRM/CustomerManagement.js
- Customer CRUD operations
- Customer list view
- Search and filter functionality
- Customer details form

## Backend Components

### Server Configuration (server.js)
```javascript
// Main server setup
- Express application configuration
- Middleware setup (cors, json parsing)
- Route handling
- Database connection
- Error handling
```

### Models

#### User.js
```javascript
// User schema definition
- Username
- Email
- Password (hashed)
- Role (enum: ['superadmin', 'admin', 'user'])
- Created date
- Last login
```

#### Customer.js
```javascript
// Customer schema definition
- Name
- Email
- Phone
- Company
- Status
- Notes
- Created by
- Last updated
```

### Routes

#### auth.js
```javascript
// Authentication routes
POST /auth/login - User login
POST /auth/register - User registration
POST /superadmin/login - Super admin login
GET /auth/verify - Token verification
```

#### crm.js
```javascript
// CRM related routes
GET /crm/customers - List customers
POST /crm/customers - Create customer
PUT /crm/customers/:id - Update customer
DELETE /crm/customers/:id - Delete customer
```

## API Documentation

### Authentication Endpoints

#### POST /auth/login
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
    "id": "string",
    "email": "string",
    "role": "string"
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
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "company": "string",
      "status": "string",
      "notes": "string"
    }
  ]
}
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
  lastLogin: Date
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
  notes: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication & Authorization

### JWT Implementation
- Token generation on login
- Token verification middleware
- Role-based access control
- Token refresh mechanism

### Security Measures
- Password hashing using bcrypt
- JWT secret key protection
- CORS configuration
- Input validation
- XSS protection
- Rate limiting

## Development Commands

### Frontend Development
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Backend Development
```bash
# Start server
npm start

# Start with nodemon
npm run dev

# Run tests
npm test
```

## Deployment

### Production Setup
1. Build frontend:
```bash
cd frontend
npm run build
```

2. Configure environment variables for production
3. Set up MongoDB production database
4. Configure NGINX or similar web server
5. Set up SSL certificates
6. Deploy using PM2 or similar process manager

### Environment Variables
```
NODE_ENV=production
MONGO_URI=production_mongodb_uri
JWT_SECRET=production_jwt_secret
PORT=5000
```

## Maintenance and Updates

### Regular Tasks
- Database backups
- Log rotation
- Security updates
- Performance monitoring
- User feedback collection

### Troubleshooting
- Check server logs
- Monitor database performance
- Review error reports
- Test authentication flow
- Verify API endpoints

## Future Enhancements
1. Email integration
2. File upload functionality
3. Advanced reporting
4. Mobile application
5. Integration with third-party services
6. Enhanced analytics dashboard
7. Automated backup system
8. Multi-language support 