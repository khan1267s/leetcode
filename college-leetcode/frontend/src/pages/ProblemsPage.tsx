import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  TablePagination,
  IconButton,
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Problem } from '../types';

const ProblemsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['problems', page + 1, rowsPerPage, difficulty, category, search],
    queryFn: async () => {
      const response = await api.get('/problems', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          difficulty: difficulty || undefined,
          category: category || undefined,
          search: search || undefined,
        },
      });
      return response.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/problems/meta/categories');
      return response.data.categories;
    },
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'Hard':
        return 'error';
      default:
        return 'default';
    }
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
        <Alert severity="error">Failed to load problems. Please try again later.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Coding Problems
      </Typography>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={difficulty}
            label="Difficulty"
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Easy">Easy</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Hard">Hard</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {categories?.map((cat: string) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Problems Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="5%">Status</TableCell>
              <TableCell width="45%">Title</TableCell>
              <TableCell width="15%">Difficulty</TableCell>
              <TableCell width="20%">Category</TableCell>
              <TableCell width="15%">Acceptance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.problems?.map((problem: Problem) => (
              <TableRow
                key={problem._id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/problems/${problem._id}`)}
              >
                <TableCell>
                  <IconButton size="small">
                    {problem.solved ? (
                      <CheckCircle color="success" />
                    ) : (
                      <RadioButtonUnchecked />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">{problem.title}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={problem.difficulty}
                    size="small"
                    color={getDifficultyColor(problem.difficulty)}
                  />
                </TableCell>
                <TableCell>{problem.category}</TableCell>
                <TableCell>
                  {problem.submissionCount > 0
                    ? `${problem.acceptanceRate}%`
                    : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={data?.totalProblems || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Container>
  );
};

export default ProblemsPage;