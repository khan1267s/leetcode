import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Box,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import { Search, People, Code } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Company } from '../types';

const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ['companies', page, search],
    queryFn: async () => {
      const response = await api.get('/companies', {
        params: {
          page,
          limit,
          search: search || undefined,
        },
      });
      return response.data;
    },
  });

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

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
      <Typography variant="h4" gutterBottom>
        Companies
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Explore companies and their interview processes
      </Typography>

      {/* Search Bar */}
      <Box my={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Companies Grid */}
      <Grid container spacing={3}>
        {data?.companies?.map((company: Company) => (
          <Grid item xs={12} sm={6} md={4} key={company._id}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() => navigate(`/companies/${company._id}`)}
                sx={{ height: '100%' }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={company.logo}
                  alt={company.name}
                  sx={{ objectFit: 'contain', p: 3, bgcolor: 'grey.100' }}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    {company.name}
                  </Typography>
                  {company.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {company.description}
                    </Typography>
                  )}
                  <Box display="flex" gap={1} mt={2}>
                    <Chip
                      icon={<People />}
                      label={`${company.placedStudentCount || 0} placed`}
                      size="small"
                      variant="outlined"
                    />
                    {company.problems && (
                      <Chip
                        icon={<Code />}
                        label={`${Array.isArray(company.problems) ? company.problems.length : 0} problems`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={data.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
};

export default CompaniesPage;