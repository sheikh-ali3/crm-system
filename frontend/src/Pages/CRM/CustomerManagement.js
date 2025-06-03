import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './CRM.css';
import ThemeToggle from '../../Components/ThemeToggle';

const CustomerManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
    assignedTo: '',
    notes: '',
    source: 'website',
    potentialValue: 0,
    conversionProbability: 50
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [currentUser, setCurrentUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or table
  const [filteredAdmin, setFilteredAdmin] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState({ field: 'createdAt', direction: 'desc' });

  useEffect(() => {
    // Check for filtered admin from location state (from SuperAdminDashboard)
    if (location.state?.filteredAdmin) {
      setFilteredAdmin(location.state.filteredAdmin);
    }
  }, [location]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return false;
    }
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = response.data.user;
      setCurrentUser(user);
      
      // Check if user has CRM access
      if (user.role === 'admin' && !user.permissions?.crmAccess) {
        showAlert('You do not have access to the CRM system', 'error');
        navigate('/admin');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      navigate('/login');
      return false;
    }
  }, [navigate, showAlert]);

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);

  const fetchAdmins = useCallback(async () => {
    // Only superadmin needs to fetch admins list for assignment
    if (currentUser?.role !== 'superadmin') return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/superadmin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      showAlert('Failed to fetch admins. Please try again.', 'error');
    }
  }, [navigate, showAlert, currentUser]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Use the appropriate endpoint based on role
      // SuperAdmin can access all customer data, while admins only see their assigned customers
      let endpoint = currentUser?.role === 'superadmin' 
        ? `${baseUrl}/superadmin/customers` 
        : `${baseUrl}/crm/customers`;
      
      // If filtered by admin (superadmin only), add query parameter
      if (currentUser?.role === 'superadmin' && filteredAdmin) {
        endpoint += `?adminId=${filteredAdmin}`;
      }
      
      console.log(`Fetching customers from endpoint: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        console.log(`Loaded ${response.data.length} customers`);
        
        // For admin users, double-check that only their customers are shown
        // This is a safety measure in case the backend has an issue
        if (currentUser?.role === 'admin') {
          const filteredData = response.data.filter(customer => 
            customer.assignedTo === currentUser._id || 
            (customer.assignedTo?._id === currentUser._id)
          );
          
          setCustomers(filteredData);
          console.log(`Filtered to ${filteredData.length} customers assigned to current admin`);
        } else {
          setCustomers(response.data);
        }
      } else {
        setCustomers([]);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (error.response?.status === 403) {
        showAlert('You do not have access to CRM functionality. Please contact your SuperAdmin.', 'error');
        navigate('/admin');
      } else {
        setError(`Failed to fetch customers: ${error.response?.data?.message || error.message}`);
        setCustomers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigate, showAlert, filteredAdmin]);

  useEffect(() => {
    const init = async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        await fetchAdmins();
        await fetchCustomers();
      }
    };
    init();
  }, [checkAuth, fetchAdmins, fetchCustomers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      // Ensure assignedTo is set correctly
      // For admin users, they can only create customers assigned to themselves
      // For superadmin, they must select an admin to assign
      if (currentUser?.role === 'admin') {
        formData.assignedTo = currentUser._id;
      } else if (!formData.assignedTo) {
        showAlert('Please select an admin to assign this customer to', 'error');
        return;
      }

      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let url, method;
      
      if (selectedCustomer) {
        // Update existing customer
        url = `${baseUrl}/crm/customers/${selectedCustomer._id}`;
        method = 'put';
      } else {
        // Create new customer - use appropriate endpoint based on role
        url = currentUser?.role === 'superadmin' 
          ? `${baseUrl}/superadmin/customers`  // SuperAdmin endpoint can assign to any admin
          : `${baseUrl}/crm/customers`;       // Regular endpoint for admins
        method = 'post';
      }
      
      console.log(`${method.toUpperCase()} request to ${url}`);
      console.log('Customer data:', { ...formData, assignedTo: formData.assignedTo });

      const response = await axios[method](
        url,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showAlert(`Customer ${selectedCustomer ? 'updated' : 'created'} successfully`, 'success');
      setOpenDialog(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error submitting customer:', error);
      
      // Handle specific errors
      if (error.response?.status === 403) {
        showAlert('Permission denied. You may not have access to this action.', 'error');
      } else if (error.response?.status === 400 && error.response?.data?.message) {
        showAlert(error.response.data.message, 'error');
      } else {
        showAlert(`Failed to ${selectedCustomer ? 'update' : 'create'} customer: ${error.message}`, 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.delete(`${baseUrl}/crm/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Customer deleted successfully', 'success');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      showAlert(`Failed to delete customer: ${error.response?.data?.message || error.message}`, 'error');
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'active',
      assignedTo: currentUser?.role === 'admin' ? currentUser._id : '',
      notes: '',
      source: 'website',
      potentialValue: 0,
      conversionProbability: 50
    });
    setSelectedCustomer(null);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      status: customer.status || 'active',
      assignedTo: customer.assignedTo?._id || customer.assignedTo || '',
      notes: customer.notes || '',
      source: customer.source || 'website',
      potentialValue: customer.potentialValue || 0,
      conversionProbability: customer.conversionProbability || 50
    });
    setOpenDialog(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'table' : 'grid');
  };

  const handleSort = (field) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getAdminName = (adminId) => {
    const admin = admins.find(a => a._id === adminId);
    return admin ? (admin.profile?.fullName || admin.email) : 'Unknown';
  };

  const filteredCustomers = customers
    .filter(customer => {
      // Filter by admin if filtered admin is set
      if (filteredAdmin && customer.assignedTo?._id !== filteredAdmin) {
        return false;
      }
      
      // Filter by status
      if (filterStatus !== 'all' && customer.status !== filterStatus) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          customer.name?.toLowerCase().includes(search) ||
          customer.email?.toLowerCase().includes(search) ||
          customer.company?.toLowerCase().includes(search) ||
          customer.phone?.toLowerCase().includes(search)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      const direction = sortBy.direction === 'asc' ? 1 : -1;
      
      if (sortBy.field === 'name') {
        return direction * a.name.localeCompare(b.name);
      } else if (sortBy.field === 'email') {
        return direction * a.email.localeCompare(b.email);
      } else if (sortBy.field === 'status') {
        return direction * a.status.localeCompare(b.status);
      } else if (sortBy.field === 'createdAt') {
        return direction * (new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy.field === 'potentialValue') {
        return direction * ((a.potentialValue || 0) - (b.potentialValue || 0));
      }
      
      return 0;
    });

  const handleAddNew = () => {
    resetForm();
    setOpenDialog(true);
  };

  return (
    <div className="crm-container">
      {alert.show && (
        <div className={`alert ${alert.type}`}>
          {alert.message}
        </div>
      )}
      
      {alerts.length > 0 && (
        <div className="alerts-container">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert ${alert.type}`}>
              {alert.message}
              <button 
                className="alert-close"
                onClick={() => setAlerts(alerts.filter((_, i) => i !== index))}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="crm-header">
        <div className="crm-title">
          <h2>Customer Management</h2>
          {filteredAdmin && (
            <div className="filtered-badge">
              Filtered by Admin: {admins.find(a => a._id === filteredAdmin)?.fullName || 'Unknown'}
              <button className="clear-filter" onClick={() => setFilteredAdmin(null)}>
                ×
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
        
        <div className="crm-actions">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="filter-select" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="lead">Leads</option>
            <option value="customer">Customers</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <button 
            className="view-toggle-btn" 
            onClick={toggleViewMode}
          >
            <i className={`fas fa-${viewMode === 'grid' ? 'list' : 'th'}`}></i> {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </button>
          
          <button
            className="add-btn primary"
            onClick={handleAddNew}
          >
            <i className="fas fa-plus"></i> Add New Customer
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading customers...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="retry-btn"
            onClick={fetchCustomers}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="customers-grid">
              {filteredCustomers.length === 0 ? (
                <div className="no-data-container">
                  <p className="no-data">No customers found matching your filters.</p>
                  <button 
                    className="action-btn"
                    onClick={() => {
                      setFilterStatus('all');
                      setSearchTerm('');
                      setFilteredAdmin(null);
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredCustomers.map(customer => (
                  <div key={customer._id} className={`customer-card ${customer.status}`}>
                    <div className="customer-header">
                      <h3>{customer.name}</h3>
                      <span className={`status-badge ${customer.status}`}>
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </span>
                    </div>
                    <div className="customer-info">
                      <p><i className="fa fa-envelope"></i> {customer.email}</p>
                      <p><i className="fa fa-phone"></i> {customer.phone || 'No phone'}</p>
                      <p><i className="fa fa-building"></i> {customer.company || 'No company'}</p>
                      {customer.potentialValue > 0 && (
                        <p className="potential-value">
                          <i className="fa fa-money"></i> Potential Value: ${customer.potentialValue.toLocaleString()}
                        </p>
                      )}
                      {currentUser?.role === 'superadmin' && (
                        <p className="assigned-admin">
                          <i className="fa fa-user"></i> Assigned to: {customer.assignedTo?.profile?.fullName || customer.assignedTo?.email || 'Unassigned'}
                        </p>
                      )}
                    </div>
                    <div className="customer-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(customer)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(customer._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="customers-table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')}>
                      Name {sortBy.field === 'name' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('email')}>
                      Email {sortBy.field === 'email' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th onClick={() => handleSort('status')}>
                      Status {sortBy.field === 'status' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    {currentUser?.role === 'superadmin' && (
                      <th>Assigned To</th>
                    )}
                    <th onClick={() => handleSort('potentialValue')}>
                      Value {sortBy.field === 'potentialValue' && (sortBy.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={currentUser?.role === 'superadmin' ? 8 : 7} className="no-data-cell">
                        No customers found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => (
                      <tr key={customer._id} className={customer.status}>
                        <td>{customer.name}</td>
                        <td>{customer.email}</td>
                        <td>{customer.phone || 'N/A'}</td>
                        <td>{customer.company || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${customer.status}`}>
                            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                          </span>
                        </td>
                        {currentUser?.role === 'superadmin' && (
                          <td>{customer.assignedTo?.profile?.fullName || customer.assignedTo?.email || 'Unassigned'}</td>
                        )}
                        <td>${(customer.potentialValue || 0).toLocaleString()}</td>
                        <td className="action-cell">
                          <button 
                            className="edit-btn small"
                            onClick={() => handleEdit(customer)}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-btn small"
                            onClick={() => handleDelete(customer._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {openDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setOpenDialog(false);
                  resetForm();
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="customer-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email <span className="required">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="company">Company</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status <span className="required">*</span></label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="lead">Lead</option>
                      <option value="customer">Customer</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="source">Source</label>
                    <select
                      id="source"
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                    >
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="social">Social Media</option>
                      <option value="email">Email Campaign</option>
                      <option value="event">Event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="potentialValue">Potential Value ($)</label>
                    <input
                      type="number"
                      id="potentialValue"
                      name="potentialValue"
                      value={formData.potentialValue}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="conversionProbability">Conversion Probability (%)</label>
                    <input
                      type="number"
                      id="conversionProbability"
                      name="conversionProbability"
                      value={formData.conversionProbability}
                      onChange={handleChange}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="assignedTo">Assigned To <span className="required">*</span></label>
                  <select
                    id="assignedTo"
                    name="assignedTo"
                    value={formData.assignedTo || ''}
                    onChange={handleChange}
                    required
                    disabled={currentUser?.role === 'admin'}
                  >
                    {currentUser?.role === 'admin' ? (
                      <option value={currentUser._id}>
                        {currentUser.profile?.fullName || currentUser.email} (You)
                      </option>
                    ) : (
                      <>
                        <option value="">Select Admin</option>
                        {admins.map(admin => (
                          <option key={admin._id} value={admin._id}>
                            {admin.profile?.fullName ? `${admin.profile.fullName} (${admin.email})` : admin.email}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
  
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setOpenDialog(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {selectedCustomer ? 'Update Customer' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Add a notice for admins to make data separation clear */}
      {currentUser?.role === 'admin' && (
        <div className="data-separation-notice">
          <p>
            <i className="fa fa-info-circle"></i>
            You are viewing only the customers assigned to you. SuperAdmin may assign additional customers to you.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement; 