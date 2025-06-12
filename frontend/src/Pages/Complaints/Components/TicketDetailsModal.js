import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import './TicketDetailsModal.css';
import websocketService from '../../../services/websocketService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TicketDetailsModal = ({ isOpen, onClose, ticket, userRole, onResponseAdded }) => {
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [currentResponses, setCurrentResponses] = useState([]);

  useEffect(() => {
    if (isOpen && ticket) {
      console.log('TicketDetailsModal received userRole:', userRole);
      // Sort responses by creation time to show them in chronological order
      const sortedResponses = [...(ticket.responses || [])].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      setCurrentResponses(sortedResponses);
    }
  }, [isOpen, ticket, userRole]);

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!newResponse.trim()) {
      showAlert('Response cannot be empty!', 'error');
      return;
    }

    if (!ticket || !ticket._id) {
      showAlert('Ticket ID is missing. Cannot submit response.', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Submitting response for ticket ID:', ticket._id);
      
      // Validate and sanitize the response message
      const sanitizedMessage = newResponse.trim();
      if (!sanitizedMessage) {
        showAlert('Response cannot be empty!', 'error');
        setLoading(false);
        return;
      }

      // Prepare the request data
      const requestData = {
        message: sanitizedMessage,
        status: ticket.status || 'Open',
        role: userRole
      };

      console.log('Sending request with data:', requestData);
      
      // Use PUT to update the ticket with a new response
      const response = await axios.put(`${API_URL}/api/tickets/${ticket._id}`, 
        requestData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data) {
        // Sort responses by creation time
        const updatedResponses = [...(response.data.responses || [])].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        setCurrentResponses(updatedResponses);
        setNewResponse('');
        showAlert('Response sent successfully!', 'success');
        
        // Emit WebSocket event for ticket update
        if (response.data) {
          try {
            websocketService.notifyEnterpriseAdmins('ticket_updated', response.data);
            if (ticket.submittedBy && ticket.submittedBy._id) {
              websocketService.notifyUser(ticket.submittedBy._id, 'ticket_updated_for_user', response.data);
            }
          } catch (wsError) {
            console.error('WebSocket notification error:', wsError);
            // Don't show error to user for WebSocket issues
          }
        }
        
        if (onResponseAdded) {
          onResponseAdded(); // Callback to refresh tickets in parent component
        }
      }
    } catch (error) {
      console.error('Error submitting response:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        ticketId: ticket._id,
        userRole: userRole
      });
      
      let errorMessage = 'Failed to send response.';
      
      if (error.response) {
        const serverError = error.response.data;
        errorMessage = serverError?.message || serverError?.error || 'Server error occurred. Please try again.';
        
        if (error.response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
          console.error('Server error details:', serverError);
        } else if (error.response.status === 404) {
          errorMessage = 'Ticket not found. Please refresh the page and try again.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to respond to this ticket.';
        } else if (error.response.status === 400) {
          errorMessage = serverError?.message || 'Invalid request. Please check your input and try again.';
        }
      } else if (error.request) {
        errorMessage = 'No response received from server. Please check your connection and try again.';
        console.error('No response received:', error.request);
      }
      
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="ticket-details-modal"
      overlayClassName="modal-overlay"
    >
      <div className="ticket-details-container">
        <div className="ticket-details-header">
          <h2>Ticket Details</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {alert.show && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        <div className="ticket-info">
          <div className="info-group">
            <label>Subject</label>
            <p>{ticket?.subject}</p>
          </div>
          <div className="info-group">
            <label>Status</label>
            <p className={`status ${ticket?.status?.toLowerCase()}`}>{ticket?.status}</p>
          </div>
          <div className="info-group">
            <label>Description</label>
            <p>{ticket?.description}</p>
          </div>
        </div>

        <div className="responses-section">
          <h3>Conversation</h3>
          <div className="responses-list">
            {currentResponses.length > 0 ? (
              currentResponses.map((response, index) => {
                console.log(`Response ${index} role:`, response.role); // DEBUG: Log each response's role
                return (
                <div 
                  key={index} 
                  className={`response-item ${response.role === 'superadmin' ? 'superadmin-response' : 'admin-response'}`}
                >
                  <div className="response-header">
                    <span className="response-role">
                      {response.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </span>
                    <span className="response-time">
                      {new Date(response.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="response-message">{response.message}</p>
                </div>
              )})
            ) : (
              <p className="no-responses">No messages yet. Start the conversation!</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmitResponse} className="response-form">
          <textarea
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            placeholder={`Type your message as ${userRole === 'superadmin' ? 'Super Admin' : 'Admin'}...`}
            rows="4"
            required
          />
          <button 
            type="submit" 
            className="submit-response-btn"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default TicketDetailsModal; 