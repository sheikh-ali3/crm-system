import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './Pages/HomePage';
import LoginPage from './Pages/LoginPage';
import SuperAdminLogin from './Pages/SuperAdminLogin';
import SuperAdminDashboard from './Pages/SuperAdminDashboard';
import AdminDashboard from './Pages/AdminDashboard';
import UserDashboard from './Pages/UserDashboard';
import CustomerManagement from './Pages/CRM/CustomerManagement';
import SuperAdminCustomerManagement from './Pages/CRM/SuperAdminCustomerManagement';
import LeadManagement from './Pages/CRM/LeadManagement';
import DealManagement from './Pages/CRM/DealManagement';
import ProductAccess from './Pages/ProductAccess';
import SuperAdminServicesPage from './Pages/SuperAdminServicesPage';
import AdminServicesPage from './Pages/AdminServicesPage';
import { ThemeProvider } from './utils/ThemeContext';

/**
 * App Component - Main routing setup for the CRM application
 * 
 * Handles all routes in the application with role-based access.
 * SEO-friendly component organization with semantic route names.
 * 
 * @returns {JSX.Element} The router configuration with all app routes
 */
const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />
          
          {/* Product Access Route */}
          <Route path="/products/access/:accessLink" element={<ProductAccess />} />

          {/* SuperAdmin Routes */}
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/products" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/services" element={<SuperAdminServicesPage />} />
          <Route path="/superadmin/services/create" element={<SuperAdminServicesPage />} />
          <Route path="/superadmin/services/edit/:id" element={<SuperAdminServicesPage />} />
          <Route path="/superadmin/enterprise" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/quotations" element={<SuperAdminServicesPage />} />
          <Route path="/superadmin/invoices" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/reports" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/expenses" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/receipts" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/complaints" element={<SuperAdminDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/crm" element={<AdminDashboard />} />
          <Route path="/admin/services" element={<AdminDashboard activeTab="services" />} />
          <Route path="/admin/hrm" element={<AdminDashboard />} />
          <Route path="/admin/job-portal" element={<AdminDashboard />} />
          <Route path="/admin/job-board" element={<AdminDashboard />} />
          <Route path="/admin/projects" element={<AdminDashboard />} />
          
          {/* User Routes */}
          <Route path="/user" element={<UserDashboard />} />

          {/* CRM Routes */}
          <Route path="/crm/customers" element={<CustomerManagement />} />
          <Route path="/crm/leads" element={<LeadManagement />} />
          <Route path="/crm/deals" element={<DealManagement />} />
          <Route path="/superadmin/crm/customers" element={<SuperAdminCustomerManagement />} />

          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;