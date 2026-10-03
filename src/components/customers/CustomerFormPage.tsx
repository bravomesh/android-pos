import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormPage from "../crud/FormPage";
import { FieldDef } from "../crud/types";
import api from "../../api";

const fields: FieldDef[] = [
  { name: "name", label: "Name", wide: true, required: true },
  { name: "description", label: "Description", wide: true },
  { name: "address", label: "Address", wide: true },
  { name: "mobile", label: "Mobile" },
  { name: "email", label: "Email" },
];

const EMPTY = { name: "", description: "", address: "", mobile: "", email: "" };

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [initial, setInitial] = useState<Record<string, unknown>>(EMPTY);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const res = await api.customer.fetchById(id);
      const c = res.data;
      setInitial({
        name: c.name ?? "",
        description: c.description ?? "",
        address: c.address ?? "",
        mobile: c.mobile ?? "",
        email: c.email ?? "",
      });
      setLoading(false);
    })();
  }, [id, isEdit]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      name: values.name,
      description: values.description || "",
      address: values.address || "",
      mobile: values.mobile || "",
      email: values.email || "",
    };
    if (isEdit && id) {
      await api.customer.update(id, payload);
    } else {
      await api.customer.createNew(payload);
    }
  };

  if (loading) return null;

  return (
    <FormPage
      title={isEdit ? "Edit customer" : "Add new customer"}
      fields={fields}
      initial={initial}
      onSubmit={handleSubmit}
    />
  );
}
