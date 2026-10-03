import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Skeleton from "@mui/material/Skeleton";
import { alpha, useTheme } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreRounded";
import UndoIcon from "@mui/icons-material/UndoRounded";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongRounded";
import api from "../../api";
import ConfirmDialog from "../crud/ConfirmDialog";
import EmptyState from "../motion/EmptyState";
import AnimatedNumber from "../motion/AnimatedNumber";
import { toast } from "../../toast/useToast";
import { money } from "../../money";
import { localDay, localDayBefore } from "../../services/database/businessDay";
import { selectIsAdmin } from "../../reducers/auth";
import { duration, easing, stagger } from "../../theme/motion";

interface SaleRow {
  id: number;
  created_at: string;
  sales_type: "Counter" | "Credit";
  transaction_status: "Done" | "Reversed";
  customer_name: string | null;
  cashier_name: string | null;
  net_amount: number;
  amount_paid: number;
  items_count: number;
}

interface SaleLine {
  product_id: number;
  product_name: string;
  qty: number;
  selling_price: number;
  price: number;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const shiftDay = (day: string, by: number) => {
  const [y, m, d] = day.split("-").map(Number);
  return localDayBefore(-by, new Date(y, m - 1, d));
};

const dayLabel = (day: string) => {
  if (day === localDay()) return "Today";
  if (day === localDayBefore(1)) return "Yesterday";
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
};

function Summary({ label, value, format, color }: { label: string; value: number; format?: (v: number) => string; color: string }) {
  return (
    <Card sx={{ p: 2, position: "relative", overflow: "hidden" }}>
      <Box aria-hidden sx={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${alpha(color, 0.14)}, transparent 60%)` }} />
      <Typography variant="caption" color="text.secondary" component="div" sx={{ fontWeight: 700, position: "relative" }} noWrap>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ position: "relative", fontSize: { xs: "1.1rem", sm: "1.5rem" } }} noWrap>
        <AnimatedNumber value={value} format={format} />
      </Typography>
    </Card>
  );
}

export default function SalesHistoryPage() {
  const theme = useTheme();
  // Undoing a sale puts money back in a customer's hand, so it is kept for
  // whoever runs the shop.
  const canReverse = useSelector(selectIsAdmin);
  const [day, setDay] = useState(localDay());
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [lines, setLines] = useState<Record<number, SaleLine[]>>({});
  const [reversing, setReversing] = useState<SaleRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSales((await api.transaction.getSales(day, day)).data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    load();
    setOpenId(null);
  }, [load]);

  const toggle = async (sale: SaleRow) => {
    if (openId === sale.id) {
      setOpenId(null);
      return;
    }
    setOpenId(sale.id);
    if (lines[sale.id]) return;
    try {
      const items = (await api.transaction.getSale(sale.id)).data?.items || [];
      setLines((prev) => ({ ...prev, [sale.id]: items }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load the sale");
    }
  };

  const handleReverse = async () => {
    if (!reversing) return;
    const sale = reversing;
    setReversing(null);
    try {
      await api.transaction.reverseSale(sale.id);
      toast.success(`Sale #${sale.id} reversed`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reverse the sale");
    }
  };

