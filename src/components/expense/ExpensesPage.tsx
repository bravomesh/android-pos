import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import ReceiptIcon from "@mui/icons-material/ReceiptLongRounded";
import CategoryIcon from "@mui/icons-material/CategoryRounded";
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
    <ListPage<ExpenseRow>
      title="Expenses"
      toolbar={
        <Button variant="outlined" startIcon={<CategoryIcon />} onClick={() => navigate("/expensetypes")} sx={{ minHeight: 48 }}>
          Expense types
        </Button>
      }
      empty={{ icon: <ReceiptIcon />, title: "No expenses yet", message: "Record rent, power, transport and other costs to see your real profit." }}
      columns={columns}
      fetchRows={async () => (await api.expense.fetchAll()).data}
      searchRows={async (q: string) => (await api.expense.searchByIdAndGetByPages(q)).data}
      onAdd={() => navigate("/expense/new")}
      onEdit={(row) => navigate(`/expense/edit/${row.id}`)}
      onDelete={async (row) => {
        await api.expense.delete(row.id);
      }}
    />
  );
}
