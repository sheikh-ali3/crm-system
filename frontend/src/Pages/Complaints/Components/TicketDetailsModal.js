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
      setCurrentResponses(ticket.responses || []);
    }
  }, [isOpen, ticket]);

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
      console.log('Submitting response for ticket ID:', ticket._id); // Keep this for debugging
      // Use PUT to update the ticket with a new response
      const response = await axios.put(`${API_URL}/api/tickets/${ticket._id}`, 
        { message: newResponse, status: ticket.status, role: userRole }, // Send message, current status, and user role
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setCurrentResponses(response.data.responses); // Update responses from the returned ticket
      setNewResponse('');
      showAlert('Response sent successfully!', 'success');
      // Emit WebSocket event for ticket update
      websocketService.notifyEnterpriseAdmins('ticket_updated', response.data); // Assuming response.data is the updated ticket object
      websocketService.notifyUser(ticket.submittedBy._id, 'ticket_updated_for_user', response.data);
      if (onResponseAdded) {
        onResponseAdded(); // Callback to refresh tickets in parent component
      }
    } catch (error) {
      console.error('Error submitting response:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to send response.';
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="Modal ticket-details-modal"
      overlayClassName="Overlay"
      contentLabel="Ticket Details"
    >
      {alert.show && (
        <div className={`alert alert-${alert.type} response-alert`}>
          {alert.message}
        </div>
      )}
      <div className="ticket-details-container">
        <div className="ticket-details-header">
          <h2>Ticket Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="ticket-info">
          <div className="info-group">
            <label>Subject:</label>
            <p>{ticket?.subject}</p>
          </div>
          <div className="info-group">
            <label>Status:</label>
            <p className={`status ${ticket?.status?.toLowerCase()}`}>
              {ticket?.status}
            </p>
          </div>
          <div className="info-group">
            <label>Created:</label>
            <p>{new Date(ticket?.createdAt).toLocaleString()}</p>
          </div>
          <div className="info-group">
            <label>Description:</label>
            <p>{ticket?.description}</p>
          </div>
        </div>

        <div className="responses-section">
          <h3>Responses</h3>
          <div className="responses-list">
            {currentResponses.length > 0 ? (
              currentResponses.map((response, index) => (
                <div 
                  key={index} 
                  className={`response-item ${response.role === userRole ? 'own-response' : 'other-response'}`}
                >
                  <div className="response-header">
                    <span className="response-role">{response.role}</span>
                    <span className="response-time">
                      {new Date(response.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="response-message">{response.message}</p>
                </div>
              ))
            ) : (
              <p className="no-responses">No responses yet.</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmitResponse} className="response-form">
          <textarea
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            placeholder="Type your response..."
            rows="4"
            required
          />
          <button 
            type="submit" 
            className="submit-response-btn"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Response'}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default TicketDetailsModal; 