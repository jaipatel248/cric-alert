import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDateTime, formatTime } from '../utils/dateFormatter';
import { capitalize } from "lodash";
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
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { alertAPI } from "../services/api";
import { AlertMonitor, AlertType, MonitorStatus } from "../types";
import { useMonitorActions } from "../hooks/useMonitorActions";
import DeleteMonitorDialog from "../components/DeleteMonitorDialog";

const AlertDetail: React.FC = () => {
  const { monitorId } = useParams<{ monitorId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [monitor, setMonitor] = useState<AlertMonitor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    deleteMonitor,
    stopMonitor,
    startMonitor,
    loadingMonitorId,
    loadingAction,
  } = useMonitorActions();

  const fetchMonitorDetail = useCallback(async () => {
    if (!monitorId) return;
    try {
      const data = await alertAPI.get(monitorId);
      setMonitor(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch monitor details");
    } finally {
      setLoading(false);
    }
  }, [monitorId]);

  useEffect(() => {
    if (monitorId) {
      fetchMonitorDetail();
      // Poll every 10 seconds
      const interval = setInterval(() => {
        fetchMonitorDetail();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [monitorId, fetchMonitorDetail]);

  // Action handlers
  const handleStart = useCallback(async () => {
    if (!monitor) return;
    await startMonitor(
      monitor.monitor_id,
      (msg) => {
        setSuccess(msg);
        fetchMonitorDetail();
      },
      (err) => setError(err)
    );
  }, [monitor, startMonitor, fetchMonitorDetail]);

  const handleStop = useCallback(async () => {
    if (!monitor) return;
    await stopMonitor(
      monitor.monitor_id,
      (msg) => {
        setSuccess(msg);
        fetchMonitorDetail();
      },
      (err) => setError(err)
    );
  }, [monitor, stopMonitor, fetchMonitorDetail]);

  const handleDelete = useCallback(async () => {
    if (!monitor) return;
    await deleteMonitor(
      monitor.monitor_id,
      (msg) => {
        setSuccess(msg);
        navigate("/alerts");
      },
      (err) => setError(err)
    );
    setDeleteDialogOpen(false);
  }, [monitor, deleteMonitor, navigate]);

  const getStatusColor = useCallback((status?: MonitorStatus) => {
    switch (status) {
      case "monitoring":
        return "info";
      case "approaching":
        return "info";
      case "imminent":
        return "warning";
      case "triggered":
        return "success";
      case "aborted":
        return "error";
      case "completed":
        return "success";
      case "stopped":
        return "default";
      case "error":
        return "error";
      case "deleted":
        return "default";
      default:
        return "default";
    }
  }, []);

  const getAlertTypeColor = useCallback(
    (type: AlertType): "warning" | "error" | "success" | "info" => {
      switch (type) {
        case "SOFT_ALERT":
          return "info";
        case "HARD_ALERT":
          return "warning";
        case "TRIGGER":
          return "success";
        case "ABORTED":
          return "error";
        case "INFO":
          return "info";
      }
    },
    []
  );

  const getAlertTypeLabel = useCallback((type: AlertType): string => {
    switch (type) {
      case "SOFT_ALERT":
        return "Approaching";
      case "HARD_ALERT":
        return "Imminent";
      case "TRIGGER":
        return "Triggered";
      case "ABORTED":
        return "Aborted";
      case "INFO":
        return "Info";
    }
  }, []);

  const ballsToOvers = (estimatedBalls: number) => {
    const overs = Math.floor(estimatedBalls / 6); // full overs
    const balls = estimatedBalls % 6; // leftover balls
    return `${overs}.${balls}`;
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

  if (error || !monitor) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/alerts")}
          sx={{ mb: 2 }}
        >
          Back to Alerts
        </Button>
        <Alert severity='error'>{error || "Monitor not found"}</Alert>
      </Box>
    );
  }

  const isRunning =
    monitor.status === "monitoring" ||
    monitor.status === "initializing" ||
    monitor.status === "approaching" ||
    monitor.status === "imminent";

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
            disabled={loading}
            startIcon={!isMobile ? <RefreshIcon /> : undefined}
            onClick={fetchMonitorDetail}
          >
            {isMobile ? <RefreshIcon /> : "Refresh"}
          </Button>
          {monitor && (
            <>
              {monitor.status === "monitoring" ||
              monitor.status === "approaching" ||
              monitor.status === "imminent" ||
              monitor.status === "initializing" ? (
                <Button
                  variant='outlined'
                  color='warning'
                  onClick={handleStop}
                  disabled={loadingMonitorId === monitor.monitor_id}
                  startIcon={
                    loadingAction === "stop" &&
                    loadingMonitorId === monitor.monitor_id ? (
                      <CircularProgress size={16} />
                    ) : (
                      <StopIcon />
                    )
                  }
                >
                  {loadingAction === "stop" &&
                  loadingMonitorId === monitor.monitor_id
                    ? "Stopping..."
                    : "Stop"}
                </Button>
              ) : monitor.status === "stopped" || monitor.status === "error" ? (
                <Button
                  variant='outlined'
                  color='success'
                  onClick={handleStart}
                  disabled={loadingMonitorId === monitor.monitor_id}
                  startIcon={
                    loadingAction === "start" &&
                    loadingMonitorId === monitor.monitor_id ? (
                      <CircularProgress size={16} />
                    ) : (
                      <PlayArrowIcon />
                    )
                  }
                >
                  {loadingAction === "start" &&
                  loadingMonitorId === monitor.monitor_id
                    ? "Starting..."
                    : "Start"}
                </Button>
              ) : null}
              <Button
                variant='outlined'
                color='error'
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loadingMonitorId === monitor.monitor_id}
                startIcon={
                  loadingAction === "delete" &&
                  loadingMonitorId === monitor.monitor_id ? (
                    <CircularProgress size={16} />
                  ) : !isMobile ? (
                    <DeleteIcon />
                  ) : undefined
                }
              >
                {loadingAction === "delete" &&
                loadingMonitorId === monitor.monitor_id ? (
                  "Deleting..."
                ) : isMobile ? (
                  <DeleteIcon />
                ) : (
                  "Delete"
                )}
              </Button>
            </>
          )}
        </Box>
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
              label={capitalize(monitor.status || "unknown")}
              color={getStatusColor(monitor.status)}
              size='medium'
            />
          </Box>
          <Divider />

          {/* Grid layout for monitor info */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant='body2' color='text.secondary'>
                Alert Condition
              </Typography>
              <Typography variant='body1' fontWeight='medium'>
                {monitor.alert_text}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant='body2' color='text.secondary'>
                Status
              </Typography>
              <Typography variant='body1'>
                {isRunning ? "🟢 Running" : "🔴 Stopped"} ·{" "}
                {monitor.alerts_count || 0} alerts triggered
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant='body2' color='text.secondary'>
                Match ID
              </Typography>
              <Typography variant='body1' fontWeight='medium'>
                {monitor.match_id}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant='body2' color='text.secondary'>
                Created
              </Typography>
              <Typography variant='body1'>
                {formatDateTime(monitor.created_at)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
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
            </Grid>
          </Grid>

          {/* Next Check Estimation */}
          {monitor.expectedNextCheck && (
            <>
              <Divider />
              <Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  gutterBottom
                  sx={{ mb: 1.5 }}
                >
                  Next Check Estimation
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "info.lighter",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "info.light",
                  }}
                >
                  <Grid container spacing={2}>
                    {monitor.expectedNextCheck.estimatedMinutes !==
                      undefined && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box
                          display='flex'
                          alignItems='center'
                          gap={1}
                          sx={{
                            p: 1,
                            bgcolor: "background.paper",
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ minWidth: "fit-content" }}
                          >
                            ⏱️ Time:
                          </Typography>
                          <Typography variant='body2' fontWeight='medium'>
                            ~
                            {Math.round(
                              monitor.expectedNextCheck.estimatedMinutes * 60
                            )}
                            s (
                            {monitor.expectedNextCheck.estimatedMinutes.toFixed(
                              1
                            )}{" "}
                            min)
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {monitor.expectedNextCheck.estimatedBalls !== undefined && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box
                          display='flex'
                          alignItems='center'
                          gap={1}
                          sx={{
                            p: 1,
                            bgcolor: "background.paper",
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ minWidth: "fit-content" }}
                          >
                            📊 Overs:
                          </Typography>
                          <Typography variant='body2' fontWeight='medium'>
                            ~
                            {ballsToOvers(
                              monitor.expectedNextCheck.estimatedBalls
                            )}{" "}
                            overs
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {monitor.expectedNextCheck.reasoning && (
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: "background.paper",
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            display='block'
                            gutterBottom
                          >
                            💡 Reasoning:
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{ fontStyle: "italic" }}
                          >
                            {monitor.expectedNextCheck.reasoning}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>
            </>
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
                  {formatTime(monitor.created_at)}
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
                      {formatDateTime(alert.timestamp)}
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

      <DeleteMonitorDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        loading={
          loadingAction === "delete" && loadingMonitorId === monitor.monitor_id
        }
      />
    </Box>
  );
};

export default AlertDetail;
