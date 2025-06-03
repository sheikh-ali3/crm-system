import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AdminSidebar.css';

/**
 * AdminSidebar Component
 * 
 * A responsive sidebar navigation component for the Admin dashboard
 * providing navigation to all main sections of the Admin system.
 */
const AdminSidebar = ({ activeItem, setActiveItem, onNavigate, hasCrmAccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add state for notification counts
  const [notificationCounts, setNotificationCounts] = useState({
    services: 0,
    quotations: 0
  });

  // Add fetchNotificationCounts function
  const fetchNotificationCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await axios.get(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 1, // Only need count, not actual notifications
          includeRead: false
        }
      });
      
      if (response.data && response.data.pagination) {
        // Process notifications to count by type
        const servicesCount = response.data.pagination.unreadCount || 0;
        
        setNotificationCounts({
          services: servicesCount,
          quotations: servicesCount // For now, use same count for both
        });
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  }, []);

  // Call fetchNotificationCounts on mount and every 30 seconds
  useEffect(() => {
    fetchNotificationCounts();
    
    const interval = setInterval(() => {
      fetchNotificationCounts();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchNotificationCounts]);

  // Navigation items with their icons and accessibility options
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'dashboard',
      route: '/admin'
    },
    { 
      id: 'products', 
      label: 'Products', 
      icon: 'products',
      route: '/admin/products'
    },
    { 
      id: 'services', 
      label: 'Services', 
      icon: 'services',
      route: '/admin/services'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: 'profile',
      route: '/admin/profile'
    },
    { 
      id: 'quotations', 
      label: 'Quotations', 
      icon: 'quotations',
      route: '/admin/quotations'
    },
    { 
      id: 'invoices', 
      label: 'Invoices', 
      icon: 'invoices',
      route: '/admin/invoices'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: 'reports',
      route: '/admin/reports'
    },
    { 
      id: 'createTicket', 
      label: 'Create Ticket', 
      icon: 'ticket',
      route: '/admin/create-ticket'
    },
    { 
      id: 'users', 
      label: 'Add Users', 
      icon: 'users',
      route: '/admin/users'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: 'settings',
      route: '/admin/settings'
    }
  ];

  // Handle navigation item click
  const handleNavigation = (item) => {
    console.log("Navigation triggered to:", item.id, "with route:", item.route);
    
    // Update active item state
    if (setActiveItem) {
      setActiveItem(item.id);
    }
    
    // Set a flag in localStorage to indicate internal navigation
    localStorage.setItem('internalNavigation', 'true');
    console.log("Setting internalNavigation flag for routing to", item.route);
    
    // Save current timestamp to track navigation timing
    localStorage.setItem('navigationTimestamp', Date.now().toString());
    
    // If onNavigate callback is provided, use it
    if (onNavigate) {
      console.log("Using provided onNavigate callback for", item.id);
      onNavigate(item.id);
      return;
    } 
    
    // Otherwise navigate to the route
    if (item.route) {
      console.log("Navigating to route:", item.route);
      navigate(item.route);
    }
    
    // Clear the flag after navigation
    setTimeout(() => {
      localStorage.removeItem('internalNavigation');
      localStorage.removeItem('navigationTimestamp');
      console.log("Cleared navigation flags after navigation");
    }, 2000); // Increased timeout to ensure navigation completes
  };

  // Determine if an item is active based on activeItem prop or current route
  const isActive = (item) => {
    if (activeItem) {
      return activeItem === item.id;
    }
    
    // If no activeItem provided, check against current path
    return location.pathname === item.route;
  };

  // Filter items based on CRM access
  const filteredNavItems = navItems.filter(item => 
    !item.requiresAccess || hasCrmAccess
  );

  return (
    <div className="admin-sidebar">
      {/* Logo and Title Section */}
      <div className="sidebar-header">
        <div className="company-name">MOAQA</div>
        <div className="dashboard-title">Admin Dashboard</div>
        {/* User Avatar/Profile Placeholder */}
        <div className="user-avatar"></div>
      </div>

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        {filteredNavItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${isActive(item) ? 'active' : ''}`}
            onClick={() => handleNavigation(item)}
            aria-label={item.label}
          >
            <span className={`nav-icon ${item.icon}-icon`}></span>
            <span className="nav-label">{item.label}</span>
            {item.id === 'services' && notificationCounts.services > 0 && (
              <span className="notification-badge">{notificationCounts.services}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;

<style>
{`
  .sidebar-nav li {
    position: relative;
  }
  
  .notification-badge {
    position: absolute;
    top: 8px;
    right: 15px;
    background-color: #ea4335;
    color: white;
    border-radius: 50%;
    min-width: 18px;
    height: 18px;
    font-size: 10px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }
`}
</style> 