import React, { createContext, useState, useEffect, useContext } from 'react';
import '../styles/theme.css';

// Theme context for managing light/dark mode
export const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if theme preference exists in localStorage, otherwise default to light
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('crm-theme');
    return savedTheme || 'light';
  });

  // Initialize theme on first load
  useEffect(() => {
    const savedTheme = localStorage.getItem('crm-theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, []);

  // Update the theme in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('crm-theme', theme);
    
    // Apply the theme to the body
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Force a re-render of components that might depend on CSS variables
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    // Notify about theme change
    console.log('Theme changed to:', theme);
  }, [theme]);

  // Function to toggle between light and dark mode
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easier access to the theme context
export const useTheme = () => useContext(ThemeContext); 