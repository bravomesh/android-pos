import { MouseEvent } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import { alpha } from "@mui/material/styles";
import SearchOffIcon from "@mui/icons-material/SearchOffRounded";
import { SaleProduct } from "./useSaleProducts";
import { toast } from "../../toast/useToast";
import { money } from "../../money";
import { stagger } from "../../theme/motion";
import EmptyState from "../motion/EmptyState";
import { initials, stockLabel, tileGradient } from "./productLook";
import { flyToCart } from "./flyToCart";

export interface ProductGridProps {
  products: SaleProduct[];
  /** Returns false when the item could not go in the cart (e.g. no stock left). */
  onAdd: (product: SaleProduct) => boolean;
  /** How many of each product are already in the cart, by id. */
  inCart?: Record<string, number>;
  loading?: boolean;
}

// A service (alterations, delivery) is never counted, so it never runs out.
const isOutOfStock = (product: SaleProduct) =>
  product.track_stock !== 0 && (!product.stock_qty || product.stock_qty <= 0);

const isLow = (product: SaleProduct) =>
  product.track_stock !== 0 && product.reorder_level != null && product.stock_qty <= Number(product.reorder_level);

const GRID = {
  display: "grid",
  gap: 1.5,
  gridTemplateColumns: "repeat(auto-fill, minmax(min(150px, 46%), 1fr))",
  p: 0.5,
} as const;

function StockLine({ product }: { product: SaleProduct }) {
  const out = isOutOfStock(product);
  const low = !out && isLow(product);
  const label =
    product.track_stock === 0
      ? "Service"
      : out
        ? "Out of stock"
        : `${stockLabel(product.stock_qty, product.unit)} left${low ? " · low" : ""}`;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box
        aria-hidden
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          bgcolor: out ? "error.main" : low ? "warning.main" : product.track_stock === 0 ? "secondary.main" : "primary.main",
        }}
      />
      <Typography variant="caption" color={out ? "error" : "text.secondary"} sx={{ fontWeight: 700 }} noWrap>
        {label}
      </Typography>
    </Box>
  );
}

export default function ProductGrid({ products, onAdd, inCart = {}, loading }: ProductGridProps) {
  const handleTap = (product: SaleProduct, event: MouseEvent<HTMLElement>) => {
    const card = event.currentTarget;
    if (isOutOfStock(product)) {
      toast.error(`${product.name} is out of stock`);
      card.classList.remove("pos-shake");
      void card.offsetWidth;
      card.classList.add("pos-shake");
      return;
    }
    if (onAdd(product)) {
      const tile = card.querySelector<HTMLElement>("[data-tile]") ?? card;
      flyToCart(tile, initials(product.name), tileGradient(product.name));
    }
  };

  if (loading) {
    return (
      <Box sx={GRID} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} sx={{ p: 1.25 }}>
            <Skeleton variant="rounded" height={76} />
            <Skeleton width="80%" sx={{ mt: 1 }} />
            <Skeleton width="45%" />
          </Card>
        ))}
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<SearchOffIcon />}
        title="No products found"
        message="Try another name or code, or pick a different category."
      />
    );
  }

  return (
    <Box sx={GRID}>
      {products.map((product, index) => {
        const out = isOutOfStock(product);
        const count = inCart[String(product.id)] ?? 0;
        const seed = product.name;
        return (
          <Card
            key={product.id}
            className="pos-enter"
            sx={{
              animationDelay: stagger(index, 25, 16),
              overflow: "visible",
              position: "relative",
              opacity: out ? 0.62 : 1,
              transition: "box-shadow 200ms, transform 200ms",
              "@media (hover: hover)": {
                "&:hover": { transform: out ? undefined : "translateY(-3px)" },
              },
            }}
          >
            {count > 0 && (
              <Box
                key={count}
                className="pos-bump"
                aria-label={`${count} in cart`}
                sx={(theme) => ({
                  position: "absolute",
                  top: -8,
                  right: -8,
                  zIndex: 1,
                  minWidth: 28,
                  height: 28,
                  px: 0.75,
                  borderRadius: "14px",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  color: theme.palette.secondary.contrastText,
                  bgcolor: "secondary.main",
                  border: `2px solid ${theme.palette.background.paper}`,
                  boxShadow: `0 4px 10px ${alpha(theme.palette.secondary.main, 0.4)}`,
                })}
              >
                {Number.isInteger(count) ? count : count.toFixed(1)}
              </Box>
            )}
            <CardActionArea
              onClick={(e) => handleTap(product, e)}
              data-testid={`product-card-${product.id}`}
              aria-label={`Add ${product.name}, ${money(product.selling_price)}`}
              sx={{ height: "100%", p: 1.25, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 1, borderRadius: "inherit" }}
            >
              <Box
                data-tile
                aria-hidden
                sx={{
                  height: 76,
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  position: "relative",
                  overflow: "hidden",
                  background: tileGradient(seed),
                  filter: out ? "grayscale(0.9)" : "none",
                  color: "#fff",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(120px 60px at 85% 0%, rgba(255,255,255,.28), transparent 70%)",
                  },
                }}
              >
                <Typography sx={{ fontFamily: "Rubik Variable, Rubik, sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "0.02em" }}>
                  {initials(product.name)}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "2.5em" }}
                >
                  {product.name}
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.25 }}>
                  {money(product.selling_price)}
                </Typography>
                <StockLine product={product} />
              </Box>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}
