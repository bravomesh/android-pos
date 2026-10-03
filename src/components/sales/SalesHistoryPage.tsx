import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import api from "../../api";
import ConfirmDialog from "../crud/ConfirmDialog";
import { toast } from "../../toast/useToast";
import { money } from "../../money";
import { localDay } from "../../services/database/businessDay";

interface SaleRow {
  id: number;
  created_at: string;
  sales_type: "Counter" | "Credit";
  transaction_status: "Done" | "Reversed";
  customer_name: string | null;
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

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function SalesHistoryPage() {
  const [day, setDay] = useState(localDay());
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [lines, setLines] = useState<SaleLine[]>([]);
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
    setLines([]);
    try {
      setLines((await api.transaction.getSale(sale.id)).data?.items || []);
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
        <Typography variant="h5">Sales</Typography>
        <TextField
          type="date"
          size="small"
          label="Day"
          value={day}
          onChange={(e) => e.target.value && setDay(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" data-testid="sales-summary">
        {done.length} sale{done.length === 1 ? "" : "s"} · {money(takings)}
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : sales.length === 0 ? (
        <Typography color="text.secondary">No sales on this day</Typography>
      ) : (
        <Stack spacing={1.5}>
          {sales.map((sale) => {
            const reversed = sale.transaction_status === "Reversed";
            return (
              <Card key={sale.id} sx={{ opacity: reversed ? 0.6 : 1 }}>
                <CardActionArea onClick={() => toggle(sale)} data-testid={`sale-${sale.id}`}>
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1">
                        #{sale.id} · {time(sale.created_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {sale.items_count} item{sale.items_count === 1 ? "" : "s"}
                        {sale.customer_name ? ` · ${sale.customer_name}` : ""}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography variant="subtitle1">{money(sale.net_amount)}</Typography>
                      <Chip
                        size="small"
                        label={reversed ? "Reversed" : sale.sales_type === "Credit" ? "On account" : "Cash"}
                        color={reversed ? "default" : sale.sales_type === "Credit" ? "warning" : "success"}
                      />
                    </Box>
                  </CardContent>
                </CardActionArea>

                {openId === sale.id && (
                  <CardContent sx={{ pt: 0 }}>
                    {lines.map((line) => (
                      <Box key={line.product_id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                        <Typography variant="body2">
                          {line.qty} × {line.product_name}
                        </Typography>
                        <Typography variant="body2">{money(line.price)}</Typography>
                      </Box>
                    ))}
                    {!reversed && (
                      <Button
                        color="error"
                        onClick={() => setReversing(sale)}
                        sx={{ mt: 1, minHeight: 48 }}
                        data-testid={`reverse-${sale.id}`}
                      >
                        Reverse sale
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </Stack>
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
