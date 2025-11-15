import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/dateFormatter';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { alertAPI } from "../services/api";
import { AlertMonitor, MonitorStatus } from "../types";

const AlertsList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [alerts, setAlerts] = useState<AlertMonitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
    // Poll every 5 seconds for updates
    const interval = setInterval(() => {
      fetchAlerts();
    }, 50000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alertAPI.list();
      setAlerts(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (monitorId: string) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    try {
      await alertAPI.delete(monitorId);
      setSuccess("Alert deleted successfully");
      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete alert");
    }
  };

  const getStatusColor = (status?: MonitorStatus) => {
    switch (status) {
      case "monitoring":
        return "info";
      case "approaching":
        return "warning";
      case "imminent":
        return "warning";
      case "triggered":
        return "success";
      case "aborted":
        return "error";
      case "completed":
        return "default";
      case "stopped":
        return "default";
      case "error":
        return "error";
      case "deleted":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='50vh'
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h4' fontWeight='bold'>
          Active Alerts
        </Typography>
        <Button
          variant='outlined'
          startIcon={!isMobile ? <RefreshIcon /> : undefined}
          onClick={fetchAlerts}
        >
          {isMobile ? <RefreshIcon /> : "Refresh"}
        </Button>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity='success'
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {alerts.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant='h6' color='text.secondary' gutterBottom>
            No alerts found
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Create a new alert from the Monitor page
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Match ID</strong>
                </TableCell>
                <TableCell>
                  <strong>Alert Description</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell>
                  <strong>Last Alert</strong>
                </TableCell>
                <TableCell>
                  <strong>Count</strong>
                </TableCell>
                <TableCell>
                  <strong>Created</strong>
                </TableCell>
                <TableCell align='center'>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow
                  key={alert.monitor_id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/alerts/${alert.monitor_id}`)}
                >
                  <TableCell>{alert.match_id}</TableCell>
                  <TableCell>
                    <Typography variant='body2' noWrap sx={{ maxWidth: 300 }}>
                      {alert.alert_text}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={alert.status || "unknown"}
                      color={getStatusColor(alert.status)}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    {alert.last_alert_message ? (
                      <Typography
                        variant='body2'
                        noWrap
                        sx={{ maxWidth: 250, fontStyle: "italic" }}
                      >
                        {alert.last_alert_message}
                      </Typography>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {alert.alerts_count !== undefined &&
                    alert.alerts_count > 0 ? (
                      <Chip
                        label={`${alert.alerts_count}`}
                        color='success'
                        size='small'
                        variant='outlined'
                      />
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        0
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {formatDateTime(alert.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align='center'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Stack direction='row'>
                      <IconButton
                        color='primary'
                        size='small'
                        onClick={() => navigate(`/alerts/${alert.monitor_id}`)}
                        title='View details'
                        sx={{ mr: 1 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        color='error'
                        size='small'
                        onClick={() => handleDelete(alert.monitor_id)}
                        title='Delete alert'
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AlertsList;
