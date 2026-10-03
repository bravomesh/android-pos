import { useEffect, useMemo, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import InputAdornment from "@mui/material/InputAdornment";
import { alpha } from "@mui/material/styles";
import PaymentsIcon from "@mui/icons-material/PaymentsRounded";
import PersonIcon from "@mui/icons-material/PersonRounded";
import currency from "currency.js";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { getCartItemsArraySelector } from "../../selectors";
import { emptyCart } from "../../actions/cart";
import { selectUser } from "../../reducers/auth";
import { toast } from "../../toast/useToast";
import api from "../../api";
import { CURRENCY, money } from "../../money";
import { duration, easing, haptic } from "../../theme/motion";
import AnimatedNumber from "../motion/AnimatedNumber";

export interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

interface Customer {
  id: number | string;
  name: string;
  mobile?: string | null;
}

interface Done {
  salesType: "Counter" | "Credit";
  change: number;
  owing: number;
  customer?: string;
}

// How long the "sale complete" screen stays before the till moves on.
const AUTO_NEXT_MS = 4000;

/**
 * Amounts a customer is likely to hand over: the exact bill, then the bill
 * rounded up to the next 50, 100, 500 and 1,000 — the notes and coins a
 * cashier actually receives.
 */
export const quickCash = (due: number) => {
  if (!(due > 0)) return [];
  const steps = [50, 100, 500, 1000].map((step) => Math.ceil(due / step) * step);
  return [...new Set([Math.round(due * 100) / 100, ...steps])].filter((v) => v >= due).slice(0, 4);
};

function SuccessMark() {
  return (
    <Box sx={{ position: "relative", width: 96, height: 96, mx: "auto" }} aria-hidden>
      <Box
        sx={(theme) => ({
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.25),
          animation: `pos-ring 900ms ${easing.decelerate} 120ms both`,
        })}
      />
      <Box
        component="svg"
        viewBox="0 0 96 96"
        sx={(theme) => ({ position: "relative", width: 96, height: 96, color: theme.palette.primary.main })}
      >
        <circle cx="48" cy="48" r="44" fill="currentColor" style={{ animation: `pos-pop-in ${duration.emphasis}ms ${easing.spring} both` }} />
        <path
          d="M29 50 l13 13 l25 -28"
          fill="none"
          stroke="#fff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="70"
          strokeDashoffset="70"
          style={{ animation: `pos-draw 420ms ${easing.decelerate} 220ms forwards` }}
        />
      </Box>
    </Box>
  );
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
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [done, setDone] = useState<Done | null>(null);
  const amountBox = useRef<HTMLInputElement>(null);

  const netTotal = Number(summary.netTotal) || 0;
  const balance = currency(amountPaid || 0).subtract(netTotal);
  const change = balance.value > 0 ? balance.value : 0;
  const owing = balance.value < 0 ? -balance.value : 0;
  const suggestions = useMemo(() => quickCash(netTotal), [netTotal]);

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

  const reset = () => {
    setAmountPaid("");
    setError("");
    setSalesType("Counter");
    setCustomer(null);
    setDone(null);
  };

  const handleClose = () => {
    if (submitting) return;
    if (done) {
      finish();
      return;
    }
    reset();
    onClose();
  };

  const finish = () => {
    reset();
    onCompleted();
  };

  // The success screen moves the till on by itself, so a busy cashier never
  // has to tap it away.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(finish, AUTO_NEXT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const handleConfirm = async () => {
    // A cash sale must cover the bill. A credit sale is allowed to fall
    // short — that shortfall is exactly what the customer now owes.
    if (salesType === "Counter" && balance.value < 0) {
      setError("The amount paid is less than the bill");
      return;
    }

    if (salesType === "Credit" && !customer) {
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
        customerId: salesType === "Credit" ? customer?.id : undefined,
        cashierId: cashier?.id,
      };

      await api.transaction.saveNormalSale(sale);

      haptic();
      setDone({ salesType, change, owing, customer: customer?.name });
      dispatch(emptyCart());

      // Start a fresh transaction so the next sale has an id.
      try {
        await api.transaction.getTransactionId();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to start a new transaction");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to complete sale");
    } finally {
      setSubmitting(false);
    }
  };

  const short = salesType === "Counter" && amountPaid !== "" && balance.value < 0;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      {done ? (
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <SuccessMark />
          <Typography variant="h5" sx={{ mt: 2 }} className="pos-enter">
            {done.salesType === "Credit" ? "Sale on account" : "Sale complete"}
          </Typography>
          {done.salesType === "Counter" ? (
            <Box className="pos-enter" sx={{ animationDelay: "120ms", mt: 2 }}>
              <Typography variant="overline" color="text.secondary">
                {done.change > 0 ? "Give change" : "No change due"}
              </Typography>
              <Typography variant="h3" color="primary" data-testid="success-change">
                {money(done.change)}
              </Typography>
            </Box>
          ) : (
            <Box className="pos-enter" sx={{ animationDelay: "120ms", mt: 2 }}>
              <Typography variant="overline" color="text.secondary">
                {done.customer} now owes
              </Typography>
              <Typography variant="h3" color="secondary">
                {money(done.owing)}
              </Typography>
            </Box>
          )}
          <Button variant="contained" size="large" fullWidth autoFocus onClick={finish} sx={{ mt: 3 }} data-testid="next-sale-btn">
            Next sale
          </Button>
          <LinearProgress
            variant="determinate"
            value={100}
            aria-hidden
            sx={{
              mt: 1.5,
              "& .MuiLinearProgress-bar": { transition: "none", animation: `pos-countdown ${AUTO_NEXT_MS}ms linear forwards` },
              "@keyframes pos-countdown": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-100%)" } },
            }}
          />
        </DialogContent>
      ) : (
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: "center", mb: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Amount due
            </Typography>
            <Typography variant="h3" data-testid="checkout-net-total">
              <AnimatedNumber value={netTotal} format={money} />
            </Typography>
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
            sx={{ mb: 2, "& .MuiToggleButton-root": { minHeight: 52, gap: 1 } }}
          >
            <ToggleButton value="Counter" data-testid="pay-cash">
              <PaymentsIcon aria-hidden /> Cash
            </ToggleButton>
            <ToggleButton value="Credit" data-testid="pay-credit">
              <PersonIcon aria-hidden /> On account
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {salesType === "Credit" && (
              <Autocomplete
                className="pos-enter"
                options={customers}
                value={customer}
                onChange={(_, value) => {
                  setCustomer(value);
                  setError("");
                }}
                getOptionLabel={(c) => c.name}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                noOptionsText="No customers yet — add them under Customers"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
                    slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, "data-testid": "credit-customer" } }}
                  />
                )}
              />
            )}

            <TextField
              inputRef={amountBox}
              label={salesType === "Credit" ? "Paid now (may be nothing)" : "Cash received"}
              type="number"
              value={amountPaid}
              onChange={(e) => {
                setAmountPaid(e.target.value);
                setError("");
              }}
              error={!!error || short}
              helperText={error || " "}
              slotProps={{
                htmlInput: { inputMode: "decimal", "data-testid": "amount-paid-input", style: { fontSize: 22, fontWeight: 700 } },
                input: { startAdornment: <InputAdornment position="start">{CURRENCY}</InputAdornment> },
              }}
              fullWidth
              autoFocus
            />

            {salesType === "Counter" && suggestions.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: -1.5 }}>
                {suggestions.map((value, i) => (
                  <Chip
                    key={value}
                    label={i === 0 ? "Exact" : value.toLocaleString()}
                    onClick={() => {
                      setAmountPaid(String(value));
                      setError("");
                    }}
                    color={Number(amountPaid) === value ? "primary" : "default"}
                    variant={Number(amountPaid) === value ? "filled" : "outlined"}
                    className="pos-enter"
                    sx={{ minHeight: 48, minWidth: 72, animationDelay: `${i * 40}ms` }}
                  />
                ))}
              </Box>
            )}

            <Box
              sx={(theme) => ({
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                borderRadius: "16px",
                transition: `background-color ${duration.quick}ms`,
                bgcolor: alpha(short ? theme.palette.error.main : salesType === "Credit" ? theme.palette.secondary.main : theme.palette.primary.main, 0.1),
              })}
            >
              <Typography sx={{ fontWeight: 700 }}>
                {salesType === "Credit" ? "Left owing" : short ? "Short by" : "Change"}
              </Typography>
              <Typography
                variant="h5"
                data-testid="checkout-change"
                color={short ? "error" : salesType === "Credit" ? "secondary" : "primary"}
              >
                {money(salesType === "Credit" || short ? owing : change)}
              </Typography>
            </Box>

            <Button
              onClick={handleConfirm}
              variant="contained"
              color="secondary"
              size="large"
              disabled={submitting}
              data-testid="confirm-sale-btn"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{ minHeight: 56 }}
            >
              {salesType === "Credit" ? "Put on account" : "Complete sale"}
            </Button>
            <Button onClick={handleClose} disabled={submitting} color="inherit" sx={{ color: "text.secondary" }}>
              Back to the cart
            </Button>
          </Box>
        </DialogContent>
      )}
    </Dialog>
  );
}
