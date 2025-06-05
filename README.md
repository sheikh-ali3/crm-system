# CRM System

A comprehensive Customer Relationship Management system built with the MERN stack.

## Overview

This CRM system provides functionality for managing customer relationships, admin users, and various business operations with a multi-level user authentication system.

## Key Features

- **Multi-level Authentication**: SuperAdmin, Admin, and User roles with different permissions
- **Customer Management**: Complete CRUD operations for customer data
- **Lead Management**: Track potential customers and convert them
- **Admin Controls**: SuperAdmin can manage admins and grant/revoke CRM access
- **Responsive Design**: Works on desktop and mobile devices
- **Statistics Dashboard**: Visual representation of business metrics

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sheikh-ali3/crm-system.git
   cd crm-system
   ```

2. **Install dependencies**:
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up MongoDB**:
   
   - **Install MongoDB**: Download and install from [MongoDB website](https://www.mongodb.com/try/download/community)
   - **Start MongoDB service**:
     - Windows: Start the MongoDB service from Services or run `net start MongoDB` as Administrator
     - macOS: Run `brew services start mongodb-community`
     - Linux: Run `sudo systemctl start mongod`
   - **Verify MongoDB is running**:
     ```bash
     cd backend
     node start-mongodb.js
     ```

4. **Set up environment variables**:
   
   Create `.env` in the backend directory:
   ```
   MONGO_URI=mongodb://localhost:27017/crm-system
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   USE_MOCK_DB=false
   NODE_ENV=development
   ```

   Create `.env` in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

5. **Seed the database**:
   
   Using PowerShell (Windows):
   ```
   .\seed-mongodb.ps1
   ```
   
   Or manually:
   ```bash
   cd backend
   node scripts/seedInitialData.js
   ```

6. **Start the servers**:

   Using PowerShell (Windows):
   ```
   .\start-mongodb-server.ps1
   ```
   
   Or manually:
   ```bash
   # Backend (in backend directory)
   cd backend
   npm start

   # Frontend (in frontend directory, in a separate terminal)
   cd frontend
   npm start
   ```

7. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Default Credentials
- **SuperAdmin**: 
  - Email: superadmin@example.com
  - Password: superadmin123
- **Admin**:
  - Email: admin@example.com
  - Password: adminpassword

## MongoDB Setup Details

### Connection String
The default connection string is `mongodb://localhost:27017/crm-system`. You can modify this in the `.env` file if you're using a different MongoDB setup.

### Fallback to Mock Database
If MongoDB is not available, you can set `USE_MOCK_DB=true` in the `.env` file to use an in-memory mock database for development purposes.

### Database Seeding
The seeding script (`scripts/seedInitialData.js`) creates:
- 5 sample services across different categories
- 4 sample quotations with different statuses
- Default SuperAdmin and Admin users

## Documentation

Detailed documentation is available in the `docs` directory:

- [Complete System Documentation](docs/CRM_System_Documentation.md)

## Tech Stack

### Frontend
- React.js
- React Router
- Axios
- Styled Components
- Material UI

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact:
- Technical Support: support@example.com
- Development Team: dev@example.com 
