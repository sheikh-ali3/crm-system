import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const useErrorHandler = (showAlert) => {
  const navigate = useNavigate();

  const handleError = useCallback((error, customMessage = null) => {
    console.error('API Error:', error);

    // Handle network errors
    if (!error.response) {
      showAlert('Network error. Please check your connection.', 'error');
      return;
    }

    // Handle different HTTP status codes
    switch (error.response.status) {
      case 400:
        showAlert(error.response.data.message || 'Invalid request. Please check your input.', 'error');
        break;
      case 401:
        showAlert('Session expired. Please login again.', 'error');
        navigate('/login');
        break;
      case 403:
        showAlert('You do not have permission to perform this action.', 'error');
        navigate('/login');
        break;
      case 404:
        showAlert('Resource not found.', 'error');
        break;
      case 422:
        showAlert('Validation error. Please check your input.', 'error');
        break;
      case 429:
        showAlert('Too many requests. Please try again later.', 'error');
        break;
      case 500:
        showAlert('Server error. Please try again later.', 'error');
        break;
      default:
        showAlert(
          customMessage || 'An unexpected error occurred. Please try again.',
          'error'
        );
    }
  }, [navigate, showAlert]);

  return handleError;
};

export default useErrorHandler; 