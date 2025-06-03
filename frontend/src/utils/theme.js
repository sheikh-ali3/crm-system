// Theme configuration for the CRM application
// This defines standardized colors, typography, spacing, and other UI variables

const theme = {
  // Color palette
  colors: {
    // Primary colors
    primary: {
      main: '#3498db',
      light: '#5dade2',
      dark: '#2980b9',
      contrastText: '#ffffff',
    },
    // Secondary colors
    secondary: {
      main: '#2ecc71',
      light: '#58d68d',
      dark: '#27ae60',
      contrastText: '#ffffff',
    },
    // Status colors
    status: {
      success: '#2ecc71',
      warning: '#f39c12',
      danger: '#e74c3c',
      info: '#3498db',
      inactive: '#95a5a6',
    },
    // Neutral colors
    neutral: {
      main: '#ecf0f1',
      light: '#f8f9fa',
      dark: '#bdc3c7',
      darker: '#7f8c8d',
      text: '#2c3e50',
      textLight: '#7f8c8d',
    },
    // Background colors
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
      light: '#ecf0f1',
    },
    border: '#e1e5e8',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  // Typography
  typography: {
    fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      md: '1rem',        // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      xxl: '1.5rem',     // 24px
      xxxl: '2rem',      // 32px
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing system (in pixels)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
  },

  // Borders
  borders: {
    radius: {
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      round: '50%',
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '4px',
    },
  },

  // Shadows
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    lg: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    xl: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
  },

  // Z-index values
  zIndex: {
    navbar: 100,
    dropdown: 200,
    modal: 300,
    tooltip: 400,
  },

  // Transitions
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: '480px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px',
  },
};

export default theme; 