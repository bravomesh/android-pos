import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormPage from "../crud/FormPage";
import { FieldDef } from "../crud/types";
import api from "../../api";

const fields: FieldDef[] = [{ name: "description", label: "Description", wide: true, required: true }];

export default function ProductTypeFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [initial, setInitial] = useState<Record<string, unknown>>({ description: "" });
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const res = await api.productType.fetchById(id);
      setInitial({ description: res.data.description ?? "" });
      setLoading(false);
    })();
  }, [id, isEdit]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = { description: values.description };
    if (isEdit && id) {
      await api.productType.update(id, payload);
    } else {
      await api.productType.createNew(payload);
    }
  };

  if (loading) return null;

  return (
    <FormPage
      title={isEdit ? "Edit product type" : "Add new product type"}
      fields={fields}
      initial={initial}
      onSubmit={handleSubmit}
    />
  );
}
