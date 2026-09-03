import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import api from "../../api";

interface ProductRow {
  id: number;
  name: string;
  sku: string | null;
  unit: string;
  reorder_level: number | null;
  track_stock: number;
  product_type_name: string | null;
  selling_price: number;
  stock_qty: number;
}

const columns: ColumnDef<ProductRow>[] = [
  { key: "name", label: "Name", primary: true },
  {
    key: "sku",
    label: "Code",
    secondary: true,
    render: (row) => row.sku || row.product_type_name || "—",
  },
  { key: "selling_price", label: "Selling Price" },
  {
    key: "stock_qty",
    label: "Stock",
    // A service has no stock to show, and a product at or below its reorder
    // level is called out where the shopkeeper is already looking.
    render: (row) => {
      if (!row.track_stock) return "—";
      const low = row.reorder_level !== null && Number(row.stock_qty) <= Number(row.reorder_level);
      return `${row.stock_qty} ${row.unit || ""}${low ? " (low)" : ""}`.trim();
    },
  },
];

export default function ProductsPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button size="small" onClick={() => navigate("/producttypes")} sx={{ minHeight: 48 }}>
          Product types
        </Button>
      </Box>
      <ListPage<ProductRow>
        title="Products"
        columns={columns}
        fetchRows={async () => (await api.product.fetchAll()).data}
        searchRows={async (q: string) => (await api.product.searchByIdAndGetByPages(q)).data}
        onAdd={() => navigate("/products/new")}
        onEdit={(row) => navigate(`/products/edit/${row.id}`)}
        onDelete={async (row) => {
          await api.product.delete(row.id);
        }}
      />
    </Box>
  );
}
