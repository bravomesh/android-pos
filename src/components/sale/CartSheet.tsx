import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import { alpha } from "@mui/material/styles";
import { TransitionGroup } from "react-transition-group";
import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasketRounded";
import TuneIcon from "@mui/icons-material/TuneRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreRounded";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { getCartItemsArraySelector } from "../../selectors";
import { updateCartItem, removeItemFromCart, updateDiscountOnTotal, updateTax, emptyCart } from "../../actions/cart";
import { CartLine } from "../../reducers/cart";
import { money } from "../../money";
import { duration, easing } from "../../theme/motion";
import AnimatedNumber from "../motion/AnimatedNumber";
import ConfirmDialog from "../crud/ConfirmDialog";
import { initials, tileGradient } from "./productLook";
import { CART_TARGET } from "./flyToCart";

/**
 * Quantity box for goods sold by weight or length (1.5 kg, 2.25 m). The
 * typed text is kept as-is while editing, so "1." is not snapped back to
 * "1", and is applied when the cashier leaves the box or presses Enter.
 */
function QtyField({ line, onChange }: { line: CartLine; onChange: (qty: number) => void }) {
  const [text, setText] = useState(String(line.qty));

  useEffect(() => {
    setText(String(line.qty));
  }, [line.qty]);

  const commit = () => {
    const qty = Number(text);
    if (qty > 0 && qty !== line.qty) onChange(qty);
    else setText(String(line.qty));
  };

  return (
    <TextField
      variant="standard"
      type="number"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      slotProps={{
        input: { disableUnderline: true },
        htmlInput: {
          inputMode: "decimal",
          "aria-label": `${line.name} quantity`,
          "data-testid": `cart-qty-${line.id}`,
          style: { textAlign: "center", padding: "4px 0", fontWeight: 800 },
        },
      }}
      sx={{ width: 44, "& input::-webkit-inner-spin-button": { display: "none" } }}
    />
  );
}

function CartLineRow({ line }: { line: CartLine }) {
  const dispatch = useDispatch();
  const set = (qty: number) => dispatch(updateCartItem({ ...line, qty }));

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1 }} data-testid={`cart-line-${line.id}`}>
      <Box
        aria-hidden
        sx={{
          width: 40,
          height: 40,
          borderRadius: "10px",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          background: tileGradient(line.name),
        }}
      >
        {initials(line.name)}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
          {line.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap component="p">
          {money(line.totalPrice)}
        </Typography>
      </Box>
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          borderRadius: "999px",
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          border: `1px solid ${theme.palette.divider}`,
        })}
      >
        <IconButton
          size="small"
          aria-label={`decrease ${line.name} quantity`}
          onClick={() => line.qty > 1 && set(line.qty - 1)}
          disabled={line.qty <= 1}
          sx={{ width: 44, height: 44 }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <QtyField line={line} onChange={set} />
        <IconButton size="small" aria-label={`increase ${line.name} quantity`} onClick={() => set(line.qty + 1)} sx={{ width: 44, height: 44 }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
      <IconButton aria-label={`remove ${line.name}`} onClick={() => dispatch(removeItemFromCart(line))} sx={{ width: 44, height: 44, color: "text.secondary" }}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}

export interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  variant: "drawer" | "panel";
  onCharge: () => void;
}

