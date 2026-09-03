import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useSelector } from "react-redux";
import currency from "currency.js";
import { RootState } from "../../store";

export interface CartBarProps {
  onViewCart: () => void;
}

export default function CartBar({ onViewCart }: CartBarProps) {
  const summary = useSelector((state: RootState) => state.cart.summary);
  const itemCount = summary.noOfInividualItems;
  const netTotal = currency(summary.netTotal).format();

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: 2,
        py: 1,
        bgcolor: "background.paper",
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 -2px 12px rgba(0,0,0,.6)"
            : "0 -2px 8px rgba(0,0,0,.15)",
      }}
    >
      <Typography variant="body2">
        {itemCount} item{itemCount === 1 ? "" : "s"} · {netTotal}
      </Typography>
      <Button
        variant="contained"
        onClick={onViewCart}
        disabled={itemCount === 0}
        data-testid="view-cart-btn"
        sx={{ minHeight: 48 }}
      >
        View cart
      </Button>
    </Box>
  );
}
