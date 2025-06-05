import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SuperAdminDashboard.css';
import '../Components/Loader.css';
import '../Components/Alert.css';
import './styles/FixedDialogs.css';
import SuperAdminSidebar from '../Components/Layout/SuperAdminSidebar';
import ThemeToggle from '../Components/UI/ThemeToggle';
import Modal from 'react-modal';
import websocketService from '../services/websocketService';

// Initialize Modal
Modal.setAppElement('#root');

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    department: '',
    status: 'active'
  });
  const [enterprise, setEnterprise] = useState({
    enterpriseId: '',
    companyName: '',
    logo: '',
    address: '',
    mailingAddress: '',
    city: '',
    country: '',
    zipCode: '',
    phoneNumber: '',
    companyEmail: '',
    loginLink: '',
    industry: '',
    businessType: ''
  });
  const [permissions, setPermissions] = useState({
    crmAccess: false
  });
  const [productAccess, setProductAccess] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    enterprises: 0
  });
  const [enterprises, setEnterprises] = useState([]);
  const [services, setServices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [crmOverview, setCrmOverview] = useState([]);
  const [newProduct, setNewProduct] = useState({ id: '', name: '', description: '', icon: '📋' });
  const [products, setProducts] = useState([
    { id: 'crm', name: 'CRM System', description: 'Customer Relationship Management', icon: '📊', category: 'crm' },
    { id: 'hrm', name: 'HR Management', description: 'Human Resource Management', icon: '👥', category: 'hrm' },
    { id: 'job-portal', name: 'Job Portal', description: 'Internal job management system', icon: '🧑‍💼', category: 'job-portal' },
    { id: 'job-board', name: 'Job Board', description: 'Public job listing platform', icon: '📋', category: 'job-board' },
    { id: 'project-management', name: 'Project Management', description: 'Manage projects and tasks', icon: '📝', category: 'project-management' }
  ]);
  const [loadingProduct, setLoadingProduct] = useState(null);
  const [openProductEditDialog, setOpenProductEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openEnterpriseListDialog, setOpenEnterpriseListDialog] = useState(false);
  const [enterprisesWithAccess, setEnterprisesWithAccess] = useState([]);
  const [showEnterpriseForm, setShowEnterpriseForm] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState(null);
  const [enterpriseFormData, setEnterpriseFormData] = useState({
    companyName: '',
    industry: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    enterpriseId: '',
    logo: '',
    address: '',
    mailingAddress: '',
    zipCode: '',
    loginLink: '',
    businessType: ''
  });
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessData, setAccessData] = useState({
    enterpriseId: '',
    product: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [quotationStats, setQuotationStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0
  });
  const [invoiceStats, setInvoiceStats] = useState({
    totalInvoices: 0,
    invoicesByStatus: { pending: 0, paid: 0, overdue: 0 },
    financials: { totalRevenue: 0, paidRevenue: 0, pendingRevenue: 0 }
  });
  const [invoices, setInvoices] = useState([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [openInvoiceForm, setOpenInvoiceForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    adminId: '',
    enterpriseDetails: {
      companyName: '',
      email: ''
    },
    items: [],
    totalAmount: 0,
    status: 'pending',
    issueDate: new Date(),
    dueDate: '',
    notes: '',
    billingPeriod: {
      start: '',
      end: ''
    }
  });

  // Add enterpriseForm state
  const [enterpriseForm, setEnterpriseForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    companyName: '',
    industry: '',
    size: '',
    location: ''
  });

  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  // Add state for services and quotations
  const [enterpriseServices, setEnterpriseServices] = useState([]);
  const [enterpriseQuotations, setEnterpriseQuotations] = useState([]);

  // Add at the top of the component, after useState imports
  const [openQuotationViewModal, setOpenQuotationViewModal] = useState(false);
  const [viewQuotation, setViewQuotation] = useState(null);
  const [openQuotationForm, setOpenQuotationForm] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationForm, setQuotationForm] = useState({
    status: 'pending',
    finalPrice: '',
    superadminNotes: '',
    proposedDeliveryDate: '',
    rejectionReason: ''
  });

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

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ show: true, message, type });
    
    if (window.alertTimeout) {
      clearTimeout(window.alertTimeout);
    }
    
    window.alertTimeout = setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (window.alertTimeout) {
        clearTimeout(window.alertTimeout);
      }
    };
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showAlert('No authentication token found. Please login again.', 'error');
      navigate('/superadmin/login');
      return false;
    }
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.get(`${apiUrl}/superadmin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      showAlert('Authentication failed. Please login again.', 'error');
      navigate('/superadmin/login');
      return false;
    }
  }, [navigate, showAlert]);

  const fetchEnterprises = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/superadmin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Fetched enterprises:', response.data);
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching enterprises:', error);
      showAlert('Failed to fetch enterprises: ' + (error.response?.data?.message || error.message), 'error');
      if (error.response?.status === 403) {
        navigate('/superadmin/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showAlert]);

  const fetchCrmOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/superadmin/crm/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Fetched CRM overview:', response.data);
      setCrmOverview(response.data);
    } catch (error) {
      console.error('Error fetching CRM overview:', error);
      showAlert('Failed to fetch CRM overview: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('No authentication token found. Please login again.', 'error');
        navigate('/superadmin/login');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('Fetching products from:', `${apiUrl}/superadmin/products`);
      
      try {
        const response = await axios.get(
          `${apiUrl}/superadmin/products`,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Products API response:', response.data);

        if (response.data && response.data.length > 0) {
          // Map response data to our format
          const mappedProducts = response.data.map(product => ({
            id: product.productId,
            name: product.name,
            description: product.description,
            icon: product.icon || '📋',
            category: product.category,
            _id: product._id,
            accessLink: product.accessLink,
            accessUrl: product.accessUrl || `${apiUrl}/products/access/${product.accessLink}`,
            features: product.features || [],
            pricing: product.pricing || { isFree: true },
            active: product.active !== undefined ? product.active : true,
            displayInMenu: product.displayInMenu !== undefined ? product.displayInMenu : true,
            totalEnterprises: product.usage?.totalEnterprises || 0,
            activeEnterprises: product.usage?.activeEnterprises || 0
          }));
          
          console.log('Mapped products:', mappedProducts);
          setProducts(mappedProducts);
        } else {
          // If no products found, create default products
          console.log('No products found, creating default products...');
          await createDefaultProducts();
        }
      } catch (error) {
        console.error('Products API error:', error.response || error);
        console.log('Error details:', error.response?.data || error.message);
        // If the API endpoint isn't implemented yet, we'll create default products
        console.log('Creating default products due to API error...');
        await createDefaultProducts();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showAlert('Failed to fetch products: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showAlert]);

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('No authentication token found. Please login again.', 'error');
        navigate('/superadmin/login');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('Fetching services from:', `${apiUrl}/services/superadmin`);
      
      const response = await axios.get(
        `${apiUrl}/services/superadmin`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Services API response:', response.data);

      if (response.data && response.data.length > 0) {
        setServices(response.data);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Services API error:', error);
      showAlert('Failed to fetch services: ' + (error.response?.data?.message || error.message), 'error');
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showAlert]);

  // Function to create default products
  const createDefaultProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('Creating default products at:', `${apiUrl}/superadmin/products`);
      
      const defaultProducts = [
        { productId: 'crm', name: 'CRM System', description: 'Customer Relationship Management', icon: '📊', category: 'crm' },
        { productId: 'hrm', name: 'HR Management', description: 'Human Resource Management', icon: '👥', category: 'hrm' },
        { productId: 'job-portal', name: 'Job Portal', description: 'Internal job management system', icon: '🧑‍💼', category: 'job-portal' },
        { productId: 'job-board', name: 'Job Board', description: 'Public job listing platform', icon: '📋', category: 'job-board' },
        { productId: 'project-management', name: 'Project Management', description: 'Manage projects and tasks', icon: '📝', category: 'project-management' }
      ];
      
      // Create each default product
      let successCount = 0;
      for (const product of defaultProducts) {
        try {
          console.log(`Attempting to create product: ${product.name}`);
      const response = await axios.post(
            `${apiUrl}/superadmin/products`,
            product,
            { 
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              } 
            }
          );
          console.log(`Created default product: ${product.name}`, response.data);
          successCount++;
        } catch (error) {
          if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
            console.log(`Product ${product.name} already exists`);
          } else {
            console.error(`Error creating product ${product.name}:`, error.response?.data || error.message);
          }
        }
      }
      
      console.log(`Successfully created ${successCount} products. Fetching updated product list...`);
      
      // Fetch products again to get the created ones
      const response = await axios.get(
        `${apiUrl}/superadmin/products`,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('Products after creation:', response.data);
      
      if (response.data && response.data.length > 0) {
        const mappedProducts = response.data.map(product => ({
          id: product.productId,
          name: product.name,
          description: product.description,
          icon: product.icon || '📋',
          category: product.category,
          _id: product._id,
          accessLink: product.accessLink,
          accessUrl: product.accessUrl || `${apiUrl}/products/access/${product.accessLink}`,
          features: product.features || [],
          pricing: product.pricing || { isFree: true },
          active: product.active !== undefined ? product.active : true,
          displayInMenu: product.displayInMenu !== undefined ? product.displayInMenu : true,
          totalEnterprises: product.usage?.totalEnterprises || 0,
          activeEnterprises: product.usage?.activeEnterprises || 0
        }));
        console.log('Mapped products after creation:', mappedProducts);
        setProducts(mappedProducts);
      } else {
        console.log('No products returned after creation');
        // Set default products in state as a fallback
        setProducts(defaultProducts.map(p => ({
          ...p,
          id: p.productId,
          accessUrl: `${apiUrl}/products/access/default-${p.productId}`,
          active: true,
          displayInMenu: true
        })));
      }
    } catch (error) {
      console.error('Error in createDefaultProducts:', error);
      showAlert('Failed to create default products. Please check console for details.', 'error');
    }
  };

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

  // Add fetchNotifications function
  const fetchNotifications = useCallback(async () => {
    try {
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
    }
  }, []);

  // Add a new useEffect for initializing the dashboard and fetching notifications
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
          await Promise.all([
            fetchEnterprises(),
            fetchCrmOverview(),
            fetchProducts(),
            fetchServices(),
            fetchNotifications()
          ]);
        }
      } catch (error) {
        console.error("Dashboard initialization error:", error);
        showAlert("Failed to load dashboard data", "error");
    } finally {
      setIsLoading(false);
    }
  };

    initializeDashboard();
  }, [checkAuth, fetchEnterprises, fetchCrmOverview, fetchProducts, fetchServices, fetchNotifications]);

  const handleCreateEnterprise = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!enterpriseForm.email || !enterpriseForm.password || !enterpriseForm.companyName) {
      showAlert('Please fill in all required fields', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Authentication token missing', 'error');
        return;
      }

      // Prepare the data according to backend expectations
      const enterpriseData = {
        email: enterpriseForm.email,
        password: enterpriseForm.password,
        profile: {
          fullName: enterpriseForm.fullName || '',
          phone: enterpriseForm.phone || '',
          status: 'active'
        },
        permissions: {
          crmAccess: true // Default to true for new enterprises
        },
        enterprise: {
          companyName: enterpriseForm.companyName,
          industry: enterpriseForm.industry || '',
          size: enterpriseForm.size || '',
          location: enterpriseForm.location || ''
        }
      };

      console.log('Creating enterprise with data:', enterpriseData);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/superadmin/create-admin`,
        enterpriseData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        showAlert('Enterprise created successfully', 'success');
        setEnterpriseForm({
          email: '',
          password: '',
          fullName: '',
          phone: '',
          companyName: '',
          industry: '',
          size: '',
          location: ''
        });
        setShowEnterpriseModal(false);
        fetchEnterprises(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating enterprise:', error);
      let errorMessage = 'Failed to create enterprise';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server';
      }
      
      showAlert(errorMessage, 'error');
    }
  };

  const handleToggleProductAccess = async (adminId, productId, grantAccess = true) => {
    try {
      // Set loading state for this specific product
      setLoadingProduct({ id: productId, action: grantAccess ? 'grant' : 'revoke' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('No authentication token found. Please login again.', 'error');
        navigate('/superadmin/login');
        return;
      }
      
      // Get product name for user-friendly messages
      const productNames = {
        'crm': 'CRM System',
        'hrm': 'HR Management',
        'job-portal': 'Job Portal',
        'job-board': 'Job Board',
        'project-management': 'Project Management'
      };
      const productName = productNames[productId] || productId;
      
      const actionText = grantAccess ? 'granted' : 'revoked';
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const endpoint = `/superadmin/admins/${adminId}/products/${productId}/${grantAccess ? 'grant' : 'revoke'}`;
      
      const response = await axios.post(
        `${apiUrl}${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert(`Access to ${productName} has been ${actionText} successfully`, 'success');
      
      // Update the local state with the updated admin data
      setAdmins(prevAdmins => prevAdmins.map(admin => 
        admin._id === adminId ? { ...admin, productAccess: response.data.admin.productAccess } : admin
      ));
      
      // Update permissions based on product
      if (productId === 'crm') {
        setAdmins(prevAdmins => prevAdmins.map(admin => 
          admin._id === adminId ? { 
            ...admin, 
            permissions: { 
              ...admin.permissions, 
              crmAccess: grantAccess 
            } 
          } : admin
        ));
      } else if (productId === 'hrm') {
        setAdmins(prevAdmins => prevAdmins.map(admin => 
          admin._id === adminId ? { 
            ...admin, 
            permissions: { 
              ...admin.permissions, 
              hrmAccess: grantAccess 
            } 
          } : admin
        ));
      } else if (productId === 'job-portal') {
        setAdmins(prevAdmins => prevAdmins.map(admin => 
          admin._id === adminId ? { 
            ...admin, 
            permissions: { 
              ...admin.permissions, 
              jobPortalAccess: grantAccess 
            } 
          } : admin
        ));
      } else if (productId === 'job-board') {
        setAdmins(prevAdmins => prevAdmins.map(admin => 
          admin._id === adminId ? { 
            ...admin, 
            permissions: { 
              ...admin.permissions, 
              jobBoardAccess: grantAccess 
            } 
          } : admin
        ));
      } else if (productId === 'project-management') {
        setAdmins(prevAdmins => prevAdmins.map(admin => 
          admin._id === adminId ? { 
            ...admin, 
            permissions: { 
              ...admin.permissions, 
              projectManagementAccess: grantAccess 
            } 
          } : admin
        ));
      }
      
      // Display access URL if the action was to grant access
        if (grantAccess) {
          const accessUrl = response.data.admin.productAccess.find(p => p.productId === productId)?.accessUrl;
          if (accessUrl) {
          showAlert(`Access URL: ${accessUrl}`, 'info');
          }
      }
    } catch (error) {
      console.error('Product access error:', error);
      showAlert(
        `Failed to ${grantAccess ? 'grant' : 'revoke'} access to product: ${error.response?.data?.message || error.message}`,
        'error'
      );
    } finally {
      setLoadingProduct(null);
    }
  };

  const handleToggleCrmAccess = async (adminId, currentAccess) => {
    await handleToggleProductAccess(adminId, 'crm', currentAccess);
  };

  // Enhanced hasProductAccess function to check all product types
  const hasProductAccess = (admin, productId) => {
    if (productId === 'crm') {
      return admin.permissions?.crmAccess || false;
    } else if (productId === 'hrm') {
      return admin.permissions?.hrmAccess || false;
    } else if (productId === 'job-portal') {
      return admin.permissions?.jobPortalAccess || false;
    } else if (productId === 'job-board') {
      return admin.permissions?.jobBoardAccess || false;
    } else if (productId === 'project-management') {
      return admin.permissions?.projectManagementAccess || false;
    }
    
    return admin.productAccess?.some(p => p.productId === productId && p.hasAccess) || false;
  };

  // eslint-disable-next-line no-unused-vars
  const getProductAccessLink = (admin, productId) => {
    const productAccess = admin.productAccess?.find(p => p.productId === productId);
    
    if (!productAccess || !productAccess.accessLink) {
      return '';
    }
    
    const accessLink = productAccess.accessLink;
    
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
    
    if (isProduction) {
      return `https://${accessLink}.${baseUrl.replace(/^https?:\/\//, '')}`;
    } else {
      return `${baseUrl}/products/access/${accessLink}`;
    }
  };

  const handleRegenerateAccessLink = async (adminId, productId) => {
    try {
      // Set loading state
      setLoadingProduct({ id: productId });
      
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('You must be logged in to perform this action', 'error');
        setLoadingProduct(null);
        return;
      }
      
      // Get product name for user-friendly messages
      const productNames = {
        'crm': 'CRM System',
        'ticketing': 'Ticketing System',
        'inventory': 'Inventory Management'
      };
      const productName = productNames[productId] || productId;
      
      // Confirm regeneration
      if (!window.confirm(`Are you sure you want to regenerate the access link for ${productName}? The old link will no longer work.`)) {
        setLoadingProduct(null);
        return;
      }
      
      // Make API request
      const response = await axios.put(
        `/api/superadmin/admins/${adminId}/products/${productId}/regenerate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Handle success
      if (response.data && response.data.admin) {
        // Update selected admin
        setSelectedAdmin(response.data.admin);
        
        // Update admin in the list
        setAdmins(prevAdmins => 
          prevAdmins.map(admin => 
            admin._id === adminId ? response.data.admin : admin
          )
        );
        
        // Show success message
        showAlert(`Access link for ${productName} regenerated successfully`, 'success');
        
        // Copy new link to clipboard
        const newUrl = response.data.admin.productAccess.find(p => p.productId === productId)?.accessUrl;
        if (newUrl) {
          navigator.clipboard.writeText(newUrl)
            .then(() => showAlert('New access URL copied to clipboard', 'info'))
            .catch(() => {});
        }
      } else {
        showAlert('Failed to regenerate access link', 'error');
      }
    } catch (error) {
      console.error('Error regenerating access link:', error);
      showAlert(error.response?.data?.message || 'Failed to regenerate access link', 'error');
    } finally {
      setLoadingProduct(null);
    }
  };

  const renderEnterpriseAccess = () => {
    if (!selectedAdmin) return null;

    // Define available products
    const products = [
      { id: 'crm', name: 'CRM System', icon: 'fa-users' },
      { id: 'ticketing', name: 'Ticketing System', icon: 'fa-ticket-alt' },
      { id: 'inventory', name: 'Inventory Management', icon: 'fa-boxes' }
    ];

    // Helper functions
    const hasProductAccess = (productId) => {
      if (!selectedAdmin.productAccess) return false;
      const product = selectedAdmin.productAccess.find(p => p.productId === productId);
      return product && product.hasAccess;
    };

    const getAccessUrl = (productId) => {
      if (!selectedAdmin.productAccess) return '';
      const product = selectedAdmin.productAccess.find(p => p.productId === productId);
      return product && product.hasAccess ? product.accessUrl || '' : '';
    };

    const getStatusClass = (productId) => {
      const hasAccess = hasProductAccess(productId);
      return hasAccess ? 'status-active' : 'status-inactive';
    };

    const handleCopyUrl = (url) => {
      navigator.clipboard.writeText(url)
        .then(() => showAlert('Access URL copied to clipboard', 'info'))
        .catch(() => showAlert('Failed to copy URL', 'error'));
    };

    const isProductLoading = (productId) => {
      return loadingProduct && loadingProduct.id === productId;
    };

    return (
      <div className="enterprise-access-container">
        <h3 className="section-title">Product Access Management</h3>
        
        {products.map(product => (
          <div key={product.id} className="product-access-card">
            <div className="product-access-header">
              <div className="product-icon">
                <i className={`fas ${product.icon}`}></i>
              </div>
              <div className="product-details">
                <h4>{product.name}</h4>
                <div className={`access-status ${getStatusClass(product.id)}`}>
                  {hasProductAccess(product.id) ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            
            <div className="product-access-actions">
              {hasProductAccess(product.id) ? (
                <>
                  {getAccessUrl(product.id) && (
                    <div className="access-url-container">
                      <div className="access-url">
                        {getAccessUrl(product.id)}
                      </div>
                      <button 
                        className="btn btn-icon"
                        onClick={() => handleCopyUrl(getAccessUrl(product.id))}
                        title="Copy URL"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  )}
                  
                  <div className="action-buttons">
                    <button
                      className="btn btn-warning"
                      onClick={() => handleToggleProductAccess(selectedAdmin._id, product.id, false)}
                      disabled={isProductLoading(product.id)}
                    >
                      {isProductLoading(product.id) ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <>Revoke Access</>
                      )}
                    </button>
                    
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleRegenerateAccessLink(selectedAdmin._id, product.id)}
                      disabled={isProductLoading(product.id)}
                    >
                      {isProductLoading(product.id) ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <>Regenerate Link</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => handleToggleProductAccess(selectedAdmin._id, product.id, true)}
                  disabled={isProductLoading(product.id)}
                >
                  {isProductLoading(product.id) ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <>Grant Access</>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleDeleteEnterprise = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this enterprise?')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('No authentication token found. Please login again.', 'error');
        navigate('/superadmin/login');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.delete(`${apiUrl}/superadmin/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state by removing the deleted admin
      setAdmins(prevAdmins => prevAdmins.filter(admin => admin._id !== adminId));
      showAlert('Enterprise deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting enterprise:', error);
      showAlert(error.response?.data?.message || 'Failed to delete enterprise', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setProfile({
      fullName: '',
      phone: '',
      department: '',
      status: 'active'
    });
    setEnterprise({
      enterpriseId: '',
      companyName: '',
      logo: '',
      address: '',
      mailingAddress: '',
      city: '',
      country: '',
      zipCode: '',
      phoneNumber: '',
      companyEmail: '',
      loginLink: '',
      industry: '',
      businessType: ''
    });
    setPermissions({
      crmAccess: false
    });
    setProductAccess([]);
    setSelectedAdmin(null);
  };

  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setEditingEnterprise(admin);
    setEmail(admin.email);
    setProfile(admin.profile || {});
    setEnterprise(admin.enterprise || {
      enterpriseId: '',
      companyName: '',
      logo: '',
      address: '',
      mailingAddress: '',
      city: '',
      country: '',
      zipCode: '',
      phoneNumber: '',
      companyEmail: '',
      loginLink: '',
      industry: '',
      businessType: ''
    });
    setPermissions(admin.permissions || { crmAccess: false });
    setProductAccess(admin.productAccess || []);
    setOpenDialog(true);
  };

  const resetProductForm = () => {
    setNewProduct({ id: '', name: '', description: '', icon: '📋' });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (products.some(product => product.id === newProduct.id)) {
      showAlert('A product with this ID already exists', 'error');
      return;
    }
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      try {
        const response = await axios.post(
          `${apiUrl}/api/products`,
          {
            productId: newProduct.id,
            name: newProduct.name,
            description: newProduct.description,
            icon: newProduct.icon
          },
          {
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            }
          }
        );
        
        const { product, accessUrl } = response.data;
        
        const newProductWithAccess = {
          ...newProduct,
          _id: product._id,
          accessLink: product.accessLink,
          accessUrl: accessUrl
        };
        
        setProducts(prevProducts => [...prevProducts, newProductWithAccess]);
        
        showAlert(`Product "${newProduct.name}" added successfully. Access link created.`, 'success');
        setOpenProductDialog(false);
        resetProductForm();
      } catch (error) {
        // If API endpoint doesn't exist yet, add product to local state only
        if (error.response?.status === 404) {
          console.log('Products API not found - adding product to local state only');
          const mockId = Date.now().toString();
          const mockProduct = {
            ...newProduct,
            _id: mockId,
            accessLink: `${newProduct.id}-${mockId.substring(0, 6)}`,
            accessUrl: `${window.location.origin}/products/access/${newProduct.id}-${mockId.substring(0, 6)}`
          };
          
          setProducts(prevProducts => [...prevProducts, mockProduct]);
          showAlert(`Product "${newProduct.name}" added to local state.`, 'success');
          setOpenProductDialog(false);
          resetProductForm();
        } else {
          throw error; // Rethrow if not a 404 error
        }
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showAlert(`Failed to create product: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSidebarNavigation = (itemId) => {
    setActiveTab(itemId);
  };

  const renderForm = (handleSubmit, title, submitButtonText) => {
    return (
      <>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit} className="enterprise-form">
          <div className="form-section">
            <h3>Administrator Account</h3>
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input 
                type="email" 
                className="form-control"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password {selectedAdmin ? '(Leave blank to keep current)' : ''} <span className="required">*</span></label>
              <input 
                type="password" 
                className="form-control"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required={!selectedAdmin} 
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.fullName} 
                onChange={(e) => setProfile({...profile, fullName: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.phone} 
                onChange={(e) => setProfile({...profile, phone: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input 
                type="text" 
                className="form-control"
                value={profile.department} 
                onChange={(e) => setProfile({...profile, department: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Join Date</label>
              <input 
                type="date" 
                className="form-control"
                value={profile.joinDate} 
                onChange={(e) => setProfile({...profile, joinDate: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Enterprise Details</h3>
            <div className="form-group">
              <label>Enterprise ID <span className="required">*</span></label>
              <input 
                type="text" 
                className="form-control"
                value={enterprise.enterpriseId} 
                onChange={(e) => setEnterprise({...enterprise, enterpriseId: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Company Name <span className="required">*</span></label>
              <input 
                type="text" 
                className="form-control"
                value={enterprise.companyName} 
                onChange={(e) => setEnterprise({...enterprise, companyName: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Logo URL</label>
              <input 
                type="text" 
                className="form-control"
                value={enterprise.logo} 
                onChange={(e) => setEnterprise({...enterprise, logo: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Address Information</h3>
            <div className="form-group">
              <label>Address</label>
              <input 
                type="text" 
                className="form-control"
                value={enterprise.address} 
                onChange={(e) => setEnterprise({...enterprise, address: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Mailing Address</label>
              <input 
                type="text" 
                className="form-control"
                value={enterprise.mailingAddress} 
                onChange={(e) => setEnterprise({...enterprise, mailingAddress: e.target.value})} 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={enterprise.city} 
                  onChange={(e) => setEnterprise({...enterprise, city: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={enterprise.country} 
                  onChange={(e) => setEnterprise({...enterprise, country: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Zip Code</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={enterprise.zipCode} 
                  onChange={(e) => setEnterprise({...enterprise, zipCode: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact & Business Information</h3>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                className="form-control"
                value={enterprise.phoneNumber} 
                onChange={(e) => setEnterprise({...enterprise, phoneNumber: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Company Email</label>
              <input 
                type="email" 
                className="form-control"
                value={enterprise.companyEmail} 
                onChange={(e) => setEnterprise({...enterprise, companyEmail: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Login Link</label>
              <input 
                type="text" 
                className="form-control"
                value={enterprise.loginLink || `${window.location.origin}/admin/login`} 
                onChange={(e) => setEnterprise({...enterprise, loginLink: e.target.value})} 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Industry</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={enterprise.industry} 
                  onChange={(e) => setEnterprise({...enterprise, industry: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Business Type</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={enterprise.businessType} 
                  onChange={(e) => setEnterprise({...enterprise, businessType: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Product Access</h3>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={permissions.crmAccess} 
                  onChange={(e) => setPermissions({...permissions, crmAccess: e.target.checked})} 
                />
                Grant CRM Access
              </label>
            </div>
            {products.filter(p => p.id !== 'crm').map(product => (
              <div className="form-group checkbox-group" key={product.id}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={productAccess?.some(p => p.productId === product.id) || false} 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProductAccess([...productAccess, { productId: product.id, grantedAt: new Date() }]);
                      } else {
                        setProductAccess(productAccess.filter(p => p.productId !== product.id));
                      }
                    }} 
                  />
                  Grant {product.name} Access
                </label>
              </div>
            ))}
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-outline" onClick={() => {
              setOpenDialog(false);
              setOpenEditDialog(false);
              resetForm();
            }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">{submitButtonText}</button>
          </div>
        </form>
      </>
    );
  };

  const renderProductForm = () => {
    return (
      <div className="product-form-container">
        <h2>Add New Product</h2>
        <form onSubmit={handleAddProduct} className="product-form">
          <div className="form-group">
            <label>Product ID</label>
            <input 
              type="text" 
              className="form-control"
              value={newProduct.id} 
              onChange={(e) => setNewProduct({...newProduct, id: e.target.value})} 
              required 
              placeholder="Enter a unique identifier (e.g., billing-system)"
            />
          </div>
          <div className="form-group">
            <label>Product Name</label>
            <input 
              type="text" 
              className="form-control"
              value={newProduct.name} 
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
              required 
              placeholder="Enter product name"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              className="form-control"
              value={newProduct.description} 
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} 
              required 
              placeholder="Describe what this product or service does"
            />
          </div>
          <div className="form-group">
            <label>Icon (Emoji)</label>
            <div className="icon-selector">
              <input 
                type="text" 
                className="form-control"
                value={newProduct.icon} 
                onChange={(e) => setNewProduct({...newProduct, icon: e.target.value})} 
                required 
                placeholder="Enter an emoji (e.g., 📊, 📈, 💰)"
              />
              <div className="icon-preview">{newProduct.icon}</div>
            </div>
            <div className="icon-suggestions">
              <span onClick={() => setNewProduct({...newProduct, icon: '📊'})}>📊</span>
              <span onClick={() => setNewProduct({...newProduct, icon: '📈'})}>📈</span>
              <span onClick={() => setNewProduct({...newProduct, icon: '📉'})}>📉</span>
              <span onClick={() => setNewProduct({...newProduct, icon: '💰'})}>💰</span>
              <span onClick={() => setNewProduct({...newProduct, icon: '📱'})}>📱</span>
              <span onClick={() => setNewProduct({...newProduct, icon: '💻'})}>💻</span>
              <span onClick={() => setNewProduct({...newProduct, icon: '🔔'})}>🔔</span>
              <span onClick={() => setNewProduct({...newProduct, icon: '📝'})}>📝</span>
            </div>
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn btn-outline" onClick={() => {
              setOpenProductDialog(false);
              resetProductForm();
            }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">Add Product</button>
          </div>
        </form>
      </div>
    );
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setNewProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      icon: product.icon
    });
    setOpenProductEditDialog(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // In a real implementation, this would update the product via API
      const updatedProducts = products.map(p => 
        p.id === selectedProduct.id 
          ? {...p, name: newProduct.name, description: newProduct.description, icon: newProduct.icon} 
          : p
      );
      
      setProducts(updatedProducts);
      showAlert(`Product "${newProduct.name}" updated successfully`, 'success');
      setOpenProductEditDialog(false);
      resetProductForm();
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      showAlert(`Failed to update product: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewEnterprises = (product) => {
    // Filter admins who have access to this product
    const filteredAdmins = admins.filter(admin => {
      if (product.id === 'crm') {
        return admin.permissions?.crmAccess === true;
      } else {
        return admin.productAccess?.some(p => p.productId === product.id && p.hasAccess);
      }
    });
    
    setEnterprisesWithAccess(filteredAdmins);
    setSelectedProduct(product);
    setOpenEnterpriseListDialog(true);
  };

  // Add this useEffect for handling keyboard events
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        if (openDialog) setOpenDialog(false);
        if (openEditDialog) setOpenEditDialog(false);
        if (openProductDialog) setOpenProductDialog(false);
        if (openProductEditDialog) setOpenProductEditDialog(false);
        if (openEnterpriseListDialog) setOpenEnterpriseListDialog(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [openDialog, openEditDialog, openProductDialog, openProductEditDialog, openEnterpriseListDialog]);

  // Add this function to handle outside clicks for all modals
  const handleOutsideClick = (e) => {
    if (e.target.className === 'modal') {
      if (openDialog) setOpenDialog(false);
      if (openEditDialog) setOpenEditDialog(false);
      if (openProductDialog) setOpenProductDialog(false);
      if (openProductEditDialog) setOpenProductEditDialog(false);
      if (openEnterpriseListDialog) setOpenEnterpriseListDialog(false);
    }
  };

  const resetEnterpriseForm = () => {
    setEnterpriseFormData({
      companyName: '',
      industry: '',
      city: '',
      country: '',
      email: '',
      phone: '',
      enterpriseId: '',
      logo: '',
      address: '',
      mailingAddress: '',
      zipCode: '',
      loginLink: '',
      businessType: ''
    });
  };

  const handleManageAccess = () => {
    // Implementation of handleManageAccess function
  };

  // Add this new function after handleRegenerateAccessLink or another handler function
  
  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        await axios.delete(`${apiUrl}/superadmin/services/${serviceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local state by removing the deleted service
        setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
        
        showAlert('Service deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting service:', error);
        showAlert(error.response?.data?.message || 'Failed to delete service', 'error');
      } finally {
        setIsLoading(false);
      }
    }
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

  // Handle update enterprise
  const handleUpdateEnterprise = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Authentication token not found. Please log in again.', 'error');
        navigate('/login');
        return;
      }
      
      let enterpriseId = selectedAdmin?._id || editingEnterprise?._id;
      if (!enterpriseId) {
        showAlert('Invalid enterprise selection', 'error');
        return;
      }
      
      // Create a properly structured update object
      const updateData = {
        email: email,
        profile: profile,
        enterprise: enterprise
      };
      
      // Only include password if it was provided
      if (password) {
        updateData.password = password;
      }
      
      console.log('Updating enterprise with data:', updateData);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await axios.put(
        `${apiUrl}/api/enterprise/update/${enterpriseId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Enterprise updated:', response.data);
      
      if (response.data.admin) {
        // Update the admins list
        setAdmins(admins.map(admin => 
          admin._id === enterpriseId ? response.data.admin : admin
        ));
        
        // Close dialog and reset form
        setOpenDialog(false);
        setSelectedAdmin(null);
        setShowEnterpriseForm(false);
        setEditingEnterprise(null);
        resetForm();
        resetEnterpriseForm();
        
        showAlert('Enterprise updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating enterprise:', error);
      let errorMessage = 'Failed to update enterprise';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch quotations for superadmin (update to use /api/quotations and same logic as SuperAdminServicesPage)
  const fetchQuotations = useCallback(async () => {
    setIsLoadingQuotations(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('No authentication token found. Please login again.', 'error');
        navigate('/superadmin/login');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      // Use the same route as SuperAdminServicesPage.js
      const response = await axios.get(`${apiUrl}/services/superadmin/quotations`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Quotations API response:', response.data);

      if (response.data && Array.isArray(response.data)) {
        setQuotations(response.data);
        // Calculate stats
        const stats = { pending: 0, approved: 0, rejected: 0, completed: 0 };
        response.data.forEach(q => {
          if (q.status && stats[q.status] !== undefined) stats[q.status]++;
        });
        setQuotationStats(stats);
      } else {
        console.warn('Invalid quotations data format:', response.data);
        setQuotations([]);
        setQuotationStats({ pending: 0, approved: 0, rejected: 0, completed: 0 });
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      showAlert('Failed to fetch quotations: ' + (error.response?.data?.message || error.message), 'error');
      setQuotations([]);
      setQuotationStats({ pending: 0, approved: 0, rejected: 0, completed: 0 });
    } finally {
      setIsLoadingQuotations(false);
    }
  }, [navigate, showAlert]);

  // Move quotation handlers here so they're defined before JSX uses them
  const handleViewQuotation = (quotation) => {
    // You can implement a view modal here if needed
    console.log('Viewing quotation:', quotation);
  };

  const handleEditQuotation = (quotation) => {
    // You can implement an edit modal here if needed
    console.log('Editing quotation:', quotation);
  };

  const handleDeleteQuotation = async (quotationId) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('No authentication token found. Please login again.', 'error');
        navigate('/superadmin/login');
        return;
      }
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.delete(`${apiUrl}/api/quotations/${quotationId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setQuotations(prevQuotations => prevQuotations.filter(q => q._id !== quotationId));
      showAlert('Quotation deleted successfully', 'success');
      fetchQuotations();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      showAlert('Failed to delete quotation: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  // 3. Fetch quotations when tab is active
  useEffect(() => {
    if (activeTab === 'quotations') {
      fetchQuotations();
    }
  }, [activeTab, fetchQuotations]);

  const fetchInvoices = useCallback(async () => {
    setIsLoadingInvoices(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Always use response.data if it exists, otherwise use response
      const data = response.data ? response.data : response;
      if (Array.isArray(data)) {
        setInvoices(data);
        // Calculate stats
        const stats = { totalInvoices: 0, invoicesByStatus: { pending: 0, paid: 0, overdue: 0 }, financials: { totalRevenue: 0, paidRevenue: 0, pendingRevenue: 0 } };
        data.forEach(invoice => {
          stats.totalInvoices++;
          if (invoice.status === 'pending') stats.invoicesByStatus.pending++;
          if (invoice.status === 'paid') stats.invoicesByStatus.paid++;
          if (invoice.status === 'overdue') stats.invoicesByStatus.overdue++;
          stats.financials.totalRevenue += invoice.totalAmount;
          if (invoice.status === 'paid') stats.financials.paidRevenue += invoice.totalAmount;
          if (invoice.status !== 'paid') stats.financials.pendingRevenue += invoice.totalAmount;
        });
        setInvoiceStats(stats);
      } else {
        setInvoices([]);
        setInvoiceStats({ totalInvoices: 0, invoicesByStatus: { pending: 0, paid: 0, overdue: 0 }, financials: { totalRevenue: 0, paidRevenue: 0, pendingRevenue: 0 } });
      }
    } catch (err) {
      setInvoices([]);
      setInvoiceStats({ totalInvoices: 0, invoicesByStatus: { pending: 0, paid: 0, overdue: 0 }, financials: { totalRevenue: 0, paidRevenue: 0, pendingRevenue: 0 } });
    } finally {
      setIsLoadingInvoices(false);
    }
  }, []);

  // 3. Fetch invoices when tab is active
  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices();
    }
  }, [activeTab, fetchInvoices]);

  // Handle viewing an invoice
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    // You can implement a view modal here if needed
  };

  // Handle editing an invoice
  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    
    // Format the date for the form
    const formattedDueDate = new Date(invoice.dueDate).toISOString().split('T')[0];
    
    // Set the form data
    setInvoiceForm({
      adminId: invoice.adminId._id || invoice.adminId,
      enterpriseDetails: invoice.enterpriseDetails || {
        companyName: '',
        email: ''
      },
      items: invoice.items || [{
        type: 'service',
        itemId: '',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }],
      amount: invoice.amount,
      tax: invoice.tax || 0,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      dueDate: formattedDueDate,
      notes: invoice.notes || '',
      billingPeriod: invoice.billingPeriod || ''
    });
    
    setOpenInvoiceForm(true);
  };

  // Handle deleting an invoice
  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.delete(`${apiUrl}/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove the deleted invoice from state
      setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice._id !== invoiceId));
      showAlert('Invoice deleted successfully', 'success');
      
      // Refresh invoice stats
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showAlert('Failed to delete invoice', 'error');
    }
  };

  // Reset invoice form
  const resetInvoiceForm = () => {
    setInvoiceForm({
      adminId: '',
      enterpriseDetails: {
        companyName: '',
        email: ''
      },
      items: [],
      totalAmount: 0,
      status: 'pending',
      issueDate: new Date(),
      dueDate: '',
      notes: '',
      billingPeriod: {
        start: '',
        end: ''
      }
    });
    setSelectedInvoice(null);
  };

  // Add item to invoice
  const addInvoiceItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          type: 'service',
          itemId: '',
          name: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0
        }
      ]
    }));
  };

  // Remove item from invoice
  const removeInvoiceItem = (index) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Update invoice item
  const updateInvoiceItem = (index, field, value) => {
    setInvoiceForm(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      
      // Recalculate total price if quantity or unit price changes
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
        const unitPrice = field === 'unitPrice' ? value : updatedItems[index].unitPrice;
        updatedItems[index].totalPrice = quantity * unitPrice;
      }
      
      // Recalculate invoice amount
      const amount = updatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const tax = prev.tax || 0;
      const totalAmount = amount + (amount * tax / 100);
      
      return {
        ...prev,
        items: updatedItems,
        amount,
        totalAmount
      };
    });
  };

  // Handle tax change
  const handleTaxChange = (value) => {
    setInvoiceForm(prev => {
      const tax = parseFloat(value) || 0;
      const amount = prev.amount || 0;
      const totalAmount = amount + (amount * tax / 100);
      
      return {
        ...prev,
        tax,
        totalAmount
      };
    });
  };

  // Handle create/update invoice
  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Authentication token missing', 'error');
        return;
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Validate required fields
      if (!invoiceForm.adminId) {
        showAlert('Please select an enterprise', 'error');
        return;
      }

      if (!invoiceForm.items || invoiceForm.items.length === 0) {
        showAlert('Please add at least one item to the invoice', 'error');
        return;
      }

      if (!invoiceForm.dueDate) {
        showAlert('Please select a due date', 'error');
        return;
      }
      
      // Calculate final amounts
      const amount = invoiceForm.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const totalAmount = amount + (amount * (invoiceForm.tax || 0) / 100);
      
      // Format the invoice data according to the expected structure
      const invoiceData = {
        adminId: invoiceForm.adminId,
        enterpriseDetails: {
          companyName: invoiceForm.enterpriseDetails.companyName,
          email: invoiceForm.enterpriseDetails.email
        },
        items: invoiceForm.items.map(item => ({
          type: item.type,
          itemId: item.itemId,
          name: item.name,
          description: item.description || '',
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice)
        })),
        amount: Number(amount),
        totalAmount: Number(totalAmount),
        status: 'pending',
        issueDate: new Date().toISOString(),
        dueDate: new Date(invoiceForm.dueDate).toISOString(),
        notes: invoiceForm.notes || '',
        billingPeriod: invoiceForm.billingPeriod || ''
      };

      console.log('Submitting invoice data:', JSON.stringify(invoiceData, null, 2));
      
      let response;
      if (selectedInvoice) {
        // Update existing invoice
        response = await axios.put(
          `${apiUrl}/api/invoices/${selectedInvoice._id}`, 
          invoiceData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        showAlert('Invoice updated successfully', 'success');
      } else {
        // Create new invoice
        response = await axios.post(
          `${apiUrl}/api/invoices`, 
          invoiceData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        showAlert('Invoice created successfully', 'success');
      }
      
      console.log('Invoice API response:', response.data);
      
      // Close form and reset
      setOpenInvoiceForm(false);
      resetInvoiceForm();
      
      // Refresh invoices
      fetchInvoices();
    } catch (error) {
      console.error('Error submitting invoice:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let errorMessage = 'Failed to create invoice';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert(errorMessage, 'error');
    }
  };

  // Add function to fetch enterprise services and quotations
  const fetchEnterpriseData = async (enterpriseId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Find the admin/enterprise to get their product access
      const admin = admins.find(a => a._id === enterpriseId);
      if (!admin) {
        showAlert('Enterprise not found', 'error');
        return;
      }

      // Get products that the enterprise has access to
      const accessibleProducts = products.filter(product => {
        if (product.id === 'crm') {
          return admin.permissions?.crmAccess;
        } else {
          return admin.productAccess?.some(p => p.productId === product.id && p.hasAccess);
        }
      });

      setEnterpriseServices(accessibleProducts);
      
      // Fetch approved quotations
      const quotationsResponse = await axios.get(`${apiUrl}/api/invoices/enterprises/${enterpriseId}/quotations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnterpriseQuotations(quotationsResponse.data.filter(q => q.status === 'approved'));
    } catch (error) {
      console.error('Error fetching enterprise data:', error);
      showAlert('Failed to fetch enterprise data', 'error');
    }
  };

  // Update enterprise selection handler
  const handleEnterpriseChange = async (e) => {
    const selectedAdmin = admins.find(admin => admin._id === e.target.value);
    if (selectedAdmin) {
      setInvoiceForm({
        ...invoiceForm,
        adminId: e.target.value,
        enterpriseDetails: {
          companyName: selectedAdmin.enterprise?.companyName || selectedAdmin.profile?.fullName || '',
          email: selectedAdmin.email || ''
        }
      });
      await fetchEnterpriseData(e.target.value);
    }
  };

  // Update item type change handler
  const handleItemTypeChange = (index, type) => {
    setInvoiceForm(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        type,
        itemId: '',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      };
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  // Update item name change handler
  const handleItemNameChange = (index, name, itemId) => {
    setInvoiceForm(prev => {
      const updatedItems = [...prev.items];
      const item = updatedItems[index];
      
      if (item.type === 'service') {
        const product = enterpriseServices.find(p => p.id === itemId);
        if (product) {
          item.unitPrice = product.pricing?.price || 0;
          item.description = product.description || '';
        }
      } else if (item.type === 'quotation') {
        const quotation = enterpriseQuotations.find(q => q._id === itemId);
        if (quotation) {
          item.unitPrice = quotation.finalPrice || 0;
          item.description = quotation.requestDetails || '';
        }
      }
      
      item.name = name;
      item.itemId = itemId;
      item.totalPrice = item.quantity * item.unitPrice;
      
      // Recalculate invoice totals
      const amount = updatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const totalAmount = amount + (amount * (prev.tax || 0) / 100);
      
      return {
        ...prev,
        items: updatedItems,
        amount,
        totalAmount
      };
    });
  };

  const handleItemQuantityChange = (index, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index].quantity = value;
    newItems[index].totalPrice = value * newItems[index].unitPrice;
    
    // Calculate total amount from items
    const totalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    setInvoiceForm({
      ...invoiceForm,
      items: newItems,
      totalAmount
    });
  };

  // Add WebSocket event handlers
  useEffect(() => {
    // Connect to WebSocket when component mounts
    websocketService.connect();

    // Subscribe to invoice events
    const handleInvoiceCreated = (invoice) => {
      setInvoices(prevInvoices => [...prevInvoices, invoice]);
      showAlert('New invoice created', 'success');
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

  // Add this function near the other handlers
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
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.put(
        `${apiUrl}/services/superadmin/quotations/${selectedQuotation._id}`,
        quotationForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      showAlert('Quotation updated successfully', 'success');
      setOpenQuotationForm(false);
      setSelectedQuotation(null);
      setQuotationForm({
        status: 'pending',
        finalPrice: '',
        superadminNotes: '',
        proposedDeliveryDate: '',
        rejectionReason: ''
      });
      fetchQuotations();
    } catch (error) {
      console.error('Update quotation error:', error);
      if (error.response?.status === 500) {
        showAlert('Server error while updating quotation. Please try again later.', 'error');
      } else {
        showAlert('Failed to update quotation', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <SuperAdminSidebar 
        activeItem={activeTab} 
        onNavigate={handleSidebarNavigation} 
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
            <h3>Super Admin Dashboard</h3>
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
        
        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-overview">
              <h2>Welcome to the Dashboard</h2>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Total Enterprises</h3>
                  <p className="stat-number">{admins.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Enterprises with CRM Access</h3>
                  <p className="stat-number">
                    {admins.filter(admin => admin.permissions?.crmAccess).length}
                  </p>
                </div>
                <div className="stat-card">
                  <h3>Available Products</h3>
                  <p className="stat-number">{products.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Customers</h3>
                  <p className="stat-number">
                    {crmOverview.reduce((total, admin) => total + admin.stats?.totalCustomers || 0, 0)}
                  </p>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => setActiveTab('enterprise')}>
                    Manage Enterprises
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('products')}>
                    View Products
                  </button>
                  <button className="action-btn" onClick={() => navigate('/superadmin/crm/customers')}>
                    Manage CRM Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'enterprise' && (
            <div className="enterprises-section">
              <h2>Enterprise Management</h2>
              <button className="create-btn" onClick={() => setOpenDialog(true)}>
                Create New Enterprise
              </button>
              
              <div className="enterprises-list">
                {admins.length === 0 ? (
                  <div className="no-data-container">
                    <p>No enterprises found. Add your first enterprise to get started.</p>
                  </div>
                ) : (
                  <div className="enterprises-grid">
                    {admins.map((admin) => (
                      <div key={admin._id} className="enterprise-card">
                        <div className="enterprise-header">
                          {admin.enterprise?.logo && (
                            <div className="enterprise-logo">
                              <img src={admin.enterprise.logo} alt={`${admin.enterprise?.companyName || admin.email} logo`} />
                            </div>
                          )}
                          <div className="enterprise-titles">
                            <h3>{admin.enterprise?.companyName || admin.profile?.fullName || admin.email}</h3>
                            <span className="enterprise-id">
                              ID: {admin.enterprise?.enterpriseId || admin._id.substring(0, 8)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="enterprise-details">
                          <div className="enterprise-info">
                            <p><strong>Contact:</strong> {admin.profile?.fullName || 'Not set'}</p>
                            <p><strong>Email:</strong> {admin.email}</p>
                            <p><strong>Company Email:</strong> {admin.enterprise?.companyEmail || 'Not set'}</p>
                            <p><strong>Phone:</strong> {admin.enterprise?.phoneNumber || admin.profile?.phone || 'Not set'}</p>
                          </div>
                          
                          <div className="enterprise-location">
                            <p><strong>Location:</strong> {[
                              admin.enterprise?.city, 
                              admin.enterprise?.country
                            ].filter(Boolean).join(', ') || 'Not set'}</p>
                            <p><strong>Industry:</strong> {admin.enterprise?.industry || 'Not set'}</p>
                            <p><strong>Business Type:</strong> {admin.enterprise?.businessType || 'Not set'}</p>
                            <p><strong>Created:</strong> {new Date(admin.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        {renderEnterpriseAccess()}
                        
                        <div className="enterprise-actions">
                          <button 
                            className="edit-btn" 
                            onClick={() => handleEditClick(admin)}
                          >
                            Manage
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteEnterprise(admin._id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="products-section">
              <div className="section-header">
                <h2>Products & Services</h2>
                <button className="create-btn" onClick={() => setOpenProductDialog(true)}>
                  <i className="add-icon"></i> Add New Product
                </button>
              </div>
              
              <div className="products-list">
                {products.length === 0 ? (
                  <div className="no-data-container">
                    <div className="empty-state-icon">🏷️</div>
                    <p>No products found. Add your first product to get started.</p>
                    <button className="add-first-btn" onClick={() => setOpenProductDialog(true)}>
                      Add First Product
                    </button>
                  </div>
                ) : (
                  <div className="products-grid">
                    {products.map((product) => (
                      <div key={product.id} className="product-card">
                        <div className="product-header">
                          <div className="product-icon">{product.icon}</div>
                          <div className="product-info">
                            <h3>{product.name}</h3>
                            <span className="product-id">{product.id}</span>
                          </div>
                        </div>
                        <p className="product-description">{product.description}</p>
                        
                        <div className="product-stats">
                          <div className="stat-item">
                            <span className="stat-label">Enterprises with Access:</span>
                            <span className="stat-value">
                              {product.id === 'crm' 
                                ? admins.filter(admin => admin.permissions?.crmAccess).length 
                                : admins.filter(admin => admin.productAccess?.some(p => p.productId === product.id)).length}
                            </span>
                          </div>
                        </div>
                        
                        <div className="product-access-link">
                          <div className="access-link-label">Access Link:</div>
                          <div className="access-link-url">
                            {product.accessUrl || `${window.location.origin}/products/access/${product.id}`}
                          </div>
                          <button 
                            className="copy-link-btn"
                            onClick={() => {
                              const link = product.accessUrl || `${window.location.origin}/products/access/${product.id}`;
                              navigator.clipboard.writeText(link);
                              showAlert('Access link copied to clipboard', 'success');
                            }}
                          >
                            <i className="copy-icon"></i> Copy Link
                          </button>
                        </div>
                        
                        <div className="product-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditProduct(product)}
                          >
                            <i className="edit-icon"></i> Edit
                          </button>
                          <button 
                            className="view-users-btn"
                            onClick={() => handleViewEnterprises(product)}
                          >
                            <i className="users-icon"></i> View Enterprises
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'services' && (
            <div className="services-section">
              <div className="section-header">
                <h2>Services Management</h2>
                <button className="create-btn" onClick={() => navigate('/superadmin/services/create')}>
                  <i className="add-icon"></i> Add New Service
                </button>
              </div>
              
              <div className="services-list">
                {services && services.length > 0 ? (
                  <div className="services-grid">
                    {services.map((service) => (
                      <div key={service._id} className="service-card">
                        <div className="service-header">
                          <div className="service-icon">{service.icon || '🛠️'}</div>
                          <div className="service-info">
                            <h3>{service.name}</h3>
                            <span className="service-price">${service.price?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                        <p className="service-description">{service.description}</p>
                        
                        <div className="service-stats">
                          <div className="stat-item">
                            <span className="stat-label">Category:</span>
                            <span className="stat-value">{service.category || 'General'}</span>
                          </div>
                        </div>
                        
                        <div className="service-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => navigate(`/superadmin/services/edit/${service._id}`)}
                          >
                            <i className="edit-icon"></i> Edit
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteService(service._id)}
                          >
                            <i className="delete-icon"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data-container">
                    <div className="empty-state-icon">🛠️</div>
                    <p>No services found. Add your first service to get started.</p>
                    <button className="add-first-btn" onClick={() => navigate('/superadmin/services/create')}>
                      Add First Service
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'invoices' && (
            <div className="invoices-section">
              <div className="invoices-header">
                <h2>Invoice Management</h2>
                <button className="create-invoice-btn" onClick={() => setOpenInvoiceForm(true)}>
                  <i className="fas fa-plus"></i> Generate New Invoice
                </button>
              </div>
              
              <div className="quotation-stats">
                <div className="stat-card">
                  <h3>Total</h3>
                  <p className="stat-number">{invoiceStats.totalInvoices || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Pending</h3>
                  <p className="stat-number">{invoiceStats.invoicesByStatus?.pending || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Paid</h3>
                  <p className="stat-number">{invoiceStats.invoicesByStatus?.paid || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Overdue</h3>
                  <p className="stat-number">{invoiceStats.invoicesByStatus?.overdue || 0}</p>
                </div>
              </div>
              
              <div className="financial-summary">
                <div className="summary-card">
                  <h3>Total Revenue</h3>
                  <p className="amount">${(invoiceStats.financials?.totalRevenue || 0).toFixed(2)}</p>
                </div>
                <div className="summary-card">
                  <h3>Paid Revenue</h3>
                  <p className="amount">${(invoiceStats.financials?.paidRevenue || 0).toFixed(2)}</p>
                </div>
                <div className="summary-card">
                  <h3>Pending Revenue</h3>
                  <p className="amount">${(invoiceStats.financials?.pendingRevenue || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="invoices-list">
                {isLoadingInvoices ? (
                  <div className="loading-container"><p>Loading invoices...</p></div>
                ) : invoices.length === 0 ? (
                  <div className="no-data-container">
                    <div className="empty-state-icon">📃</div>
                    <p>No invoices found. Create your first invoice to get started.</p>
                  </div>
                ) : (
                  <div className="invoices-table-container">
                    <table className="invoices-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Enterprise</th>
                          <th>Amount</th>
                          <th>Issue Date</th>
                          <th>Due Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice._id} className={`invoice-row ${invoice.status === 'overdue' ? 'highlight-row' : ''}`}>
                            <td>{invoice.invoiceNumber}</td>
                            <td>{invoice.enterpriseDetails?.companyName || invoice.adminId?.profile?.fullName || 'Unknown'}</td>
                            <td>${invoice.totalAmount.toFixed(2)}</td>
                            <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                            <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge ${invoice.status}`}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </span>
                            </td>
                            <td className="invoice-actions">
                              <button
                                className="view-btn"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                View
                              </button>
                              <button
                                className="edit-btn"
                                onClick={() => handleEditInvoice(invoice)}
                              >
                                Edit
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteInvoice(invoice._id)}
                              >
                                Delete
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
          
          {activeTab === 'quotations' && (
            <div className="quotations-section">
              <div className="section-header">
                <h2>Quotations Management</h2>
              </div>
              
              <div className="quotation-stats">
                <div className="stat-card">
                  <h3>Pending</h3>
                  <p className="stat-number">{quotationStats.pending || 0}</p>
              </div>
                <div className="stat-card">
                  <h3>Approved</h3>
                  <p className="stat-number">{quotationStats.approved || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Rejected</h3>
                  <p className="stat-number">{quotationStats.rejected || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Completed</h3>
                  <p className="stat-number">{quotationStats.completed || 0}</p>
                </div>
              </div>
              
              <div className="quotations-list">
                {isLoadingQuotations ? (
                  <div className="loading-container">
                    <p>Loading quotations...</p>
                  </div>
                ) : quotations.length === 0 ? (
                  <div className="no-data-container">
                    <div className="empty-state-icon">📄</div>
                    <p>No quotations found.</p>
                  </div>
                ) : (
                  <div className="quotations-table-container">
                    <table className="quotations-table">
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
                                className="btn-view" 
                                onClick={() => {
                                  setViewQuotation(quotation);
                                  setOpenQuotationViewModal(true);
                                }}
                              >
                                View
                              </button>
                              <button 
                                className="btn-manage" 
                                onClick={() => handleQuotationClick(quotation)}
                              >
                                Manage
                              </button>
                              <button 
                                className="btn-delete" 
                                onClick={() => handleDeleteQuotation(quotation._id)}
                              >
                                Delete
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
          
          {['reports', 'expenses', 'receipts'].includes(activeTab) && (
            <div className="placeholder-section">
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h2>
              <p>This section is under development. Please check back later.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Admin Dialog */}
      {openDialog && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedAdmin ? 'Edit Admin' : 'Create Admin'}</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenDialog(false);
                  setSelectedAdmin(null);
                  resetForm();
                }}
                aria-label="Close"
              >×</button>
            </div>
            <form onSubmit={selectedAdmin ? handleUpdateEnterprise : handleCreateEnterprise}>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              
              {!selectedAdmin && (
                <div className="form-group">
                  <label>Password {selectedAdmin ? '(Leave blank to keep current)' : ''} <span className="required">*</span></label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    required={!selectedAdmin}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                  className="form-control"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile({...profile, department: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>Enterprise Information</h3>
                
                <div className="form-group">
                  <label>Admin/Enterprise <span className="required">*</span></label>
                  <select 
                    value={invoiceForm.adminId} 
                    onChange={handleEnterpriseChange}
                    required
                    className="form-control"
                  >
                    <option value="">Select Admin/Enterprise</option>
                    {admins.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {admin.enterprise?.companyName || admin.profile?.fullName || admin.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                      value={invoiceForm.enterpriseDetails.companyName} 
                      readOnly
                      className="read-only"
                  />
                </div>
                
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email" 
                      value={invoiceForm.enterpriseDetails.email} 
                      readOnly
                      className="read-only"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Invoice Items</h3>
                
                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="invoice-item">
                    <div className="form-row">
                  <div className="form-group">
                        <label>Type</label>
                    <select
                          value={item.type} 
                          onChange={(e) => handleItemTypeChange(index, e.target.value)}
                        >
                          <option value="service">Service</option>
                          <option value="quotation">Quotation</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Name <span className="required">*</span></label>
                        <select 
                          value={item.itemId} 
                          onChange={(e) => handleItemNameChange(index, e.target.options[e.target.selectedIndex].text, e.target.value)}
                          required
                      className="form-control"
                    >
                          <option value="">Select {item.type === 'service' ? 'Service' : 'Quotation'}</option>
                          {item.type === 'service' ? (
                            enterpriseServices.map(service => (
                              <option key={service._id} value={service._id}>
                                {service.name}
                              </option>
                            ))
                          ) : (
                            enterpriseQuotations.map(quotation => (
                              <option key={quotation._id} value={quotation._id}>
                                {quotation.requestDetails}
                              </option>
                            ))
                          )}
                    </select>
                  </div>
                </div>
                    
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        value={item.description} 
                        readOnly
                        className="read-only"
                        rows={2}
                      />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                        <label>Quantity <span className="required">*</span></label>
                    <input
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleItemQuantityChange(index, parseFloat(e.target.value) || 0)}
                          required
                          min="1"
                          step="1"
                    />
                  </div>
                      
                <div className="form-group">
                        <label>Unit Price ($) <span className="required">*</span></label>
                  <input
                          type="number" 
                          value={item.unitPrice} 
                          readOnly
                          className="read-only"
                  />
                </div>
                      
                      <div className="form-group">
                        <label>Total Price ($)</label>
                        <input 
                          type="number" 
                          value={item.totalPrice} 
                          readOnly
                          className="read-only"
                        />
              </div>
                      
                      <button 
                        type="button" 
                        className="remove-item-btn"
                        onClick={() => removeInvoiceItem(index)}
                        disabled={invoiceForm.items.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <button type="button" className="add-item-btn" onClick={addInvoiceItem}>
                  + Add Item
                </button>
              </div>
              
              <div className="form-section">
                <h3>Invoice Details</h3>
                
              <div className="form-row">
                <div className="form-group">
                    <label>Total Amount ($)</label>
                  <input
                      type="number" 
                      value={invoiceForm.totalAmount} 
                      readOnly
                      className="read-only"
                  />
                </div>
                </div>
                
                <div className="form-row">
                  
                  
                <div className="form-group">
                    <label>Due Date <span className="required">*</span></label>
                  <input
                      type="date" 
                      value={invoiceForm.dueDate} 
                      onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                      required
                  />
                </div>
                  
                  <div className="form-group">
                    <label>Billing Period</label>
                    <input 
                      type="text" 
                      value={invoiceForm.billingPeriod} 
                      onChange={(e) => setInvoiceForm({...invoiceForm, billingPeriod: e.target.value})}
                      placeholder="e.g. January 2023"
                    />
              </div>
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    value={invoiceForm.notes} 
                    onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                    placeholder="Additional notes for the invoice"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setOpenInvoiceForm(false);
                  resetInvoiceForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Form Dialog */}
      {openProductDialog && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedProduct ? 'Edit Product' : 'Create Product'}</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenProductDialog(false);
                  resetProductForm();
                }}
                aria-label="Close"
              >×</button>
            </div>
            <form onSubmit={selectedProduct ? handleUpdateProduct : handleAddProduct}>
              <div className="form-group">
                <label>Product Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>ID/Key <span className="required">*</span></label>
                <input
                  type="text"
                  value={newProduct.id}
                  onChange={(e) => setNewProduct({...newProduct, id: e.target.value})}
                  className="form-control"
                  required
                  disabled={selectedProduct}
                />
                <small>
                  {selectedProduct ? 'Product ID cannot be changed after creation' : 'A unique identifier for the product (e.g., "crm", "analytics")'}
                </small>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <input
                  type="text"
                  value={newProduct.icon}
                  onChange={(e) => setNewProduct({...newProduct, icon: e.target.value})}
                  className="form-control"
                  placeholder="e.g., 📊 or icon class"
                />
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setOpenProductDialog(false);
                  resetProductForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : selectedProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openProductEditDialog && (
        <div className="modal-backdrop" onClick={handleOutsideClick}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenProductEditDialog(false);
                  resetProductForm();
                  setSelectedProduct(null);
                }}
                aria-label="Close"
              >×</button>
            </div>
            <div className="product-form-container">
              <form onSubmit={handleUpdateProduct} className="product-form">
                <div className="form-group">
                  <label>Product ID</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={newProduct.id} 
                    disabled
                    readOnly
                  />
                  <small>Product ID cannot be changed</small>
                </div>
                <div className="form-group">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={newProduct.name} 
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                    required 
                    placeholder="Enter product name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    className="form-control"
                    value={newProduct.description} 
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} 
                    required 
                    placeholder="Describe what this product or service does"
                  />
                </div>
                <div className="form-group">
                  <label>Icon (Emoji)</label>
                  <div className="icon-selector">
                    <input 
                      type="text" 
                      className="form-control"
                      value={newProduct.icon} 
                      onChange={(e) => setNewProduct({...newProduct, icon: e.target.value})} 
                      required 
                      placeholder="Enter an emoji (e.g., 📊, 📈, 💰)"
                    />
                    <div className="icon-preview">{newProduct.icon}</div>
                  </div>
                  <div className="icon-suggestions">
                    <span onClick={() => setNewProduct({...newProduct, icon: '📊'})}>📊</span>
                    <span onClick={() => setNewProduct({...newProduct, icon: '📈'})}>📈</span>
                    <span onClick={() => setNewProduct({...newProduct, icon: '📉'})}>📉</span>
                    <span onClick={() => setNewProduct({...newProduct, icon: '💰'})}>💰</span>
                    <span onClick={() => setNewProduct({...newProduct, icon: '📱'})}>📱</span>
                    <span onClick={() => setNewProduct({...newProduct, icon: '💻'})}>💻</span>
                    <span onClick={() => setNewProduct({...newProduct, icon: '🔔'})}>🔔</span>
                    <span onClick={() => setNewProduct({...newProduct, icon: '📝'})}>📝</span>
                  </div>
                </div>
                <div className="dialog-actions">
                  <button type="button" className="btn btn-outline" onClick={() => {
                    setOpenProductEditDialog(false);
                    resetProductForm();
                    setSelectedProduct(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Update Product</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {openEnterpriseListDialog && selectedProduct && (
        <div className="modal-backdrop" onClick={handleOutsideClick}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Enterprises with Access to {selectedProduct.name}</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenEnterpriseListDialog(false);
                  setSelectedProduct(null);
                  setEnterprisesWithAccess([]);
                }}
                aria-label="Close"
              >×</button>
            </div>
            <div className="enterprises-access-container">
              {enterprisesWithAccess.length === 0 ? (
                <div className="no-data-container">
                  <p>No enterprises have access to this product yet.</p>
                </div>
              ) : (
                <div className="enterprises-access-list">
                  {enterprisesWithAccess.map(admin => (
                    <div key={admin._id} className="enterprise-access-item">
                      <div className="enterprise-access-info">
                        <h3>{admin.enterprise?.companyName || admin.profile?.fullName || admin.email}</h3>
                        <p><strong>Enterprise ID:</strong> {admin.enterprise?.enterpriseId || admin._id.substring(0, 8)}</p>
                        <p><strong>Admin Email:</strong> {admin.email}</p>
                        <p><strong>Access Granted:</strong> {
                          selectedProduct.id === 'crm' 
                            ? 'CRM Access Enabled' 
                            : admin.productAccess?.find(p => p.productId === selectedProduct.id)?.grantedAt 
                              ? new Date(admin.productAccess?.find(p => p.productId === selectedProduct.id)?.grantedAt).toLocaleDateString()
                              : 'Unknown'
                        }</p>
                      </div>
                      <div className="enterprise-access-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            handleEditClick(admin);
                            setOpenEnterpriseListDialog(false);
                          }}
                        >
                          Manage Admin
                        </button>
                        {selectedProduct.id === 'crm' ? (
                          <button 
                            className="btn btn-warning"
                            onClick={async () => {
                              await handleToggleCrmAccess(admin._id, false);
                              // Update the list of enterprises with access
                              const updatedList = enterprisesWithAccess.filter(a => a._id !== admin._id);
                              setEnterprisesWithAccess(updatedList);
                              
                              if (updatedList.length === 0) {
                                // Close dialog if no enterprises left
                                setOpenEnterpriseListDialog(false);
                                setSelectedProduct(null);
                              }
                            }}
                            disabled={loadingProduct && loadingProduct.id === 'crm'}
                          >
                            {loadingProduct && loadingProduct.id === 'crm' ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              'Revoke Access'
                            )}
                          </button>
                        ) : (
                          <button 
                            className="btn btn-warning"
                            onClick={async () => {
                              await handleToggleProductAccess(admin._id, selectedProduct.id, false);
                              // Update the list of enterprises with access
                              const updatedList = enterprisesWithAccess.filter(a => a._id !== admin._id);
                              setEnterprisesWithAccess(updatedList);
                              
                              if (updatedList.length === 0) {
                                // Close dialog if no enterprises left
                                setOpenEnterpriseListDialog(false);
                                setSelectedProduct(null);
                              }
                            }}
                            disabled={loadingProduct && loadingProduct.id === selectedProduct.id}
                          >
                            {loadingProduct && loadingProduct.id === selectedProduct.id ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              'Revoke Access'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="dialog-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setOpenEnterpriseListDialog(false);
                    setSelectedProduct(null);
                    setEnterprisesWithAccess([]);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Access Dialog */}
      {showAccessDialog && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Manage Product Access</h2>
              <button 
                className="close-button" 
                onClick={() => setShowAccessDialog(false)}
                aria-label="Close"
              >×</button>
            </div>
            <div className="product-access-form">
              <div className="form-group">
                <label>Enterprise</label>
                <select 
                  value={accessData.enterpriseId} 
                  onChange={(e) => setAccessData({...accessData, enterpriseId: e.target.value})}
                  className="form-control"
                >
                  <option value="">Select Enterprise</option>
                  {admins.map(enterprise => (
                    <option key={enterprise._id} value={enterprise._id}>
                      {enterprise.enterprise?.companyName || enterprise.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Product</label>
                <select 
                  value={accessData.product} 
                  onChange={(e) => setAccessData({...accessData, product: e.target.value})}
                  className="form-control"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAccessDialog(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleManageAccess}
                  disabled={!accessData.enterpriseId || !accessData.product}
                >
                  Grant Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Enterprise Dialog */}
      {showEnterpriseForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingEnterprise ? 'Edit Enterprise' : 'Create Enterprise'}</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setShowEnterpriseForm(false);
                  setEditingEnterprise(null);
                  resetEnterpriseForm();
                }}
                aria-label="Close"
              >×</button>
            </div>
            <form onSubmit={editingEnterprise ? handleUpdateEnterprise : handleCreateEnterprise}>
              <div className="form-group">
                <label>Company Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={enterprise.companyName}
                  onChange={(e) => setEnterprise({...enterprise, companyName: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Industry</label>
                  <input
                    type="text"
                    value={enterprise.industry}
                    onChange={(e) => setEnterprise({...enterprise, industry: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Size</label>
                  <select
                    value={enterprise.size}
                    onChange={(e) => setEnterprise({...enterprise, size: e.target.value})}
                    className="form-control"
                  >
                    <option value="">Select Size</option>
                    <option value="small">Small (1-50)</option>
                    <option value="medium">Medium (51-200)</option>
                    <option value="large">Large (201-1000)</option>
                    <option value="enterprise">Enterprise (1000+)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={enterprise.city}
                    onChange={(e) => setEnterprise({...enterprise, city: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={enterprise.country}
                    onChange={(e) => setEnterprise({...enterprise, country: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={enterprise.email}
                    onChange={(e) => setEnterprise({...enterprise, email: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={enterprise.phone}
                    onChange={(e) => setEnterprise({...enterprise, phone: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowEnterpriseForm(false);
                  setEditingEnterprise(null);
                  resetEnterpriseForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingEnterprise ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      {openInvoiceForm && (
        <div className="modal-backdrop">
          <div className="modal-content invoice-form-modal">
            <div className="modal-header">
              <h2>{selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setOpenInvoiceForm(false);
                  resetInvoiceForm();
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitInvoice} className="invoice-form">
              <div className="form-section">
                <h3>Enterprise Information</h3>
                
                <div className="form-group">
                  <label>Admin/Enterprise <span className="required">*</span></label>
                  <select 
                    value={invoiceForm.adminId} 
                    onChange={handleEnterpriseChange}
                    required
                    className="form-control"
                  >
                    <option value="">Select Admin/Enterprise</option>
                    {admins.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {admin.enterprise?.companyName || admin.profile?.fullName || admin.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Company Name</label>
                    <input 
                      type="text" 
                      value={invoiceForm.enterpriseDetails.companyName} 
                      readOnly
                      className="read-only"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={invoiceForm.enterpriseDetails.email} 
                      readOnly
                      className="read-only"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Invoice Items</h3>
                
                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="invoice-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Type</label>
                        <select 
                          value={item.type} 
                          onChange={(e) => handleItemTypeChange(index, e.target.value)}
                        >
                          <option value="service">Service</option>
                          <option value="quotation">Quotation</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Name <span className="required">*</span></label>
                        <select 
                          value={item.itemId} 
                          onChange={(e) => handleItemNameChange(index, e.target.options[e.target.selectedIndex].text, e.target.value)}
                          required
                          className="form-control"
                        >
                          <option value="">Select {item.type === 'service' ? 'Service' : 'Quotation'}</option>
                          {item.type === 'service' ? (
                            enterpriseServices.map(service => (
                              <option key={service._id} value={service._id}>
                                {service.name}
                              </option>
                            ))
                          ) : (
                            enterpriseQuotations.map(quotation => (
                              <option key={quotation._id} value={quotation._id}>
                                {quotation.requestDetails}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        value={item.description} 
                        readOnly
                        className="read-only"
                        rows={2}
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Quantity <span className="required">*</span></label>
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleItemQuantityChange(index, parseFloat(e.target.value) || 0)}
                          required
                          min="1"
                          step="1"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Unit Price ($) <span className="required">*</span></label>
                        <input 
                          type="number" 
                          value={item.unitPrice} 
                          readOnly
                          className="read-only"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Total Price ($)</label>
                        <input 
                          type="number" 
                          value={item.totalPrice} 
                          readOnly
                          className="read-only"
                        />
                      </div>
                      
                      <button 
                        type="button" 
                        className="remove-item-btn"
                        onClick={() => removeInvoiceItem(index)}
                        disabled={invoiceForm.items.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <button type="button" className="add-item-btn" onClick={addInvoiceItem}>
                  + Add Item
                </button>
              </div>
              
              <div className="form-section">
                <h3>Invoice Details</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Total Amount ($)</label>
                    <input 
                      type="number" 
                      value={invoiceForm.totalAmount} 
                      readOnly
                      className="read-only"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  
                  
                  <div className="form-group">
                    <label>Due Date <span className="required">*</span></label>
                    <input 
                      type="date" 
                      value={invoiceForm.dueDate} 
                      onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Billing Period</label>
                    <input 
                      type="text" 
                      value={invoiceForm.billingPeriod} 
                      onChange={(e) => setInvoiceForm({...invoiceForm, billingPeriod: e.target.value})}
                      placeholder="e.g. January 2023"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    value={invoiceForm.notes} 
                    onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                    placeholder="Additional notes for the invoice"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setOpenInvoiceForm(false);
                  resetInvoiceForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  setQuotationForm({
                    status: 'pending',
                    finalPrice: '',
                    superadminNotes: '',
                    proposedDeliveryDate: '',
                    rejectionReason: ''
                  });
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
                    setQuotationForm({
                      status: 'pending',
                      finalPrice: '',
                      superadminNotes: '',
                      proposedDeliveryDate: '',
                      rejectionReason: ''
                    });
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

export default SuperAdminDashboard;
