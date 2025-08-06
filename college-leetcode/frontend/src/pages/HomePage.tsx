import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Business, Group, Code } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Company } from '../types';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies', 'featured'],
    queryFn: async () => {
      const response = await api.get('/companies', {
        params: { limit: 12 }
      });
      return response.data.companies as Company[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['user', 'stats'],
    queryFn: async () => {
      const response = await api.get('/problems/stats/overview');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">Failed to load companies. Please try again later.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Prepare for your dream company's coding interviews
        </Typography>
      </Box>

      {/* Stats Section */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Code sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5">{stats.solvedProblems}/{stats.totalProblems}</Typography>
              <Typography variant="body2" color="text.secondary">Problems Solved</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Business sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5">{companies?.length || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Companies</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Group sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5">{stats.solvingRate}%</Typography>
              <Typography variant="body2" color="text.secondary">Success Rate</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Company Preparation Section */}
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Company-wise Preparation
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Click on a company to see previous years' questions, placed students, and preparation tips
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {companies?.map((company) => (
          <Grid item xs={6} sm={4} md={3} key={company._id}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea onClick={() => navigate(`/companies/${company._id}`)}>
                <CardMedia
                  component="img"
                  height="140"
                  image={company.logo}
                  alt={company.name}
                  sx={{ objectFit: 'contain', p: 2, bgcolor: 'grey.100' }}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {company.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={`${company.placedStudentCount || 0} placed`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box mt={6} mb={4}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
              onClick={() => navigate('/problems')}
            >
              <CardContent>
                <Typography variant="h6">Practice Problems</Typography>
                <Typography variant="body2" color="text.secondary">
                  Solve coding problems to improve your skills
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
              onClick={() => navigate('/companies')}
            >
              <CardContent>
                <Typography variant="h6">Browse All Companies</Typography>
                <Typography variant="body2" color="text.secondary">
                  See all companies and their interview processes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
              onClick={() => navigate('/profile')}
            >
              <CardContent>
                <Typography variant="h6">Update Profile</Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep your profile up to date
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;