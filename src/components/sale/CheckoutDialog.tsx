import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import currency from "currency.js";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { getCartItemsArraySelector } from "../../selectors";
import { emptyCart } from "../../actions/cart";
import { toast } from "../../toast/useToast";
import api from "../../api";

export interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export default function CheckoutDialog({ open, onClose, onCompleted }: CheckoutDialogProps) {
  const dispatch = useDispatch();
  const cartArray = useSelector(getCartItemsArraySelector);
  const summary = useSelector((state: RootState) => state.cart.summary);

  const [amountPaid, setAmountPaid] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const netTotal = summary.netTotal;
  const balance = currency(amountPaid || 0).subtract(netTotal);
  const change = balance.value > 0 ? balance : currency(0);

  const handleClose = () => {
    if (submitting) return;
    setAmountPaid("");
    setError("");
    onClose();
  };

  const handleConfirm = async () => {
    if (balance.value < 0) {
      setError("You have entered a less amount than the bill. Please correct it");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const sale = {
        items: cartArray,
        total: currency(summary.total).value,
        tax: summary.tax,
        taxAmount: currency(summary.taxAmount).value,
        discountOnTotal: currency(summary.discountOnTotal).value,
        totalDiscount: currency(summary.discountOnItems).add(summary.discountOnTotal).value,
        netTotal: currency(netTotal).value,
        amountPaid: currency(amountPaid || 0).value,
      };

      await api.transaction.saveNormalSale(sale);

      toast.success("Sale completed");
      dispatch(emptyCart());
      setAmountPaid("");

      // Start a fresh transaction so the next sale has an id.
      try {
        await api.transaction.getTransactionId();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to start a new transaction");
      }

      onCompleted();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete sale";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Checkout</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography>Net total</Typography>
            <Typography data-testid="checkout-net-total">{currency(netTotal).format()}</Typography>
          </Box>

          <TextField
            label="Amount paid"
            type="number"
            value={amountPaid}
            onChange={(e) => {
              setAmountPaid(e.target.value);
              setError("");
            }}
            error={!!error}
            helperText={error}
            slotProps={{ htmlInput: { inputMode: "decimal", "data-testid": "amount-paid-input" } }}
            fullWidth
            autoFocus
          />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography>Change</Typography>
            <Typography data-testid="checkout-change">{change.format()}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting} sx={{ minHeight: 48 }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={submitting}
          data-testid="confirm-sale-btn"
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ minHeight: 48 }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
