import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormPage from "../crud/FormPage";
import { FieldDef } from "../crud/types";
import api from "../../api";

const fields: FieldDef[] = [{ name: "description", label: "Description", wide: true, required: true }];

export default function ExpenseTypeFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [initial, setInitial] = useState<Record<string, unknown>>({ description: "" });
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const res = await api.expenseType.fetchById(id);
      setInitial({ description: res.data.description ?? "" });
      setLoading(false);
    })();
  }, [id, isEdit]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = { description: values.description };
    if (isEdit && id) {
      await api.expenseType.update(id, payload);
    } else {
      await api.expenseType.createNew(payload);
    }
  };

  if (loading) return null;

  return (
    <FormPage
      title={isEdit ? "Edit expense type" : "Add new expense type"}
      fields={fields}
      initial={initial}
      onSubmit={handleSubmit}
    />
  );
}
