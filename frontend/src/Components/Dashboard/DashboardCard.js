import React from 'react';

/**
 * DashboardCard Component
 * 
 * A reusable card component for dashboard items
 */
const DashboardCard = ({ title, icon, children, onClick }) => {
  return (
    <div className="dashboard-card" onClick={onClick}>
      {icon && <div className="card-icon">{icon}</div>}
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
};

export default DashboardCard; 