  const done = sales.filter((s) => s.transaction_status === "Done");
  const takings = done.reduce((sum, s) => sum + (s.net_amount || 0), 0);
  const onAccount = done.filter((s) => s.sales_type === "Credit").reduce((sum, s) => sum + (s.net_amount - s.amount_paid), 0);
  const isToday = day === localDay();
  const navButton = { width: 48, height: 48, bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}` };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <IconButton aria-label="Previous day" onClick={() => setDay((d) => shiftDay(d, -1))} sx={navButton}>
          <ChevronLeftIcon />
        </IconButton>
        <Box key={day} className="pos-enter" sx={{ flex: 1, minWidth: 120 }}>
          <Typography variant="h5" component="h2" noWrap>
            {dayLabel(day)}
          </Typography>
        </Box>
        <TextField
          type="date"
          size="small"
          label="Pick a day"
          value={day}
          onChange={(e) => e.target.value && setDay(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 170 }}
        />
        {!isToday && (
          <Button variant="outlined" onClick={() => setDay(localDay())} sx={{ minHeight: 48 }}>
            Today
          </Button>
        )}
        <IconButton aria-label="Next day" disabled={isToday} onClick={() => setDay((d) => shiftDay(d, 1))} sx={navButton}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Typography data-testid="sales-summary" className="sr-only">
        {done.length} sale{done.length === 1 ? "" : "s"} · {money(takings)}
      </Typography>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <Summary label="Sales" value={done.length} color={theme.palette.secondary.main} />
        <Summary label="Takings" value={takings} format={money} color={theme.palette.primary.main} />
        <Summary label="Put on account" value={onAccount} format={money} color={theme.palette.warning.main} />
      </Box>

      {loading ? (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} sx={{ p: 2 }}>
              <Skeleton width="40%" />
              <Skeleton width="25%" />
            </Card>
          ))}
        </Box>
      ) : sales.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ReceiptLongIcon />}
            title={isToday ? "No sales yet today" : "No sales on this day"}
            message={isToday ? "Sales appear here as soon as they are rung up." : "Use the arrows to look at another day."}
          />
        </Card>
      ) : (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {sales.map((sale, index) => {
            const reversed = sale.transaction_status === "Reversed";
            const open = openId === sale.id;
            const edge = reversed
              ? theme.palette.text.disabled
              : sale.sales_type === "Credit"
                ? theme.palette.warning.main
                : theme.palette.primary.main;
            return (
              <Card
                key={sale.id}
                className="pos-enter"
                sx={{
                  animationDelay: stagger(index, 30, 12),
                  position: "relative",
                  opacity: reversed ? 0.7 : 1,
                  "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: edge },
                }}
              >
                <CardActionArea onClick={() => toggle(sale)} data-testid={`sale-${sale.id}`} aria-expanded={open}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, pl: 2.5 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ textDecoration: reversed ? "line-through" : "none" }}>
                        #{sale.id} · {time(sale.created_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {sale.items_count} item{sale.items_count === 1 ? "" : "s"}
                        {sale.customer_name ? ` · ${sale.customer_name}` : ""}
                        {sale.cashier_name ? ` · by ${sale.cashier_name}` : ""}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography variant="h6">{money(sale.net_amount)}</Typography>
                      <Chip
                        size="small"
                        label={reversed ? "Reversed" : sale.sales_type === "Credit" ? "On account" : "Cash"}
                        color={reversed ? "default" : sale.sales_type === "Credit" ? "warning" : "success"}
                        variant={reversed ? "outlined" : "filled"}
                      />
                    </Box>
                    <ExpandMoreIcon
                      aria-hidden
                      sx={{
                        color: "text.secondary",
                        transform: open ? "rotate(180deg)" : "none",
                        transition: `transform ${duration.enter}ms ${easing.standard}`,
                      }}
                    />
                  </Box>
                </CardActionArea>

                <Collapse in={open} timeout={duration.enter} easing={easing.decelerate} unmountOnExit>
                  <Box sx={{ px: 2.5, pb: 2, pt: 1.5, borderTop: `1px dashed ${theme.palette.divider}` }}>
                    {(lines[sale.id] || []).map((line) => (
                      <Box key={line.product_id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                        <Typography variant="body2">
                          {line.qty} × {line.product_name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {money(line.price)}
                        </Typography>
                      </Box>
                    ))}
                    {!reversed && canReverse && (
                      <Button
                        color="error"
                        startIcon={<UndoIcon />}
                        onClick={() => setReversing(sale)}
                        sx={{ mt: 1, minHeight: 48 }}
                        data-testid={`reverse-${sale.id}`}
                      >
                        Reverse sale
                      </Button>
                    )}
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Box>
      )}

      <ConfirmDialog
        open={!!reversing}
        message={
          reversing
            ? `Reverse sale #${reversing.id}? The goods go back into stock` +
              (reversing.sales_type === "Credit" ? " and the amount still owed comes off the customer's account" : "") +
              (reversing.amount_paid > 0 ? `. Give the customer back ${money(reversing.amount_paid)}.` : ".")
            : ""
        }
        onConfirm={handleReverse}
        onCancel={() => setReversing(null)}
      />
    </Box>
  );
}
