import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SuperAdminSidebar.css';

/**
 * SuperAdminSidebar Component
 * 
 * A responsive sidebar navigation component for the Super Admin dashboard
 * providing navigation to all main sections of the CRM system.
 * 
 * Features:
 * - Dark theme with grid pattern background
 * - Visual indication of active menu item
 * - Icon and text for each navigation item
 * - Role-based access control capabilities
 */
const SuperAdminSidebar = ({ activeItem, setActiveItem, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Navigation items with their labels and routes
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', route: '/superadmin' },
    { id: 'products', label: 'Products', route: '/superadmin/products' },
    { id: 'services', label: 'Services', route: '/superadmin/services' },
    { id: 'enterprise', label: 'Enterprise', route: '/superadmin/enterprise' },
    { id: 'quotations', label: 'Quotations', route: '/superadmin/quotations' },
    { id: 'invoices', label: 'Invoices', route: '/superadmin/invoices' },
    { id: 'reports', label: 'Reports', route: '/superadmin/reports' },
    { id: 'expenses', label: 'Expenses', route: '/superadmin/expenses' },
    { id: 'receipts', label: 'Receipts', route: '/superadmin/receipts' },
    { id: 'complaints', label: 'Complaints', route: '/superadmin/complaints' }
  ];

  // Handle navigation item click
  const handleNavigation = (item) => {
    console.log("Navigation triggered to:", item.id);
    
    // Update active item state if the setter is provided
    if (setActiveItem) {
      setActiveItem(item.id);
    }
    
    // Special case for dashboard which has a different route
    const route = item.id === 'dashboard' ? '/superadmin' : item.route;
    
    // If onNavigate callback is provided, use it
    if (onNavigate) {
      onNavigate(item.id);
    } 
    // Otherwise navigate to the route if provided
    else if (route) {
      navigate(route);
    }
  };

  // Determine if an item is active based on activeItem prop or current route
  const isActive = (item) => {
    if (activeItem) {
      return activeItem === item.id;
    }
    
    // If no activeItem provided, check against current path
    const currentPath = location.pathname.toLowerCase();
    return currentPath.includes(item.id);
  };

  return (
    <div className="super-admin-sidebar">
      {/* Logo and Title Section */}
      <div className="sidebar-header">
        <div className="company-name">MOAQA</div>
        <div className="dashboard-title">SUPER ADMIN DASHBOARD</div>
      </div>
      
      {/* User Avatar */}
      <div className="user-avatar"></div>

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        {navItems.map((item, index) => (
          <button
            key={item.id}
            className={`nav-item ${isActive(item) ? 'active' : ''}`}
            onClick={() => handleNavigation(item)}
            style={{ "--btn-index": index }}
          >
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default SuperAdminSidebar; 