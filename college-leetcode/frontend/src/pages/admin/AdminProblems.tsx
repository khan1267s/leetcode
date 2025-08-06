import React from 'react';
import { Container, Typography, Alert } from '@mui/material';

const AdminProblems: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Manage Problems
      </Typography>
      <Alert severity="info">
        Problem management interface - Add, edit, and delete coding problems
      </Alert>
    </Container>
  );
};

export default AdminProblems;