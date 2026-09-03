import { useNavigate } from "react-router-dom";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import api from "../../api";

interface CustomerRow {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  mobile: string | null;
  email: string | null;
}

const columns: ColumnDef<CustomerRow>[] = [
  { key: "id", label: "Id" },
  { key: "name", label: "Name", primary: true },
  { key: "description", label: "Description" },
  { key: "address", label: "Address" },
  { key: "mobile", label: "Mobile", secondary: true },
  { key: "email", label: "Email" },
];

export default function CustomersPage() {
  const navigate = useNavigate();

  return (
    <ListPage<CustomerRow>
      title="Customers"
      columns={columns}
      fetchRows={async () => (await api.customer.fetchAll()).data}
      searchRows={async (q: string) => (await api.customer.searchByIdAndGetByPages(q)).data}
      onAdd={() => navigate("/customers/new")}
      onEdit={(row) => navigate(`/customers/edit/${row.id}`)}
      onDelete={async (row) => {
        await api.customer.delete(row.id);
      }}
    />
  );
}
