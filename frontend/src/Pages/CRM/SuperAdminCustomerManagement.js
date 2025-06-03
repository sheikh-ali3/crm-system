import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CRM.css';

const SuperAdminCustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filterAdmin, setFilterAdmin] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead',
    assignedTo: '',
    notes: ''
  });
  
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/superadmin/login');
      return false;
    }
    
    try {
      await axios.get('http://localhost:5000/superadmin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/superadmin/login');
      return false;
    }
  }, [navigate]);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/superadmin/crm/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers. Please try again.');
      showAlert('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  const fetchAdmins = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/superadmin/admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
      
      // Set the first admin as default assignee if creating a new customer
      if (response.data.length > 0 && !selectedCustomer) {
        setFormData(prev => ({ ...prev, assignedTo: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      showAlert('Failed to load admins', 'error');
    }
  }, [selectedCustomer, showAlert]);

  useEffect(() => {
    const init = async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        await Promise.all([fetchCustomers(), fetchAdmins()]);
      }
    };
    
    init();
  }, [checkAuth, fetchCustomers, fetchAdmins]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name.trim()) {
      showAlert('Customer name is required', 'error');
      return;
    }
    
    if (!formData.email.trim()) {
      showAlert('Customer email is required', 'error');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }
    
    if (!formData.assignedTo) {
      showAlert('Please select an admin to assign this customer to', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Authentication token missing. Please log in again.', 'error');
        navigate('/superadmin/login');
        return;
      }
      
      // Prepare data for API call
      const customerData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        status: formData.status,
        assignedTo: formData.assignedTo,
        notes: formData.notes.trim()
      };
      
      console.log('Sending customer data:', customerData);
      
      if (selectedCustomer) {
        // Update existing customer
        const response = await axios.put(
          `http://localhost:5000/superadmin/crm/customers/${selectedCustomer._id}`,
          customerData,
          { headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }}
        );
        console.log('Customer updated successfully:', response.data);
        showAlert('Customer updated successfully');
      } else {
        // Create new customer
        const response = await axios.post(
          'http://localhost:5000/superadmin/crm/customers',
          customerData,
          { headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }}
        );
        console.log('Customer created successfully:', response.data);
        showAlert('Customer created successfully');
      }
      
      setShowDialog(false);
      resetForm();
      await fetchCustomers(); // Refresh customer list
    } catch (error) {
      console.error('Error saving customer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save customer';
      showAlert(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/superadmin/crm/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showAlert('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        showAlert('Failed to delete customer', 'error');
      }
    }
  };

  const resetForm = () => {
    const defaultAdmin = admins.length > 0 ? admins[0].id : '';
    
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'lead',
      assignedTo: defaultAdmin,
      notes: ''
    });
    
    setSelectedCustomer(null);
  };

  const handleEdit = (customer) => {
    console.log("Editing customer:", customer);
    setSelectedCustomer(customer);
    
    // Make sure we handle the assignedTo property correctly
    const assignedToValue = customer.assignedTo?._id || customer.assignedTo;
    
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      status: customer.status || 'lead',
      assignedTo: assignedToValue || '',
      notes: customer.notes || ''
    });
    
    setShowDialog(true);
  };

  const handleAddNewClick = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort customers
  const filteredAndSortedCustomers = customers
    .filter(customer => {
      const matchesAdmin = filterAdmin === 'all' || customer.assignedTo._id === filterAdmin;
      const matchesSearch = 
        searchQuery === '' || 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesAdmin && matchesSearch;
    })
    .sort((a, b) => {
      let valueA, valueB;
      
      if (sortField === 'name') {
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
      } else if (sortField === 'email') {
        valueA = a.email.toLowerCase();
        valueB = b.email.toLowerCase();
      } else if (sortField === 'company') {
        valueA = (a.company || '').toLowerCase();
        valueB = (b.company || '').toLowerCase();
      } else if (sortField === 'status') {
        valueA = a.status;
        valueB = b.status;
      } else if (sortField === 'assignedTo') {
        valueA = a.assignedTo.profile?.fullName || a.assignedTo.email;
        valueB = b.assignedTo.profile?.fullName || b.assignedTo.email;
      } else {
        valueA = a[sortField];
        valueB = b[sortField];
      }
      
      if (sortDirection === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });

  const getStatusClass = (status) => {
    switch (status) {
      case 'lead': return 'status-lead';
      case 'customer': return 'status-customer';
      case 'inactive': return 'status-inactive';
      default: return '';
    }
  };

  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getAdminName = (adminId) => {
    const admin = admins.find(admin => admin.id === adminId);
    return admin ? (admin.profile?.fullName || admin.email) : 'Unknown';
  };

  // Add a function to properly handle form input changes with validation
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add a debug function to log current state for troubleshooting
  const debugState = () => {
    console.log("Current form data:", formData);
    console.log("Selected customer:", selectedCustomer);
    console.log("Available admins:", admins);
  };

  return (
    <div className="crm-container">
      <div className="crm-header">
        <h1>Customer Management</h1>
        <div className="header-actions">
          <button className="add-button" onClick={handleAddNewClick}>Add New Customer</button>
          {process.env.NODE_ENV === 'development' && (
            <button className="debug-button" onClick={debugState}>Debug</button>
          )}
        </div>
      </div>
      
      {alert.show && (
        <div className={`alert ${alert.type}`}>
          {alert.message}
        </div>
      )}
      
      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>Filter by Admin:</label>
          <select 
            value={filterAdmin} 
            onChange={(e) => setFilterAdmin(e.target.value)}
          >
            <option value="all">All Admins</option>
            {admins.map(admin => (
              <option key={admin.id} value={admin.id}>
                {admin.profile?.fullName || admin.email}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading">Loading customers...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="customer-stats">
            <div className="stat-card">
              <h3>Total Customers</h3>
              <p>{customers.filter(c => c.status === 'customer').length}</p>
            </div>
            <div className="stat-card">
              <h3>Active Leads</h3>
              <p>{customers.filter(c => c.status === 'lead').length}</p>
            </div>
            <div className="stat-card">
              <h3>Inactive</h3>
              <p>{customers.filter(c => c.status === 'inactive').length}</p>
            </div>
          </div>
          
          <div className="customers-table-container">
            <table className="customers-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>
                    Name {getSortIndicator('name')}
                  </th>
                  <th onClick={() => handleSort('email')}>
                    Email {getSortIndicator('email')}
                  </th>
                  <th onClick={() => handleSort('company')}>
                    Company {getSortIndicator('company')}
                  </th>
                  <th onClick={() => handleSort('status')}>
                    Status {getSortIndicator('status')}
                  </th>
                  <th onClick={() => handleSort('assignedTo')}>
                    Assigned To {getSortIndicator('assignedTo')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-results">No customers found</td>
                  </tr>
                ) : (
                  filteredAndSortedCustomers.map(customer => (
                    <tr key={customer._id}>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.company || '-'}</td>
                      <td>
                        <span className={`status ${getStatusClass(customer.status)}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td>
                        {customer.assignedTo.profile?.fullName || customer.assignedTo.email}
                      </td>
                      <td className="actions">
                        <button 
                          className="action-btn view" 
                          onClick={() => {
                            setSelectedCustomer(customer);
                            showAlert(`Last Contact: ${new Date(customer.lastContact).toLocaleString()}, Deals: ${customer.deals?.length || 0}`, 'info');
                          }}
                          title="View Details"
                        >
                          View
                        </button>
                        <button 
                          className="action-btn edit" 
                          onClick={() => handleEdit(customer)}
                          title="Edit Customer"
                        >
                          Edit
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDelete(customer._id)}
                          title="Delete Customer"
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
        </>
      )}
      
      {showDialog && (
        <div className="modal-overlay" onClick={() => setShowDialog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{selectedCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSubmit} className="customer-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleFormChange('company', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  required
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <option value="lead">Lead</option>
                  <option value="customer">Customer</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="assignedTo">Assigned To *</label>
                <select
                  id="assignedTo"
                  required
                  value={formData.assignedTo}
                  onChange={(e) => handleFormChange('assignedTo', e.target.value)}
                >
                  <option value="">Select Admin</option>
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.profile?.fullName || admin.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  rows="4"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowDialog(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {selectedCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCustomerManagement; 