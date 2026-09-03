import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormPage from "../crud/FormPage";
import { FieldDef } from "../crud/types";
import api from "../../api";

const UNIT_OPTIONS = [
  { value: "pcs", label: "Pieces" },
  { value: "kg", label: "Kilograms" },
  { value: "g", label: "Grams" },
  { value: "L", label: "Litres" },
  { value: "ml", label: "Millilitres" },
  { value: "m", label: "Metres" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "service", label: "Service (not stocked)" },
];

const BASE_FIELDS: FieldDef[] = [
  { name: "name", label: "Name", required: true },
  { name: "productTypeId", label: "Product Type", type: "select", options: [] },
  { name: "description", label: "Description" },
  {
    name: "sku",
    label: "SKU / shelf code",
    helperText: "Your own code. Give each size or colour its own.",
  },
  {
    name: "barcode",
    label: "Barcode",
    helperText: "Scan or type the code printed on the packaging.",
  },
  {
    name: "unit",
    label: "Sold by",
    type: "select",
    options: UNIT_OPTIONS,
    helperText: "Choose Service for things you sell but do not stock.",
  },
  { name: "costPrice", label: "Cost price", type: "money", required: true },
  { name: "sellingPrice", label: "Selling price", type: "money", required: true },
  {
    name: "reorderLevel",
    label: "Reorder level",
    type: "number",
    helperText: "Warn when stock drops to this. Leave blank for no warning.",
  },
];

const NEW_ONLY_FIELDS: FieldDef[] = [
  {
    name: "openingStock",
    label: "Opening stock",
    type: "number",
    helperText: "How many you have right now. Add more later with a receiving.",
  },
];

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;

  // Opening stock only makes sense when the product is first created; after
  // that, stock moves through receivings, sales and adjustments so that every
  // change is accounted for.
  const [fields, setFields] = useState<FieldDef[]>(
    isEdit ? BASE_FIELDS : [...BASE_FIELDS, ...NEW_ONLY_FIELDS]
  );
  const [initial, setInitial] = useState<Record<string, unknown>>({
    name: "",
    productTypeId: "",
    description: "",
    sku: "",
    barcode: "",
    unit: "pcs",
    costPrice: "",
    sellingPrice: "",
    reorderLevel: "",
    openingStock: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const typesRes = await api.productType.fetchAll();
      const options = (typesRes.data || []).map((t: { id: number | string; description: string }) => ({
        value: t.id,
        label: t.description,
      }));
      setFields((prev) =>
        prev.map((f) => (f.name === "productTypeId" ? { ...f, options } : f))
      );

      if (isEdit && id) {
        const res = await api.product.fetchById(id);
        const p = res.data;
        setInitial({
          name: p.name ?? "",
          productTypeId: p.product_type_id ?? "",
          description: p.description ?? "",
          sku: p.sku ?? "",
          barcode: p.barcode ?? "",
          unit: p.unit ?? "pcs",
          costPrice: p.cost_price ?? "",
          sellingPrice: p.selling_price ?? "",
          reorderLevel: p.reorder_level ?? "",
        });
      }
      setLoading(false);
    })();
  }, [id, isEdit]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const unit = (values.unit as string) || "pcs";

    const payload: Record<string, unknown> = {
      name: values.name,
      description: values.description || "",
      sku: values.sku || "",
      barcode: values.barcode || "",
      unit,
      // A service has nothing to count, so it is billed without touching stock.
      trackStock: unit !== "service",
      reorderLevel: values.reorderLevel === "" ? null : Number(values.reorderLevel),
      costPrice: Number(values.costPrice) || 0,
      sellingPrice: Number(values.sellingPrice) || 0,
      productTypeId: values.productTypeId || null,
    };

    if (isEdit && id) {
      await api.product.update(id, payload);
    } else {
      payload.openingStock = Number(values.openingStock) || 0;
      await api.product.createNew(payload);
    }
  };

  if (loading) return null;

  return (
    <FormPage
      title={isEdit ? "Edit product" : "Add new product"}
      fields={fields}
      initial={initial}
      onSubmit={handleSubmit}
    />
  );
}
