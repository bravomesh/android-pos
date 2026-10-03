import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { SaleProduct } from "./useSaleProducts";
import { toast } from "../../toast/useToast";
import { money } from "../../money";

export interface ProductGridProps {
  products: SaleProduct[];
  onAdd: (product: SaleProduct) => void;
  loading?: boolean;
}

export default function ProductGrid({ products, onAdd, loading }: ProductGridProps) {
  const handleTap = (product: SaleProduct) => {
    if (!product.stock_qty || product.stock_qty <= 0) {
      toast.error("Out of stock");
      return;
    }
    onAdd(product);
  };

  if (loading) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        Loading products…
      </Typography>
    );
  }

  if (products.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        No products found
      </Typography>
    );
  }

  return (
    <Grid container spacing={1.5} sx={{ p: 0.5 }}>
      {products.map((product) => {
        const outOfStock = !product.stock_qty || product.stock_qty <= 0;
        return (
          <Grid key={product.id} size={{ xs: 6, sm: 4, md: 3 }}>
            <Card sx={{ height: "100%" }}>
              <CardActionArea
                onClick={() => handleTap(product)}
                data-testid={`product-card-${product.id}`}
                sx={{
                  minHeight: 96,
                  height: "100%",
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  gap: 0.5,
                }}
              >
                <Typography variant="subtitle2" noWrap sx={{ width: "100%" }}>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {money(product.selling_price)}
                </Typography>
                <Box sx={{ mt: "auto" }}>
                  <Chip
                    size="small"
                    label={outOfStock ? "Out of stock" : `Stock: ${product.stock_qty}`}
                    color={outOfStock ? "error" : "default"}
                  />
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
