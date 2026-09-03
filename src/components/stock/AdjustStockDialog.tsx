import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import api from "../../api";
import { toast } from "../../toast/useToast";

export interface AdjustTarget {
  id: number;
  name: string;
  unit: string;
  stock_qty: number;
}

export interface AdjustStockDialogProps {
  product: AdjustTarget | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

// Reasons a shop actually needs: what came off the shelf without being sold,
// and what a physical count says is really there.
const DELTA_REASONS = [
  "Damaged",
  "Spoiled / expired",
  "Lost or stolen",
  "Used in the shop",
  "Returned to supplier",
  "Customer return",
  "Correction",
];

const COUNT_REASONS = ["Stock take", "Correction"];

export default function AdjustStockDialog({ product, onClose, onSaved }: AdjustStockDialogProps) {
  const [mode, setMode] = useState<"delta" | "count">("delta");
  const [direction, setDirection] = useState<"out" | "in">("out");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState(DELTA_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setMode("delta");
      setDirection("out");
      setQty("");
      setReason(DELTA_REASONS[0]);
      setNotes("");
    }
  }, [product]);

  if (!product) return null;

  const reasons = mode === "count" ? COUNT_REASONS : DELTA_REASONS;
  const amount = Number(qty);
  const onHand = Number(product.stock_qty) || 0;
  const resulting =
    mode === "count" ? amount : direction === "out" ? onHand - amount : onHand + amount;

  const handleSave = async () => {
    if (!Number.isFinite(amount) || qty === "") {
      toast.error("Enter a quantity");
      return;
    }

    setSaving(true);
    try {
      await api.product.adjustStock({
        productId: product.id,
        mode,
        qty: mode === "count" ? amount : direction === "out" ? -amount : amount,
        reason: reasons.includes(reason) ? reason : reasons[0],
        notes,
      });
      toast.success("Stock updated");
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{product.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            On hand: {onHand} {product.unit}
          </Typography>

          <ToggleButtonGroup
            exclusive
            fullWidth
            value={mode}
            onChange={(_, value) => {
              if (!value) return;
              setMode(value);
              setReason(value === "count" ? COUNT_REASONS[0] : DELTA_REASONS[0]);
            }}
          >
            <ToggleButton value="delta" sx={{ minHeight: 48 }}>
              Add / remove
            </ToggleButton>
            <ToggleButton value="count" sx={{ minHeight: 48 }} data-testid="mode-count">
              Counted total
            </ToggleButton>
          </ToggleButtonGroup>

          {mode === "delta" && (
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={direction}
              onChange={(_, value) => value && setDirection(value)}
            >
              <ToggleButton value="out" sx={{ minHeight: 48 }}>
                Remove
              </ToggleButton>
              <ToggleButton value="in" sx={{ minHeight: 48 }}>
                Add back
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          <TextField
            label={mode === "count" ? `Counted quantity (${product.unit})` : `Quantity (${product.unit})`}
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            slotProps={{ htmlInput: { inputMode: "decimal", "data-testid": "adjust-qty" } }}
            fullWidth
            autoFocus
          />

          <TextField
            select
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
          >
            {reasons.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Note (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
          />

          {qty !== "" && Number.isFinite(amount) && (
            <Typography variant="body2" color={resulting < 0 ? "error.main" : "text.secondary"}>
              New quantity: {resulting} {product.unit}
            </Typography>
          )}
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
          data-testid="save-adjustment"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
