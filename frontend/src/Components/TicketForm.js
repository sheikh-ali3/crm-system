import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TicketForm.css';

const TicketForm = ({ ticketForm, handleTicketFormChange, handleSubmitTicket, onClose, onSuccess }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when component mounts or when ticketForm changes
  useEffect(() => {
    if (ticketForm && Object.values(ticketForm).every(value => value === '' || value === 'Low')) {
      setAttachments([]);
      setError('');
    }
  }, [ticketForm]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }
    setAttachments(Array.from(e.target.files));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data - only check fields that are in this form
      const requiredFields = ['subject', 'category', 'description'];
      const missingFields = requiredFields.filter(field => !ticketForm[field] || ticketForm[field].trim() === '');
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Call the handleSubmitTicket function passed from parent
      await handleSubmitTicket();
      
      // If successful, call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset attachments
      setAttachments([]);
      setError('');
      
    } catch (error) {
      console.error('Ticket submission error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Failed to submit ticket';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticket-form-container">
      <h2>Create New Ticket</h2>
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Subject Issue <span className="required">*</span></label>
          <input
            type="text"
            name="subject"
            value={ticketForm.subject || ''}
            onChange={handleTicketFormChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Category <span className="required">*</span></label>
          <select
            name="category"
            value={ticketForm.category || ''}
            onChange={handleTicketFormChange}
            required
          >
            <option value="">Select category</option>
            <option value="Technical">Technical</option>
            <option value="Billing">Billing</option>
            <option value="Product">Product</option>
            <option value="Service">Service</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description <span className="required">*</span></label>
          <textarea
            name="description"
            value={ticketForm.description || ''}
            onChange={handleTicketFormChange}
            required
            rows="5"
          />
        </div>

        <div className="form-group">
          <label>Priority</label>
          <select
            name="priority"
            value={ticketForm.priority || 'Low'}
            onChange={handleTicketFormChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="form-group">
          <label>Attachments (Max 5 files)</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm; 