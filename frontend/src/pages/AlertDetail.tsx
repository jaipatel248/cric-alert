import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { alertAPI } from '../services/api';
import { AlertMonitor, AlertType, MonitorStatus } from '../types';

const AlertDetail: React.FC = () => {
  const { monitorId } = useParams<{ monitorId: string }>();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState<AlertMonitor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (monitorId) {
      fetchMonitorDetail();
      // Poll every 3 seconds
      const interval = setInterval(() => {
        fetchMonitorDetail();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [monitorId]);

  const fetchMonitorDetail = async () => {
    if (!monitorId) return;
    
    try {
      const data = await alertAPI.get(monitorId);
      setMonitor(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch monitor details');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!monitorId || !window.confirm('Are you sure you want to delete this monitor?')) {
      return;
    }

    try {
      await alertAPI.delete(monitorId);
      navigate('/alerts');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete monitor');
    }
  };

  const getStatusColor = (status?: MonitorStatus) => {
    switch (status) {
      case 'monitoring': return 'info';
      case 'approaching': return 'warning';
      case 'imminent': return 'warning';
      case 'triggered': return 'success';
      case 'aborted': return 'error';
      case 'completed': return 'default';
      case 'stopped': return 'default';
      case 'error': return 'error';
      case 'deleted': return 'default';
      default: return 'default';
    }
  };

  const getAlertTypeColor = (type: AlertType): 'warning' | 'error' | 'success' | 'info' => {
    switch (type) {
      case 'SOFT_ALERT': return 'info';
      case 'HARD_ALERT': return 'warning';
      case 'TRIGGER': return 'success';
      case 'ABORTED': return 'error';
      case 'INFO': return 'info';
    }
  };

  const getAlertTypeLabel = (type: AlertType): string => {
    switch (type) {
      case 'SOFT_ALERT': return 'Approaching';
      case 'HARD_ALERT': return 'Imminent';
      case 'TRIGGER': return 'Triggered';
      case 'ABORTED': return 'Aborted';
      case 'INFO': return 'Info';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !monitor) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/alerts')} sx={{ mb: 2 }}>
          Back to Alerts
        </Button>
        <Alert severity="error">{error || 'Monitor not found'}</Alert>
      </Box>
    );
  }

  const isRunning = monitor.status === 'monitoring' || 
                    monitor.status === 'approaching' || 
                    monitor.status === 'imminent';

  return (
    <Box>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <IconButton onClick={() => navigate("/alerts")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant='h4' fontWeight='bold'>
            Alert Details
          </Typography>
        </Box>
        <Box display='flex' gap={1}>
          <Button
            variant='outlined'
            startIcon={<RefreshIcon />}
            onClick={fetchMonitorDetail}
          >
            Refresh
          </Button>
          <Button
            variant='outlined'
            color='error'
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Monitor Info Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='h6'>Monitor Information</Typography>
            <Chip
              label={monitor.status || "unknown"}
              color={getStatusColor(monitor.status)}
              size='medium'
            />
          </Box>
          <Divider />
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Alert Condition
            </Typography>
            <Typography variant='body1' fontWeight='medium'>
              {monitor.alert_text}
            </Typography>
          </Box>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Match ID
            </Typography>
            <Typography variant='body1' fontWeight='medium'>
              {monitor.match_id}
            </Typography>
          </Box>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Monitor ID
            </Typography>
            <Typography
              variant='body1'
              fontWeight='medium'
              sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}
            >
              {monitor.monitor_id}
            </Typography>
          </Box>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Created
            </Typography>
            <Typography variant='body1'>
              {new Date(monitor.created_at).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Status
            </Typography>
            <Typography variant='body1'>
              {isRunning ? "🟢 Running" : "🔴 Stopped"} ·{" "}
              {monitor.alerts_count || 0} alerts triggered
            </Typography>
          </Box>
          {monitor.last_alert_message && (
            <Box>
              <Typography variant='body2' color='text.secondary'>
                Latest Alert
              </Typography>
              <Typography
                variant='body1'
                fontStyle='italic'
                color='success.main'
              >
                {monitor.last_alert_message}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Chat-like Alerts View */}
      <Paper sx={{ p: 3, bgcolor: "grey.50", minHeight: "60vh" }}>
        <Typography variant='h6' gutterBottom>
          Alert Timeline
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Stack spacing={2}>
          {/* User's original alert (right side) */}
          <Box display='flex' justifyContent='flex-end'>
            <Card
              sx={{ maxWidth: "70%", bgcolor: "primary.main", color: "white" }}
            >
              <CardContent>
                <Typography variant='body2' sx={{ mb: 1, opacity: 0.8 }}>
                  Your Alert
                </Typography>
                <Typography variant='body1'>{monitor.alert_text}</Typography>
                <Typography
                  variant='caption'
                  sx={{ mt: 1, display: "block", opacity: 0.7 }}
                >
                  {new Date(monitor.created_at).toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* System alerts (left side) */}
          {monitor.recent_alerts && monitor.recent_alerts.length > 0 ? (
            monitor.recent_alerts.map((alert, index) => (
              <Box key={index} display='flex' justifyContent='flex-start'>
                <Card sx={{ maxWidth: "70%", bgcolor: "white" }}>
                  <CardContent>
                    <Box display='flex' alignItems='center' gap={1} mb={1}>
                      <Chip
                        label={getAlertTypeLabel(alert.type)}
                        color={getAlertTypeColor(alert.type)}
                        size='small'
                      />
                      {alert.entityType && (
                        <Chip
                          label={alert.entityType}
                          variant='outlined'
                          size='small'
                        />
                      )}
                    </Box>
                    <Typography variant='body1' sx={{ mb: 1 }}>
                      {alert.message}
                    </Typography>
                    {alert.context && Object.keys(alert.context).length > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          bgcolor: "grey.100",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant='caption' color='text.secondary'>
                          Context:
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          {alert.context.currentValue !== undefined && (
                            <Typography variant='caption'>
                              Current:{" "}
                              <strong>{alert.context.currentValue}</strong>
                            </Typography>
                          )}
                          {alert.context.target !== undefined && (
                            <Typography variant='caption'>
                              Target: <strong>{alert.context.target}</strong>
                            </Typography>
                          )}
                          {alert.context.runsToTarget !== undefined && (
                            <Typography variant='caption'>
                              To Go:{" "}
                              <strong>{alert.context.runsToTarget}</strong>
                            </Typography>
                          )}
                          {alert.context.overNumber !== undefined && (
                            <Typography variant='caption'>
                              Over: <strong>{alert.context.overNumber}</strong>
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ mt: 1, display: "block" }}
                    >
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))
          ) : (
            <Box textAlign='center' py={4}>
              <Typography variant='body1' color='text.secondary'>
                No alerts triggered yet. Monitoring in progress...
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default AlertDetail;
