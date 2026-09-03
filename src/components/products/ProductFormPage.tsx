import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormPage from "../crud/FormPage";
import { FieldDef } from "../crud/types";
import api from "../../api";

const BASE_FIELDS: FieldDef[] = [
  { name: "name", label: "Name", required: true },
  { name: "productTypeId", label: "Product Type", type: "select", options: [] },
  { name: "description", label: "Description" },
  { name: "costPrice", label: "Cost price", type: "money", required: true },
  { name: "sellingPrice", label: "Selling price", type: "money", required: true },
];

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;

  const [fields, setFields] = useState<FieldDef[]>(BASE_FIELDS);
  const [initial, setInitial] = useState<Record<string, unknown>>({
    name: "",
    productTypeId: "",
    description: "",
    costPrice: "",
    sellingPrice: "",
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
          costPrice: p.cost_price ?? "",
          sellingPrice: p.selling_price ?? "",
        });
      }
      setLoading(false);
    })();
  }, [id, isEdit]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      name: values.name,
      description: values.description || "",
      costPrice: Number(values.costPrice) || 0,
      sellingPrice: Number(values.sellingPrice) || 0,
      productTypeId: values.productTypeId || null,
    };

    if (isEdit && id) {
      await api.product.update(id, payload);
    } else {
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
