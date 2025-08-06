import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { PlayArrow, Send } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Problem, Submission } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [language, setLanguage] = useState<'c' | 'cpp'>('cpp');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['problem', id],
    queryFn: async () => {
      const response = await api.get(`/problems/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      // Set initial code
      setCode(data.problem.starterCode[language]);
    },
  });

  const runMutation = useMutation({
    mutationFn: async ({ problemId, code, language }: any) => {
      const response = await api.post('/submissions/run', {
        problemId,
        code,
        language,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setOutput(data.output);
      if (data.error) {
        toast.error(data.error);
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ problemId, code, language }: any) => {
      const response = await api.post('/submissions/submit', {
        problemId,
        code,
        language,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Code submitted successfully!');
      queryClient.invalidateQueries(['problem', id]);
      // Poll for submission status
      pollSubmissionStatus(data.submissionId);
    },
  });

  const pollSubmissionStatus = async (submissionId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const checkStatus = async () => {
      try {
        const response = await api.get(`/submissions/status/${submissionId}`);
        const submission = response.data.submission;

        if (submission.status === 'pending' || submission.status === 'running') {
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 2000);
          }
        } else {
          // Submission completed
          if (submission.status === 'accepted') {
            toast.success('All test cases passed!');
          } else {
            toast.error(`Submission failed: ${submission.status}`);
          }
          queryClient.invalidateQueries(['problem', id]);
        }
      } catch (error) {
        console.error('Error polling submission status:', error);
      }
    };

    checkStatus();
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput('Running...');
    try {
      await runMutation.mutateAsync({
        problemId: id,
        code,
        language,
      });
    } catch (error) {
      toast.error('Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        problemId: id,
        code,
        language,
      });
    } catch (error) {
      toast.error('Failed to submit code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLanguageChange = (newLanguage: 'c' | 'cpp') => {
    setLanguage(newLanguage);
    if (data?.problem?.starterCode[newLanguage]) {
      setCode(data.problem.starterCode[newLanguage]);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container>
        <Alert severity="error">Failed to load problem. Please try again later.</Alert>
      </Container>
    );
  }

  const { problem, submissions, solved } = data;

  return (
    <Container maxWidth={false} sx={{ height: 'calc(100vh - 120px)' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Problem Description */}
        <Grid item xs={12} md={5} sx={{ height: '100%', overflow: 'auto' }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h5">{problem.title}</Typography>
              <Chip
                label={problem.difficulty}
                size="small"
                color={
                  problem.difficulty === 'Easy'
                    ? 'success'
                    : problem.difficulty === 'Medium'
                    ? 'warning'
                    : 'error'
                }
              />
              {solved && <Chip label="Solved" size="small" color="primary" />}
            </Box>

            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Description" />
              <Tab label="Submissions" />
              <Tab label="Hints" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="body1" paragraph>
                {problem.description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Constraints
              </Typography>
              <Typography variant="body2" paragraph>
                {problem.constraints}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Sample Input
              </Typography>
              <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.100' }}>
                <pre style={{ margin: 0 }}>{problem.sampleInput}</pre>
              </Paper>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Sample Output
              </Typography>
              <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.100' }}>
                <pre style={{ margin: 0 }}>{problem.sampleOutput}</pre>
              </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <List>
                {submissions.map((submission: Submission) => (
                  <ListItem key={submission._id}>
                    <ListItemText
                      primary={submission.status}
                      secondary={new Date(submission.submittedAt).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {problem.hints?.map((hint: string, index: number) => (
                <Typography key={index} variant="body2" paragraph>
                  {index + 1}. {hint}
                </Typography>
              ))}
            </TabPanel>
          </Paper>
        </Grid>

        {/* Code Editor */}
        <Grid item xs={12} md={7} sx={{ height: '100%' }}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  label="Language"
                  onChange={(e) => handleLanguageChange(e.target.value as 'c' | 'cpp')}
                >
                  <MenuItem value="c">C</MenuItem>
                  <MenuItem value="cpp">C++</MenuItem>
                </Select>
              </FormControl>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrow />}
                  onClick={handleRun}
                  disabled={running || submitting}
                >
                  Run
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSubmit}
                  disabled={running || submitting}
                >
                  Submit
                </Button>
              </Box>
            </Box>

            <Box sx={{ flex: 1, mb: 2 }}>
              <Editor
                height="100%"
                language={language === 'c' ? 'c' : 'cpp'}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                }}
              />
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.900', color: 'white' }}>
              <Typography variant="subtitle2" gutterBottom>
                Output
              </Typography>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
            </Paper>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProblemDetailPage;