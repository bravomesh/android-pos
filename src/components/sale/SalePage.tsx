import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api";
import { toast } from "../../toast/useToast";
import { RootState } from "../../store";
import { addItemToCart, updateCartItem } from "../../actions/cart";
import { useSaleProducts, SaleProduct } from "./useSaleProducts";
import ProductGrid from "./ProductGrid";
import CartBar from "./CartBar";
import CartSheet from "./CartSheet";
import CheckoutDialog from "./CheckoutDialog";

export default function SalePage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { products, types, loading, search, filterByType } = useSaleProducts();

  const [activeType, setActiveType] = useState<number | string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Guard against React 18 StrictMode's double-invoked effects creating two
  // transactions for a single mount.
  const startedTransaction = useRef(false);

  useEffect(() => {
    if (startedTransaction.current) return;
    startedTransaction.current = true;

    api.transaction.getTransactionId().catch((err) => {
      toast.error(err instanceof Error ? err.message : "Failed to start a new sale");
    });
  }, []);

  const handleTypeSelect = (id: number | string | null) => {
    setActiveType(id);
    filterByType(id);
  };

  const handleAdd = (product: SaleProduct) => {
    const existing = cartItems[product.id];
    if (existing) {
      dispatch(updateCartItem({ ...existing, qty: existing.qty + 1 }));
    } else {
      dispatch(
        addItemToCart({
          id: product.id,
          name: product.name,
          qty: 1,
          price: Number(product.selling_price),
          discount: 0,
        })
      );
    }
  };

  const handleCharge = () => setCheckoutOpen(true);

  const handleCheckoutCompleted = () => {
    setCheckoutOpen(false);
    setCartOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        gap: 2,
        height: "calc(100vh - 112px)",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          pb: isDesktop ? 0 : 9,
        }}
      >
        <Box sx={{ position: "sticky", top: 0, zIndex: 1, bgcolor: "background.default", pb: 1.5 }}>
          <TextField
            fullWidth
            placeholder="Search products"
            size="small"
            onChange={(e) => search(e.target.value)}
            slotProps={{ htmlInput: { "data-testid": "sale-search-input" } }}
            sx={{ mb: 1.5 }}
          />
          <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
            <Chip
              label="All"
              color={activeType === null ? "primary" : "default"}
              onClick={() => handleTypeSelect(null)}
              sx={{ minHeight: 32 }}
            />
            {types.map((t) => (
              <Chip
                key={t.id}
                label={t.description}
                color={activeType === t.id ? "primary" : "default"}
                onClick={() => handleTypeSelect(t.id)}
                sx={{ minHeight: 32 }}
              />
            ))}
          </Stack>
        </Box>

        <ProductGrid products={products} onAdd={handleAdd} loading={loading} />
      </Box>

      {isDesktop && (
        <Box sx={{ width: 360, flexShrink: 0 }}>
          <CartSheet variant="panel" open onClose={() => {}} onCharge={handleCharge} />
        </Box>
      )}

      {!isDesktop && (
        <>
          <CartBar onViewCart={() => setCartOpen(true)} />
          <CartSheet
            variant="drawer"
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            onCharge={handleCharge}
          />
        </>
      )}

      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onCompleted={handleCheckoutCompleted}
      />
    </Box>
  );
}
