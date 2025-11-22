import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import { matchAPI, alertAPI } from '../services/api';
import { MatchStatus } from '../types';

const MatchMonitor: React.FC = () => {
  const { matchId: urlMatchId } = useParams<{ matchId?: string }>();
  const navigate = useNavigate();
  
  const [matchId, setMatchId] = useState<string>(urlMatchId || '');
  const [alertText, setAlertText] = useState<string>('');
  const [matchData, setMatchData] = useState<MatchStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [alertLoading, setAlertLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMatchStatus = async () => {
    if (!matchId) {
      setError('Please enter a match ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await matchAPI.getStatus(parseInt(matchId));
      setMatchData(data);
      navigate(`/monitor/${matchId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch match data');
      setMatchData(null);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!matchId || !alertText) {
      setError("Please enter both match ID and alert text");
      return;
    }

    setAlertLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await alertAPI.create({
        match_id: parseInt(matchId),
        alert_text: alertText,
      });

      setSuccess(
        `Alert created successfully! Monitor ID: ${response.monitor_id}`
      );
      setAlertText("");

      // Redirect to alert details page
      navigate(`/alerts/${response.monitor_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create alert");
    } finally {
      setAlertLoading(false);
    }
  };

  const exampleAlerts = [
    "Notify me when any player scores 50 runs",
    "Alert when the team crosses 200 runs",
    "Tell me when a bowler takes 5 wickets",
    "Alert on every wicket",
  ];

  return (
    <Box>
      <Typography variant='h4' gutterBottom fontWeight='bold'>
        Match Monitor
      </Typography>

      {/* Match ID Input */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' gutterBottom>
          1. Enter Match ID
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            fullWidth
            label='Match ID'
            placeholder='e.g., 119888'
            value={matchId}
            disabled={loading}
            onChange={(e) => setMatchId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && fetchMatchStatus()}
          />
          <Button
            variant='contained'
            onClick={fetchMatchStatus}
            disabled={loading || !matchId}
            startIcon={
              loading ? <CircularProgress size={20} /> : <SearchIcon />
            }
            sx={{ minWidth: 120 }}
          >
            {loading ? "Loading..." : "Fetch"}
          </Button>
        </Box>
      </Paper>

      {/* Match Status Display */}
      {matchData && (
        <Card sx={{ mb: 3, bgcolor: "success.lighter" }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              📊 Match Status
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 300px" }}>
                <Typography variant='body2'>
                  <strong>Match:</strong>{" "}
                  {matchData.match_header?.matchDescription ||
                    `Match ${matchData.match_id}`}
                </Typography>
                <Typography variant='body2'>
                  <strong>Status:</strong>{" "}
                  {matchData.match_header?.status || matchData.status || "N/A"}
                </Typography>
                <Typography variant='body2'>
                  <strong>State:</strong>{" "}
                  <Chip
                    label={
                      matchData.match_header?.state || matchData.state || "N/A"
                    }
                    size='small'
                    color={
                      (matchData.match_header?.state || matchData.state) ===
                      "In Progress"
                        ? "success"
                        : "default"
                    }
                  />
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 300px" }}>
                {matchData.miniscore ? (
                  <>
                    <Typography variant='body2'>
                      <strong>Score:</strong>{" "}
                      {matchData.miniscore.batTeam?.teamScore}/
                      {matchData.miniscore.batTeam?.teamWkts} (
                      {matchData.miniscore.overs} ov)
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Batting:</strong>{" "}
                      {matchData.miniscore.batsmanStriker?.batName} (
                      {matchData.miniscore.batsmanStriker?.batRuns}*)
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Bowling:</strong>{" "}
                      {matchData.miniscore.bowlerStriker?.bowlName}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant='body2'>
                      <strong>Score:</strong> {matchData.score || "N/A"}{" "}
                      {matchData.overs ? `(${matchData.overs} ov)` : ""}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Batting:</strong>{" "}
                      {matchData.batting_team || "N/A"}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Current RR:</strong>{" "}
                      {matchData.current_run_rate !== undefined
                        ? matchData.current_run_rate
                        : "N/A"}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Alert Creation */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' gutterBottom>
          2. Create Alert
        </Typography>
        <TextField
          fullWidth
          multiline
          disabled={loading}
          rows={3}
          label='Alert Description'
          placeholder='e.g., Notify me when Virat Kohli is within 5 runs of a century'
          value={alertText}
          onChange={(e) => setAlertText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant='contained'
          color='secondary'
          onClick={createAlert}
          disabled={alertLoading || !matchId || !alertText}
          startIcon={
            alertLoading ? <CircularProgress size={20} /> : <AddAlertIcon />
          }
          fullWidth
        >
          {alertLoading ? "Creating Alert..." : "Create Alert"}
        </Button>
      </Paper>

      {/* Messages */}
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

      {/* Example Alerts */}
      <Paper sx={{ p: 3, bgcolor: "grey.50" }}>
        <Typography variant='h6' gutterBottom>
          💡 Example Alerts
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1}>
          {exampleAlerts.map((example, index) => (
            <Button
              key={index}
              variant='outlined'
              size='small'
              fullWidth
              sx={{
                justifyContent: "flex-start",
                textAlign: "left",
                textTransform: "none",
              }}
              onClick={() => setAlertText(example)}
            >
              {example}
            </Button>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

export default MatchMonitor;
