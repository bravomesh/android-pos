import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import api from "../../api";
import { money } from "../../money";

interface ExpenseRow {
  id: number;
  description: string | null;
  amount: number;
  spent_at: string | null;
  expense_type_name: string | null;
}

const columns: ColumnDef<ExpenseRow>[] = [
  { key: "id", label: "ID" },
  { key: "description", label: "Description", primary: true },
  { key: "amount", label: "Amount", render: (row) => money(row.amount) },
  { key: "spent_at", label: "Spent At" },
  { key: "expense_type_name", label: "Type", secondary: true },
];

export default function ExpensesPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button size="small" onClick={() => navigate("/expensetypes")} sx={{ minHeight: 48 }}>
          Expense types
        </Button>
      </Box>
      <ListPage<ExpenseRow>
        title="Expenses"
        columns={columns}
        fetchRows={async () => (await api.expense.fetchAll()).data}
        searchRows={async (q: string) => (await api.expense.searchByIdAndGetByPages(q)).data}
        onAdd={() => navigate("/expense/new")}
        onEdit={(row) => navigate(`/expense/edit/${row.id}`)}
        onDelete={async (row) => {
          await api.expense.delete(row.id);
        }}
      />
    </Box>
  );
}
