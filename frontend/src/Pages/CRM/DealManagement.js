import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CRM.css';

const DealManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    value: 0,
    status: 'pending',
    closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days from now
    notes: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [currentUser, setCurrentUser] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Show alert message with auto-dismiss
  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);

  // Fetch customers with deals
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      // Only get customers, not leads
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseUrl}/crm/customers?status=customer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCustomers(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers. Please try again.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    
    // Get current user info
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(tokenData);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, [fetchCustomers, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const customer = customers.find(c => c._id === formData.customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Create a payload that includes the deal
      let updatedDeals = [...(customer.deals || [])];
      
      if (selectedDeal !== null) {
        // Update existing deal
        updatedDeals[selectedDeal] = {
          title: formData.title,
          value: parseFloat(formData.value),
          status: formData.status,
          closingDate: new Date(formData.closingDate),
          notes: formData.notes
        };
      } else {
        // Add new deal
        updatedDeals.push({
          title: formData.title,
          value: parseFloat(formData.value),
          status: formData.status,
          closingDate: new Date(formData.closingDate),
          notes: formData.notes
        });
      }

      // Update customer with new deals array
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.put(
        `${baseUrl}/crm/customers/${formData.customerId}`,
        { deals: updatedDeals },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showAlert(`Deal ${selectedDeal !== null ? 'updated' : 'created'} successfully`, 'success');
      setOpenDialog(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error submitting deal:', error);
      setAlerts([...alerts, { 
        type: 'error', 
        message: `Failed to ${selectedDeal !== null ? 'update' : 'create'} deal: ${error.response?.data?.message || error.message}` 
      }]);
    }
  };

  const handleDeleteDeal = async (customerId, dealIndex) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const customer = customers.find(c => c._id === customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      let updatedDeals = [...(customer.deals || [])];
      updatedDeals.splice(dealIndex, 1);
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.put(
        `${baseUrl}/crm/customers/${customerId}`,
        { deals: updatedDeals },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert('Deal deleted successfully', 'success');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting deal:', error);
      setAlerts([...alerts, { 
        type: 'error', 
        message: `Failed to delete deal: ${error.response?.data?.message || error.message}` 
      }]);
    }
  };
  
  const resetForm = () => {
    setFormData({
      customerId: '',
      title: '',
      value: 0,
      status: 'pending',
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
    });
    setSelectedCustomer(null);
    setSelectedDeal(null);
  };

  const handleEditDeal = (customer, dealIndex) => {
    const deal = customer.deals[dealIndex];
    
    setSelectedCustomer(customer);
    setSelectedDeal(dealIndex);
    
    setFormData({
      customerId: customer._id,
      title: deal.title || '',
      value: deal.value || 0,
      status: deal.status || 'pending',
      closingDate: deal.closingDate ? new Date(deal.closingDate).toISOString().split('T')[0] : '',
      notes: deal.notes || ''
    });
    
    setOpenDialog(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate total deals and values
  const totalDeals = customers.reduce((sum, customer) => sum + (customer.deals?.length || 0), 0);
  const pendingDeals = customers.reduce((sum, customer) => {
    return sum + (customer.deals?.filter(deal => deal.status === 'pending').length || 0);
  }, 0);
  const wonDeals = customers.reduce((sum, customer) => {
    return sum + (customer.deals?.filter(deal => deal.status === 'won').length || 0);
  }, 0);
  const totalValue = customers.reduce((sum, customer) => {
    return sum + (customer.deals?.reduce((dealSum, deal) => dealSum + (deal.value || 0), 0) || 0);
  }, 0);

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
        <h2>Deal Management</h2>
        <button
          className="add-btn"
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
        >
          Add New Deal
        </button>
      </div>
      
      <div className="deals-stats">
        <div className="stat-card">
          <h3>Total Deals</h3>
          <p>{totalDeals}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p>{pendingDeals}</p>
        </div>
        <div className="stat-card">
          <h3>Won</h3>
          <p>{wonDeals}</p>
        </div>
        <div className="stat-card">
          <h3>Total Value</h3>
          <p>${totalValue.toLocaleString()}</p>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading deals...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="deals-list">
          {customers.filter(customer => customer.deals && customer.deals.length > 0).length === 0 ? (
            <div className="no-deals">No deals found. Add your first deal!</div>
          ) : (
            customers
              .filter(customer => customer.deals && customer.deals.length > 0)
              .map(customer => (
                <div key={customer._id} className="customer-deals-card">
                  <h3 className="customer-name">{customer.name}</h3>
                  <p className="customer-email">{customer.email}</p>
                  
                  <div className="deals-table">
                    <div className="deals-header">
                      <div className="deal-title">Deal</div>
                      <div className="deal-value">Value</div>
                      <div className="deal-status">Status</div>
                      <div className="deal-date">Closing Date</div>
                      <div className="deal-actions">Actions</div>
                    </div>
                    
                    {customer.deals.map((deal, index) => (
                      <div key={index} className={`deal-row ${deal.status}`}>
                        <div className="deal-title">{deal.title}</div>
                        <div className="deal-value">${(deal.value || 0).toLocaleString()}</div>
                        <div className="deal-status">
                          <span className={`status-badge ${deal.status}`}>
                            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                          </span>
                        </div>
                        <div className="deal-date">
                          {deal.closingDate ? new Date(deal.closingDate).toLocaleDateString() : 'No date'}
                        </div>
                        <div className="deal-actions">
                          <button onClick={() => handleEditDeal(customer, index)} className="edit-btn">Edit</button>
                          <button onClick={() => handleDeleteDeal(customer._id, index)} className="delete-btn">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}
      
      {openDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedDeal !== null ? 'Edit Deal' : 'Add New Deal'}</h3>
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
              <form onSubmit={handleSubmit} className="deal-form">
                {!selectedDeal && (
                  <div className="form-group">
                    <label htmlFor="customerId">Customer</label>
                    <select
                      id="customerId"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers
                        .filter(c => c.status === 'customer')
                        .map(customer => (
                          <option key={customer._id} value={customer._id}>
                            {customer.name} ({customer.email})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="title">Deal Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="value">Deal Value ($)</label>
                  <input
                    type="number"
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="closingDate">Expected Closing Date</label>
                  <input
                    type="date"
                    id="closingDate"
                    name="closingDate"
                    value={formData.closingDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
                
                <button type="submit" className="submit-btn">
                  {selectedDeal !== null ? 'Update Deal' : 'Add Deal'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealManagement; 