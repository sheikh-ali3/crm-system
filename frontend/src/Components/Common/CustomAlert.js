import React from 'react';
import '../../Pages/AdminDashboard.css';

/**
 * CustomAlert Component
 * 
 * A reusable alert component for displaying messages to the user
 */
const CustomAlert = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div className={`alert ${type || 'info'}`}>
      {message}
      {onClose && (
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default CustomAlert; 