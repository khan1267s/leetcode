import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  Link,
  Divider,
  IconButton,
} from '@mui/material';
import {
  LinkedIn,
  School,
  Work,
  CalendarToday,
  Description,
  PlayCircleOutline,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Company, PlacedStudent, PreparationTip, Problem } from '../types';

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
      id={`company-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const response = await api.get(`/companies/${id}`);
      return response.data.company as Company;
    },
  });

  const { data: problems } = useQuery({
    queryKey: ['company', id, 'problems'],
    queryFn: async () => {
      const response = await api.get(`/companies/${id}/problems`);
      return response.data.problems as Problem[];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !company) {
    return (
      <Container>
        <Alert severity="error">Failed to load company details. Please try again later.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Company Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Box
              component="img"
              src={company.logo}
              alt={company.name}
              sx={{
                width: '100%',
                maxWidth: 200,
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <Typography variant="h4" gutterBottom>
              {company.name}
            </Typography>
            {company.description && (
              <Typography variant="body1" color="text.secondary" paragraph>
                {company.description}
              </Typography>
            )}
            {company.website && (
              <Link href={company.website} target="_blank" rel="noopener">
                Visit Website
              </Link>
            )}
            <Box display="flex" gap={1} mt={2}>
              <Chip label={`${company.placedStudents.length} Students Placed`} color="primary" />
              <Chip label={`${problems?.length || 0} Interview Questions`} color="secondary" />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Placed Students" />
          <Tab label="Interview Questions" />
          <Tab label="Preparation Tips" />
          <Tab label="Interview Process" />
        </Tabs>
      </Paper>

      {/* Placed Students */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          {company.placedStudents.map((student: PlacedStudent, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }}>
                      {typeof student.user === 'object' && student.user.name
                        ? student.user.name.charAt(0).toUpperCase()
                        : '?'}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6">
                        {typeof student.user === 'object' ? student.user.name : 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {student.role}
                      </Typography>
                    </Box>
                    {typeof student.user === 'object' && student.user.linkedinProfile && (
                      <IconButton
                        component="a"
                        href={student.user.linkedinProfile}
                        target="_blank"
                        rel="noopener"
                      >
                        <LinkedIn />
                      </IconButton>
                    )}
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      icon={<School />}
                      label={`Batch: ${student.batch}`}
                      size="small"
                      variant="outlined"
                    />
                    {student.package && (
                      <Chip
                        icon={<Work />}
                        label={`Package: ${student.package}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  {student.experience && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      {student.experience}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Interview Questions */}
      <TabPanel value={tabValue} index={1}>
        <List>
          {problems?.map((problem) => (
            <ListItem
              key={problem._id}
              button
              onClick={() => navigate(`/problems/${problem._id}`)}
            >
              <ListItemText
                primary={problem.title}
                secondary={
                  <Box display="flex" gap={1} mt={0.5}>
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
                    <Chip label={problem.category} size="small" variant="outlined" />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </TabPanel>

      {/* Preparation Tips */}
      <TabPanel value={tabValue} index={2}>
        {company.preparationTips.map((tip: PreparationTip, index) => (
          <Paper key={index} sx={{ p: 3, mb: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ mr: 2 }}>
                {typeof tip.author === 'object' && tip.author.name
                  ? tip.author.name.charAt(0).toUpperCase()
                  : '?'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {typeof tip.author === 'object' ? tip.author.name : 'Anonymous'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(tip.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" paragraph>
              {tip.content}
            </Typography>
            {tip.resources.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Resources:
                </Typography>
                <List dense>
                  {tip.resources.map((resource, idx) => (
                    <ListItem key={idx}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 30, height: 30 }}>
                          <Description fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Link href={resource.url} target="_blank" rel="noopener">
                            {resource.title}
                          </Link>
                        }
                        secondary={resource.type}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        ))}
      </TabPanel>

      {/* Interview Process */}
      <TabPanel value={tabValue} index={3}>
        {company.interviewProcess ? (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Interview Process Overview
            </Typography>
            <Box mb={2}>
              <Chip
                icon={<CalendarToday />}
                label={`Duration: ${company.interviewProcess.duration}`}
                sx={{ mr: 1 }}
              />
              <Chip
                label={`Difficulty: ${company.interviewProcess.difficulty}`}
                color={
                  company.interviewProcess.difficulty === 'Easy'
                    ? 'success'
                    : company.interviewProcess.difficulty === 'Medium'
                    ? 'warning'
                    : 'error'
                }
              />
            </Box>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              Interview Rounds:
            </Typography>
            <List>
              {company.interviewProcess.rounds.map((round, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar>{index + 1}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={round.name}
                    secondary={
                      <>
                        <Typography variant="body2">{round.description}</Typography>
                        <Chip
                          label={round.type.replace('_', ' ').toUpperCase()}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No interview process information available yet.
          </Typography>
        )}
      </TabPanel>
    </Container>
  );
};

export default CompanyDetailPage;