export default function CartSheet({ open, onClose, variant, onCharge }: CartSheetProps) {
  const dispatch = useDispatch();
  const cartArray = useSelector(getCartItemsArraySelector) as CartLine[];
  const summary = useSelector((state: RootState) => state.cart.summary);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const discount = Number(summary.discountOnTotal) || 0;
  const tax = Number(summary.taxAmount) || 0;
  const net = Number(summary.netTotal) || 0;
  const count = summary.noOfInividualItems;
  const hasAdjustments = discount > 0 || Number(summary.tax) > 0;

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2, pt: 2, pb: 1.5 }}>
        <Box
          {...{ [CART_TARGET]: "" }}
          aria-hidden
          sx={(theme) => ({
            width: 44,
            height: 44,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          })}
        >
          <ShoppingBasketIcon />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
            Current sale
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {count === 0 ? "No items yet" : `${Number.isInteger(count) ? count : count.toFixed(2)} item${count === 1 ? "" : "s"}`}
          </Typography>
        </Box>
        {cartArray.length > 0 && (
          <Button size="small" color="inherit" onClick={() => setConfirmClear(true)} sx={{ color: "text.secondary" }}>
            Clear
          </Button>
        )}
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, minHeight: 120 }}>
        {cartArray.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }} className="pos-enter">
            <ShoppingBasketIcon sx={{ fontSize: 40, opacity: 0.4 }} aria-hidden />
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
              Tap a product or scan a barcode
            </Typography>
          </Box>
        ) : (
          <TransitionGroup>
            {cartArray.map((line) => (
              <Collapse key={line.id} timeout={duration.enter} easing={easing.decelerate}>
                <CartLineRow line={line} />
              </Collapse>
            ))}
          </TransitionGroup>
        )}
      </Box>

      <Box
        sx={(theme) => ({
          px: 2,
          pt: 1.5,
          pb: "calc(16px + env(safe-area-inset-bottom))",
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, 0.03),
        })}
      >
        <Button
          fullWidth
          color="inherit"
          onClick={() => setAdjustOpen((v) => !v)}
          startIcon={<TuneIcon />}
          endIcon={
            <ExpandMoreIcon
              sx={{ transform: adjustOpen ? "rotate(180deg)" : "none", transition: `transform ${duration.enter}ms ${easing.standard}` }}
            />
          }
          aria-expanded={adjustOpen}
          sx={{ justifyContent: "flex-start", color: "text.secondary", "& .MuiButton-endIcon": { ml: "auto" } }}
        >
          Discount & tax{hasAdjustments ? " · applied" : ""}
        </Button>
        <Collapse in={adjustOpen || hasAdjustments}>
          <Box sx={{ display: "flex", gap: 1.5, pt: 1, pb: 1.5 }}>
            <TextField
              label="Discount"
              type="number"
              size="small"
              value={summary.discountOnTotal}
              onChange={(e) => dispatch(updateDiscountOnTotal(e.target.value))}
              slotProps={{ htmlInput: { inputMode: "decimal", "data-testid": "discount-on-total-input" } }}
              fullWidth
            />
            <TextField
              label="Tax"
              type="number"
              size="small"
              value={summary.tax}
              onChange={(e) => dispatch(updateTax(e.target.value))}
              slotProps={{
                htmlInput: { inputMode: "decimal", "data-testid": "tax-input" },
                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
              }}
              sx={{ width: 120, flexShrink: 0 }}
            />
          </Box>
        </Collapse>

        {hasAdjustments && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.25, mb: 1, color: "text.secondary" }}>
            <Typography variant="body2">Subtotal</Typography>
            <Typography variant="body2">{money(summary.total)}</Typography>
            {discount > 0 && (
              <>
                <Typography variant="body2">Discount</Typography>
                <Typography variant="body2">−{money(discount)}</Typography>
              </>
            )}
            {tax > 0 && (
              <>
                <Typography variant="body2">Tax ({summary.tax}%)</Typography>
                <Typography variant="body2">{money(tax)}</Typography>
              </>
            )}
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="subtitle1" color="text.secondary">
            Total
          </Typography>
          <Typography variant="h4" data-testid="cart-net-total" aria-live="polite">
            <AnimatedNumber value={net} format={money} />
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          size="large"
          fullWidth
          disabled={cartArray.length === 0}
          onClick={onCharge}
          data-testid="charge-btn"
          sx={{ minHeight: 56, fontSize: "1.1rem", borderRadius: "14px" }}
        >
          Charge {cartArray.length > 0 ? money(net) : ""}
        </Button>
      </Box>

      <ConfirmDialog
        open={confirmClear}
        message="Take everything out of this sale?"
        onConfirm={() => {
          setConfirmClear(false);
          dispatch(emptyCart());
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </Box>
  );

  if (variant === "panel") {
    return (
      <Paper
        sx={(theme) => ({
          height: "100%",
          overflow: "hidden",
          borderRadius: "20px",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
        })}
      >
        {content}
      </Paper>
    );
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          maxHeight: "88vh",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
      }}
    >
      <Box aria-hidden sx={{ width: 40, height: 5, borderRadius: "12px", bgcolor: "divider", mx: "auto", mt: 1 }} />
      {content}
    </Drawer>
  );
}
