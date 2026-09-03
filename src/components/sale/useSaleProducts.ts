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
}

const FALLBACK_ERROR = "Failed to load products";

export function useSaleProducts(): UseSaleProductsResult {
  const [allProducts, setAllProducts] = useState<SaleProduct[]>([]);
  const [types, setTypes] = useState<SaleProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState<number | string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [productsRes, typesRes] = await Promise.all([
          api.product.fetchAll(),
          api.productType.fetchAll(),
        ]);
        if (cancelled) return;
        setAllProducts(productsRes.data || []);
        setTypes(typesRes.data || []);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : FALLBACK_ERROR;
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const search = useCallback((q: string) => setQuery(q), []);
  const filterByType = useCallback((id: number | string | null) => setTypeId(id), []);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProducts.filter((p) => {
      const matchesQuery = q === "" || p.name.toLowerCase().includes(q);
      const matchesType =
        typeId === null || typeId === undefined || String(p.product_type_id) === String(typeId);
      return matchesQuery && matchesType;
    });
  }, [allProducts, query, typeId]);

  return { products, types, loading, search, filterByType };
}
