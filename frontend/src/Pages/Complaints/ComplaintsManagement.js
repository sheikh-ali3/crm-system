import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ComplaintsManagement.css';
import SuperAdminSidebar from '../../Components/Layout/SuperAdminSidebar';
import ThemeToggle from '../../Components/UI/ThemeToggle';
import TicketList from './Components/TicketList';
import TicketDetail from './Components/TicketDetail';

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
      navigate('/login');
      return false;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/superadmin/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentUser(response.data.user);
      return true;
    } catch (error) {
      console.error('Auth error:', error);
      showAlert('Authentication failed', 'error');
      localStorage.removeItem('token');
      navigate('/login');
      return false;
    }
  }, [navigate, showAlert]);

  const fetchTickets = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
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
      if (isAuth) {
        fetchTickets();
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
          <div className="tickets-container">
            {viewMode === 'list' && (
              <TicketList 
                tickets={getFilteredTickets()} 
                loading={loading} 
                error={error} 
                onSelectTicket={handleSelectTicket}
              />
            )}
            
            {viewMode === 'detail' && selectedTicket && (
              <div className="ticket-detail">
                <div className="ticket-detail-header">
                  <button className="back-btn" onClick={() => setViewMode('list')}>
                    ← Back to List
                  </button>
                  <h3>Ticket Details</h3>
                </div>
                
                <div className="ticket-info">
                  <h4>{selectedTicket.subject}</h4>
                  <p><strong>From:</strong> {selectedTicket.name} ({selectedTicket.email})</p>
                  <p><strong>Department:</strong> {selectedTicket.department}</p>
                  <p><strong>Category:</strong> {selectedTicket.category}</p>
                  <p><strong>Priority:</strong> {selectedTicket.priority}</p>
                  <p><strong>Status:</strong> {selectedTicket.status}</p>
                  <p><strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  <p><strong>Description:</strong> {selectedTicket.description}</p>
                </div>

                <div className="ticket-responses">
                  <h4>Responses</h4>
                  {selectedTicket.responses && selectedTicket.responses.map((response, index) => (
                    <div key={index} className="response-item">
                      <p>{response.message}</p>
                      <small>{new Date(response.createdAt).toLocaleString()}</small>
                    </div>
                  ))}
                </div>

                <div className="add-response">
                  <h4>Add Response</h4>
                  <textarea
                    value={responseForm.message}
                    onChange={(e) => setResponseForm({ message: e.target.value })}
                    placeholder="Type your response here..."
                    rows="4"
                  ></textarea>
                  <button 
                    className="submit-btn"
                    onClick={() => handleAddResponse(selectedTicket._id)}
                    disabled={!responseForm.message.trim()}
                  >
                    Send Response
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug/Error Section */}
        <div style={{ background: '#f9f9f9', color: '#333', padding: '1rem', margin: '1rem 0', border: '1px solid #ccc', borderRadius: '6px' }}>
          <h4>Debug: Raw Tickets Data</h4>
          <pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(tickets, null, 2)}</pre>
          {error && (
            <div style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</div>
          )}
          {!error && !loading && tickets && tickets.length === 0 && (
            <div style={{ color: '#888', marginTop: '1rem' }}>No tickets found. (API returned empty array)</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintsManagement; 