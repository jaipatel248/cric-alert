import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface DeleteMonitorDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteMonitorDialog: React.FC<DeleteMonitorDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Alert</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this alert? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color='error'
          variant='contained'
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteMonitorDialog;
