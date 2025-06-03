import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Button, Typography, Paper } from '@mui/material';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Welcome to CRM System
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4 }}>
            Please select your login type to access your dashboard
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ 
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' }
              }}
            >
              Admin / User Login
            </Button>
            
            <Typography variant="body2" sx={{ my: 1 }}>
              OR
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/superadmin/login')}
              sx={{ 
                backgroundColor: '#2e7d32',
                '&:hover': { backgroundColor: '#1b5e20' }
              }}
            >
              Super Admin Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;