import React from 'react';
import { Container, Typography, Alert } from '@mui/material';

const AdminCompanies: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Manage Companies
      </Typography>
      <Alert severity="info">
        Company management interface - Add, edit companies and manage placed students
      </Alert>
    </Container>
  );
};

export default AdminCompanies;