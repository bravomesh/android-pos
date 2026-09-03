import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Button from "@mui/material/Button";

export interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} sx={{ minHeight: 48 }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          data-testid="confirm-delete-btn"
          sx={{ minHeight: 48 }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
