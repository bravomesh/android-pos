import FormPage from "../crud/FormPage";
import { FieldDef } from "../crud/types";
import api from "../../api";

const FIELDS: FieldDef[] = [
  { name: "name", label: "Username", required: true },
  { name: "password", label: "Password", required: true, helperText: "At least 6 characters" },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    options: [
      { value: "NonAdmin", label: "Cashier" },
      { value: "Admin", label: "Administrator" },
    ],
  },
];

export default function UserFormPage() {
  const handleSubmit = async (values: Record<string, unknown>) => {
    const password = String(values.password || "");
    if (password.length < 6) {
      throw new Error("Use at least 6 characters for the password");
    }

    await api.user.create({
      name: values.name,
      password,
      role: values.role || "NonAdmin",
    });
  };

  return (
    <FormPage
      title="Add user"
      fields={FIELDS}
      initial={{ name: "", password: "", role: "NonAdmin" }}
      onSubmit={handleSubmit}
    />
  );
}
