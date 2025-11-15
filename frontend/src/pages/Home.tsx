import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SportsIcon from '@mui/icons-material/Sports';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SpeedIcon from '@mui/icons-material/Speed';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { healthAPI } from '../services/api';
import { HealthResponse } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const data = await healthAPI.check();
      setHealthStatus(data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const features = [
    {
      icon: <SmartToyIcon fontSize="large" color="primary" />,
      title: 'Natural Language',
      description: 'Define alerts in plain English - AI understands your intent',
    },
    {
      icon: <NotificationsActiveIcon fontSize="large" color="secondary" />,
      title: 'Real-time Alerts',
      description: 'Get notified instantly when your conditions are met',
    },
    {
      icon: <SpeedIcon fontSize="large" color="success" />,
      title: 'Adaptive Polling',
      description: 'Smart frequency adjustment based on match activity',
    },
    {
      icon: <SportsIcon fontSize="large" color="info" />,
      title: 'Multiple Alert Types',
      description: 'Player milestones, team targets, wickets, and more',
    },
  ];

  const examples = [
    'Notify me when Virat Kohli is within 5 runs of a century',
    'Alert when India crosses 200 runs',
    'Tell me when any bowler takes 5 wickets',
    'Alert on every wicket',
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        elevation={3}
        sx={{
          p: 6,
          mb: 4,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          🏏 Cric Alert
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, opacity: 0.9 }}>
          Never miss a moment in cricket. Set custom alerts and stay updated!
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/monitor')}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'grey.100',
            },
            px: 4,
            py: 1.5,
          }}
        >
          Start Monitoring
        </Button>
      </Paper>

      {/* Health Status */}
      {healthStatus && (
        <Alert severity="success" sx={{ mb: 4 }}>
          <strong>API Status:</strong> {healthStatus.status} • 
          Version: {healthStatus.version} • 
          Uptime: {Math.floor(healthStatus.uptime)}s
        </Alert>
      )}

      {/* Features Grid */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Features
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 6 }}>
        {features.map((feature, index) => (
          <Card
            key={index}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
              <Box sx={{ mb: 2 }}>{feature.icon}</Box>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Example Alerts */}
      <Paper sx={{ p: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Example Alerts
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Here are some examples of alerts you can create:
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          {examples.map((example, index) => (
            <Chip
              key={index}
              label={example}
              sx={{
                height: 'auto',
                py: 1,
                px: 2,
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                },
              }}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Paper>

      {/* How to Find Match ID */}
      <Paper sx={{ p: 4, mt: 4, bgcolor: 'info.lighter' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          📝 How to Find Match ID
        </Typography>
        <Typography variant="body2" paragraph>
          1. Go to{' '}
          <a href="https://www.cricbuzz.com/cricket-match/live-scores" target="_blank" rel="noopener noreferrer">
            Cricbuzz Live Scores
          </a>
        </Typography>
        <Typography variant="body2" paragraph>
          2. Click on any live or recent match
        </Typography>
        <Typography variant="body2" paragraph>
          3. Look at the URL:
        </Typography>
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.9rem',
          }}
        >
          https://www.cricbuzz.com/live-cricket-scores/<strong>119888</strong>/ind-vs-aus-1st-test
          <br />
          <Typography variant="caption" color="text.secondary">
            ↑ This is your Match ID
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
