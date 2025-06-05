import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ComplaintsSection.css';

const ComplaintsSection = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [editingResponse, setEditingResponse] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await axios.get(`${apiUrl}/api/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setTickets(response.data);
    } catch (error) {
      setError('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddResponse = async (ticketId) => {
    if (!response.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      await axios.post(`${apiUrl}/api/tickets/${ticketId}/responses`, {
        message: response
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setResponse('');
      fetchTickets();
    } catch (error) {
      setError('Failed to add response');
    }
  };

  const handleUpdateResponse = async (ticketId, responseId) => {
    if (!response.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      await axios.put(`${apiUrl}/api/tickets/${ticketId}/responses/${responseId}`, {
        message: response
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setResponse('');
      setEditingResponse(null);
      fetchTickets();
    } catch (error) {
      setError('Failed to update response');
    }
  };

  const handleDeleteResponse = async (ticketId, responseId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      await axios.delete(`${apiUrl}/api/tickets/${ticketId}/responses/${responseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      fetchTickets();
    } catch (error) {
      setError('Failed to delete response');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div className="loading">Loading tickets...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="complaints-section">
      <h2>Complaints & Support Tickets</h2>
      
      <div className="tickets-list">
        {tickets.map(ticket => (
          <div key={ticket._id} className="ticket-card">
            <div className="ticket-header">
              <h3>{ticket.subject}</h3>
              <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
            </div>
            
            <div className="ticket-details">
              <p><strong>From:</strong> {ticket.name} ({ticket.email})</p>
              <p><strong>Department:</strong> {ticket.department}</p>
              <p><strong>Related To:</strong> {ticket.relatedTo}</p>
              <p><strong>Message:</strong> {ticket.message}</p>
              
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="attachments">
                  <strong>Attachments:</strong>
                  <ul>
                    {ticket.attachments.map((attachment, index) => (
                      <li key={index}>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          {attachment.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="responses-section">
              <h4>Responses</h4>
              {ticket.responses && ticket.responses.map(response => (
                <div key={response._id} className="response">
                  <div className="response-header">
                    <span className="response-date">{formatDate(response.createdAt)}</span>
                    <div className="response-actions">
                      <button
                        onClick={() => {
                          setEditingResponse(response._id);
                          setResponse(response.message);
                        }}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteResponse(ticket._id, response._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p>{response.message}</p>
                </div>
              ))}

              <div className="add-response">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response..."
                  rows="3"
                />
                <button
                  onClick={() => {
                    if (editingResponse) {
                      handleUpdateResponse(ticket._id, editingResponse);
                    } else {
                      handleAddResponse(ticket._id);
                    }
                  }}
                  className="btn-submit"
                >
                  {editingResponse ? 'Update Response' : 'Add Response'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintsSection; 