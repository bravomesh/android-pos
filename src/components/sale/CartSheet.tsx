import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { getCartItemsArraySelector } from "../../selectors";
import { updateCartItem, removeItemFromCart, updateDiscountOnTotal, updateTax } from "../../actions/cart";
import { CartLine } from "../../reducers/cart";
import { money } from "../../money";

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
      size="small"
      type="number"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      slotProps={{
        htmlInput: {
          inputMode: "decimal",
          "aria-label": `${line.name} quantity`,
          "data-testid": `cart-qty-${line.id}`,
          style: { textAlign: "center", padding: "6px 4px" },
        },
      }}
      sx={{ width: 64 }}
    />
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

  const handleIncrement = (line: CartLine) => {
    dispatch(updateCartItem({ ...line, qty: line.qty + 1 }));
  };

  const handleDecrement = (line: CartLine) => {
    if (line.qty <= 1) return;
    dispatch(updateCartItem({ ...line, qty: line.qty - 1 }));
  };

  const handleRemove = (line: CartLine) => {
    dispatch(removeItemFromCart(line));
  };

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2, height: "100%", overflowY: "auto" }}>
      <Typography variant="h6">Cart</Typography>

      {cartArray.length === 0 ? (
        <Typography color="text.secondary">Cart is empty</Typography>
      ) : (
        <Stack spacing={1}>
          {cartArray.map((line) => (
            <Box
              key={line.id}
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}
              data-testid={`cart-line-${line.id}`}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap>
                  {line.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {money(line.totalPrice)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  size="small"
                  aria-label={`decrease ${line.name} quantity`}
                  onClick={() => handleDecrement(line)}
                  disabled={line.qty <= 1}
                  sx={{ minWidth: 48, minHeight: 48 }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <QtyField line={line} onChange={(qty) => dispatch(updateCartItem({ ...line, qty }))} />
                <IconButton
                  size="small"
                  aria-label={`increase ${line.name} quantity`}
                  onClick={() => handleIncrement(line)}
                  sx={{ minWidth: 48, minHeight: 48 }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={`remove ${line.name}`}
                  onClick={() => handleRemove(line)}
                  sx={{ minWidth: 48, minHeight: 48 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Divider />

      <TextField
        label="Discount on total"
        type="number"
        size="small"
        value={summary.discountOnTotal}
        onChange={(e) => dispatch(updateDiscountOnTotal(e.target.value))}
        slotProps={{ htmlInput: { inputMode: "decimal", "data-testid": "discount-on-total-input" } }}
        fullWidth
      />
      <TextField
        label="Tax (%)"
        type="number"
        size="small"
        value={summary.tax}
        onChange={(e) => dispatch(updateTax(e.target.value))}
        slotProps={{ htmlInput: { inputMode: "decimal", "data-testid": "tax-input" } }}
        fullWidth
      />

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="subtitle1">Net total</Typography>
        <Typography variant="subtitle1" data-testid="cart-net-total">
          {money(summary.netTotal)}
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        disabled={cartArray.length === 0}
        onClick={onCharge}
        data-testid="charge-btn"
        sx={{ minHeight: 48 }}
      >
        Charge
      </Button>
    </Box>
  );

  if (variant === "panel") {
    return (
      <Paper sx={{ height: "100%", overflow: "hidden" }}>
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
          maxHeight: "85vh",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
      }}
    >
      {content}
    </Drawer>
  );
}
