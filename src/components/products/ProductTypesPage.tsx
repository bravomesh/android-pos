import { useNavigate } from "react-router-dom";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import api from "../../api";

interface ProductTypeRow {
  id: number;
  description: string;
}

const columns: ColumnDef<ProductTypeRow>[] = [
  { key: "id", label: "ID" },
  { key: "description", label: "Description", primary: true },
];

export default function ProductTypesPage() {
  const navigate = useNavigate();

  return (
    <ListPage<ProductTypeRow>
      title="Product Types"
      columns={columns}
      fetchRows={async () => (await api.productType.fetchAll()).data}
      searchRows={async (q: string) => (await api.productType.searchByIdAndGetByPages(q)).data}
      onAdd={() => navigate("/producttypes/new")}
      onEdit={(row) => navigate(`/producttypes/edit/${row.id}`)}
      onDelete={async (row) => {
        await api.productType.delete(row.id);
      }}
    />
  );
}
