import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
} from '@mui/material';
import {
  People,
  Code,
  Business,
  Assignment,
  TrendingUp,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
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
        <Alert severity="error">Failed to load dashboard data. Please try again later.</Alert>
      </Container>
    );
  }

  const formatChartData = () => {
    if (!stats?.userGrowth) return [];
    return stats.userGrowth.map((item: any) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      users: item.count,
    })).reverse();
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4">{stats?.totalUsers || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Students
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Code sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h4">{stats?.totalProblems || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Problems
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4">{stats?.totalSubmissions || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Submissions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Business sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4">{stats?.totalCompanies || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Companies
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* User Growth Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Growth (Last 12 Months)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#1976d2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Submissions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Submissions
            </Typography>
            <List>
              {stats?.recentSubmissions?.slice(0, 5).map((submission: any) => (
                <ListItem key={submission._id}>
                  <ListItemAvatar>
                    <Avatar>
                      {submission.user?.name?.charAt(0).toUpperCase() || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={submission.problem?.title || 'Unknown Problem'}
                    secondary={submission.user?.name || 'Unknown User'}
                  />
                  <Chip
                    icon={submission.status === 'accepted' ? <CheckCircle /> : <Cancel />}
                    label={submission.status}
                    size="small"
                    color={submission.status === 'accepted' ? 'success' : 'error'}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => window.location.href = '/admin/problems'}
            >
              <Code sx={{ fontSize: 30, mb: 1 }} />
              <Typography>Manage Problems</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => window.location.href = '/admin/companies'}
            >
              <Business sx={{ fontSize: 30, mb: 1 }} />
              <Typography>Manage Companies</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => window.location.href = '/admin/users'}
            >
              <People sx={{ fontSize: 30, mb: 1 }} />
              <Typography>Manage Users</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminDashboard;