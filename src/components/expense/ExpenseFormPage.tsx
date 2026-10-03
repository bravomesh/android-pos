import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormPage from "../crud/FormPage";
import { FieldDef } from "../crud/types";
import api from "../../api";

const BASE_FIELDS: FieldDef[] = [
  { name: "expenseTypeId", label: "Expense type", type: "select", options: [] },
  { name: "amount", label: "Amount", type: "money", required: true },
  { name: "description", label: "Expense description", wide: true },
  { name: "spentAt", label: "Spent At", type: "date" },
];

const EMPTY = { expenseTypeId: "", amount: "", description: "", spentAt: "" };

export default function ExpenseFormPage() {
  const { id } = useParams();
  const isEdit = !!id;

  const [fields, setFields] = useState<FieldDef[]>(BASE_FIELDS);
  const [initial, setInitial] = useState<Record<string, unknown>>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const typesRes = await api.expenseType.fetchAll();
      const options = (typesRes.data || []).map((t: { id: number | string; description: string }) => ({
        value: t.id,
        label: t.description,
      }));
      setFields((prev) =>
        prev.map((f) => (f.name === "expenseTypeId" ? { ...f, options } : f))
      );

      if (isEdit && id) {
        const res = await api.expense.fetchById(id);
        const e = res.data;
        setInitial({
          expenseTypeId: e.expense_type_id ?? "",
          amount: e.amount ?? "",
          description: e.description ?? "",
          spentAt: (e.spent_at || "").slice(0, 10),
        });
      }
      setLoading(false);
    })();
  }, [id, isEdit]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      expenseTypeId: values.expenseTypeId || null,
      amount: Number(values.amount) || 0,
      description: values.description || "",
      spentAt: values.spentAt || undefined,
    };
    if (isEdit && id) {
      await api.expense.update(id, payload);
    } else {
      await api.expense.createNew(payload);
    }
  };

  if (loading) return null;

  return (
    <FormPage
      title={isEdit ? "Edit expense" : "Add new expense"}
      fields={fields}
      initial={initial}
      onSubmit={handleSubmit}
    />
  );
}
