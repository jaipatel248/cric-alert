import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { formatDateTime } from "../utils/dateFormatter";
import { RecentAlert } from "../types";

interface Props {
  open: boolean;
  alert?: RecentAlert | null;
  onClose: () => void;
}

const TriggerAlertDialog: React.FC<Props> = ({ open, alert, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="trigger-alert-dialog" maxWidth="sm" fullWidth>
      <DialogTitle id="trigger-alert-dialog">Alert Triggered</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          {alert?.message}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {alert ? formatDateTime(alert.timestamp) : ""}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Dismiss</Button>
        <Button
          onClick={onClose}
          variant="contained"
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TriggerAlertDialog;
