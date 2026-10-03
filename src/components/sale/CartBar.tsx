import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasketRounded";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { money } from "../../money";
import AnimatedNumber from "../motion/AnimatedNumber";
import { CART_TARGET } from "./flyToCart";

export interface CartBarProps {
  onViewCart: () => void;
}

/** Phone register: the cart floats above the grid until it is opened. */
export default function CartBar({ onViewCart }: CartBarProps) {
  const summary = useSelector((state: RootState) => state.cart.summary);
  const itemCount = summary.noOfInividualItems;
  const empty = itemCount === 0;

  return (
    <Box
      sx={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        zIndex: (theme) => theme.zIndex.appBar,
        transform: empty ? "translateY(140%)" : "none",
        transition: "transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
      aria-hidden={empty}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pl: 1,
          pr: 1,
          py: 1,
          borderRadius: "20px",
          color: "#fff",
          background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.88)})`,
          boxShadow: `0 14px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
        })}
      >
        <Box
          {...{ [CART_TARGET]: "" }}
          sx={{ position: "relative", width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,.18)" }}
        >
          <ShoppingBasketIcon aria-hidden />
          <Box
            key={itemCount}
            className="pos-bump"
            sx={(theme) => ({
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 22,
              height: 22,
              px: 0.5,
              borderRadius: "11px",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 800,
              bgcolor: "secondary.main",
              color: theme.palette.secondary.contrastText,
            })}
          >
            {Number.isInteger(itemCount) ? itemCount : itemCount.toFixed(1)}
          </Box>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.85, display: "block", lineHeight: 1 }}>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </Typography>
          <Typography variant="h6" sx={{ lineHeight: 1.2, color: "#fff" }}>
            <AnimatedNumber value={Number(summary.netTotal) || 0} format={money} />
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          onClick={onViewCart}
          disabled={empty}
          data-testid="view-cart-btn"
          sx={{ minHeight: 48, borderRadius: "14px", px: 2.5 }}
        >
          View cart
        </Button>
      </Box>
    </Box>
  );
}
