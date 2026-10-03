import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import { toast } from "../../toast/useToast";
import { CURRENCY, money } from "../../money";
import { haptic } from "../../theme/motion";

export interface PaymentParty {
  id: number;
  name: string;
  /** What is outstanding before this payment. */
  owed: number;
}

export interface TakePaymentDialogProps {
  party: PaymentParty | null;
  /** "Payment from Jane" for a customer, "Pay Little Steps" for a supplier. */
  title: (name: string) => string;
  /** Records the payment and returns what is still outstanding. */
  pay: (id: number, amount: number) => Promise<number>;
  /** The toast once done, given the party's name and what is left. */
  done: (name: string, left: string) => string;
  confirmLabel: string;
  onClose: () => void;
  onSaved: () => void;
}

/** Money settled against a balance, either way round: a customer paying the shop or the shop paying a supplier. */
export default function TakePaymentDialog({ party, title, pay, done, confirmLabel, onClose, onSaved }: TakePaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAmount("");
  }, [party]);

  if (!party) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const left = await pay(party.id, Number(amount));
      haptic();
      toast.success(done(party.name, money(left)));
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record the payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title(party.name)}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Outstanding: {money(party.owed)}
          </Typography>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            slotProps={{
              htmlInput: { inputMode: "decimal", "data-testid": "payment-amount" },
              input: { startAdornment: <InputAdornment position="start">{CURRENCY}</InputAdornment> },
            }}
            fullWidth
            autoFocus
          />
          <Button size="small" onClick={() => setAmount(String(party.owed))} sx={{ alignSelf: "flex-start" }}>
            All of it
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} sx={{ minHeight: 48 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="secondary"
          disabled={saving || !amount}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ minHeight: 48 }}
          data-testid="save-payment"
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
