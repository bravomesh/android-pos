import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api";
import { toast } from "../../toast/useToast";

export interface SaleProduct {
  id: number | string;
  name: string;
  selling_price: number;
  cost_price?: number;
  product_type_id?: number | string | null;
  product_type_name?: string | null;
  stock_qty: number;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  unit?: string | null;
  track_stock?: number;
}

export interface SaleProductType {
  id: number | string;
  description: string;
}

export interface UseSaleProductsResult {
  products: SaleProduct[];
  types: SaleProductType[];
  loading: boolean;
  search: (q: string) => void;
  filterByType: (typeId: number | string | null) => void;
  /** Re-read stock from the database, e.g. once a sale has been rung up. */
  refresh: () => Promise<void>;
  /** Exact match on a scanned barcode or typed shelf code. */
  findByCode: (code: string) => Promise<SaleProduct | null>;
}

const FALLBACK_ERROR = "Failed to load products";

export function useSaleProducts(): UseSaleProductsResult {
  const [allProducts, setAllProducts] = useState<SaleProduct[]>([]);
  const [types, setTypes] = useState<SaleProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState<number | string | null>(null);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const [productsRes, typesRes] = await Promise.all([
        api.product.fetchAll(),
        api.productType.fetchAll(),
      ]);
      setAllProducts(productsRes.data || []);
      setTypes(typesRes.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const search = useCallback((q: string) => setQuery(q), []);
  const filterByType = useCallback((id: number | string | null) => setTypeId(id), []);

  // The grid shows stock levels, so they have to be re-read after a sale.
  // Loaded once at mount, they used to drift further from the truth with
  // every transaction until the cashier navigated away and back.
  const refresh = useCallback(() => load(false), [load]);

  const findByCode = useCallback(async (code: string) => {
    const res = await api.product.findByCode(code);
    return (res.data as SaleProduct | null) || null;
  }, []);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProducts.filter((p) => {
      const matchesQuery =
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        String(p.sku ?? "").toLowerCase().includes(q) ||
        String(p.barcode ?? "").toLowerCase().includes(q);
      const matchesType =
        typeId === null || typeId === undefined || String(p.product_type_id) === String(typeId);
      return matchesQuery && matchesType;
    });
  }, [allProducts, query, typeId]);

  return { products, types, loading, search, filterByType, refresh, findByCode };
}
