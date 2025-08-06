import React from 'react';
import { Container, Typography, Alert } from '@mui/material';

const AdminUsers: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Manage Users
      </Typography>
      <Alert severity="info">
        User management interface - View users, change roles, and monitor activity
      </Alert>
    </Container>
  );
};

export default AdminUsers;