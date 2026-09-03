import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import api from "../../api";
import { toast } from "../../toast/useToast";

export interface ChangePasswordDialogProps {
  user: { id: number; name: string } | null;
  onClose: () => void;
  onSaved: () => void;
}

const MIN_LENGTH = 6;

export default function ChangePasswordDialog({ user, onClose, onSaved }: ChangePasswordDialogProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrent("");
    setNext("");
    setConfirm("");
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    if (next.length < MIN_LENGTH) {
      toast.error(`Use at least ${MIN_LENGTH} characters`);
      return;
    }
    if (next !== confirm) {
      toast.error("The two new passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await api.user.changePassword(user.id, current, next);
      toast.success("Password changed");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Change password for {user.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Current password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { "data-testid": "current-password" } }}
          />
          <TextField
            label="New password"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            helperText={`At least ${MIN_LENGTH} characters`}
            fullWidth
            slotProps={{ htmlInput: { "data-testid": "new-password" } }}
          />
          <TextField
            label="Repeat new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            fullWidth
            slotProps={{ htmlInput: { "data-testid": "confirm-password" } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} sx={{ minHeight: 48 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ minHeight: 48 }}
          data-testid="save-password"
        >
          Change
        </Button>
      </DialogActions>
    </Dialog>
  );
}
