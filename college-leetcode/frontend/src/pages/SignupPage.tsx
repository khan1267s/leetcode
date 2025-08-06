import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  role: yup.string().oneOf(['student', 'admin']).default('student'),
  college: yup.string().when('role', {
    is: 'student',
    then: (schema) => schema.required('College is required for students'),
    otherwise: (schema) => schema.notRequired(),
  }),
  batch: yup.string().when('role', {
    is: 'student',
    then: (schema) => schema.required('Batch is required for students'),
    otherwise: (schema) => schema.notRequired(),
  }),
  linkedinProfile: yup.string().url('Invalid URL').notRequired(),
});

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'admin';
  college?: string;
  batch?: string;
  linkedinProfile?: string;
}

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'student',
    },
  });

  const role = watch('role');

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError('');
      setLoading(true);
      const { confirmPassword, ...signupData } = data;
      await signup(signupData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center">
            College LeetCode
          </Typography>
          <Typography component="h2" variant="h6" align="center" sx={{ mb: 3 }}>
            Sign Up
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              autoComplete="name"
              autoFocus
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            
            <FormControl fullWidth margin="normal" error={!!errors.role}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                label="Role"
                defaultValue="student"
                {...register('role')}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
              {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
            </FormControl>

            {role === 'student' && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="college"
                  label="College Name"
                  {...register('college')}
                  error={!!errors.college}
                  helperText={errors.college?.message}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="batch"
                  label="Batch (e.g., 2024)"
                  {...register('batch')}
                  error={!!errors.batch}
                  helperText={errors.batch?.message}
                />
              </>
            )}
            
            <TextField
              margin="normal"
              fullWidth
              id="linkedinProfile"
              label="LinkedIn Profile URL (Optional)"
              {...register('linkedinProfile')}
              error={!!errors.linkedinProfile}
              helperText={errors.linkedinProfile?.message}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            <Box textAlign="center">
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Already have an account? Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupPage;