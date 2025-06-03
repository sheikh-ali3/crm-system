import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <h2>Welcome to the CRM System</h2>
      <p>Please log in to access your dashboard.</p>
      <Link to="/login">Go to Login Page</Link>
    </div>
  );
};

export default HomePage;
