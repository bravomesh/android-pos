import { useNavigate } from "react-router-dom";
import CategoryIcon from "@mui/icons-material/CategoryRounded";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import api from "../../api";

interface ExpenseTypeRow {
  id: number;
  description: string;
}

const columns: ColumnDef<ExpenseTypeRow>[] = [
  { key: "id", label: "ID" },
  { key: "description", label: "Description", primary: true },
];

export default function ExpenseTypesPage() {
  const navigate = useNavigate();

  return (
    <ListPage<ExpenseTypeRow>
      title="Expense Types"
        empty={{ icon: <CategoryIcon />, title: "No expense types yet", message: "Types group costs, like Rent or Transport." }}
      columns={columns}
      fetchRows={async () => (await api.expenseType.fetchAll()).data}
      searchRows={async (q: string) => (await api.expenseType.searchByIdAndGetByPages(q)).data}
      onAdd={() => navigate("/expensetypes/new")}
      onEdit={(row) => navigate(`/expensetypes/edit/${row.id}`)}
      onDelete={async (row) => {
        await api.expenseType.delete(row.id);
      }}
    />
  );
}
