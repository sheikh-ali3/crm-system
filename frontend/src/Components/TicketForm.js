import React, { useState } from 'react';
import axios from 'axios';
import './TicketForm.css';

const TicketForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    department: '',
    relatedTo: '',
    message: '',
    priority: 'Medium',
    category: 'Other'
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
      // Validate form data
      const requiredFields = ['name', 'email', 'subject', 'department', 'relatedTo', 'message'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      console.log('Submitting ticket with data:', {
        ...formData,
        attachmentsCount: attachments.length
      });

      const response = await axios.post(`${apiUrl}/api/tickets`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Ticket submission response:', response.data);

      if (response.data) {
        onSuccess();
        onClose();
      }
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
          <label>Name <span className="required">*</span></label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email <span className="required">*</span></label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Subject Issue <span className="required">*</span></label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Department <span className="required">*</span></label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Related Products/Service <span className="required">*</span></label>
          <input
            type="text"
            name="relatedTo"
            value={formData.relatedTo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="Technical">Technical</option>
            <option value="Billing">Billing</option>
            <option value="Product">Product</option>
            <option value="Service">Service</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Message <span className="required">*</span></label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows="5"
          />
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