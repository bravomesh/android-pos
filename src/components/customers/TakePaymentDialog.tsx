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
import api from "../../api";
import { toast } from "../../toast/useToast";
import { money } from "../../money";

export interface TakePaymentDialogProps {
  customer: { id: number; name: string; outstanding_balance: number } | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TakePaymentDialog({ customer, onClose, onSaved }: TakePaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAmount("");
  }, [customer]);

  if (!customer) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.customer.receivePayment(customer.id, Number(amount));
      toast.success(`Payment taken. ${customer.name} now owes ${money(res.data.balance)}`);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not take the payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Payment from {customer.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Owes {money(customer.outstanding_balance)}
          </Typography>
          <TextField
            label="Amount received"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            slotProps={{ htmlInput: { inputMode: "decimal", "data-testid": "payment-amount" } }}
            fullWidth
            autoFocus
          />
          <Button size="small" onClick={() => setAmount(String(customer.outstanding_balance))} sx={{ alignSelf: "flex-start" }}>
            Pay it all
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
          disabled={saving || !amount}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ minHeight: 48 }}
          data-testid="save-payment"
        >
          Take payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
