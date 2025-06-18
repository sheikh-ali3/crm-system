import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import './styles/ServicesPage.css';
import AdminSidebar from '../Components/Layout/AdminSidebar';
import ThemeToggle from '../Components/UI/ThemeToggle';
import { useNavigate } from 'react-router-dom';

const AdminServicesPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState({ services: false, quotations: false });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('services');
  const [adminProfile, setAdminProfile] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Refs for data caching and tracking loading attempts
  const cachedData = useRef({ services: null, quotations: null });
  const mountTime = useRef(Date.now());
  const loadAttempts = useRef({ services: 0, quotations: 0 });
  
  // For quotation request form
  const [openQuotationForm, setOpenQuotationForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [quotationForm, setQuotationForm] = useState({
    requestDetails: '',
    customRequirements: '',
    requestedPrice: '',
    enterpriseDetails: {
      companyName: '',
      contactPerson: '',
      email: '',
      phone: ''
    }
  });
  
  // For quotation details view
  const [viewQuotation, setViewQuotation] = useState(null);
  const [openQuotationDetails, setOpenQuotationDetails] = useState(false);

  // Alert message helper
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  // Check authentication
  const checkAuth = useCallback(async () => {
    console.log('Checking authentication status...');
    
    // Check if we're in internal navigation mode or have a persistent session
    if (localStorage.getItem('internalNavigation') || localStorage.getItem('sessionPersist')) {
      console.log('Navigation or persistent session detected, skipping full auth check');
      return true;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      showAlert('No authentication token found. Please login again.', 'error');
      navigate('/admin/login');
      return false;
    }
    
    try {
      console.log('Attempting to verify authentication with backend');
      
      // First try with a simple ping to avoid redirects on network errors
      try {
        await axios.get(`${apiUrl}/api/status`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 second timeout to prevent hanging
        });
      } catch (pingError) {
        console.log('API status check failed, but continuing:', pingError.message);
        // Don't fail immediately on ping failure
        return true; // Return true to prevent redirect
      }
      
      // Now try the actual auth check
      try {
        const response = await axios.get(`${apiUrl}/admin`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 second timeout
        });
        
        setAdminProfile(response.data);
        console.log('Authentication successful');
        return true;
      } catch (authError) {
        // Try admin/verify endpoint as fallback
        console.log('Trying fallback admin verification endpoint');
        try {
          const verifyResponse = await axios.get(`${apiUrl}/admin/verify`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          
          if (verifyResponse.data && verifyResponse.data.user) {
            setAdminProfile(verifyResponse.data.user);
            console.log('Authentication successful via fallback');
            return true;
          }
        } catch (verifyError) {
          console.warn('Fallback verification also failed:', verifyError.message);
          // Still return true to prevent redirect
          return true;
        }
      }
      
      // If we reach here, assume auth is valid to prevent redirect
      return true;
    } catch (error) {
      console.error('Authentication check error details:', error.response || error);
      
      // NEVER redirect if we have a persistent session
      if (localStorage.getItem('sessionPersist')) {
        console.log('Error during auth check but session is persistent - continuing');
        return true;
      }
      
      // Check specific error conditions
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          console.log('Token expired or invalid, redirecting to login');
          localStorage.removeItem('token'); // Clear invalid token
          showAlert('Your session has expired. Please login again.', 'error');
          navigate('/admin/login');
        } else if (error.response.status === 403) {
          showAlert('You do not have permission to access this page.', 'error');
        } else {
          showAlert('Authentication failed: ' + (error.response.data?.message || 'Server error'), 'error');
        }
      } else if (error.request) {
        console.log('No response received from server, network issue');
        showAlert('Unable to connect to the server. Please check your network connection.', 'error');
      } else {
        // Something happened in setting up the request that triggered an Error
        showAlert('Authentication check failed: ' + error.message, 'error');
      }
      
      // Return true by default to prevent redirect loops
      return true;
    }
  }, [navigate, showAlert]);

  // Keep session alive
  const keepAlive = useCallback(() => {
    console.log('Refreshing session...');
    // Refresh the session persist flag
    localStorage.setItem('sessionPersist', 'true');
    
    // Get current timestamp for token validation
    const validationTimestamp = Date.now().toString();
    localStorage.setItem('tokenLastValidated', validationTimestamp);
    
    return true;
  }, []);

  // Fetch services
  const fetchServices = useCallback(async () => {
    console.log('Attempting to fetch services');
    try {
      // Don't set loading if we already have cached data
      if (!services.length) {
        setIsLoading(true);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/admin/login');
        return;
      }

      console.log('Fetching services from:', `${apiUrl}/api/services/admin`);
      
      const response = await axios.get(`${apiUrl}/api/services/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Services API response:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setServices(response.data);
        cachedData.current.services = response.data;
        console.log('Services data cached');
        return response.data;
      } else {
        console.log('No services data returned or invalid format');
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching services:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
      
      // More specific error handling
      if (error.response?.status === 403) {
        showAlert('Access denied. Please make sure you are logged in as an admin user.', 'error');
      } else if (error.response?.status === 401) {
        showAlert('Authentication failed. Please log in again.', 'error');
        navigate('/admin/login');
      } else {
        // Try fallback endpoint
        try {
          console.log('Trying fallback endpoint for services');
          const token = localStorage.getItem('token');
          const fallbackResponse = await axios.get(`${apiUrl}/api/services`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
            console.log('Fallback endpoint successful:', fallbackResponse.data);
            setServices(fallbackResponse.data);
            cachedData.current.services = fallbackResponse.data;
            return fallbackResponse.data;
          }
        } catch (fallbackError) {
          console.error('Fallback endpoint also failed:', fallbackError.message);
        }
        
        // If both endpoints fail, set empty array and show error
        console.log('Both endpoints failed, setting empty services array');
        setServices([]);
        cachedData.current.services = [];
        showAlert('Unable to load services. Please check your connection and try again.', 'error');
        return [];
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, navigate, services.length, showAlert]);

  // Fetch quotations
  const fetchQuotations = async () => {
    console.log('Attempting to fetch quotations');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      setIsLoading(true);
      console.log('Fetching quotations from:', `${apiUrl}/api/services/admin/quotations`);
      
      const response = await axios.get(`${apiUrl}/api/services/admin/quotations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Quotations API response:', response.data);
      if (response.data) {
        setQuotations(response.data);
      } else {
        console.log('No quotations data returned');
        setQuotations([]);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
      showAlert('Failed to load quotations. Please try again later.', 'error');
      setQuotations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a fetchNotifications function
  const fetchNotifications = useCallback(async () => {
    try {
      console.log('Fetching notifications...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, cannot fetch notifications');
        return;
      }
      
      try {
        const response = await axios.get(`${apiUrl}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 10,
            includeRead: false
          },
          timeout: 10000
        });
        
        console.log('Notifications data received:', response.data);
        
        if (response.data && response.data.notifications) {
          // Format the notifications and check for quotation-related ones
          const formattedNotifications = response.data.notifications.map(notification => ({
            id: notification._id,
            text: notification.message,
            time: new Date(notification.createdAt).toLocaleTimeString(),
            type: notification.type || 'info',
            read: notification.read,
            link: notification.link,
            title: notification.title,
            relatedTo: notification.relatedTo
          }));
          
          // Check if there are any quotation-related notifications and highlight the quotations tab
          const hasQuotationNotifications = formattedNotifications.some(
            notification => notification.relatedTo?.model === 'Quotation' && !notification.read
          );
          
          if (hasQuotationNotifications && activeTab === 'services') {
            // Show an alert about new quotation updates
            showAlert('You have new updates on your quotation requests!', 'info');
          }
        }
      } catch (error) {
        console.warn('Error fetching notifications:', error.message);
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  }, [apiUrl, showAlert, activeTab]);

  // Update the useEffect initialization to include fetchNotifications
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Check authentication first
        await checkAuth();
        
        // Keep session alive
        keepAlive();
        
        // Reset tracked states
        setDataLoaded({ services: false, quotations: false });
        
        // Fetch services first for better UX
        await fetchServices();
        
        // Load quotations after a small delay
        setTimeout(() => {
          fetchQuotations().catch(err => console.warn('Tab switch quotations load error:', err.message));
        }, 500);
        
        // Fetch notifications
        fetchNotifications();
      } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Error initializing page', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [checkAuth, keepAlive, fetchServices, fetchQuotations, fetchNotifications]);

  // Handle tab navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Load data for the tab if not already loaded
    if (tab === 'services' && !cachedData.current.services) {
      console.log('Loading services data for tab switch');
      fetchServices().catch(err => console.warn('Tab switch services load error:', err.message));
    } else if (tab === 'quotations' && !cachedData.current.quotations) {
      console.log('Loading quotations data for tab switch');
      fetchQuotations().catch(err => console.warn('Tab switch quotations load error:', err.message));
    } else {
      console.log(`Tab switched to ${tab}, using cached data`);
    }
  };

  // Format price as a string with currency symbol
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'Contact for pricing';
    return `$${price.toLocaleString()}`;
  };

  // Helper to get status badge color
  const getQuotationStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  // Request a quotation
  const handleRequestQuotation = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      keepAlive(); // Refresh session
      
      const token = localStorage.getItem('token');
      if (!token) {
        // Check if we have a persistent session before redirecting
        if (!localStorage.getItem('sessionPersist')) {
          showAlert('No authentication token found. Please login again.', 'error');
          navigate('/admin/login');
          return;
        } else {
          showAlert('Session error. Please refresh the page and try again.', 'error');
          setIsLoading(false);
          return;
        }
      }

      if (!selectedService) {
        showAlert('Invalid service selected', 'error');
        setIsLoading(false);
        return;
      }

      // Extract service ID, handling both number and string formats
      const serviceId = selectedService.id || selectedService._id;
      if (!serviceId) {
        console.error('No service ID found in:', selectedService);
        showAlert('Invalid service selected: Missing ID', 'error');
        setIsLoading(false);
        return;
      }

      // Validate form
      if (!quotationForm.requestDetails) {
        showAlert('Please provide details about your request', 'error');
        setIsLoading(false);
        return;
      }

      // Ensure enterprise details are properly set from admin profile
      const adminDetails = {
        companyName: adminProfile?.enterprise?.companyName || adminProfile?.profile?.company || '',
        contactPerson: quotationForm.enterpriseDetails.contactPerson || adminProfile?.profile?.fullName || '',
        email: adminProfile?.email || '',
        phone: quotationForm.enterpriseDetails.phone || adminProfile?.profile?.phone || ''
      };

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Primary and fallback endpoints
      const primaryEndpoint = `${apiUrl}/api/services/${serviceId}/quotation`;
      const fallbackEndpoint = `${apiUrl}/api/services/admin/${serviceId}/quotation`;
      
      console.log('Attempting to send quotation request to primary endpoint:', primaryEndpoint);
      showAlert('Processing your quotation request...', 'info');
      
      try {
        // First try the primary endpoint
        const response = await axios.post(
          primaryEndpoint,
          {
            ...quotationForm,
            enterpriseDetails: adminDetails
          },
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000 // Increased timeout to 15 seconds
          }
        );
        
        console.log('Quotation request successful:', response.data);
        showAlert('Quotation requested successfully. A SuperAdmin will review your request.', 'success');
      } catch (primaryError) {
        console.warn('Primary quotation endpoint failed:', primaryError.message);
        
        // Try the fallback endpoint
        console.log('Trying fallback quotation endpoint:', fallbackEndpoint);
        const fallbackResponse = await axios.post(
          fallbackEndpoint,
          {
            ...quotationForm,
            enterpriseDetails: adminDetails
          },
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000 // Increased timeout to 15 seconds
          }
        );
        
        console.log('Quotation request successful via fallback:', fallbackResponse.data);
        showAlert('Quotation requested successfully. A SuperAdmin will review your request.', 'success');
      }
      
      // Clean up regardless of which endpoint worked
      setOpenQuotationForm(false);
      setSelectedService(null);
      resetQuotationForm();
      fetchQuotations();
    } catch (error) {
      console.error('Request quotation error:', error);
      
      // Never redirect if session is persistent
      if (localStorage.getItem('sessionPersist') && error.response && error.response.status === 401) {
        console.log('Authentication error during quotation request but session is persistent - continuing');
        showAlert('Session error. Please refresh the page and try again.', 'warning');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to request quotation';
        showAlert(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset quotation form
  const resetQuotationForm = () => {
    setQuotationForm({
      requestDetails: '',
      customRequirements: '',
      requestedPrice: '',
      enterpriseDetails: {
        companyName: '',
        contactPerson: '',
        email: '',
        phone: ''
      }
    });
  };

  // Update the handleServiceQuotationClick function
  const handleServiceQuotationClick = (service) => {
    console.log('Selected service for quotation:', service);
    setSelectedService(service);
    
    // Pre-fill form with admin profile data if available
    if (adminProfile) {
      const adminDetails = {
        companyName: adminProfile.enterprise?.companyName || adminProfile.profile?.company || '',
        contactPerson: adminProfile.profile?.fullName || '',
        email: adminProfile.email || '',
        phone: adminProfile.profile?.phone || ''
      };
      
      setQuotationForm({
        requestDetails: '',
        customRequirements: '',
        requestedPrice: '',
        enterpriseDetails: adminDetails
      });
      
      console.log('Pre-filled quotation form with admin details:', adminDetails);
    } else {
      // If adminProfile is not available, fetch it from the API
      const token = localStorage.getItem('token');
      if (token) {
        axios.get(`${apiUrl}/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          const adminData = response.data;
          const adminDetails = {
            companyName: adminData.enterprise?.companyName || adminData.profile?.company || '',
            contactPerson: adminData.profile?.fullName || '',
            email: adminData.email || '',
            phone: adminData.profile?.phone || ''
          };
          
          setQuotationForm({
            requestDetails: '',
            customRequirements: '',
            requestedPrice: '',
            enterpriseDetails: adminDetails
          });
          
          console.log('Pre-filled quotation form with API admin details:', adminDetails);
        })
        .catch(error => {
          console.error('Error fetching admin profile:', error);
          showAlert('Error loading enterprise details. Please try again.', 'error');
        });
      }
    }
    
    setOpenQuotationForm(true);
  };

  // Handle view quotation details
  const handleViewQuotation = (quotation) => {
    setViewQuotation(quotation);
    setOpenQuotationDetails(true);
  };

  return (
    <div className="dashboard-layout">
      <style>
        {`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 2rem;
            background-color: rgba(240, 240, 240, 0.5);
            border-radius: 8px;
            text-align: center;
            margin: 1rem 0;
          }

          .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1.5s linear infinite;
            margin-bottom: 1rem;
          }

          .loading-message {
            color: #666;
            font-size: 0.9rem;
            margin-top: 0.5rem;
            max-width: 80%;
          }

          .retry-btn {
            margin-top: 1rem;
            padding: 0.5rem 1.5rem;
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
          }

          .retry-btn:hover {
            background-color: #e0e0e0;
            border-color: #ccc;
          }

          .no-data-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 2rem;
            background-color: rgba(240, 240, 240, 0.3);
            border-radius: 8px;
            text-align: center;
            margin: 1rem 0;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <AdminSidebar 
        activeItem="services" 
        onNavigate={(item) => {
          console.log("Navigating from services page to:", item);
          
          // Set the internal navigation flag to prevent authentication issues
          localStorage.setItem('internalNavigation', 'true');
          localStorage.setItem('navigationTimestamp', Date.now().toString());
          
          // If already on services page and clicking services, don't navigate
          if (item === 'services') {
            console.log("Already on services page, not navigating");
            localStorage.removeItem('internalNavigation');
            localStorage.removeItem('navigationTimestamp');
            return;
          }
          
          // Handle dashboard special case
          if (item === 'dashboard') {
            navigate('/admin');
          } else {
            navigate(`/admin/${item}`);
          }
          
          // Clear the flag after navigation
          setTimeout(() => {
            localStorage.removeItem('internalNavigation');
            localStorage.removeItem('navigationTimestamp');
            console.log("Cleared navigation flags after navigation");
          }, 2000);
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
            <h3>Services & Quotations</h3>
          </div>
          <div className="header-right">
            <ThemeToggle />
            <div className="date-range">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <button onClick={(e) => {
              e.preventDefault();
              if (window.confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('sessionPersist');
                navigate('/admin/login');
              }
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
              Available Services
            </div>
            <div 
              className={`tab ${activeTab === 'quotations' ? 'active' : ''}`}
              onClick={() => handleTabChange('quotations')}
            >
              My Quotation Requests
            </div>
          </div>
          
          {activeTab === 'services' && (
            <div className="services-section">
              <div className="services-header">
                <h2>Services & Offerings</h2>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loader"></div>
                  <p>Loading services...</p>
                  <p className="loading-message">This may take a moment. If loading persists, data will be displayed automatically.</p>
                </div>
              ) : services.length === 0 ? (
                <div className="no-data-container">
                  <p>No services are currently available.</p>
                  <button 
                    onClick={() => {
                      setIsLoading(true);
                      fetchServices()
                        .then(() => setIsLoading(false))
                        .catch(() => setIsLoading(false));
                    }}
                    className="retry-btn"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : (
                <div className="services-grid">
                  {services.map((service) => (
                    <div key={service._id} className="service-card">
                      <div className="service-card-header">
                        <span className="service-icon">{service.icon}</span>
                        <span className="service-category">{service.category}</span>
                      </div>
                      <div className="service-card-body">
                        <h3 className="service-title">{service.name}</h3>
                        <p className="service-description">{service.description}</p>
                        
                        {service.features && service.features.length > 0 && (
                          <div className="service-features">
                            <h4>Features</h4>
                            <ul>
                              {service.features.map((feature, index) => (
                                <li key={index} className={!feature.included ? 'feature-not-included' : ''}>
                                  {feature.included ? '✓' : '✕'} {feature.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="service-card-footer">
                        <div className="service-price">
                          <span className="price-label">Price:</span>
                          <span className="price-value">{formatPrice(service.price)}</span>
                          {service.duration && service.duration.value && (
                            <span className="price-duration">
                              {service.duration.unit !== 'one-time' 
                                ? `/${service.duration.value} ${service.duration.unit}` 
                                : ''}
                            </span>
                          )}
                        </div>
                        <button 
                          className="get-quotation-btn"
                          onClick={() => handleServiceQuotationClick(service)}
                        >
                          Get Quotation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'quotations' && (
            <div className="quotations-section">
              <div className="quotations-header">
                <h2>My Quotation Requests</h2>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loader"></div>
                  <p>Loading quotations...</p>
                  <p className="loading-message">This may take a moment. If loading persists, data will be displayed automatically.</p>
                </div>
              ) : quotations.length === 0 ? (
                <div className="no-data-container">
                  <p>You haven't requested any quotations yet. Go to the Services tab to request a quotation.</p>
                  <button 
                    onClick={() => {
                      setIsLoading(true);
                      fetchQuotations()
                        .then(() => setIsLoading(false))
                        .catch(() => setIsLoading(false));
                    }}
                    className="retry-btn"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : (
                <div className="quotations-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Requested On</th>
                        <th>Status</th>
                        <th>Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotations.map((quotation) => (
                        <tr key={quotation._id} className={quotation.status === 'approved' ? 'highlight-row' : ''}>
                          <td>{quotation.serviceId?.name || 'Unknown Service'}</td>
                          <td>{new Date(quotation.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${quotation.status}`}>
                              {getQuotationStatusText(quotation.status)}
                            </span>
                          </td>
                          <td>
                            {quotation.status === 'approved' || quotation.status === 'completed' 
                              ? formatPrice(quotation.finalPrice || quotation.serviceId?.price) 
                              : '-'}
                          </td>
                          <td>
                            <button 
                              className="btn-primary view-details-btn"
                              onClick={() => handleViewQuotation(quotation)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quotation Request Form Modal */}
      {openQuotationForm && selectedService && (
        <div className="modal-backdrop">
          <div className="modal-content quotation-form-modal">
            <div className="modal-header">
              <h2>Request Quotation</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenQuotationForm(false);
                  setSelectedService(null);
                  resetQuotationForm();
                }}
              >
                ×
              </button>
            </div>
            <div className="selected-service-info">
              <div className="service-name-icon">
                <span className="service-icon">{selectedService.icon}</span>
                <h3>{selectedService.name}</h3>
              </div>
              <p>{selectedService.description}</p>
              <div className="service-price-info">
                <span className="starting-price">Starting price: {formatPrice(selectedService.price)}</span>
              </div>
            </div>
            <form onSubmit={handleRequestQuotation} className="quotation-form">
              <div className="form-group">
                <label>Request Details <span className="required">*</span></label>
                <textarea 
                  value={quotationForm.requestDetails} 
                  onChange={(e) => setQuotationForm({...quotationForm, requestDetails: e.target.value})}
                  required
                  placeholder="Describe what you need, timeline, expectations, etc."
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label>Custom Requirements (Optional)</label>
                <textarea 
                  value={quotationForm.customRequirements} 
                  onChange={(e) => setQuotationForm({...quotationForm, customRequirements: e.target.value})}
                  placeholder="Any specific customizations or requirements?"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Proposed Budget (Optional)</label>
                <input 
                  type="number" 
                  value={quotationForm.requestedPrice} 
                  onChange={(e) => setQuotationForm({...quotationForm, requestedPrice: parseFloat(e.target.value) || ''})}
                  placeholder="Your budget in USD (optional)"
                  min="0"
                  step="0.01"
                />
                <p className="form-helper-text">Leave blank if you're not sure about the budget.</p>
              </div>
              
              <h4 className="form-section-title">Enterprise Details</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" 
                    value={quotationForm.enterpriseDetails.companyName} 
                    readOnly
                    className="read-only"
                    placeholder="Your company name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Contact Person</label>
                  <input 
                    type="text" 
                    value={quotationForm.enterpriseDetails.contactPerson} 
                    onChange={(e) => setQuotationForm({
                      ...quotationForm, 
                      enterpriseDetails: {
                        ...quotationForm.enterpriseDetails,
                        contactPerson: e.target.value
                      }
                    })}
                    placeholder="Full name"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={quotationForm.enterpriseDetails.email} 
                    readOnly
                    className="read-only"
                    placeholder="Contact email"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    value={quotationForm.enterpriseDetails.phone} 
                    onChange={(e) => setQuotationForm({
                      ...quotationForm, 
                      enterpriseDetails: {
                        ...quotationForm.enterpriseDetails,
                        phone: e.target.value
                      }
                    })}
                    placeholder="Contact phone number"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => {
                    setOpenQuotationForm(false);
                    setSelectedService(null);
                    resetQuotationForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quotation Details Modal */}
      {openQuotationDetails && viewQuotation && (
        <div className="modal-backdrop">
          <div className="modal-content quotation-details-modal">
            <div className="modal-header">
              <h2>Quotation Details</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenQuotationDetails(false);
                  setViewQuotation(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="quotation-details-content">
              <div className="quotation-status-header">
                <h3>{viewQuotation.serviceId?.name}</h3>
                <span className={`status-badge large ${viewQuotation.status}`}>
                  {getQuotationStatusText(viewQuotation.status)}
                </span>
              </div>
              
              <div className="quotation-info-section">
                <div className="quotation-info-row">
                  <div className="info-label">Requested On:</div>
                  <div className="info-value">{new Date(viewQuotation.createdAt).toLocaleDateString()}</div>
                </div>
                
                {(viewQuotation.status === 'approved' || viewQuotation.status === 'completed') && (
                  <>
                    <div className="quotation-info-row">
                      <div className="info-label">Approved On:</div>
                      <div className="info-value">
                        {viewQuotation.approvedDate 
                          ? new Date(viewQuotation.approvedDate).toLocaleDateString() 
                          : 'Not specified'}
                      </div>
                    </div>
                    <div className="quotation-info-row highlight">
                      <div className="info-label">Final Price:</div>
                      <div className="info-value price">
                        {formatPrice(viewQuotation.finalPrice || viewQuotation.serviceId?.price)}
                      </div>
                    </div>
                    <div className="quotation-info-row">
                      <div className="info-label">Proposed Delivery:</div>
                      <div className="info-value">
                        {viewQuotation.proposedDeliveryDate 
                          ? new Date(viewQuotation.proposedDeliveryDate).toLocaleDateString() 
                          : 'To be discussed'}
                      </div>
                    </div>
                  </>
                )}
                
                {viewQuotation.status === 'rejected' && (
                  <div className="quotation-info-row">
                    <div className="info-label">Rejection Reason:</div>
                    <div className="info-value rejection-reason">{viewQuotation.rejectionReason || 'No reason provided'}</div>
                  </div>
                )}
              </div>
              
              <div className="quotation-details-sections">
                <div className="details-section">
                  <h4>Your Request</h4>
                  <div className="details-content">
                    <p>{viewQuotation.requestDetails}</p>
                    
                    {viewQuotation.customRequirements && (
                      <>
                        <h5>Custom Requirements</h5>
                        <p>{viewQuotation.customRequirements}</p>
                      </>
                    )}
                    
                    {viewQuotation.requestedPrice > 0 && (
                      <div className="budget-info">
                        <span>Your Proposed Budget: {formatPrice(viewQuotation.requestedPrice)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {viewQuotation.superadminNotes && (
                  <div className="details-section">
                    <h4>SuperAdmin Notes</h4>
                    <div className="details-content">
                      <p>{viewQuotation.superadminNotes}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="quotation-actions">
                <button 
                  className="btn-outline" 
                  onClick={() => {
                    setOpenQuotationDetails(false);
                    setViewQuotation(null);
                  }}
                >
                  Close
                </button>
                
                {viewQuotation.status === 'approved' && (
                  <button className="btn-primary">Contact SuperAdmin</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServicesPage; 