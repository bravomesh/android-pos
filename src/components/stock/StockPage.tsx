import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import api from "../../api";
import { toast } from "../../toast/useToast";
import AdjustStockDialog from "./AdjustStockDialog";
import { money } from "../../money";

interface StockRow {
  id: number;
  name: string;
  sku: string | null;
  unit: string;
  reorder_level: number | null;
  stock_qty: number;
  cost_price: number;
  selling_price: number;
  stock_cost_value: number;
  stock_retail_value: number;
  category: string | null;
}

interface AdjustmentRow {
  id: number;
  product_name: string;
  unit: string;
  qty_before: number;
  qty_change: number;
  qty_after: number;
  reason: string;
  notes: string | null;
  user_name: string | null;
  created_at: string;
}


export default function StockPage() {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState<StockRow[]>([]);
  const [totals, setTotals] = useState({ cost: 0, retail: 0, units: 0 });
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<StockRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [valuation, history] = await Promise.all([
        api.product.getStockValuation(),
        api.product.getStockAdjustments({ limit: 200 }),
      ]);
      setRows(valuation.data.products || []);
      setTotals(valuation.data.totals || { cost: 0, retail: 0, units: 0 });
      setAdjustments(history.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        String(row.sku ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const lowCount = useMemo(
    () =>
      rows.filter(
        (row) => row.reorder_level !== null && Number(row.stock_qty) <= Number(row.reorder_level)
      ).length,
    [rows]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5">Stock</Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Card sx={{ flex: "1 1 160px" }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Value at cost
            </Typography>
            <Typography variant="h6" data-testid="stock-value-cost">
              {money(totals.cost)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 160px" }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Value at retail
            </Typography>
            <Typography variant="h6">{money(totals.retail)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 160px" }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Needs reordering
            </Typography>
            <Typography variant="h6" data-testid="stock-low-count">
              {lowCount}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable">
        <Tab label="On hand" sx={{ minHeight: 48 }} />
        <Tab label="Movements" sx={{ minHeight: 48 }} />
      </Tabs>

      {tab === 0 && (
        <>
          <TextField
            label="Search by name or code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="small"
            fullWidth
          />
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">On hand</TableCell>
                  <TableCell align="right">Reorder at</TableCell>
                  <TableCell align="right">Cost value</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((row) => {
                  const low =
                    row.reorder_level !== null &&
                    Number(row.stock_qty) <= Number(row.reorder_level);
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2">{row.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.sku || row.category || ""}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          color={low ? "warning" : "default"}
                          label={`${row.stock_qty} ${row.unit}`}
                        />
                      </TableCell>
                      <TableCell align="right">{row.reorder_level ?? "—"}</TableCell>
                      <TableCell align="right">{money(row.stock_cost_value)}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => setTarget(row)}
                          sx={{ minHeight: 48 }}
                          data-testid={`adjust-${row.id}`}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No stocked products yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </>
      )}

      {tab === 1 && (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell align="right">Change</TableCell>
                <TableCell align="right">After</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adjustments.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                  <TableCell>{row.product_name}</TableCell>
                  <TableCell>
                    {row.reason}
                    {row.notes || row.user_name ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {[row.notes, row.user_name && `by ${row.user_name}`].filter(Boolean).join(" · ")}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={Number(row.qty_change) < 0 ? "error.main" : "success.main"}
                    >
                      {Number(row.qty_change) > 0 ? "+" : ""}
                      {row.qty_change} {row.unit}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{row.qty_after}</TableCell>
                </TableRow>
              ))}
              {adjustments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No stock movements recorded yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <AdjustStockDialog
        product={target}
        onClose={() => setTarget(null)}
        onSaved={async () => {
          setTarget(null);
          await load();
        }}
      />
    </Box>
  );
}
