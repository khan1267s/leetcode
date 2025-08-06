import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Edit, Save, Cancel } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  linkedinProfile: yup.string().url('Invalid URL').notRequired(),
  college: yup.string().notRequired(),
  batch: yup.string().notRequired(),
  company: yup.string().notRequired(),
});

interface ProfileFormData {
  name: string;
  linkedinProfile?: string;
  college?: string;
  batch?: string;
  company?: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name || '',
      linkedinProfile: user?.linkedinProfile || '',
      college: user?.college || '',
      batch: user?.batch || '',
      company: user?.company || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Container>
        <Alert severity="error">User not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ width: 80, height: 80, mr: 3 }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h5">{user.name}</Typography>
            <Typography variant="body1" color="text.secondary">
              {user.email}
            </Typography>
            <Chip
              label={user.role === 'admin' ? 'Admin' : 'Student'}
              size="small"
              color={user.role === 'admin' ? 'error' : 'primary'}
              sx={{ mt: 1 }}
            />
          </Box>
          {!isEditing && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={user.email}
                disabled
              />
            </Grid>
            {user.role === 'student' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="College"
                    {...register('college')}
                    error={!!errors.college}
                    helperText={errors.college?.message}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Batch"
                    {...register('batch')}
                    error={!!errors.batch}
                    helperText={errors.batch?.message}
                    disabled={!isEditing}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="LinkedIn Profile"
                {...register('linkedinProfile')}
                error={!!errors.linkedinProfile}
                helperText={errors.linkedinProfile?.message}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Company"
                {...register('company')}
                error={!!errors.company}
                helperText={errors.company?.message}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>

          {isEditing && (
            <Box display="flex" gap={2} mt={3}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
            </Box>
          )}
        </form>
      </Paper>

      {/* Statistics */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          My Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {user.solvedProblems?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Problems Solved
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {user.submissions?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Submissions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {new Date(user.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member Since
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProfilePage;