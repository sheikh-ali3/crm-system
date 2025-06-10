import React from 'react';
import './TicketList.css';

const TicketList = ({ tickets, onSelectTicket, onManageTicket, onDeleteTicket, onViewTicket, loading, error, userRole }) => {
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get priority color class
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'Critical':
        return 'priority-critical';
      case 'High': 
        return 'priority-high';
      case 'Medium':
        return 'priority-medium';
      case 'Low':
      default:
        return 'priority-low';
    }
  };

  // Get status color class
  const getStatusClass = (status) => {
    switch(status) {
      case 'Open':
        return 'status-open';
      case 'In Progress': 
        return 'status-progress';
      case 'Resolved':
        return 'status-resolved';
      case 'Closed':
      default:
        return 'status-closed';
    }
  };

  if (loading) {
    return (
      <div className="ticket-list">
        <div className="loading">Loading tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-list">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ticket-list">
      <div className="ticket-list-header">
        <div className="ticket-header-item ticket-id">Ticket No</div>
        <div className="ticket-header-item ticket-subject">Subject</div>
        <div className="ticket-header-item ticket-priority">Priority</div>
        <div className="ticket-header-item ticket-status">Status</div>
        <div className="ticket-header-item ticket-date">Created On</div>
        <div className="ticket-header-item ticket-assigned">Assigned To</div>
        <div className="ticket-header-item ticket-enterprise">Enterprise</div>
        <div className="ticket-header-item ticket-actions">Actions</div>
      </div>
      
      {tickets.length === 0 ? (
        <div className="no-tickets">
          <p>No tickets found.</p>
          <p className="no-tickets-sub">Create a new ticket to get started.</p>
        </div>
      ) : (
        <div className="ticket-list-body">
          {tickets.map(ticket => (
            <div 
              key={ticket._id} 
              className="ticket-row"
              // onClick={() => onSelectTicket(ticket)} // Row click might interfere with button clicks
            >
              <div className="ticket-cell ticket-id">{ticket.ticketNo || 'TKT-000'}</div>
              <div className="ticket-cell ticket-subject">{ticket.subject}</div>
              <div className="ticket-cell ticket-priority">
                <span className={`priority-badge ${getPriorityClass(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="ticket-cell ticket-status">
                <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              <div className="ticket-cell ticket-date">{formatDate(ticket.createdAt)}</div>
              <div className="ticket-cell ticket-assigned">
                {ticket.adminId ? (
                  <div className="assigned-user">
                    <div className="user-initial">
                      {ticket.adminId.profile?.fullName ? ticket.adminId.profile.fullName.charAt(0) : '?'}
                    </div>
                    <span>{ticket.adminId.profile?.fullName || 'Unknown'}</span>
                  </div>
                ) : (
                  <span className="unassigned">Unassigned</span>
                )}
              </div>
              <div className="ticket-cell ticket-enterprise">
                {ticket.submittedBy?.enterprise?.companyName || 'N/A'}
              </div>
              <div className="ticket-cell ticket-actions">
                <button
                  className="view-ticket-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewTicket(ticket);
                  }}
                >
                  View
                </button>
                {userRole === 'superadmin' && (
                  <button
                    className="manage-ticket-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onManageTicket(ticket);
                    }}
                  >
                    Manage
                  </button>
                )}
                <button 
                  className="delete-ticket-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click from triggering
                    onDeleteTicket(ticket._id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketList; 