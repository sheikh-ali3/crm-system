// src/Pages/AdminDashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import ThemeToggle from '../Components/UI/ThemeToggle';
import AdminSidebar from '../Components/Layout/AdminSidebar';
import DashboardCard from '../Components/Dashboard/DashboardCard';
import CustomAlert from '../Components/Common/CustomAlert';
import websocketService from '../services/websocketService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = ({ activeTab: initialActiveTab }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    profile: {
      fullName: '',
      phone: '',
      department: '',
      status: 'active'
    }
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'dashboard');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCustomers: 0,
    totalDeals: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [enterpriseInfo, setEnterpriseInfo] = useState({
    name: "Enterprise Name",
    logo: "",
    address: "",
    mailingAddress: "",
    city: "",
    country: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    industry: "",
    business: ""
  });
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reports, setReports] = useState(null);
  const [ticketStats, setTicketStats] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New user registration", time: "2 hours ago" },
    { id: 2, text: "New quotation request", time: "3 hours ago" },
    { id: 3, text: "Invoice payment received", time: "5 hours ago" },
    { id: 4, text: "Support ticket updated", time: "1 day ago" }
  ]);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [profileDropdownVisible, setProfileDropdownVisible] = useState(false);
  const profileDropdownRef = useRef(null);
  const [userPermissions, setUserPermissions] = useState({
    crmAccess: false,
    hrmsAccess: false,
    jobPortalAccess: false,
    jobBoardAccess: false,
    projectManagementAccess: false
  });
  const [openProductRequestDialog, setOpenProductRequestDialog] = useState(false);
  const [selectedProductToRequest, setSelectedProductToRequest] = useState(null);
  const [productRequestForm, setProductRequestForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyName: '',
    message: '',
    paymentMethod: 'bankTransfer',
    bankAccount: '',
    additionalInfo: ''
  });
  const [profileEditMode, setProfileEditMode] = useState({
    company: false,
    contact: false,
    user: false
  });
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    email: '',
    department: '',
    status: 'active'
  });
  const [userPassword, setUserPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [servicesTabActive, setServicesTabActive] = useState('services'); // 'services' or 'quotations'
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [alertConfig, setAlertConfig] = useState({ show: false, message: '', type: 'info' });
  const [openQuotationDialog, setOpenQuotationDialog] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [quotationForm, setQuotationForm] = useState({
    _id: '',
    service: '',
    enterpriseName: '',
    contactNumber: '',
    email: '',
    description: '',
    budget: 0
  });

  // Initialize checking authentication
  useEffect(() => {
    const init = async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        // Use Promise.all to fetch all data in parallel
        await Promise.all([
          fetchUsers(),
          fetchEnterpriseInfo(),
          fetchServices(),
          fetchProducts(),
          fetchQuotations(),
          fetchInvoices(),
          fetchReports(),
          fetchTicketStats(),
          fetchNotifications()
        ]);
      }
    };
    
    init();
  }, []); // Empty dependency array since we only want this to run once on mount

  // Initialize user profile data from current user
  useEffect(() => {
    if (currentUser?.profile) {
      setUserProfile(prevProfile => ({
        ...prevProfile,
        fullName: currentUser.profile.fullName || '',
        email: currentUser.email || '',
        department: currentUser.profile.department || '',
        status: currentUser.profile.status || 'active'
      }));
    }
  }, [currentUser]); // Only depend on currentUser changes

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownVisible(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Empty dependency array since we only need to set up the event listener once

  // Add showAlert function if not present
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const checkAuth = useCallback(async () => {
    // Check if we're in internal navigation mode
    if (localStorage.getItem('internalNavigation')) {
      console.log('Internal navigation detected, skipping auth check');
      return true;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      showAlert('Please login first', 'error');
      navigate('/login');
      return false;
    }

    try {
      console.log('Verifying admin authentication');
      const response = await axios.get(`${API_URL}/admin/verify`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Verification response:', response.data);
      
      // Store the complete user object including permissions
      if (response.data.user) {
        setCurrentUser(response.data.user);
        // Store permissions for conditional rendering
        setUserPermissions(response.data.user.permissions || {});
        console.log('User permissions:', response.data.user.permissions);
      } else {
        throw new Error('No user data received');
      }
      
      if (response.data.message === 'Authenticated as admin') {
        console.log('Successfully verified as admin');
        return true;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error.response?.data || error.message);
      
      // Only show error and redirect if not in internal navigation
      if (!localStorage.getItem('internalNavigation')) {
      showAlert(error.response?.data?.message || 'Authentication failed', 'error');
      localStorage.removeItem('token');
      navigate('/login');
      }
      return false;
    }
  }, [navigate, showAlert]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setStats(prev => ({
        ...prev,
        totalUsers: response.data.length,
        activeUsers: response.data.filter(user => user.profile.status === 'active').length
      }));
    } catch (error) {
      showAlert('Failed to fetch users', 'error');
    }
  }, [showAlert]);

  const fetchEnterpriseInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/enterprise/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setEnterpriseInfo(response.data);
        console.log('Enterprise info updated:', response.data);
        return response.data;
      } else {
        console.warn('No enterprise data received from API');
        showAlert('Failed to load company information', 'warning');
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch enterprise info:', error);
      showAlert(error.response?.data?.message || 'Failed to load company information', 'error');
      return null;
    }
  }, [showAlert]);

  // Sample services data
  const getSampleServices = useCallback(() => {
    return [
      { 
        id: 1, 
        name: 'Web Development', 
        icon: '🌐', 
        category: 'IT', 
        price: 2500, 
        status: 'active',
        description: 'Professional web development services tailored to your business needs.',
        features: [
          { name: 'Responsive Design', included: true },
          { name: 'CMS Integration', included: true },
          { name: 'E-commerce Functionality', included: true },
          { name: 'SEO Optimization', included: false }
        ],
        duration: { value: 1, unit: 'month' }
      },
      { 
        id: 2, 
        name: 'Mobile App Development', 
        icon: '📱', 
        category: 'IT', 
        price: 3500, 
        status: 'active',
        description: 'Full-cycle mobile app development for iOS and Android platforms.',
        features: [
          { name: 'Native Development', included: true },
          { name: 'Cross-platform Options', included: true },
          { name: 'API Integration', included: true },
          { name: 'App Store Submission', included: true }
        ],
        duration: { value: 2, unit: 'months' }
      },
      { 
        id: 3, 
        name: 'UI/UX Design', 
        icon: '🎨', 
        category: 'Design', 
        price: 1800, 
        status: 'active',
        description: 'User-centered design focusing on creating meaningful and relevant experiences.',
        features: [
          { name: 'User Research', included: true },
          { name: 'Wireframing', included: true },
          { name: 'Prototyping', included: true },
          { name: 'Usability Testing', included: false }
        ],
        duration: { value: 3, unit: 'weeks' }
      },
      { 
        id: 4, 
        name: 'SEO Services', 
        icon: '🔍', 
        category: 'Marketing', 
        price: 1200, 
        status: 'active',
        description: 'Boost your online visibility and drive more traffic to your website.',
        features: [
          { name: 'Keyword Research', included: true },
          { name: 'On-page SEO', included: true },
          { name: 'Technical SEO', included: true },
          { name: 'Link Building', included: false }
        ],
        duration: { value: 1, unit: 'month' }
      },
      { 
        id: 5, 
        name: 'Cloud Consulting', 
        icon: '☁️', 
        category: 'IT', 
        price: 2800, 
        status: 'active',
        description: 'Expert guidance for cloud migration, architecture, and optimization.',
        features: [
          { name: 'Cloud Assessment', included: true },
          { name: 'Migration Planning', included: true },
          { name: 'Security Review', included: true },
          { name: 'Ongoing Support', included: false }
        ],
        duration: { value: 1, unit: 'one-time' }
      }
    ];
  }, []);

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Authentication token not found', 'error');
        setServices([]);
        return;
      }
      const response = await axios.get(`${API_URL}/services/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Services data received:', response.data);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setServices(response.data);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Error in fetchServices:', error);
      showAlert('Failed to fetch services: ' + (error.response?.data?.message || error.message), 'error');
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showAlert]);

  // Fetch quotations (admin-specific)
  const fetchQuotations = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Authentication token not found', 'error');
        setQuotations([]);
        return;
      }
      // Use the correct quotations endpoint
      const response = await axios.get(`${API_URL}/api/quotations`, {
        headers: { Authorization: `Bearer ${token}` }
        });
      // Map the data to match the expected structure
      if (Array.isArray(response.data)) {
        const mapped = response.data.map(q => ({
          _id: q._id,
          service: q.serviceId?.name || q.service || '',
          enterpriseName: q.enterpriseDetails?.companyName || q.enterpriseName || '',
          contactNumber: q.enterpriseDetails?.phone || q.contactNumber || '',
          email: q.enterpriseDetails?.email || q.email || '',
          description: q.requestDetails || q.description || '',
          budget: q.requestedPrice || q.budget || 0,
          status: q.status || 'pending',
          createdAt: q.createdAt,
        }));
        setQuotations(mapped);
        } else {
        setQuotations([]);
        }
      } catch (error) {
      showAlert('Failed to fetch quotations', 'error');
      setQuotations([]);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, showAlert]);

  // Helper function to get quotation status text
  const getQuotationStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  // Handle service quotation click
  const handleServiceQuotationClick = (service) => {
    console.log('Service quotation requested for:', service);
    showAlert('Quotation feature will be available soon!', 'info');
  };

  // Handle view quotation
  const handleViewQuotation = (quotation) => {
    console.log('Viewing quotation details:', quotation);
    showAlert('Quotation details feature will be available soon!', 'info');
  };

  // Load services and quotations when services tab is active
  useEffect(() => {
    if (activeTab === 'services') {
      const loadServicesData = async () => {
        await Promise.all([
          fetchServices(),
          fetchQuotations()
        ]);
      };
      loadServicesData();
    }
  }, [activeTab]); // Only depend on activeTab changes

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Transform the API response to match the expected format
        const formattedProducts = response.data.map(product => {
          // Determine if this product is purchased based on user permissions
          let isPurchased = false;
          
          // Map product IDs to permission keys
          if (product.productId === 'crm-pro' || product.productId === 'PROD-CRM-001') {
            isPurchased = userPermissions.crmAccess;
          } else if (product.productId === 'hrms-basic' || product.productId === 'PROD-HRMS-001') {
            isPurchased = userPermissions.hrmsAccess;
          } else if (product.productId === 'job-portal' || product.productId === 'PROD-JP-001') {
            isPurchased = userPermissions.jobPortalAccess;
          } else if (product.productId === 'job-board' || product.productId === 'PROD-JB-001') {
            isPurchased = userPermissions.jobBoardAccess;
          } else if (product.productId === 'project-management' || product.productId === 'PROD-PM-001') {
            isPurchased = userPermissions.projectManagementAccess;
          }
          
          return {
            id: product.productId || product._id,
            name: product.name,
            description: product.description,
            icon: product.icon || '📋',
            productId: product.productId,
            purchased: isPurchased,
            startDate: isPurchased ? new Date().toLocaleDateString() : null,
            endDate: isPurchased ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null
          };
        });
        
        setProducts(formattedProducts);
        console.log('Products loaded from API:', formattedProducts);
      } else {
        console.log('No products returned from API, using sample products');
        
        // Provide sample products if none exist in the database
        const sampleProducts = [
          { 
            id: 'crm-pro', 
            name: 'CRM Professional', 
            description: 'Complete customer relationship management solution', 
            icon: '📊',
            purchased: userPermissions.crmAccess,
            startDate: userPermissions.crmAccess ? new Date().toLocaleDateString() : null,
            endDate: userPermissions.crmAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
            productId: 'PROD-CRM-001'
          },
          { 
            id: 'hrms-basic', 
            name: 'HRMS Basic', 
            description: 'Human resources management system', 
            icon: '👥',
            purchased: userPermissions.hrmsAccess,
            startDate: userPermissions.hrmsAccess ? new Date().toLocaleDateString() : null,
            endDate: userPermissions.hrmsAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
            productId: 'PROD-HRMS-001'
          },
          { 
            id: 'job-portal', 
            name: 'Job Portal', 
            description: 'Full-featured job posting and application platform', 
            icon: '🔍',
            purchased: userPermissions.jobPortalAccess,
            startDate: userPermissions.jobPortalAccess ? new Date().toLocaleDateString() : null,
            endDate: userPermissions.jobPortalAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
            productId: 'PROD-JP-001'
          },
          {
            id: 'job-board',
            name: 'Job Board',
            description: 'Public job board for listings',
            icon: '📋',
            purchased: userPermissions.jobBoardAccess,
            startDate: userPermissions.jobBoardAccess ? new Date().toLocaleDateString() : null,
            endDate: userPermissions.jobBoardAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
            productId: 'PROD-JB-001'
          },
          {
            id: 'project-management',
            name: 'Project Management',
            description: 'Project tracking and team coordination',
            icon: '📝',
            purchased: userPermissions.projectManagementAccess,
            startDate: userPermissions.projectManagementAccess ? new Date().toLocaleDateString() : null,
            endDate: userPermissions.projectManagementAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
            productId: 'PROD-PM-001'
          }
        ];
        
        setProducts(sampleProducts);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      
      // Fallback to sample products on error
      const sampleProducts = [
        { 
          id: 'crm-pro', 
          name: 'CRM Professional', 
          description: 'Complete customer relationship management solution', 
          icon: '📊',
          purchased: userPermissions.crmAccess,
          startDate: userPermissions.crmAccess ? new Date().toLocaleDateString() : null,
          endDate: userPermissions.crmAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
          productId: 'PROD-CRM-001'
        },
        { 
          id: 'hrms-basic', 
          name: 'HRMS Basic', 
          description: 'Human resources management system', 
          icon: '👥',
          purchased: userPermissions.hrmsAccess,
          startDate: userPermissions.hrmsAccess ? new Date().toLocaleDateString() : null,
          endDate: userPermissions.hrmsAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
          productId: 'PROD-HRMS-001'
        },
        { 
          id: 'job-portal', 
          name: 'Job Portal', 
          description: 'Full-featured job posting and application platform', 
          icon: '🔍',
          purchased: userPermissions.jobPortalAccess,
          startDate: userPermissions.jobPortalAccess ? new Date().toLocaleDateString() : null,
          endDate: userPermissions.jobPortalAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
          productId: 'PROD-JP-001'
        },
        {
          id: 'job-board',
          name: 'Job Board',
          description: 'Public job board for listings',
          icon: '📋',
          purchased: userPermissions.jobBoardAccess,
          startDate: userPermissions.jobBoardAccess ? new Date().toLocaleDateString() : null,
          endDate: userPermissions.jobBoardAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
          productId: 'PROD-JB-001'
        },
        {
          id: 'project-management',
          name: 'Project Management',
          description: 'Project tracking and team coordination',
          icon: '📝',
          purchased: userPermissions.projectManagementAccess,
          startDate: userPermissions.projectManagementAccess ? new Date().toLocaleDateString() : null,
          endDate: userPermissions.projectManagementAccess ? new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString() : null,
          productId: 'PROD-PM-001'
        }
      ];
      
      setProducts(sampleProducts);
    }
  }, [API_URL, userPermissions]);

  const fetchInvoices = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/invoices/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      showAlert('Failed to fetch invoices', 'error');
      setInvoices([]);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tickets/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  }, []);

  const fetchTicketStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tickets/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketStats(response.data);
    } catch (error) {
      console.error('Failed to fetch ticket stats:', error);
    }
  }, []);

  // Add fetchNotifications function after other fetch functions
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching notifications...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, cannot fetch notifications');
        return;
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
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
          // Format the notifications with relative time
          const formattedNotifications = response.data.notifications.map(notification => ({
            id: notification._id,
            text: notification.message,
            time: formatRelativeTime(new Date(notification.createdAt)),
            type: notification.type || 'info',
            read: notification.read,
            link: notification.link,
            title: notification.title
          }));
          
          setNotifications(formattedNotifications);
        } else {
          // Use empty array if no notifications
          setNotifications([]);
        }
      } catch (error) {
        console.warn('Error fetching notifications:', error.message);
        // Keep existing notifications on error
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add formatRelativeTime helper function
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }
    
    // For older dates, return the actual date
    return date.toLocaleDateString();
  };

  // Add markNotificationAsRead function
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      await axios.put(`${apiUrl}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the notifications list to mark this one as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Add handleNotificationClick function
  const handleNotificationClick = (notification) => {
    // Mark as read
    markNotificationAsRead(notification.id);
    
    // Navigate if there's a link
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Add markAllNotificationsAsRead function
  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      await axios.put(`${apiUrl}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update all notifications to be marked as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      showAlert('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showAlert('Failed to mark notifications as read', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/create-user`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('User created successfully', 'success');
      setOpenDialog(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/admin/users/${selectedUser._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('User updated successfully', 'success');
      setOpenDialog(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showAlert('User deleted successfully', 'success');
        fetchUsers();
      } catch (error) {
        showAlert('Failed to delete user', 'error');
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    
    if (!selectedUser && !formData.password) errors.password = 'Password is required for new users';
    else if (!selectedUser && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (!formData.profile.fullName) errors.fullName = 'Full name is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      profile: {
        fullName: '',
        phone: '',
        department: '',
        status: 'active'
      }
    });
    setSelectedUser(null);
    setFormErrors({});
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      profile: { ...user.profile }
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // Toggle profile dropdown
  const toggleProfileDropdown = () => {
    setProfileDropdownVisible(!profileDropdownVisible);
  };

  // Handle profile menu item click
  const handleProfileMenuItemClick = (action) => {
    setProfileDropdownVisible(false);
    
    switch(action) {
      case 'company':
        showAlert('Company info coming soon!', 'success');
        break;
      case 'profile':
        handleNavigate('profile');
        break;
      case 'help':
        showAlert('Help center coming soon!', 'success');
        break;
      case 'privacy':
        showAlert('Privacy settings coming soon!', 'success');
        break;
      case 'settings':
        handleNavigate('settings');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  // Implementation for logging out
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNavigate = (tabId) => {
    console.log("Navigating to tab:", tabId);
    setActiveTab(tabId);
    
    // Update URL without full redirect to maintain state
    window.history.pushState(
      {}, 
      '', 
      tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`
    );
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    // Forgot password logic would go here
    console.log('Forgot password clicked');
  };

  // Function to navigate to the main sections
  const handleMainNavigation = (section) => {
    console.log(`Navigating to ${section}`);
    // Here you would implement the navigation or action for the main buttons
    // For now we'll just show an alert
    showAlert(`${section} feature coming soon!`, 'success');
  };

  // Function to render the main content based on active tab
  const renderMainContent = () => {
    switch(activeTab) {
      case 'dashboard':
  return (
          <div className="dashboard-main-content">
            <div className="dashboard-grid">
              <div 
                className="dashboard-card"
                onClick={() => handleNavigate('products')}
              >
                <div className="card-icon">📦</div>
                <h3>Products</h3>
                <p>Manage your product catalog</p>
          </div>
              <div 
                className="dashboard-card"
                onClick={() => handleNavigate('services')}
              >
                <div className="card-icon">🛠️</div>
                <h3>Services</h3>
                <p>Manage your service offerings</p>
            </div>
              <div 
                className="dashboard-card"
                onClick={() => handleNavigate('quotations')}
              >
                <div className="card-icon">📝</div>
                <h3>Quotations</h3>
                <p>Manage customer quotations</p>
          </div>
              <div 
                className="dashboard-card"
                onClick={() => handleNavigate('invoices')}
              >
                <div className="card-icon">💰</div>
                <h3>Invoices</h3>
                <p>Manage billing and invoices</p>
                  </div>
              <div 
                className="dashboard-card"
                onClick={() => handleNavigate('reports')}
              >
                <div className="card-icon">📊</div>
                <h3>Reports and Analytics</h3>
                <p>View business performance</p>
                  </div>
              <div 
                className="dashboard-card"
                onClick={() => handleNavigate('createTicket')}
              >
                <div className="card-icon">🎫</div>
                <h3>Complains/Help</h3>
                <p>Manage support tickets</p>
                      </div>
                      </div>
                </div>
        );
      case 'services':
        return (
          <div className="section-container">
            <h1 className="section-title">Services Management</h1>
            <p className="section-description">
              Here you can view and request services for your enterprise.
            </p>
            
            <div className="services-tabs">
              <div 
                className={`tab ${servicesTabActive === 'services' ? 'active' : ''}`}
                onClick={() => setServicesTabActive('services')}
              >
                Available Services
              </div>
              <div 
                className={`tab ${servicesTabActive === 'quotations' ? 'active' : ''}`}
                onClick={() => setServicesTabActive('quotations')}
              >
                My Quotation Requests
              </div>
            </div>
            
            {servicesTabActive === 'services' && (
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
                      <div key={service._id || service.id} className="service-card">
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
                            <span className="price-value">${service.price?.toLocaleString()}</span>
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
            
            {servicesTabActive === 'quotations' && (
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
                          <tr key={quotation._id || quotation.id} className={quotation.status === 'approved' ? 'highlight-row' : ''}>
                            <td>{quotation.serviceId?.name || 'Unknown Service'}</td>
                            <td>{new Date(quotation.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge ${quotation.status}`}>
                                {getQuotationStatusText(quotation.status)}
                              </span>
                            </td>
                            <td>
                              {quotation.status === 'approved' || quotation.status === 'completed' 
                                ? `$${quotation.finalPrice?.toLocaleString() || quotation.serviceId?.price?.toLocaleString()}` 
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
        );
      case 'products':
        return (
          <div className="section-container">
            <h1 className="section-title">Products Management</h1>
            <p className="section-description">
              Here you can view and manage all available products for your enterprise.
            </p>
            
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Product</th>
                    <th>Description</th>
                    <th>Product ID</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products && products.length > 0 ? (
                    products.map(product => (
                      <tr key={product.id} className={product.purchased ? 'product-row purchased' : 'product-row'}>
                        <td className="product-icon">{product.icon}</td>
                        <td className="product-name">{product.name}</td>
                        <td className="product-description">{product.description}</td>
                        <td className="product-id">{product.productId}</td>
                        <td className="product-status">
                          <span className={`status-badge ${product.purchased ? 'active' : 'inactive'}`}>
                            {product.purchased ? 'Active' : 'Not Purchased'}
                          </span>
                        </td>
                        <td className="product-date">{product.startDate || '-'}</td>
                        <td className="product-date">{product.endDate || '-'}</td>
                        <td className="product-action">
                          {product.purchased ? (
                            <button className="view-btn">
                              Open
                            </button>
                          ) : (
                            <button className="request-btn" onClick={() => handleRequestProduct(product)}>
                              Add Product
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-products">No products available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>

            {/* Product request dialog */}
            {openProductRequestDialog && selectedProductToRequest && (
              <div className="dialog-overlay">
                <div className="dialog product-request-dialog">
                  <button 
                    className="close-btn" 
                    onClick={() => {
                      setOpenProductRequestDialog(false);
                      resetProductRequestForm();
                    }}
                  >
                    ×
                  </button>
                  <h2>Request {selectedProductToRequest.name}</h2>
                  <p className="dialog-description">
                    Complete this form to request {selectedProductToRequest.name} for your enterprise. 
                    Our team will contact you with pricing and activation details.
                  </p>
                  
                  <form onSubmit={handleSubmitProductRequest}>
                    <div className="form-section">
                      <h3>Contact Information</h3>
                      
                      <div className="form-group">
                        <label>Contact Name</label>
                        <input
                          type="text"
                          value={productRequestForm.contactName}
                          onChange={(e) => setProductRequestForm({...productRequestForm, contactName: e.target.value})}
                          required
                        />
                </div>
                      
                      <div className="form-group">
                        <label>Contact Email</label>
                        <input
                          type="email"
                          value={productRequestForm.contactEmail}
                          onChange={(e) => setProductRequestForm({...productRequestForm, contactEmail: e.target.value})}
                          required
                        />
          </div>
                      
                      <div className="form-group">
                        <label>Contact Phone</label>
                        <input
                          type="tel"
                          value={productRequestForm.contactPhone}
                          onChange={(e) => setProductRequestForm({...productRequestForm, contactPhone: e.target.value})}
                          required
                        />
            </div>

                      <div className="form-group">
                        <label>Company Name</label>
                        <input
                          type="text"
                          value={productRequestForm.companyName || (currentUser?.profile?.companyName || enterpriseInfo.name)}
                          onChange={(e) => setProductRequestForm({...productRequestForm, companyName: e.target.value})}
                          required
                        />
          </div>
                        </div>
                        
                    <div className="form-section">
                      <h3>Additional Information</h3>
                      
                      <div className="form-group">
                        <label>Message (Optional)</label>
                        <textarea
                          value={productRequestForm.message}
                          onChange={(e) => setProductRequestForm({...productRequestForm, message: e.target.value})}
                          placeholder="Tell us about your specific requirements or questions"
                          rows="3"
                        />
                  </div>
                  </div>
                        
                    <div className="form-section">
                      <h3>Payment Information</h3>
                      
                      <div className="form-group">
                        <label>Preferred Payment Method</label>
                        <select
                          value={productRequestForm.paymentMethod}
                          onChange={(e) => setProductRequestForm({...productRequestForm, paymentMethod: e.target.value})}
                          required
                        >
                          <option value="bankTransfer">Bank Transfer</option>
                          <option value="creditCard">Credit Card</option>
                          <option value="paypal">PayPal</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                          
                      {productRequestForm.paymentMethod === 'bankTransfer' && (
                        <div className="form-group">
                          <label>Bank Account Information (Optional)</label>
                          <textarea
                            value={productRequestForm.bankAccount}
                            onChange={(e) => setProductRequestForm({...productRequestForm, bankAccount: e.target.value})}
                            placeholder="Bank name, account number, etc."
                            rows="2"
                          />
                      </div>
                      )}
                      
                      <div className="form-group">
                        <label>Additional Payment Information (Optional)</label>
                        <textarea
                          value={productRequestForm.additionalInfo}
                          onChange={(e) => setProductRequestForm({...productRequestForm, additionalInfo: e.target.value})}
                          placeholder="Any other payment-related information"
                          rows="2"
                        />
                </div>
              </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenProductRequestDialog(false);
                          resetProductRequestForm();
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="submit-btn">Submit Request</button>
                        </div>
                  </form>
                      </div>
                  </div>
            )}
                    </div>
        );
      case 'profile':
        return (
          <div className="section-container">
            <h1 className="section-title">Profile</h1>
            <div className="profile-content">
              <div className="profile-section company-profile">
                <div className="section-header">
                  <h2><span className="section-icon">🏢</span> Company Information</h2>
                  <button 
                    className="edit-btn"
                    onClick={() => setProfileEditMode(prevState => ({
                      ...prevState,
                      company: !prevState.company
                    }))}
                  >
                    {profileEditMode.company ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                {profileEditMode.company ? (
                  // Edit mode
                  <div className="company-edit-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Company Name</label>
                        <input
                          type="text"
                          value={enterpriseInfo.name}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            name: e.target.value
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Industry</label>
                        <input
                          type="text"
                          value={enterpriseInfo.industry}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            industry: e.target.value
                          })}
                          placeholder="e.g. Technology, Healthcare, etc."
                        />
                    </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Company Logo (Max 2MB)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className={logoError ? "error" : ""}
                        />
                        {logoError && <span className="error-message">{logoError}</span>}
                        {logoPreview && (
                          <div className="logo-preview">
                            <img src={logoPreview} alt="Logo preview" />
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Business Type</label>
                        <input
                          type="text"
                          value={enterpriseInfo.business}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            business: e.target.value
                          })}
                          placeholder="e.g. B2B, B2C, etc."
                        />
                </div>
              </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Website</label>
                        <input
                          type="url"
                          value={enterpriseInfo.website}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            website: e.target.value
                          })}
                          placeholder="https://yourcompany.com"
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        className="save-btn"
                        onClick={handleSaveCompanyInfo}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="company-info-display">
                    <div className="company-logo">
                      {enterpriseInfo.logo ? (
                        <img src={enterpriseInfo.logo} alt={`${enterpriseInfo.name} logo`} />
                      ) : (
                        <div className="logo-placeholder">
                          {enterpriseInfo.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="info-group">
                      <h3>Company Name</h3>
                      <p>{enterpriseInfo.name || 'Not specified'}</p>
                    </div>
                    <div className="info-group">
                      <h3>Industry</h3>
                      <p>{enterpriseInfo.industry || 'Not specified'}</p>
                    </div>
                    <div className="info-group">
                      <h3>Business Type</h3>
                      <p>{enterpriseInfo.business || 'Not specified'}</p>
                    </div>
                    <div className="info-group">
                      <h3>Website</h3>
                      <p>
                        {enterpriseInfo.website ? (
                          <a href={enterpriseInfo.website} target="_blank" rel="noopener noreferrer">
                            {enterpriseInfo.website}
                          </a>
                        ) : (
                          'Not specified'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="profile-section contact-profile">
                  <div className="section-header">
                  <h2><span className="section-icon">📫</span> Contact Information</h2>
                  <button 
                    className="edit-btn"
                    onClick={() => setProfileEditMode(prevState => ({
                      ...prevState,
                      contact: !prevState.contact
                    }))}
                  >
                    {profileEditMode.contact ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                
                {profileEditMode.contact ? (
                  // Edit mode
                  <div className="contact-edit-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Address</label>
                        <input
                          type="text"
                          value={enterpriseInfo.address}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            address: e.target.value
                          })}
                          placeholder="Street address"
                        />
                      </div>
                        </div>
                        
                    <div className="form-row">
                      <div className="form-group">
                        <label>Mailing Address</label>
                        <input
                          type="text"
                          value={enterpriseInfo.mailingAddress}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            mailingAddress: e.target.value
                          })}
                          placeholder="Mailing address (if different)"
                        />
                      </div>
                          </div>
                          
                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          value={enterpriseInfo.city}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            city: e.target.value
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input
                          type="text"
                          value={enterpriseInfo.country}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            country: e.target.value
                          })}
                        />
                          </div>
                        </div>
                        
                    <div className="form-row">
                      <div className="form-group">
                        <label>Zip Code</label>
                        <input
                          type="text"
                          value={enterpriseInfo.zipCode}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            zipCode: e.target.value
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={enterpriseInfo.phone}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            phone: e.target.value
                          })}
                          placeholder="+1 (123) 456-7890"
                        />
                      </div>
                          </div>
                          
                    <div className="form-row">
                      <div className="form-group">
                        <label>Company Email</label>
                        <input
                          type="email"
                          value={enterpriseInfo.email}
                          onChange={(e) => setEnterpriseInfo({
                            ...enterpriseInfo,
                            email: e.target.value
                          })}
                          placeholder="contact@yourcompany.com"
                        />
                      </div>
                          </div>
                          
                    <div className="form-actions">
                      <button 
                        className="save-btn"
                        onClick={handleSaveContactInfo}
                      >
                        Save Changes
                      </button>
                            </div>
                          </div>
                ) : (
                  // View mode
                  <div className="contact-info-display">
                    <div className="info-group">
                      <h3>Address</h3>
                      <p>{enterpriseInfo.address || 'Not specified'}</p>
                        </div>
                    <div className="info-group">
                      <h3>Mailing Address</h3>
                      <p>{enterpriseInfo.mailingAddress || 'Not specified'}</p>
                      </div>
                    <div className="info-group">
                      <h3>City</h3>
                      <p>{enterpriseInfo.city || 'Not specified'}</p>
                  </div>
                    <div className="info-group">
                      <h3>Country</h3>
                      <p>{enterpriseInfo.country || 'Not specified'}</p>
                    </div>
                    <div className="info-group">
                      <h3>Zip Code</h3>
                      <p>{enterpriseInfo.zipCode || 'Not specified'}</p>
                    </div>
                    <div className="info-group">
                      <h3>Phone Number</h3>
                      <p>{enterpriseInfo.phone || 'Not specified'}</p>
                    </div>
                    <div className="info-group">
                      <h3>Company Email</h3>
                      <p>{enterpriseInfo.email || 'Not specified'}</p>
                    </div>
                  </div>
                )}
                </div>

              <div className="profile-section user-profile">
                    <div className="section-header">
                  <h2><span className="section-icon">👤</span> User Information</h2>
                  <button 
                    className="edit-btn"
                    onClick={() => setProfileEditMode(prevState => ({
                      ...prevState,
                      user: !prevState.user
                    }))}
                  >
                    {profileEditMode.user ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                
                {profileEditMode.user ? (
                  // Edit mode
                  <div className="user-edit-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={userProfile.fullName}
                          onChange={(e) => setUserProfile({
                            ...userProfile,
                            fullName: e.target.value
                          })}
                        />
                          </div>
                        </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => setUserProfile({
                            ...userProfile,
                            email: e.target.value
                          })}
                          disabled // Email typically shouldn't be changed
                        />
                    </div>
                  </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Department</label>
                        <input
                          type="text"
                          value={userProfile.department}
                          onChange={(e) => setUserProfile({
                            ...userProfile,
                            department: e.target.value
                          })}
                        />
                    </div>
                              </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Current Password</label>
                        <input
                          type="password"
                          value={userPassword.current}
                          onChange={(e) => setUserPassword({
                            ...userPassword,
                            current: e.target.value
                          })}
                          placeholder="Enter current password to change"
                        />
                            </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          value={userPassword.new}
                          onChange={(e) => setUserPassword({
                            ...userPassword,
                            new: e.target.value
                          })}
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                          type="password"
                          value={userPassword.confirm}
                          onChange={(e) => setUserPassword({
                            ...userPassword,
                            confirm: e.target.value
                          })}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        className="save-btn"
                        onClick={handleSaveUserInfo}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="user-info-display">
                    <div className="profile-avatar">
                      <span className="profile-avatar-placeholder">
                        {currentUser?.profile?.fullName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="info-group">
                      <h3>Full Name</h3>
                      <p>{currentUser?.profile?.fullName || 'Not specified'}</p>
                    </div>
                    <div className="info-group">
                      <h3>Email</h3>
                      <p>{currentUser?.email || 'Not specified'}</p>
                    </div>
                    <div className="info-group">
                      <h3>Department</h3>
                      <p>{currentUser?.profile?.department || 'Not specified'}</p>
                    </div>
                    <div className="info-group">
                      <h3>Status</h3>
                      <p className={`status-badge ${currentUser?.profile?.status || 'active'}`}>
                        {currentUser?.profile?.status || 'active'}
                            </p>
                          </div>
                    <div className="info-group">
                      <h3>Login Link</h3>
                      <p>
                        <a href={`${window.location.origin}/login`} target="_blank" rel="noopener noreferrer">
                          {`${window.location.origin}/login`}
                        </a>
                      </p>
                              </div>
                            </div>
                          )}
                  </div>
                </div>
              </div>
        );
      case 'quotations':
        return (
          <div className="section-container">
            <h1 className="section-title">Quotations Management</h1>
            <button className="create-btn" onClick={() => {
              resetQuotationForm();
              setOpenQuotationDialog(true);
            }}>
              Create New Quotation
            </button>
            <div className="quotations-list">
              {isLoading ? (
                <div className="loading-state">Loading quotations...</div>
              ) : quotations.length > 0 ? (
                quotations.map(quotation => (
                  <div key={quotation._id || quotation.id} className="quotation-card">
                    <h3>Quotation #{quotation._id ? quotation._id.slice(-5) : quotation.id || 'N/A'}</h3>
                    <p>Service: {quotation.service || 'Not specified'}</p>
                    <p>Enterprise: {quotation.enterpriseName || 'Not specified'}</p>
                    <p>Budget: ${quotation.budget || 0}</p>
                    <p>Status: {quotation.status || 'pending'}</p>
                    <div className="card-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => {
                          console.log('Editing quotation:', quotation);
                          setEditingQuotation(quotation);
                          setQuotationForm({
                            _id: quotation._id || quotation.id,
                            service: quotation.service || '',
                            enterpriseName: quotation.enterpriseName || '',
                            contactNumber: quotation.contactNumber || '',
                            email: quotation.email || '',
                            description: quotation.description || '',
                            budget: quotation.budget || 0
                          });
                          setOpenQuotationDialog(true);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteQuotation(quotation._id || quotation.id)}
                      >
                        Delete
                      </button>
                          </div>
                        </div>
                ))
              ) : (
                <div className="no-data">
                <p>No quotations found. Create your first quotation.</p>
                </div>
              )}
                    </div>

            {/* Quotation Form Dialog */}
            {openQuotationDialog && (
              <div className="dialog-overlay">
                <div className="dialog">
                  <h2>{editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}</h2>
                  <form onSubmit={editingQuotation ? handleEditQuotation : handleCreateQuotation}>
                    {!editingQuotation && (
                      <>
                        <div className="form-group">
                          <label>Service *</label>
                          <select
                            value={quotationForm.service}
                            onChange={e => setQuotationForm({ ...quotationForm, service: e.target.value })}
                            required
                          >
                            <option value="">Select a service</option>
                            {services.map(service => (
                              <option key={service._id} value={service._id}>
                                {service.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Enterprise Name *</label>
                          <input
                            type="text"
                            value={currentUser?.enterprise?.companyName || currentUser?.profile?.companyName || ''}
                            readOnly
                            className="read-only"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Contact Number *</label>
                          <input
                            type="tel"
                            value={quotationForm.contactNumber}
                            onChange={e => setQuotationForm({ ...quotationForm, contactNumber: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Email *</label>
                          <input
                            type="email"
                            value={currentUser?.email || ''}
                            readOnly
                            className="read-only"
                            required
                          />
                        </div>
                      </>
                    )}
                    <div className="form-group">
                      <label>Budget *</label>
                      <input
                        type="number"
                        value={quotationForm.budget}
                        onChange={e => setQuotationForm({ ...quotationForm, budget: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description *</label>
                      <textarea
                        value={quotationForm.description}
                        onChange={e => setQuotationForm({ ...quotationForm, description: e.target.value })}
                        required
                        rows="4"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="button" onClick={() => {
                        setOpenQuotationDialog(false);
                        resetQuotationForm();
                      }}>
                        Cancel
                      </button>
                      <button type="submit">
                        {editingQuotation ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
                  </div>
        );
      case 'invoices':
        return (
          <div className="section-container">
            <h1 className="section-title">Invoice Management</h1>
            <p className="section-description">
              View and manage invoices for your purchased products and services.
            </p>
            
            {showInvoiceDetail && selectedInvoice ? (
              <div className="invoice-detail-container">
                <div className="invoice-detail-header">
                  <h2>Invoice #{selectedInvoice.invoiceNumber}</h2>
                  <button className="close-btn" onClick={closeInvoiceDetail}>×</button>
                          </div>
                
                <div className="invoice-detail-content">
                  <div className="invoice-detail-section">
                    <h3>Invoice Information</h3>
                    <div className="invoice-detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Product/Service:</span>
                        <span className="detail-value">{
                          selectedInvoice.items && selectedInvoice.items.length > 0
                            ? selectedInvoice.items.map(item => item.name).join(', ')
                            : selectedInvoice.productName || (selectedInvoice.enterpriseDetails && selectedInvoice.enterpriseDetails.companyName) || 'N/A'
                        }</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value">${(selectedInvoice.totalAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span className={`detail-value status-badge ${getStatusColor(selectedInvoice.status)}`}>
                          {selectedInvoice.status}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Issue Date:</span>
                        <span className="detail-value">{formatDate(selectedInvoice.issueDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Due Date:</span>
                        <span className="detail-value">{formatDate(selectedInvoice.dueDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Paid Date:</span>
                        <span className="detail-value">{formatDate(selectedInvoice.paidDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Billing Period:</span>
                        <span className="detail-value">{selectedInvoice.billingPeriod}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="invoice-detail-section">
                    <h3>Payment Information</h3>
                    {selectedInvoice.status === 'paid' ? (
                      <div className="payment-info">
                        <p className="payment-confirmation">
                          <span className="checkmark">✓</span> Payment Complete
                        </p>
                        <p>This invoice has been paid on {formatDate(selectedInvoice.paidDate)}.</p>
                      </div>
                    ) : (
                      <div className="payment-actions">
                        <p>This invoice is {selectedInvoice.status}. Please complete payment to continue using the service.</p>
                        <button 
                          className="pay-invoice-btn" 
                          onClick={() => handlePayInvoice(selectedInvoice._id)}
                          disabled={paymentProcessing}
                        >
                          {paymentProcessing ? 'Processing...' : 'Process Payment'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="invoice-detail-section">
                    <h3>Download Invoice</h3>
                    <button className="download-invoice-btn">
                      <span className="download-icon">📥</span> Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="invoices-table-container">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Product/Service</th>
                      <th>Amount</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Paid Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices && invoices.length > 0 ? (
                      invoices.map(invoice => {
                        const status = getInvoiceStatus(invoice);
                        // Get a display name for the invoice (service/quotation/product)
                        let displayName = '';
                        if (invoice.items && invoice.items.length > 0) {
                          displayName = invoice.items.map(item => item.name).join(', ');
                        } else if (invoice.productName) {
                          displayName = invoice.productName;
                        } else if (invoice.enterpriseDetails && invoice.enterpriseDetails.companyName) {
                          displayName = invoice.enterpriseDetails.companyName;
                        } else {
                          displayName = 'N/A';
                        }
                        return (
                          <tr key={invoice._id} className={`invoice-row ${getStatusColor(status)}`}>
                            <td>{invoice.invoiceNumber}</td>
                            <td>{displayName}</td>
                            <td>${(invoice.totalAmount || 0).toFixed(2)}</td>
                            <td>{formatDate(invoice.issueDate)}</td>
                            <td>{formatDate(invoice.dueDate)}</td>
                            <td>{formatDate(invoice.paidDate)}</td>
                            <td>
                              <span className={`status-badge ${getStatusColor(status)}`}>
                                {status}
                              </span>
                            </td>
                            <td className="invoice-actions">
                              <button 
                                className="view-invoice-btn" 
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                View
                              </button>
                              {status !== 'paid' && (
                                <button 
                                  className="pay-btn"
                                  onClick={() => handlePayInvoice(invoice._id)}
                                  disabled={paymentProcessing}
                                >
                                  Pay
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="no-invoices">No invoices found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'reports':
        return (
          <div className="section-container">
            <h1 className="section-title">Reports and Analytics</h1>
            <div className="reports-container">
              <div className="report-card">
                <h3>Revenue Overview</h3>
                <div className="report-placeholder">Chart Placeholder</div>
                  </div>
              <div className="report-card">
                <h3>Sales by Product</h3>
                <div className="report-placeholder">Chart Placeholder</div>
                    </div>
              <div className="report-card">
                <h3>Customer Growth</h3>
                <div className="report-placeholder">Chart Placeholder</div>
                              </div>
                            </div>
                          </div>
        );
      case 'createTicket':
        return (
          <div className="section-container">
            <h1 className="section-title">Create Support Ticket</h1>
            <form className="ticket-form">
              <div className="form-group">
                <label>Title</label>
                <input type="text" placeholder="Ticket title" />
                        </div>
              <div className="form-group">
                <label>Category</label>
                <select>
                  <option value="">Select category</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing Issue</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other</option>
                </select>
                    </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe your issue in detail"></textarea>
                  </div>
              <div className="form-group">
                <label>Priority</label>
                <select>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                </div>
              <button type="button" className="submit-btn" onClick={() => console.log('Submit ticket clicked')}>
                Submit Ticket
              </button>
            </form>
              </div>
        );
      case 'users':
        return (
          <div className="section-container">
              <h1 className="section-title">User Management</h1>
              <button 
                className="create-btn" 
                onClick={() => {
                  resetForm();
                  setOpenDialog(true);
                }}
              >
                Create New User
              </button>
              
              <div className="team-members-grid">
              {users.length > 0 ? (
                users.map(user => (
                  <div key={user._id} className="team-member-card">
                    <div className="avatar-container">
                      <div className="avatar" style={{ backgroundImage: `url(${user.profile.avatar})` }}></div>
                    </div>
                    <h3 className="member-name">{user.profile.fullName}</h3>
                    <p className="member-role">{user.profile.department}</p>
                    <span className={`status-badge ${user.profile.status}`}>{user.profile.status}</span>
                    <div className="actions">
                      <button className="edit-btn" onClick={() => handleEditUser(user)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDeleteUser(user._id)}>Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No users found. Create your first user.</p>
              )}
              </div>
              </div>
        );
      case 'settings':
        return (
          <div className="section-container">
            <h1 className="section-title">Settings</h1>
            <div className="settings-container">
              <div className="settings-group">
                <h3>General Settings</h3>
                <div className="setting-item">
                  <label>Company Name</label>
                  <input type="text" value={enterpriseInfo.name} onChange={(e) => setEnterpriseInfo({...enterpriseInfo, name: e.target.value})} />
                </div>
                <div className="setting-item">
                  <label>Theme</label>
                  <select>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Language</label>
                  <select>
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                <button className="save-btn" onClick={() => console.log('Save settings clicked')}>
                  Save Settings
                </button>
              </div>
            </div>
            </div>
        );
      default:
        return <div>Select a tab from the sidebar</div>;
    }
  };

  // Handler for opening the product request form
  const handleRequestProduct = (product) => {
    setSelectedProductToRequest(product);
    setOpenProductRequestDialog(true);
  };

  // Handler for submitting the product request form
  const handleSubmitProductRequest = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare data for submission
      const requestData = {
        ...productRequestForm,
        productId: selectedProductToRequest.id,
        productName: selectedProductToRequest.name,
        enterpriseId: currentUser?.id,
        enterpriseName: currentUser?.profile?.companyName || enterpriseInfo.name,
        requestDate: new Date().toISOString()
      };
      
      // Submit request
      await axios.post(`${API_URL}/api/product-requests`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert(`Request for ${selectedProductToRequest.name} submitted successfully. Our team will contact you shortly.`, 'success');
      setOpenProductRequestDialog(false);
      resetProductRequestForm();
    } catch (error) {
      console.error('Failed to submit product request:', error);
      showAlert('Failed to submit request. Please try again later.', 'error');
    }
  };

  // Function to reset the product request form
  const resetProductRequestForm = () => {
    setProductRequestForm({
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      companyName: '',
      message: '',
      paymentMethod: 'bankTransfer',
      bankAccount: '',
      additionalInfo: ''
    });
    setSelectedProductToRequest(null);
  };

  // Handle logo file change
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoError("");
    
    // Check if file is selected
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    
    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo image must be less than 2MB");
      return;
    }
    
    // Check file type
    if (!file.type.match('image.*')) {
      setLogoError("Please select an image file");
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
    
    setLogoFile(file);
  };

  // Handler for saving company information
  const handleSaveCompanyInfo = async () => {
    try {
      if (logoError) {
        showAlert(logoError, 'error');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', enterpriseInfo.name);
      formData.append('industry', enterpriseInfo.industry);
      formData.append('business', enterpriseInfo.business);
      formData.append('website', enterpriseInfo.website);
      
      // Append logo file ONLY if a new one was selected
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      // Submit to API
      const response = await axios.put(
        `${API_URL}/api/enterprise/update-company`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Update state with response data
      setEnterpriseInfo(prevState => ({
        ...prevState,
        name: response.data.name || prevState.name,
        industry: response.data.industry || prevState.industry,
        business: response.data.business || prevState.business,
        website: response.data.website || prevState.website,
        logo: response.data.logo || prevState.logo
      }));
      
      // Clear logo file state
      setLogoFile(null);
      setLogoPreview(null);
      
      // Exit edit mode
      setProfileEditMode(prevState => ({
        ...prevState,
        company: false
      }));
      
      showAlert('Company information updated successfully!', 'success');
      
      // Re-fetch enterprise info to ensure persistence
      const updatedInfo = await fetchEnterpriseInfo();
      if (updatedInfo) {
        setEnterpriseInfo(updatedInfo);
      }

    } catch (error) {
      console.error('Failed to update company info:', error);
      showAlert(error.response?.data?.message || 'Failed to update company information', 'error');
    }
  };
  
  // Handler for saving contact information
  const handleSaveContactInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Prepare contact data for submission
      const contactData = {
        address: enterpriseInfo.address,
        mailingAddress: enterpriseInfo.mailingAddress,
        city: enterpriseInfo.city,
        country: enterpriseInfo.country,
        zipCode: enterpriseInfo.zipCode,
        phone: enterpriseInfo.phone,
        email: enterpriseInfo.email
      };
      
      // Submit to API
      const response = await axios.put(
        `${API_URL}/api/enterprise/update-contact`,
        contactData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update state with response data
      setEnterpriseInfo(prevState => ({
        ...prevState,
        ...response.data
      }));
      
      // Exit edit mode
      setProfileEditMode(prevState => ({
        ...prevState,
        contact: false
      }));
      
      showAlert('Contact information updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update contact info:', error);
      showAlert(error.response?.data?.message || 'Failed to update contact information', 'error');
    }
  };
  
  // Handler for saving user information and password
  const handleSaveUserInfo = async () => {
    try {
      // Validate password change if attempted
      if (userPassword.new || userPassword.confirm || userPassword.current) {
        // Check if current password is provided
        if (!userPassword.current) {
          showAlert('Current password is required to change password', 'error');
          return;
        }
        
        // Check if new password is provided
        if (!userPassword.new) {
          showAlert('New password is required', 'error');
          return;
        }
        
        // Check if passwords match
        if (userPassword.new !== userPassword.confirm) {
          showAlert('New passwords do not match', 'error');
          return;
        }
        
        // Check password length
        if (userPassword.new.length < 6) {
          showAlert('Password must be at least 6 characters long', 'error');
          return;
        }
      }
      
      const token = localStorage.getItem('token');
      
      // Prepare user data for submission
      const userData = {
        profile: {
          fullName: userProfile.fullName,
          department: userProfile.department
        }
      };
      
      // Add password data if changing password
      if (userPassword.new && userPassword.current) {
        userData.currentPassword = userPassword.current;
        userData.newPassword = userPassword.new;
      }
      
      // Submit to API
      const response = await axios.put(
        `${API_URL}/api/admin/update-profile`,
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update current user data
      if (response.data.user) {
        setCurrentUser(response.data.user);
      }
      
      // Reset password fields
      setUserPassword({
        current: '',
        new: '',
        confirm: ''
      });
      
      // Exit edit mode
      setProfileEditMode(prevState => ({
        ...prevState,
        user: false
      }));
      
      showAlert('User information updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update user info:', error);
      showAlert(error.response?.data?.message || 'Failed to update user information', 'error');
    }
  };

  // Add new function to handle viewing invoice details
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  };

  // Add new function to handle paying an invoice
  const handlePayInvoice = async (invoiceId) => {
    try {
      setPaymentProcessing(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.patch(
        `${apiUrl}/api/invoices/${invoiceId}/status`,
        { status: 'paid' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('Payment processed successfully', 'success');
      fetchInvoices(); // Refresh the invoice list
    } catch (error) {
      console.error('Failed to process payment:', error);
      showAlert('Failed to process payment. Please try again later.', 'error');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Add new function to close invoice detail view
  const closeInvoiceDetail = () => {
    setShowInvoiceDetail(false);
    setSelectedInvoice(null);
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get invoice status based on current date and due date
  const getInvoiceStatus = (invoice) => {
    if (invoice.status === 'paid') return 'paid';
    
    const dueDate = new Date(invoice.dueDate);
    const currentDate = new Date();
    const daysUntilDue = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return 'overdue';
    } else if (daysUntilDue <= 10) {
      return 'due';
    } else {
      return 'pending';
    }
  };

  // Get status color function
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'paid':
        return 'status-paid';
      case 'due':
        return 'status-due';
      case 'overdue':
        return 'status-overdue';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  // Handle delete quotation
  const handleDeleteQuotation = async (quotationId) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/quotations/${quotationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Quotation deleted successfully', 'success');
      fetchQuotations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting quotation:', error);
      showAlert(error.response?.data?.message || 'Failed to delete quotation', 'error');
    }
  };

  // Reset quotation form
  const resetQuotationForm = () => {
    setQuotationForm({
      _id: '',
      service: '',
      enterpriseName: '',
      contactNumber: '',
      email: '',
      description: '',
      budget: 0
    });
    setEditingQuotation(null);
  };

  // Handle create quotation
  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Authentication token not found', 'error');
        return;
      }

      // Validate required fields
      if (!quotationForm.service || !quotationForm.enterpriseName || !quotationForm.budget) {
        showAlert('Please fill in all required fields', 'error');
        return;
      }

      // Format the data according to the API requirements
      const quotationData = {
        serviceId: quotationForm.service,
        requestDetails: quotationForm.description,
        requestedPrice: Number(quotationForm.budget),
        enterpriseDetails: {
          companyName: quotationForm.enterpriseName,
          contactPerson: currentUser?.profile?.fullName || '',
          email: quotationForm.email,
          phone: quotationForm.contactNumber
        }
      };

      const response = await axios.post(
        `${API_URL}/api/services/${quotationForm.service}/quotation`,
        quotationData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data._id) {
        showAlert('Quotation submitted successfully!', 'success');
        setOpenQuotationDialog(false);
        resetQuotationForm();
        fetchQuotations(); // Refresh the list
      } else {
        throw new Error('No response data received');
      }
    } catch (error) {
      if (error.response) {
        showAlert(error.response.data.message || 'Failed to create quotation', 'error');
      } else if (error.request) {
        showAlert('No response from server. Please try again.', 'error');
      } else {
        showAlert('Failed to create quotation: ' + error.message, 'error');
      }
    }
  };

  const isValidObjectId = (id) => typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);

  // Handle edit quotation
  const handleEditQuotation = async (e) => {
    e.preventDefault();
    try {
      if (!quotationForm._id || !isValidObjectId(quotationForm._id)) {
        showAlert('Invalid quotation ID. Cannot update.', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/quotations/${quotationForm._id}`,
        {
          description: quotationForm.description,
          budget: quotationForm.budget
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('Quotation updated successfully', 'success');
      setOpenQuotationDialog(false);
      resetQuotationForm();
      fetchQuotations();
    } catch (error) {
      if (error.response) {
        showAlert(error.response.data.message || 'Failed to update quotation', 'error');
      } else if (error.request) {
        showAlert('No response from server. Please try again.', 'error');
      } else {
        showAlert('Failed to update quotation: ' + error.message, 'error');
      }
    }
  };

  // Add WebSocket event handlers
  useEffect(() => {
    // Connect to WebSocket when component mounts
    websocketService.connect();

    // Subscribe to invoice events
    const handleInvoiceCreated = (invoice) => {
      setInvoices(prevInvoices => [...prevInvoices, invoice]);
      showAlert('New invoice received', 'success');
    };

    const handleInvoiceUpdated = (invoice) => {
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => inv._id === invoice._id ? invoice : inv)
      );
      showAlert('Invoice updated', 'success');
    };

    const handleInvoiceDeleted = ({ id }) => {
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv._id !== id));
      showAlert('Invoice deleted', 'success');
    };

    const handleInvoiceStatusUpdated = (invoice) => {
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => inv._id === invoice._id ? invoice : inv)
      );
      showAlert('Invoice status updated', 'success');
    };

    // Subscribe to events
    websocketService.subscribe('invoice_created', handleInvoiceCreated);
    websocketService.subscribe('invoice_updated', handleInvoiceUpdated);
    websocketService.subscribe('invoice_deleted', handleInvoiceDeleted);
    websocketService.subscribe('invoice_status_updated', handleInvoiceStatusUpdated);

    // Cleanup on unmount
    return () => {
      websocketService.unsubscribe('invoice_created', handleInvoiceCreated);
      websocketService.unsubscribe('invoice_updated', handleInvoiceUpdated);
      websocketService.unsubscribe('invoice_deleted', handleInvoiceDeleted);
      websocketService.unsubscribe('invoice_status_updated', handleInvoiceStatusUpdated);
      websocketService.disconnect();
    };
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-frame">
        {/* Main Dashboard Area */}
        <div className="dashboard-container">
          {/* Top Header */}
          <div className="dashboard-header">
            <div className="brand-box">MOAQA</div>
            <div className="enterprise-name-box">{enterpriseInfo.name}</div>
            <div className="profile-container" ref={profileDropdownRef}>
              <div className="user-profile" onClick={toggleProfileDropdown}>
                <span className="user-icon">👤</span>
                        </div>
              {profileDropdownVisible && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-item" onClick={() => handleProfileMenuItemClick('company')}>Company</div>
                  <div className="profile-dropdown-item" onClick={() => handleProfileMenuItemClick('profile')}>Profile</div>
                  <div className="profile-dropdown-item" onClick={() => handleProfileMenuItemClick('help')}>Help</div>
                  <div className="profile-dropdown-item" onClick={() => handleProfileMenuItemClick('privacy')}>Privacy</div>
                  <div className="profile-dropdown-item" onClick={() => handleProfileMenuItemClick('settings')}>Setting</div>
                  <div className="profile-dropdown-item logout" onClick={() => handleProfileMenuItemClick('logout')}>LogOut</div>
                      </div>
          )}
                    </div>
                  </div>
                    
          {/* Top Navigation */}
          <div className="top-navigation">
            {userPermissions.crmAccess && (
              <button 
                className="nav-btn" 
                onClick={() => handleMainNavigation('CRM')}
                style={{["--btn-index"]: 0}}
              >
                <span className="btn-icon">👥</span> CRM
              </button>
            )}
            
            {userPermissions.hrmsAccess && (
              <button 
                className="nav-btn" 
                onClick={() => handleMainNavigation('HRMS')}
                style={{["--btn-index"]: 1}}
              >
                <span className="btn-icon">👨‍💼</span> HRMS
              </button>
            )}
            
            {userPermissions.jobPortalAccess && (
              <button 
                className="nav-btn" 
                onClick={() => handleMainNavigation('Job Portal')}
                style={{["--btn-index"]: 2}}
              >
                <span className="btn-icon">🔍</span> Job Portal
              </button>
            )}
            
            {userPermissions.jobBoardAccess && (
              <button 
                className="nav-btn" 
                onClick={() => handleMainNavigation('Job Board')}
                style={{["--btn-index"]: 3}}
              >
                <span className="btn-icon">📋</span> Job Board
              </button>
            )}
            
            {userPermissions.projectManagementAccess && (
              <button 
                className="nav-btn" 
                onClick={() => handleMainNavigation('Project Management')}
                style={{["--btn-index"]: 4}}
              >
                <span className="btn-icon">📊</span> Project Management
              </button>
            )}
                    </div>
                      
          {/* Main Content Area */}
          <div className="dashboard-content-container">
            {/* Left Sidebar Navigation */}
            <div className="sidebar-navigation">
              <button 
                className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavigate('dashboard')}
                style={{["--btn-index"]: 0}}
              >
                Dashboard
              </button>
              <button 
                className={`sidebar-btn ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => handleNavigate('products')}
                style={{["--btn-index"]: 1}}
              >
                Products
              </button>
              <button 
                className={`sidebar-btn ${activeTab === 'services' ? 'active' : ''}`}
                onClick={() => handleNavigate('services')}
                style={{["--btn-index"]: 2}}
              >
                Services
              </button>
              <button 
                className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleNavigate('profile')}
                style={{["--btn-index"]: 3}}
              >
                Profile
              </button>
              <button 
                className={`sidebar-btn ${activeTab === 'quotations' ? 'active' : ''}`}
                onClick={() => handleNavigate('quotations')}
                style={{["--btn-index"]: 4}}
              >
                Quotations
              </button>
              <button 
                className={`sidebar-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => handleNavigate('invoices')}
                style={{["--btn-index"]: 5}}
              >
                Invoices
              </button>
              <button 
                className={`sidebar-btn ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => handleNavigate('reports')}
                style={{["--btn-index"]: 6}}
              >
                Reports
              </button>
              <button 
                className={`sidebar-btn ${activeTab === 'createTicket' ? 'active' : ''}`}
                onClick={() => handleNavigate('createTicket')}
                style={{["--btn-index"]: 7}}
              >
                Create Ticket
              </button>
              <button 
                className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => handleNavigate('users')}
                style={{["--btn-index"]: 8}}
              >
                Add Users
              </button>
              <button 
                className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleNavigate('settings')}
                style={{["--btn-index"]: 9}}
              >
                Settings
              </button>
                    </div>
                    
            {/* Main Content */}
            <div className="main-content-area">
              {renderMainContent()}
                  </div>
                      
            {/* Right Notifications */}
            <div className="notifications-area">
              <div className="notifications-header">
              <h3>Notifications</h3>
                {notifications.length > 0 && (
                  <button 
                    className="mark-all-read-btn" 
                    onClick={markAllNotificationsAsRead}
                    title="Mark all as read"
                  >
                    <i className="fas fa-check-double"></i>
                  </button>
                )}
              </div>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {notification.title && <h4>{notification.title}</h4>}
                    <p>{notification.text}</p>
                      <span className="notification-time">{notification.time}</span>
                </div>
                  ))
                )}
              </div>
            </div>
        </div>
        </div>

        {/* Right Company Menu - Not needed anymore since we have dropdown */}
      </div>

      {/* Create/Edit User Dialog */}
      {openDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>{selectedUser ? 'Edit User' : 'Create New User'}</h2>
            <form className="user-form" onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Password {selectedUser ? '(Leave blank to keep current)' : '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className={formErrors.password ? 'error' : ''}
                />
                {formErrors.password && <span className="error-message">{formErrors.password}</span>}
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.profile.fullName}
                  onChange={e => setFormData({
                    ...formData,
                    profile: { ...formData.profile, fullName: e.target.value }
                  })}
                  className={formErrors.fullName ? 'error' : ''}
                />
                {formErrors.fullName && <span className="error-message">{formErrors.fullName}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.profile.phone}
                  onChange={e => setFormData({
                    ...formData,
                    profile: { ...formData.profile, phone: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={formData.profile.department}
                  onChange={e => setFormData({
                    ...formData,
                    profile: { ...formData.profile, department: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.profile.status}
                  onChange={e => setFormData({
                    ...formData,
                    profile: { ...formData.profile, status: e.target.value }
                  })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => {
                  setOpenDialog(false);
                  resetForm();
                }}>Cancel</button>
                <button type="submit">{selectedUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert message */}
      {alert.show && (
        <div className={`alert ${alert.type}`}>
          {alert.message}
          <button className="close-btn" onClick={() => setAlert({ ...alert, show: false })}>×</button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
