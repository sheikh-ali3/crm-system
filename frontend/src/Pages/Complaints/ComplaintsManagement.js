import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ComplaintsManagement.css';
import SuperAdminSidebar from '../../Components/Layout/SuperAdminSidebar';
import ThemeToggle from '../../Components/UI/ThemeToggle';
import TicketList from './Components/TicketList';
import TicketDetail from './Components/TicketDetail';
import Modal from 'react-modal';

const ComplaintsManagement = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detail'
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [currentUser, setCurrentUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [filteredStatus, setFilteredStatus] = useState('');
  const [filteredPriority, setFilteredPriority] = useState('');
  const [showCreateTicketForm, setShowCreateTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: '',
    priority: 'Low'
  });
  const [responseForm, setResponseForm] = useState({
    message: ''
  });
  const [showManageModal, setShowManageModal] = useState(false);
  const [ticketToManage, setTicketToManage] = useState(null);
  const [manageFormData, setManageFormData] = useState({
    status: '',
    message: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);

  const handleTicketFormChange = (e) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitTicket = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/tickets`,
        {
          subject: ticketForm.subject,
          category: ticketForm.category,
          description: ticketForm.description,
          priority: ticketForm.priority,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('Ticket submitted successfully!', 'success');
      setTicketForm({
        subject: '',
        category: '',
        description: '',
        priority: 'Low'
      });
      setShowCreateTicketForm(false);
      fetchTickets();
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      showAlert(error.response?.data?.message || 'Failed to submit ticket', 'error');
    }
  };

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showAlert('Please login first', 'error');
      navigate('/superadmin/login');
      return false;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.role === 'superadmin') {
        setCurrentUser(response.data);
        console.log('SuperAdmin authenticated successfully.', response.data);
        return true;
      } else {
        console.error('User is authenticated but not a superadmin.', response.data);
        showAlert('You do not have permission to view this page.', 'error');
        localStorage.removeItem('token');
        navigate('/superadmin/login');
        return false;
      }
    } catch (error) {
      console.error('Auth error:', error.response?.data || error.message);
      showAlert('Authentication failed. Please login again.', 'error');
      localStorage.removeItem('token');
      navigate('/superadmin/login');
      return false;
    }
  }, [navigate, showAlert]);

  const fetchTickets = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching tickets with token:', token ? 'Present' : 'Missing');
      setLoading(true);
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tickets`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Tickets API response:', response.data);
      setTickets(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tickets:', error.response?.data || error.message);
      setError('Failed to fetch tickets. Please try again later.');
      setLoading(false);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    if (currentUser?.role !== 'superadmin') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/superadmin/admins`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    const initPage = async () => {
      const isAuth = await checkAuth();
      console.log('Auth check result:', isAuth);
      if (isAuth) {
        console.log('User authenticated, fetching tickets...');
        fetchTickets();
      } else {
        console.log('User not authenticated, not fetching tickets.');
      }
    };
    
    initPage();
  }, [checkAuth, fetchTickets]);

  useEffect(() => {
    if (currentUser) {
      fetchAdmins();
    }
  }, [currentUser, fetchAdmins]);

  const handleSelectTicket = useCallback((ticket) => {
    setSelectedTicket(ticket);
    setViewMode('detail');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getFilteredTickets = useCallback(() => {
    let filtered = [...tickets];
    
    if (filteredStatus) {
      filtered = filtered.filter(ticket => ticket.status === filteredStatus);
    }
    
    if (filteredPriority) {
      filtered = filtered.filter(ticket => ticket.priority === filteredPriority);
    }
    
    return filtered;
  }, [tickets, filteredStatus, filteredPriority]);

  const handleAddResponse = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/tickets/${ticketId}/responses`,
        { message: responseForm.message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Create notification for the admin
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/notifications`,
        {
          userId: selectedTicket.adminId._id,
          message: `New response to your ticket: ${selectedTicket.subject}`,
          type: 'info',
          title: 'Ticket Response',
          relatedTo: {
            model: 'Ticket',
            id: selectedTicket._id
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResponseForm({ message: '' });
      showAlert('Response added successfully!', 'success');
      fetchTickets();
    } catch (error) {
      console.error('Failed to add response:', error);
      showAlert(error.response?.data?.message || 'Failed to add response', 'error');
    }
  };

  const handleManageTicketClick = useCallback((ticket) => {
    console.log('Manage button clicked for ticket:', ticket);
    setTicketToManage(ticket);
    setManageFormData({
      status: ticket.status || '',
      message: '' // Start with an empty message for a new response
    });
    console.log('Setting showManageModal to true');
    setShowManageModal(true);
    console.log('showManageModal state after setting:', showManageModal); // Note: This will likely log the old state value
  }, []);

  const handleManagementFormChange = (e) => {
    const { name, value } = e.target;
    setManageFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitManagementForm = async (e) => {
    e.preventDefault();
    if (!ticketToManage) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.put(
        `${apiUrl}/api/tickets/${ticketToManage._id}`,
        manageFormData, // Send status and message
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Ticket update response:', response.data);
      showAlert('Ticket updated successfully!', 'success');
      setShowManageModal(false);
      setTicketToManage(null);
      setManageFormData({ status: '', message: '' });
      fetchTickets(); // Refresh the list
    } catch (error) {
      console.error('Error updating ticket:', error.response?.data || error.message);
      showAlert(error.response?.data?.message || 'Failed to update ticket.', 'error');
    }
  };

  const handleDeleteTicket = useCallback(async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      setIsDeleting(true);
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        await axios.delete(`${apiUrl}/api/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        showAlert('Ticket deleted successfully!', 'success');
        fetchTickets(); // Refresh the ticket list
      } catch (error) {
        console.error('Error deleting ticket:', error.response?.data || error.message);
        showAlert(error.response?.data?.message || 'Failed to delete ticket.', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  }, [fetchTickets, showAlert]);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <SuperAdminSidebar 
        activeItem="complaints"
      />
      
      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="user-welcome">
            <h3>Complaints Management</h3>
          </div>
          <div className="header-right">
            <ThemeToggle />
            <div className="date-range">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <button onClick={handleLogout} className="logout-btn-small">
              Logout
            </button>
          </div>
        </header>
        
        {/* Alert message */}
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
        
        {/* Content Area */}
        <div className="complaints-content">
          {/* Ticket Controls */}
          <div className="ticket-controls">
            <div className="ticket-filters">
              <select 
                value={filteredStatus} 
                onChange={(e) => setFilteredStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              
              <select 
                value={filteredPriority} 
                onChange={(e) => setFilteredPriority(e.target.value)}
                className="filter-select"
              >
                <option value="">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <button 
              className="create-ticket-btn" 
              onClick={() => setShowCreateTicketForm(true)}
              style={{ display: showCreateTicketForm ? 'none' : 'flex' }}
            >
              Create New Ticket
            </button>
          </div>
          
          {showCreateTicketForm && (
            <form className="ticket-form" onSubmit={e => e.preventDefault()}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="subject"
                  value={ticketForm.subject}
                  onChange={handleTicketFormChange}
                  placeholder="Ticket title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={ticketForm.category}
                  onChange={handleTicketFormChange}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Technical">Technical Issue</option>
                  <option value="Billing">Billing Issue</option>
                  <option value="Product">Product</option>
                  <option value="Service">Service</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={ticketForm.description}
                  onChange={handleTicketFormChange}
                  placeholder="Describe your issue in detail"
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={ticketForm.priority}
                  onChange={handleTicketFormChange}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="submit-btn" onClick={handleSubmitTicket}>
                  Submit Ticket
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => {
                    setShowCreateTicketForm(false);
                    setTicketForm({
                      subject: '',
                      category: '',
                      description: '',
                      priority: 'Low'
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {/* Tickets View */}
          <div className="tickets-view">
            {loading ? (
              <div>Loading tickets...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : tickets.length === 0 ? (
              <div>No tickets found.</div>
            ) : (
              <TicketList 
                tickets={getFilteredTickets()} 
                onSelectTicket={handleSelectTicket}
                onManageTicket={handleManageTicketClick}
                onDeleteTicket={handleDeleteTicket}
              />
            )}
          </div>
        </div>
      </div>

      {/* Manage Ticket Modal */}
      <Modal
        isOpen={showManageModal}
        onRequestClose={() => setShowManageModal(false)}
        contentLabel="Manage Ticket"
        className="Modal"
        overlayClassName="Overlay"
      >
        {ticketToManage && (
          <div className="modal-content">
            <h3>Manage Ticket: {ticketToManage.subject}</h3>
            <p><strong>Ticket No:</strong> {ticketToManage.ticketNo || 'TKT-000'}</p>
            <p><strong>Status:</strong> {ticketToManage.status}</p>
            <p><strong>Priority:</strong> {ticketToManage.priority}</p>
            <p><strong>Created By:</strong> {ticketToManage.submittedBy?.profile?.fullName || 'N/A'}</p>
            <p><strong>Enterprise:</strong> {ticketToManage.submittedBy?.enterprise?.companyName || 'N/A'}</p>
            <hr/>
            <form onSubmit={handleSubmitManagementForm}>
              <div className="form-group">
                <label htmlFor="status">Update Status:</label>
                <select
                  id="status"
                  name="status"
                  value={manageFormData.status}
                  onChange={handleManagementFormChange}
                  className="form-control"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">Working</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="message">Add Response:</label>
                <textarea
                  id="message"
                  name="message"
                  value={manageFormData.message}
                  onChange={handleManagementFormChange}
                  placeholder="Type your response here..."
                  rows="4"
                  className="form-control"
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowManageModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintsManagement; 