import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ComplaintsManagement.css';
import SuperAdminSidebar from '../../Components/Layout/SuperAdminSidebar';
import ThemeToggle from '../../Components/UI/ThemeToggle';
import TicketList from '../../Components/Complaints/TicketList';
import TicketDetail from '../../Components/Complaints/TicketDetail';
import NewTicketForm from '../../Components/Complaints/NewTicketForm';
import TicketStats from '../../Components/Complaints/TicketStats';

const ComplaintsManagement = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'new'
  const [stats, setStats] = useState({
    total: 0,
    byStatus: { open: 0, inProgress: 0, resolved: 0, closed: 0 },
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 }
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [currentUser, setCurrentUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [filteredStatus, setFilteredStatus] = useState('');
  const [filteredPriority, setFilteredPriority] = useState('');

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);

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
      
      setTickets(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to fetch tickets. Please try again later.');
      setLoading(false);
    }
  }, []);

  const fetchTicketStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/tickets/stats/summary`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching ticket stats:', error);
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
        fetchTicketStats();
      }
    };
    
    initPage();
  }, [checkAuth, fetchTickets, fetchTicketStats]);

  useEffect(() => {
    if (currentUser) {
      fetchAdmins();
    }
  }, [currentUser, fetchAdmins]);

  const handleSelectTicket = useCallback((ticket) => {
    setSelectedTicket(ticket);
    setViewMode('detail');
  }, []);

  const handleCreateTicket = useCallback((newTicket) => {
    showAlert('Ticket created successfully', 'success');
    fetchTickets();
    fetchTicketStats();
    setViewMode('list');
  }, [fetchTickets, fetchTicketStats, showAlert]);

  const handleUpdateTicket = useCallback((updatedTicket) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket._id === updatedTicket._id ? updatedTicket : ticket
      )
    );
    showAlert('Ticket updated successfully', 'success');
    fetchTicketStats();
  }, [fetchTicketStats, showAlert]);

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
          {/* Ticket Statistics */}
          <TicketStats stats={stats} />
          
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
              onClick={() => setViewMode('new')}
            >
              Create New Ticket
            </button>
          </div>
          
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
              <TicketDetail 
                ticketId={selectedTicket._id} 
                onBack={() => setViewMode('list')}
                onUpdate={handleUpdateTicket}
                currentUser={currentUser}
                admins={admins}
              />
            )}
            
            {viewMode === 'new' && (
              <NewTicketForm 
                onSubmit={handleCreateTicket}
                onCancel={() => setViewMode('list')}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsManagement; 