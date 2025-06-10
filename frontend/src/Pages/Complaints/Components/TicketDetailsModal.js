import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import './TicketDetailsModal.css';

const TicketDetailsModal = ({ isOpen, onClose, ticket, userRole }) => {
  const [responses, setResponses] = useState([]);
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ticket) {
      fetchResponses();
    }
  }, [isOpen, ticket]);

  const fetchResponses = async () => {
    try {
      const response = await axios.get(`/api/complaints/${ticket._id}/responses`);
      setResponses(response.data);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!newResponse.trim()) return;

    setLoading(true);
    try {
      await axios.post(`/api/complaints/${ticket._id}/responses`, {
        message: newResponse,
        role: userRole
      });
      setNewResponse('');
      fetchResponses(); // Refresh responses
    } catch (error) {
      console.error('Error submitting response:', error);
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