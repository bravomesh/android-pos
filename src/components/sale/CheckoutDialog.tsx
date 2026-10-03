import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import currency from "currency.js";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { getCartItemsArraySelector } from "../../selectors";
import { emptyCart } from "../../actions/cart";
import { selectUser } from "../../reducers/auth";
import { toast } from "../../toast/useToast";
import api from "../../api";
import { money } from "../../money";

export interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export default function CheckoutDialog({ open, onClose, onCompleted }: CheckoutDialogProps) {
  const dispatch = useDispatch();
  const cartArray = useSelector(getCartItemsArraySelector);
  const summary = useSelector((state: RootState) => state.cart.summary);
  const cashier = useSelector(selectUser);

  const [amountPaid, setAmountPaid] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [salesType, setSalesType] = useState<"Counter" | "Credit">("Counter");
  const [customerId, setCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<{ id: number | string; name: string }[]>([]);

  const netTotal = summary.netTotal;
  const balance = currency(amountPaid || 0).subtract(netTotal);
  const change = balance.value > 0 ? balance : currency(0);
  const owing = balance.value < 0 ? currency(0).subtract(balance) : currency(0);

  // Customers are only needed for a credit sale, so they are fetched the
  // first time the cashier switches to it.
  useEffect(() => {
    if (salesType !== "Credit" || customers.length > 0) return;

    (async () => {
      try {
        const res = await api.customer.fetchAll();
        setCustomers(res.data || []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load customers");
      }
    })();
  }, [salesType, customers.length]);

  const handleClose = () => {
    if (submitting) return;
    setAmountPaid("");
    setError("");
    setSalesType("Counter");
    setCustomerId("");
    onClose();
  };

  const handleConfirm = async () => {
    // A cash sale must cover the bill. A credit sale is allowed to fall
    // short — that shortfall is exactly what the customer now owes.
    if (salesType === "Counter" && balance.value < 0) {
      setError("You have entered a less amount than the bill. Please correct it");
      return;
    }

    if (salesType === "Credit" && !customerId) {
      setError("Choose the customer this sale is on account for");
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
        salesType,
        customerId: salesType === "Credit" ? customerId : undefined,
        cashierId: cashier?.id,
      };

      await api.transaction.saveNormalSale(sale);

      toast.success(salesType === "Credit" ? "Sale recorded on account" : "Sale completed");
      dispatch(emptyCart());
      setAmountPaid("");
      setSalesType("Counter");
      setCustomerId("");

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
            <Typography data-testid="checkout-net-total">{money(netTotal)}</Typography>
          </Box>

          <ToggleButtonGroup
            exclusive
            fullWidth
            value={salesType}
            onChange={(_, value) => {
              if (!value) return;
              setSalesType(value);
              setError("");
            }}
          >
            <ToggleButton value="Counter" sx={{ minHeight: 48 }} data-testid="pay-cash">
              Cash
            </ToggleButton>
            <ToggleButton value="Credit" sx={{ minHeight: 48 }} data-testid="pay-credit">
              On account
            </ToggleButton>
          </ToggleButtonGroup>

          {salesType === "Credit" && (
            <TextField
              select
              label="Customer"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setError("");
              }}
              fullWidth
              slotProps={{ htmlInput: { "data-testid": "credit-customer" } }}
            >
              {customers.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label={salesType === "Credit" ? "Paid now (may be nothing)" : "Amount paid"}
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
            <Typography>{salesType === "Credit" ? "Balance owing" : "Change"}</Typography>
            <Typography data-testid="checkout-change">
              {salesType === "Credit" ? money(owing.value) : money(change.value)}
            </Typography>
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
