import React, { useState } from 'react';
import './TicketDetail.css';

const TicketDetail = ({ ticket, onClose, onUpdate }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updatedTicket, setUpdatedTicket] = useState({ ...ticket });
  
  if (!ticket) {
    return (
      <div className="ticket-detail empty-detail">
        <div className="empty-detail-content">
          <h3>No Ticket Selected</h3>
          <p>Select a ticket from the list to view details</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'open': return 'status-open';
      case 'in progress': return 'status-progress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return 'status-open';
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Here you would typically call an API to add the message
    console.log('Sending message:', newMessage);
    
    // Simulating adding a message to the ticket
    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'Admin User',
      timestamp: new Date().toISOString(),
    };
    
    // Update the ticket with the new message
    const updatedMessages = [...(ticket.messages || []), message];
    onUpdate({ ...ticket, messages: updatedMessages });
    
    setNewMessage('');
  };

  const handleUpdateTicket = () => {
    onUpdate(updatedTicket);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedTicket({ ...updatedTicket, [name]: value });
  };

  return (
    <div className="ticket-detail">
      <div className="ticket-detail-header">
        <h3>Ticket Details</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      {isEditing ? (
        <div className="ticket-edit-form">
          <div className="form-group">
            <label>Subject</label>
            <input 
              type="text" 
              name="subject" 
              value={updatedTicket.subject} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select 
                name="priority" 
                value={updatedTicket.priority} 
                onChange={handleInputChange}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select 
                name="status" 
                value={updatedTicket.status} 
                onChange={handleInputChange}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Assigned To</label>
            <select 
              name="assignedTo" 
              value={updatedTicket.assignedTo ? updatedTicket.assignedTo.id : ''} 
              onChange={handleInputChange}
            >
              <option value="">Unassigned</option>
              <option value="user1">John Doe</option>
              <option value="user2">Jane Smith</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={updatedTicket.description} 
              onChange={handleInputChange}
              rows="4"
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button 
              className="cancel-btn" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button 
              className="save-btn" 
              onClick={handleUpdateTicket}
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="ticket-info">
            <div className="ticket-info-row">
              <div className="ticket-info-item">
                <span className="info-label">Ticket No</span>
                <span className="info-value">{ticket.id || ticket._id}</span>
              </div>
              <div className="ticket-info-item">
                <span className="info-label">Created On</span>
                <span className="info-value">
                  <div>{formatDate(ticket.createdAt)}</div>
                  <div className="time-value">{formatTime(ticket.createdAt)}</div>
                </span>
              </div>
            </div>
            
            <div className="ticket-info-row">
              <div className="ticket-info-item">
                <span className="info-label">Subject</span>
                <span className="info-value subject-value">{ticket.subject}</span>
              </div>
            </div>
            
            <div className="ticket-info-row">
              <div className="ticket-info-item">
                <span className="info-label">Priority</span>
                <span className={`info-value priority-badge ${getPriorityClass(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="ticket-info-item">
                <span className="info-label">Status</span>
                <span className={`info-value status-badge ${getStatusClass(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
            
            <div className="ticket-info-row">
              <div className="ticket-info-item">
                <span className="info-label">Assigned To</span>
                <span className="info-value">
                  {ticket.assignedTo ? (
                    <div className="assigned-user">
                      <div className="user-initial">
                        {ticket.assignedTo.name.charAt(0)}
                      </div>
                      {ticket.assignedTo.name}
                    </div>
                  ) : (
                    <span className="unassigned">Unassigned</span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="ticket-info-row">
              <div className="ticket-info-item full-width">
                <span className="info-label">Description</span>
                <div className="info-value description-box">
                  {ticket.description || 'No description provided.'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="ticket-actions">
            <button 
              className="edit-ticket-btn" 
              onClick={() => setIsEditing(true)}
            >
              Edit Ticket
            </button>
          </div>
          
          <div className="ticket-messages">
            <h4>Communication History</h4>
            <div className="messages-list">
              {ticket.messages && ticket.messages.length > 0 ? (
                ticket.messages.map(message => (
                  <div key={message.id} className="message-item">
                    <div className="message-header">
                      <span className="message-sender">{message.sender}</span>
                      <span className="message-time">
                        {formatDate(message.timestamp)} at {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="message-content">{message.text}</div>
                  </div>
                ))
              ) : (
                <div className="no-messages">No messages yet.</div>
              )}
            </div>
            
            <form className="new-message-form" onSubmit={handleSendMessage}>
              <textarea
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                required
              ></textarea>
              <button type="submit" className="send-message-btn">
                Send Message
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default TicketDetail; 