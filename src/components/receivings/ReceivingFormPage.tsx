import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormPage from "../crud/FormPage";
import { FieldDef } from "../crud/types";
import api from "../../api";

const BASE_FIELDS: FieldDef[] = [
  { name: "productId", label: "Product", type: "select", options: [], required: true },
  { name: "vendorId", label: "Vendor", type: "select", options: [] },
  { name: "qty", label: "Qty", type: "number", required: true },
  { name: "price", label: "Price", type: "money" },
  {
    name: "amountPaid",
    label: "Amount paid to supplier",
    type: "money",
    helperText: "Leave blank if paid in full. Enter less, or 0, for stock taken on credit.",
  },
  { name: "date", label: "Received At", type: "date" },
];

const EMPTY = { productId: "", vendorId: "", qty: "", price: "", amountPaid: "", date: "" };

export default function ReceivingFormPage() {
  const { id } = useParams();
  const isEdit = !!id;

  const [fields, setFields] = useState<FieldDef[]>(BASE_FIELDS);
  const [initial, setInitial] = useState<Record<string, unknown>>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [productsRes, vendorsRes] = await Promise.all([
        api.product.fetchAll(),
        api.vendor.fetchAll(),
      ]);
      const productOptions = (productsRes.data || []).map((p: { id: number | string; name: string }) => ({
        value: p.id,
        label: p.name,
      }));
      const vendorOptions = (vendorsRes.data || []).map((v: { id: number | string; name: string }) => ({
        value: v.id,
        label: v.name,
      }));

      setFields((prev) =>
        prev.map((f) => {
          if (f.name === "productId") return { ...f, options: productOptions };
          if (f.name === "vendorId") return { ...f, options: vendorOptions };
          return f;
        })
      );

      if (isEdit && id) {
        const res = await api.receiving.fetchById(id);
        const r = res.data;
        setInitial({
          productId: r.product_id ?? "",
          vendorId: r.vendor_id ?? "",
          qty: r.qty ?? "",
          price: r.price ?? "",
          amountPaid: r.amount_paid ?? "",
          date: (r.payed_at || "").slice(0, 10),
        });
      }
      setLoading(false);
    })();
  }, [id, isEdit]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      productId: values.productId,
      vendorId: values.vendorId || null,
      qty: Number(values.qty) || 0,
      price: Number(values.price) || 0,
      amountPaid: values.amountPaid === "" ? undefined : Number(values.amountPaid),
      payedAt: values.date || undefined,
    };
    if (isEdit && id) {
      await api.receiving.update(id, payload);
    } else {
      await api.receiving.createNew(payload);
    }
  };

  if (loading) return null;

  return (
    <FormPage
      title={isEdit ? "Edit receiving" : "Add new receiving"}
      fields={fields}
      initial={initial}
      onSubmit={handleSubmit}
    />
  );
}
