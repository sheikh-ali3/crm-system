import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import './TicketDetailsModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TicketDetailsModal = ({ isOpen, onClose, ticket, userRole }) => {
  const [responses, setResponses] = useState([]);
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (isOpen && ticket) {
      fetchResponses();
    }
  }, [isOpen, ticket]);

  const fetchResponses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/complaints/${ticket._id}/responses`);
      setResponses(response.data);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

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

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/complaints/${ticket._id}/responses`, {
        message: newResponse,
        role: userRole
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNewResponse('');
      fetchResponses(); // Refresh responses
      showAlert('Response sent successfully!', 'success');
    } catch (error) {
      console.error('Error submitting response:', error.response?.data || error.message);
      showAlert(error.response?.data?.message || 'Failed to send response.', 'error');
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
            {responses.map((response, index) => (
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
            ))}
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