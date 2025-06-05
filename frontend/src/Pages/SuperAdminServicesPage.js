import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './SuperAdminDashboard.css';
import './styles/ServicesPage.css';
import SuperAdminSidebar from '../Components/Layout/SuperAdminSidebar';
import ThemeToggle from '../Components/UI/ThemeToggle';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchServices, createService, updateService, deleteService } from '../services/api';
import CustomAlert from '../Components/Common/CustomAlert';

const SuperAdminServicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('services');
  
  // For service form
  const [openServiceForm, setOpenServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'IT',
    icon: '🔧',
    features: [{ name: 'Basic Support', included: true }],
    duration: {
      value: '',
      unit: 'one-time'
    }
  });
  
  // For quotation management
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [openQuotationForm, setOpenQuotationForm] = useState(false);
  const [quotationForm, setQuotationForm] = useState({
    status: 'pending',
    finalPrice: '',
    superadminNotes: '',
    proposedDeliveryDate: '',
    rejectionReason: ''
  });
  
  // Stats
  const [serviceStats, setServiceStats] = useState({
    totalServices: 0,
    activeServices: 0,
    totalQuotations: 0,
    quotationsByStatus: {
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0
    }
  });

  // Add state for the view modal and selected quotation for viewing
  const [openQuotationViewModal, setOpenQuotationViewModal] = useState(false);
  const [viewQuotation, setViewQuotation] = useState(null);

  // API client to manage requests
  const apiClient = (() => {
    // Track active requests to prevent duplicates
    const activeRequests = {};
    
    // Base configuration
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Get auth token
    const getToken = () => localStorage.getItem('token');
    
    // Make a request with built-in error handling
    const request = async (endpoint, options = {}) => {
      const requestId = options.requestId || endpoint;
      
      // Prevent duplicate requests
      if (activeRequests[requestId]) {
        console.log(`Request to ${endpoint} already in progress, waiting...`);
        try {
          return await activeRequests[requestId];
        } catch (error) {
          console.error(`Previous request to ${endpoint} failed:`, error);
        }
      }
      
      // Set up request promise
      const requestPromise = (async () => {
        try {
          const token = getToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          // Add method-specific headers
          if (options.method === 'POST' || options.method === 'PUT') {
            headers['Content-Type'] = 'application/json';
          }
          
          console.log(`Making API request to: ${baseURL}${endpoint}`);
          
          // Make the actual API call
          const response = await axios({
            url: `${baseURL}${endpoint}`,
            method: options.method || 'GET',
            headers,
            data: options.data
          });
          
          return response.data;
        } catch (error) {
          // Handle specific error types
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(`API Error ${error.response.status}:`, error.response.data);
            
            // Handle authentication errors
            if (error.response.status === 401) {
              console.log('Authentication token expired or invalid');
              localStorage.removeItem('token');
              // Don't redirect here to avoid redirect loops
            }
            
            throw {
              status: error.response.status,
              message: error.response.data.message || 'An error occurred',
              data: error.response.data
            };
          } else if (error.request) {
            // The request was made but no response was received
            console.error('Network Error - No response received:', error.request);
            throw {
              status: 0,
              message: 'Network error - Unable to connect to server'
            };
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Request Error:', error.message);
            throw {
              status: 0,
              message: error.message
            };
          }
        } finally {
          // Clean up after request completes
          setTimeout(() => {
            delete activeRequests[requestId];
          }, 100);
        }
      })();
      
      // Store the promise so other calls can wait for it
      activeRequests[requestId] = requestPromise;
      
      return requestPromise;
    };
    
    return {
      get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
      post: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'POST', data }),
      put: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'PUT', data }),
      delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' })
    };
  })();

  // Alert message helper
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  // Check authentication status
  const checkAuth = async () => {
    try {
      console.log("Checking authentication status...");
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log("No token found, redirecting to login");
        navigate('/login');
        return false;
      }
      
      // Use a valid endpoint that exists in your backend
      const response = await apiClient.get('/services/superadmin');
      console.log("Auth check response:", response);
      
      // If we get a successful response, we're authenticated
      if (response) {
        return true;
      } else {
        console.log("Authentication failed, redirecting to login");
        navigate('/login');
        return false;
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      // Handle specific error cases
      if (error.status === 401 || error.status === 403) {
        console.log("Authentication token expired or invalid");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        showAlert("Authentication error. Please try again.", "error");
      }
      return false;
    }
  };

  // Fetch services
  const fetchServicesData = async () => {
    try {
      console.log("Fetching services...");
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await axios.get(
        `${apiUrl}/services/superadmin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Services fetched:", response);
      
      if (Array.isArray(response.data)) {
        setServices(response.data);
      } else {
        console.warn("Unexpected API response format:", response);
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      showAlert("Failed to load services. Please try again later.", "error");
      setServices([]);
    }
  };

  // Fetch quotations
  const fetchQuotations = async () => {
    try {
      console.log("Fetching quotations...");
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found, cannot fetch quotations");
        return [];
      }
      
      // Use the correct API endpoint from serviceRoutes.js
      const response = await apiClient.get('/services/superadmin/quotations');
      console.log("Quotations API response:", response);
      
      // Ensure we're working with an array of quotations
      const quotationsData = Array.isArray(response) ? response : 
                           Array.isArray(response.data) ? response.data : [];
      
      if (quotationsData.length === 0) {
        console.log("No quotations found");
      }
      
      setQuotations(quotationsData);
      return quotationsData;
    } catch (error) {
      console.error("Error fetching quotations:", error);
      // Handle specific error cases
      if (error.status === 401 || error.status === 403) {
        console.log("Authentication token expired or invalid");
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.status === 404) {
        console.log("Quotations endpoint not found");
        showAlert("Unable to load quotations. Please try again later.", "error");
      } else if (error.status === 500) {
        console.log("Server error while fetching quotations");
        showAlert("Server error. Please try again later.", "error");
      } else {
        showAlert("Failed to load quotations. Please try again later.", "error");
      }
      setQuotations([]);
      return [];
    }
  };

  // Fetch service statistics
  const fetchServiceStats = async () => {
    try {
      console.log("Fetching service statistics...");
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log("No token found, cannot fetch service stats");
        return null;
      }
      
      const response = await apiClient.get('/services/superadmin/stats/summary');
      console.log("Service stats fetched:", response);
      
      // Default stats object
      const defaultStats = {
        totalServices: 0,
        activeServices: 0,
        totalQuotations: 0,
        quotationsByStatus: { pending: 0, approved: 0, rejected: 0, completed: 0 }
      };
      
      // Extract stats from response
      let stats = response;
      
      // Check if stats are nested in a property
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        if (response.stats) {
          stats = response.stats;
        } else if (response.data) {
          stats = response.data;
        }
      }
      
      // Validate stats structure
      if (stats && typeof stats === 'object' && 'totalServices' in stats) {
        // Ensure quotationsByStatus exists
        if (!stats.quotationsByStatus) {
          stats.quotationsByStatus = { pending: 0, approved: 0, rejected: 0, completed: 0 };
        }
        
        setServiceStats(stats);
        return stats;
      } else {
        console.error("Invalid service stats format:", stats);
        setServiceStats(defaultStats);
        return defaultStats;
      }
    } catch (error) {
      console.error("Error fetching service stats:", error);
      showAlert("Failed to load service statistics. Please try again later.", "error");
      
      const defaultStats = {
        totalServices: 0,
        activeServices: 0,
        totalQuotations: 0,
        quotationsByStatus: { pending: 0, approved: 0, rejected: 0, completed: 0 }
      };
      
      setServiceStats(defaultStats);
      return defaultStats;
    }
  };

  // Create service
  const handleCreateService = async (serviceData) => {
    try {
      const response = await createService(serviceData);
      showAlert("Service created successfully", "success");
      fetchServicesData();
      return response;
    } catch (error) {
      console.error("Error creating service:", error);
      showAlert("Failed to create service. Please try again.", "error");
      throw error;
    }
  };

  // Update service
  const handleUpdateService = async (serviceId, serviceData) => {
    try {
      const response = await updateService(serviceId, serviceData);
      showAlert("Service updated successfully", "success");
      fetchServicesData();
      return response;
    } catch (error) {
      console.error("Error updating service:", error);
      showAlert("Failed to update service. Please try again.", "error");
      throw error;
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId) => {
    try {
      await deleteService(serviceId);
      showAlert("Service deleted successfully", "success");
      fetchServicesData();
    } catch (error) {
      console.error("Error deleting service:", error);
      showAlert("Failed to delete service. Please try again.", "error");
    }
  };

  // Update a quotation status
  const handleUpdateQuotation = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('No authentication token found. Please login again.', 'error');
        navigate('/superadmin/login');
        return;
      }

      if (!selectedQuotation || !selectedQuotation._id) {
        showAlert('Invalid quotation selected', 'error');
        setIsLoading(false);
        return;
      }

      // Use the correct API endpoint from serviceRoutes.js
      const response = await apiClient.put(`/services/superadmin/quotations/${selectedQuotation._id}`, quotationForm);
      console.log('Update quotation response:', response);
      
      showAlert('Quotation updated successfully', 'success');
      setOpenQuotationForm(false);
      setSelectedQuotation(null);
      resetQuotationForm();
      fetchQuotations();
      fetchServiceStats();
    } catch (error) {
      console.error('Update quotation error:', error);
      if (error.status === 500) {
        showAlert('Server error while updating quotation. Please try again later.', 'error');
      } else {
        showAlert('Failed to update quotation', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset service form
  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      price: '',
      category: 'IT',
      icon: '🔧',
      features: [{ name: 'Basic Support', included: true }],
      duration: {
        value: '',
        unit: 'one-time'
      }
    });
  };

  // Reset quotation form
  const resetQuotationForm = () => {
    setQuotationForm({
      status: 'pending',
      finalPrice: '',
      superadminNotes: '',
      proposedDeliveryDate: '',
      rejectionReason: ''
    });
  };

  // Edit a service
  const handleEditClick = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      price: service.price,
      category: service.category || 'Other',
      icon: service.icon || '🔧',
      features: service.features && service.features.length ? service.features : [{ name: 'Basic Support', included: true }],
      duration: service.duration || { value: '', unit: 'one-time' },
      active: service.active
    });
    setOpenServiceForm(true);
  };

  // Add feature field
  const addFeatureField = () => {
    setServiceForm({
      ...serviceForm,
      features: [...serviceForm.features, { name: '', included: true }]
    });
  };

  // Remove feature field
  const removeFeatureField = (index) => {
    const updatedFeatures = [...serviceForm.features];
    updatedFeatures.splice(index, 1);
    setServiceForm({
      ...serviceForm,
      features: updatedFeatures
    });
  };

  // Update feature field
  const updateFeatureField = (index, field, value) => {
    const updatedFeatures = [...serviceForm.features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [field]: field === 'included' ? value === 'true' : value
    };
    setServiceForm({
      ...serviceForm,
      features: updatedFeatures
    });
  };

  // Handle quotation click
  const handleQuotationClick = (quotation) => {
    setSelectedQuotation(quotation);
    setQuotationForm({
      status: quotation.status,
      finalPrice: quotation.finalPrice || quotation.requestedPrice || '',
      superadminNotes: quotation.superadminNotes || '',
      proposedDeliveryDate: quotation.proposedDeliveryDate ? new Date(quotation.proposedDeliveryDate).toISOString().split('T')[0] : '',
      rejectionReason: quotation.rejectionReason || ''
    });
    setOpenQuotationForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Validate form
      if (!serviceForm.name || !serviceForm.description || !serviceForm.price) {
        showAlert('Please fill out all required fields', 'error');
        return;
      }

      if (editingService) {
        await handleUpdateService(editingService._id, serviceForm);
      } else {
        await handleCreateService(serviceForm);
      }

      setOpenServiceForm(false);
      setEditingService(null);
      resetServiceForm();
    } catch (error) {
      console.error('Form submission error:', error);
      showAlert(error.response?.data?.message || 'Failed to save service', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await handleDeleteService(serviceId);
    } catch (error) {
      console.error('Delete error:', error);
      showAlert(error.response?.data?.message || 'Failed to delete service', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing SuperAdmin Services Page...");
        
        // Check authentication first
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
          console.log("Not authenticated, aborting initialization");
          setIsLoading(false);
          return;
        }
        
        // Load services first
        await fetchServicesData();
        
        // Load other data with a slight delay to prevent connection issues
        setTimeout(async () => {
          try {
            // Load stats and quotations in parallel
            const [statsResult, quotationsResult] = await Promise.allSettled([
              fetchServiceStats(),
              fetchQuotations()
            ]);
            
            // Check for errors in the results
            if (statsResult.status === 'rejected') {
              console.error("Error loading stats:", statsResult.reason);
              showAlert("Error loading statistics. Please refresh the page.", "error");
            }
            if (quotationsResult.status === 'rejected') {
              console.error("Error loading quotations:", quotationsResult.reason);
              showAlert("Error loading quotations. Please refresh the page.", "error");
            }
          } catch (error) {
            console.error("Error loading additional data:", error);
            showAlert("Error loading data. Please refresh the page.", "error");
          } finally {
            setIsLoading(false);
          }
        }, 800);
      } catch (error) {
        console.error("Error during initialization:", error);
        showAlert("Failed to initialize page. Please try again later.", "error");
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Add effect to handle URL parameters for tab navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'quotations') {
      setActiveTab('quotations');
    }
  }, [location]);

  // Handle tab navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="dashboard-layout">
      <SuperAdminSidebar 
        activeItem="services" 
        onNavigate={(item) => {
          console.log("Navigating to:", item);
          // Handle dashboard special case
          if (item === 'dashboard') {
            navigate('/superadmin');
          } else {
            navigate(`/superadmin/${item}`);
          }
        }} 
      />
      
      <div className="dashboard-main">
        {alert.show && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
            <button 
              className="close-btn" 
              onClick={() => setAlert({ show: false, message: '', type: 'success' })}
            >
              ×
            </button>
          </div>
        )}
        
        <header className="dashboard-header">
          <div className="user-welcome">
            <h3>Service Management</h3>
          </div>
          <div className="header-right">
            <ThemeToggle />
            <div className="date-range">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <button onClick={() => {
              localStorage.removeItem('token');
              navigate('/superadmin/login');
            }} className="logout-btn-small">
              Logout
            </button>
          </div>
        </header>
        
        <div className="dashboard-content">
          <div className="services-tabs">
            <div 
              className={`tab ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => handleTabChange('services')}
            >
              Services
            </div>
            <div 
              className={`tab ${activeTab === 'quotations' ? 'active' : ''}`}
              onClick={() => handleTabChange('quotations')}
            >
              Quotation Requests
            </div>
          </div>
          
          {activeTab === 'services' && (
            <div className="services-section">
              <div className="services-header">
                <h2>Services & Offerings</h2>
                <button 
                  className="create-btn" 
                  onClick={() => {
                    resetServiceForm();
                    setEditingService(null);
                    setOpenServiceForm(true);
                  }}
                >
                  Add New Service
                </button>
              </div>
              
              <div className="stats-cards">
                <div className="stat-card">
                  <h3>Total Services</h3>
                  <p className="stat-number">{serviceStats.totalServices}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Services</h3>
                  <p className="stat-number">{serviceStats.activeServices}</p>
                </div>
                <div className="stat-card">
                  <h3>Quotation Requests</h3>
                  <p className="stat-number">{serviceStats.totalQuotations}</p>
                </div>
                <div className="stat-card">
                  <h3>Pending Requests</h3>
                  <p className="stat-number">{serviceStats.quotationsByStatus?.pending || 0}</p>
                </div>
              </div>
              
              <div className="services-list">
                {services.length === 0 ? (
                  <div className="no-data-container">
                    <p>No services found. Add your first service to get started.</p>
                  </div>
                ) : (
                  <div className="services-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <tr key={service._id}>
                            <td className="service-name-cell">
                              <span className="service-icon">{service.icon}</span>
                              <div>
                                <div className="service-name">{service.name}</div>
                                <div className="service-description">{service.description.substring(0, 50)}...</div>
                              </div>
                            </td>
                            <td>{service.category}</td>
                            <td>${service.price.toLocaleString()}</td>
                            <td>
                              <span className={`status-badge ${service.active ? 'active' : 'inactive'}`}>
                                {service.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-icon edit" 
                                  onClick={() => handleEditClick(service)}
                                  title="Edit Service"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="btn-icon delete" 
                                  onClick={() => handleDeleteConfirm(service._id)}
                                  title="Delete Service"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'quotations' && (
            <div className="quotations-section">
              <div className="quotations-header">
                <h2>Quotation Requests</h2>
              </div>
              
              <div className="quotation-stats">
                <div className="stat-card">
                  <h3>Pending</h3>
                  <p className="stat-number">{serviceStats.quotationsByStatus?.pending || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Approved</h3>
                  <p className="stat-number">{serviceStats.quotationsByStatus?.approved || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Rejected</h3>
                  <p className="stat-number">{serviceStats.quotationsByStatus?.rejected || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Completed</h3>
                  <p className="stat-number">{serviceStats.quotationsByStatus?.completed || 0}</p>
                </div>
              </div>
              
              <div className="quotations-list">
                {quotations.length === 0 ? (
                  <div className="no-data-container">
                    <p>No quotation requests found.</p>
                  </div>
                ) : (
                  <div className="quotations-table" style={{ minWidth: '1200px', overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Quotation #</th>
                          <th>Service</th>
                          <th>Admin</th>
                          <th>Enterprise</th>
                          <th>Amount</th>
                          <th>Requested On</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotations.map((quotation) => (
                          <tr key={quotation._id} className={quotation.status === 'pending' ? 'highlight-row' : ''}>
                            <td>{quotation.quotationNumber || (quotation._id ? quotation._id.slice(-6) : 'N/A')}</td>
                            <td>{quotation.serviceId?.name || 'Unknown Service'}</td>
                            <td>{quotation.adminId?.email || 'Unknown Admin'}</td>
                            <td>{quotation.enterpriseDetails?.companyName || quotation.adminId?.profile?.fullName || 'Unknown Enterprise'}</td>
                            <td>{`$${(
                              quotation.finalPrice ??
                              quotation.requestedPrice ??
                              quotation.serviceId?.price ??
                              0
                            ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                            <td>{new Date(quotation.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge ${quotation.status}`}>
                                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-secondary"
                                style={{ marginRight: 8 }}
                                onClick={() => {
                                  setViewQuotation(quotation);
                                  setOpenQuotationViewModal(true);
                                }}
                              >
                                View
                              </button>
                              <button 
                                className="btn-primary"
                                onClick={() => handleQuotationClick(quotation)}
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Form Modal */}
      {openServiceForm && (
        <div className="modal-backdrop">
          <div className="modal-content service-form-modal">
            <div className="modal-header">
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenServiceForm(false);
                  setEditingService(null);
                  resetServiceForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-group">
                <label>Service Name <span className="required">*</span></label>
                <input 
                  type="text" 
                  value={serviceForm.name} 
                  onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                  required
                  placeholder="E.g. Website Development"
                />
              </div>
              
              <div className="form-group">
                <label>Description <span className="required">*</span></label>
                <textarea 
                  value={serviceForm.description} 
                  onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                  required
                  placeholder="Describe the service in detail"
                  rows={4}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Price (USD) <span className="required">*</span></label>
                  <input 
                    type="number" 
                    value={serviceForm.price} 
                    onChange={(e) => setServiceForm({...serviceForm, price: parseFloat(e.target.value) || ''})}
                    required
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={serviceForm.category} 
                    onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                  >
                    <option value="IT">IT</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Support">Support</option>
                    <option value="Training">Training</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Duration Value</label>
                  <input 
                    type="number" 
                    value={serviceForm.duration.value} 
                    onChange={(e) => setServiceForm({...serviceForm, duration: {...serviceForm.duration, value: e.target.value}})}
                    placeholder="Leave empty for one-time service"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Duration Unit</label>
                  <select 
                    value={serviceForm.duration.unit} 
                    onChange={(e) => setServiceForm({...serviceForm, duration: {...serviceForm.duration, unit: e.target.value}})}
                  >
                    <option value="one-time">One-time</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-selector">
                    <input 
                      type="text" 
                      value={serviceForm.icon} 
                      onChange={(e) => setServiceForm({...serviceForm, icon: e.target.value})}
                      maxLength={2}
                      placeholder="🔧"
                    />
                    <div className="icon-preview">{serviceForm.icon}</div>
                  </div>
                  <div className="icon-suggestions">
                    <span onClick={() => setServiceForm({...serviceForm, icon: '🔧'})}>🔧</span>
                    <span onClick={() => setServiceForm({...serviceForm, icon: '📱'})}>📱</span>
                    <span onClick={() => setServiceForm({...serviceForm, icon: '💻'})}>💻</span>
                    <span onClick={() => setServiceForm({...serviceForm, icon: '🌐'})}>🌐</span>
                    <span onClick={() => setServiceForm({...serviceForm, icon: '🚀'})}>🚀</span>
                    <span onClick={() => setServiceForm({...serviceForm, icon: '📊'})}>📊</span>
                    <span onClick={() => setServiceForm({...serviceForm, icon: '📋'})}>📋</span>
                    <span onClick={() => setServiceForm({...serviceForm, icon: '📝'})}>📝</span>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>Features</label>
                <div className="features-section">
                  {serviceForm.features.map((feature, index) => (
                    <div key={index} className="feature-row">
                      <input 
                        type="text" 
                        value={feature.name} 
                        onChange={(e) => updateFeatureField(index, 'name', e.target.value)}
                        placeholder="Feature name"
                      />
                      <select 
                        value={feature.included.toString()} 
                        onChange={(e) => updateFeatureField(index, 'included', e.target.value)}
                      >
                        <option value="true">Included</option>
                        <option value="false">Not Included</option>
                      </select>
                      <button 
                        type="button" 
                        className="remove-feature-btn"
                        onClick={() => removeFeatureField(index)}
                        disabled={serviceForm.features.length <= 1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="add-feature-btn" onClick={addFeatureField}>
                    + Add Feature
                  </button>
                </div>
              </div>
              
              {editingService && (
                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={serviceForm.active} 
                      onChange={(e) => setServiceForm({...serviceForm, active: e.target.checked})} 
                    />
                    Active
                  </label>
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => {
                    setOpenServiceForm(false);
                    setEditingService(null);
                    resetServiceForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingService ? 'Update Service' : 'Create Service')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quotation Management Modal */}
      {openQuotationForm && selectedQuotation && (
        <div className="modal-backdrop">
          <div className="modal-content quotation-form-modal">
            <div className="modal-header">
              <h2>Manage Quotation Request</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenQuotationForm(false);
                  setSelectedQuotation(null);
                  resetQuotationForm();
                }}
              >
                ×
              </button>
            </div>
            <div className="quotation-details">
              <div className="quotation-info">
                <h3>Request Details</h3>
                <p><strong>Service:</strong> {selectedQuotation.serviceId?.name}</p>
                <p><strong>Enterprise:</strong> {selectedQuotation.enterpriseDetails?.companyName || selectedQuotation.adminId?.profile?.fullName}</p>
                <p><strong>Contact:</strong> {selectedQuotation.adminId?.email}</p>
                <p><strong>Requested:</strong> {new Date(selectedQuotation.createdAt).toLocaleDateString()}</p>
                <p><strong>Request Details:</strong></p>
                <div className="request-details-box">
                  {selectedQuotation.requestDetails}
                </div>
                {selectedQuotation.customRequirements && (
                  <>
                    <p><strong>Custom Requirements:</strong></p>
                    <div className="request-details-box">
                      {selectedQuotation.customRequirements}
                    </div>
                  </>
                )}
              </div>
            </div>
            <form onSubmit={handleUpdateQuotation} className="quotation-form">
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={quotationForm.status} 
                  onChange={(e) => setQuotationForm({...quotationForm, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Final Price (USD)</label>
                <input 
                  type="number" 
                  value={quotationForm.finalPrice} 
                  onChange={(e) => setQuotationForm({...quotationForm, finalPrice: parseFloat(e.target.value) || ''})}
                  min="0"
                  step="0.01"
                  disabled={quotationForm.status !== 'approved' && quotationForm.status !== 'completed'}
                />
              </div>
              
              <div className="form-group">
                <label>Proposed Delivery Date</label>
                <input 
                  type="date" 
                  value={quotationForm.proposedDeliveryDate} 
                  onChange={(e) => setQuotationForm({...quotationForm, proposedDeliveryDate: e.target.value})}
                  disabled={quotationForm.status !== 'approved' && quotationForm.status !== 'completed'}
                />
              </div>
              
              <div className="form-group">
                <label>SuperAdmin Notes</label>
                <textarea 
                  value={quotationForm.superadminNotes} 
                  onChange={(e) => setQuotationForm({...quotationForm, superadminNotes: e.target.value})}
                  rows={3}
                  placeholder="Add notes about this quotation"
                />
              </div>
              
              {quotationForm.status === 'rejected' && (
                <div className="form-group">
                  <label>Rejection Reason</label>
                  <textarea 
                    value={quotationForm.rejectionReason} 
                    onChange={(e) => setQuotationForm({...quotationForm, rejectionReason: e.target.value})}
                    rows={3}
                    placeholder="Provide reason for rejection"
                    required
                  />
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => {
                    setOpenQuotationForm(false);
                    setSelectedQuotation(null);
                    resetQuotationForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Update Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quotation Details View Modal */}
      {openQuotationViewModal && viewQuotation && (
        <div className="modal-backdrop">
          <div className="modal-content quotation-view-modal">
            <div className="modal-header">
              <h2>Quotation Details</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenQuotationViewModal(false);
                  setViewQuotation(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="quotation-details">
              <div className="quotation-info">
                <h3>Request Details</h3>
                <p><strong>Service:</strong> {viewQuotation.serviceId?.name}</p>
                <p><strong>Enterprise:</strong> {viewQuotation.enterpriseDetails?.companyName || viewQuotation.adminId?.profile?.fullName}</p>
                <p><strong>Contact:</strong> {viewQuotation.adminId?.email}</p>
                <p><strong>Requested:</strong> {new Date(viewQuotation.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {viewQuotation.status.charAt(0).toUpperCase() + viewQuotation.status.slice(1)}</p>
                <p><strong>Final Price:</strong> {viewQuotation.finalPrice ? `$${viewQuotation.finalPrice}` : 'N/A'}</p>
                <p><strong>Proposed Delivery Date:</strong> {viewQuotation.proposedDeliveryDate ? new Date(viewQuotation.proposedDeliveryDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>SuperAdmin Notes:</strong> {viewQuotation.superadminNotes || 'N/A'}</p>
                <p><strong>Request Details:</strong></p>
                <div className="request-details-box">
                  {viewQuotation.requestDetails}
                </div>
                {viewQuotation.customRequirements && (
                  <>
                    <p><strong>Custom Requirements:</strong></p>
                    <div className="request-details-box">
                      {viewQuotation.customRequirements}
                    </div>
                  </>
                )}
                {viewQuotation.status === 'rejected' && (
                  <>
                    <p><strong>Rejection Reason:</strong></p>
                    <div className="request-details-box">
                      {viewQuotation.rejectionReason}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-outline" 
                onClick={() => {
                  setOpenQuotationViewModal(false);
                  setViewQuotation(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminServicesPage; 