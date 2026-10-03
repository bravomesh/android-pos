import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/SearchRounded";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScannerRounded";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api";
import { toast } from "../../toast/useToast";
import { RootState } from "../../store";
import { addItemToCart, updateCartItem } from "../../actions/cart";
import { useSaleProducts, SaleProduct } from "./useSaleProducts";
import { stagger } from "../../theme/motion";
import ProductGrid from "./ProductGrid";
import CartBar from "./CartBar";
import CartSheet from "./CartSheet";
import CheckoutDialog from "./CheckoutDialog";
import { bumpCart } from "./flyToCart";

/** Replay a one-shot CSS animation class on an element. */
const replay = (el: HTMLElement | null, className: string) => {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
};

export default function SalePage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { products, types, loading, search, filterByType, refresh, findByCode } = useSaleProducts();

  const [activeType, setActiveType] = useState<number | string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [term, setTerm] = useState("");
  const searchBox = useRef<HTMLDivElement>(null);

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

  const inCart = useMemo(
    () => Object.fromEntries(Object.values(cartItems).map((line) => [String(line.id), line.qty])),
    [cartItems]
  );

  // Category chips show how many products each holds, from what is loaded.
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) counts[String(p.product_type_id)] = (counts[String(p.product_type_id)] || 0) + 1;
    return counts;
  }, [products]);

  const handleTypeSelect = (id: number | string | null) => {
    setActiveType(id);
    filterByType(id);
  };

  const handleAdd = (product: SaleProduct): boolean => {
    const existing = cartItems[product.id];
    const wanted = (existing?.qty ?? 0) + 1;

    // Caught here rather than at checkout, so the cashier finds out while the
    // customer is still choosing, not after the whole basket is rung up.
    if (product.track_stock !== 0 && wanted > Number(product.stock_qty)) {
      toast.error(
        Number(product.stock_qty) > 0
          ? `Only ${product.stock_qty} ${product.name} in stock`
          : `${product.name} is out of stock`
      );
      return false;
    }

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
    return true;
  };

  /**
   * A barcode scanner behaves like a keyboard that types the code and presses
   * Enter, so submitting the search box is the scan path. An exact code match
   * goes straight into the cart and clears the box, ready for the next item;
   * the box flashes green so the cashier knows it went in without looking.
   * An unknown code shakes the box and says so.
   */
  const handleSearchSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const code = term.trim();
    if (!code) return;

    try {
      const found = await findByCode(code);
      if (!found) {
        // Several products may still match the typed name; only a code that
        // looks like a barcode and matches nothing is worth flagging.
        if (products.length === 0) {
          replay(searchBox.current, "pos-shake");
          toast.error(`Nothing matches "${code}"`);
        }
        return;
      }

      if (handleAdd(found)) {
        replay(searchBox.current, "pos-flash-ok");
        bumpCart();
        setTerm("");
        search("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not look up that code");
    }
  };

  const handleCheckoutCompleted = () => {
    setCheckoutOpen(false);
    setCartOpen(false);
    // Stock levels on the grid are now one sale out of date.
    refresh();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        gap: 2.5,
        height: isDesktop ? "calc(100dvh - 104px)" : "auto",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto", pb: isDesktop ? 1 : 12, px: 0.5 }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            pb: 1.5,
            pt: 0.5,
            bgcolor: "background.default",
          }}
        >
          <Box component="form" onSubmit={handleSearchSubmit}>
            <TextField
              ref={searchBox}
              fullWidth
              placeholder="Search or scan a barcode"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                search(e.target.value);
              }}
              slotProps={{
                htmlInput: { "data-testid": "sale-search-input", "aria-label": "Search or scan a barcode" },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <QrCodeScannerIcon color="action" aria-hidden />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 1.5, borderRadius: "12px", "& .MuiOutlinedInput-root": { borderRadius: "12px", minHeight: 52 } }}
            />
          </Box>
          <Box role="tablist" aria-label="Categories" sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, scrollbarWidth: "none" }}>
            {[{ id: null as number | string | null, description: "All" }, ...types].map((t, i) => {
              const selected = activeType === t.id;
              const count = t.id === null ? undefined : typeCounts[String(t.id)];
              return (
                <Chip
                  key={String(t.id)}
                  role="tab"
                  aria-selected={selected}
                  className="pos-enter"
                  label={count && activeType === null ? `${t.description} · ${count}` : t.description}
                  color={selected ? "primary" : "default"}
                  variant={selected ? "filled" : "outlined"}
                  onClick={() => handleTypeSelect(t.id)}
                  sx={{ minHeight: 40, px: 0.5, animationDelay: stagger(i, 30), flexShrink: 0, bgcolor: selected ? undefined : "background.paper" }}
                />
              );
            })}
          </Box>
        </Box>

        <ProductGrid products={products} onAdd={handleAdd} inCart={inCart} loading={loading} />
      </Box>

      {isDesktop && (
        <Box sx={{ width: { sm: 340, lg: 380 }, flexShrink: 0 }}>
          <CartSheet variant="panel" open onClose={() => {}} onCharge={() => setCheckoutOpen(true)} />
        </Box>
      )}

      {!isDesktop && (
        <>
          <CartBar onViewCart={() => setCartOpen(true)} />
          <CartSheet variant="drawer" open={cartOpen} onClose={() => setCartOpen(false)} onCharge={() => setCheckoutOpen(true)} />
        </>
      )}

      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onCompleted={handleCheckoutCompleted} />
    </Box>
  );
}
