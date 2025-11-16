import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/dateFormatter';
import { capitalize } from "lodash";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Alert,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { alertAPI } from "../services/api";
import { AlertMonitor, MonitorStatus } from "../types";
import { useMonitorActions } from "../hooks/useMonitorActions";
import DeleteMonitorDialog from "../components/DeleteMonitorDialog";

const AlertsList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [alerts, setAlerts] = useState<AlertMonitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(
    null
  );
  const { deleteMonitor, stopMonitor, startMonitor, loadingMonitorId, loadingAction } =
    useMonitorActions();

  const fetchAlerts = useCallback(async () => {
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
  }, []);

  // Action handlers
  const handleStart = useCallback(
    async (id: string) => {
      await startMonitor(
        id,
        (msg) => {
          setSuccess(msg);
          fetchAlerts();
        },
        (err) => setError(err)
      );
    },
    [startMonitor, fetchAlerts]
  );

  const handleStop = useCallback(
    async (id: string) => {
      await stopMonitor(
        id,
        (msg) => {
          setSuccess(msg);
          fetchAlerts();
        },
        (err) => setError(err)
      );
    },
    [stopMonitor, fetchAlerts]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedMonitorId) return;
    await deleteMonitor(
      selectedMonitorId,
      (msg) => {
        setSuccess(msg);
        fetchAlerts();
      },
      (err) => setError(err)
    );
    setDeleteDialogOpen(false);
    setSelectedMonitorId(null);
  }, [selectedMonitorId, deleteMonitor, fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const getStatusColor = (status?: MonitorStatus) => {
    switch (status) {
      case "initializing":
        return "default";
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
  };

  const columns: GridColDef[] = [
    {
      field: "match_id",
      headerName: "Match ID",
      width: 100,
    },
    {
      field: "alert_text",
      headerName: "Alert Description",
      flex: 1,
      minWidth: 250,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={capitalize(params.value || "unknown")}
          color={getStatusColor(params.value)}
          size='small'
        />
      ),
    },
    {
      field: "last_alert_message",
      headerName: "Last Alert",
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Typography variant='body2' noWrap sx={{ fontStyle: "italic" }}>
            {params.value}
          </Typography>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            -
          </Typography>
        ),
    },
    {
      field: "alerts_count",
      headerName: "Count",
      width: 80,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) =>
        params.value !== undefined && params.value > 0 ? (
          <Chip
            label={`${params.value}`}
            color='success'
            size='small'
            variant='outlined'
          />
        ) : (
          <Typography variant='body2' color='text.secondary'>
            0
          </Typography>
        ),
    },
    {
      field: "created_at",
      headerName: "Created",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant='body2' color='text.secondary'>
          {formatDateTime(params.value)}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const alert = params.row as AlertMonitor;
        const isRunning =
          alert.status === "monitoring" ||
          alert.status === "approaching" ||
          alert.status === "imminent" ||
          alert.status === "initializing";
        const canStart = alert.status === "stopped" || alert.status === "error";

        return (
          <Stack direction='row' spacing={0.5}>
            <IconButton
              color='primary'
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/alerts/${alert.monitor_id}`);
              }}
              title='View details'
            >
              <VisibilityIcon fontSize='small' />
            </IconButton>
            {isRunning && (
              <IconButton
                color='warning'
                size='small'
                onClick={(e) => {
                  e.stopPropagation();
                  handleStop(alert.monitor_id);
                }}
                disabled={loadingMonitorId === alert.monitor_id}
                title='Stop monitoring'
              >
                {loadingAction === 'stop' && loadingMonitorId === alert.monitor_id ? (
                  <CircularProgress size={16} />
                ) : (
                  <StopIcon fontSize='small' />
                )}
              </IconButton>
            )}
            {canStart && (
              <IconButton
                color='success'
                size='small'
                onClick={(e) => {
                  e.stopPropagation();
                  handleStart(alert.monitor_id);
                }}
                disabled={loadingMonitorId === alert.monitor_id}
                title='Start monitoring'
              >
                {loadingAction === 'start' && loadingMonitorId === alert.monitor_id ? (
                  <CircularProgress size={16} />
                ) : (
                  <PlayArrowIcon fontSize='small' />
                )}
              </IconButton>
            )}
            <IconButton
              color='error'
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMonitorId(alert.monitor_id);
                setDeleteDialogOpen(true);
              }}
              disabled={loadingMonitorId === alert.monitor_id}
              title='Delete alert'
            >
              {loadingAction === 'delete' && loadingMonitorId === alert.monitor_id ? (
                <CircularProgress size={16} />
              ) : (
                <DeleteIcon fontSize='small' />
              )}
            </IconButton>
          </Stack>
        );
      },
    },
  ];

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
      <DataGrid
        rows={alerts}
        columns={columns}
        loading={loading}
        getRowId={(row: AlertMonitor) => row.monitor_id}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: "created_at", sort: "desc" }],
          },
        }}
        pageSizeOptions={[5, 10, 25, 50]}
        disableRowSelectionOnClick
      />

      <DeleteMonitorDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        loading={loadingAction === 'delete' && loadingMonitorId === selectedMonitorId}
      />
    </Box>
  );
};

export default AlertsList;
