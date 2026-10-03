import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAdmin } from "../../reducers/auth";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import PeopleIcon from "@mui/icons-material/PeopleAltRounded";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import TakePaymentDialog from "./TakePaymentDialog";
import api from "../../api";
import { money } from "../../money";

interface CustomerRow {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  mobile: string | null;
  email: string | null;
  outstanding_balance: number;
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const isOwner = useSelector(selectIsAdmin);
  const [paying, setPaying] = useState<CustomerRow | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const columns: ColumnDef<CustomerRow>[] = [
    { key: "name", label: "Name", primary: true },
    { key: "mobile", label: "Mobile", secondary: true },
    { key: "address", label: "Address" },
    {
      key: "outstanding_balance",
      label: "Owes",
      render: (row) =>
        row.outstanding_balance > 0 ? (
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
            {money(row.outstanding_balance)}
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={(e) => {
                // The row itself opens the customer for editing.
                e.stopPropagation();
                setPaying(row);
              }}
              data-testid={`take-payment-${row.id}`}
            >
              Take payment
            </Button>
          </Box>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <>
      <ListPage<CustomerRow>
        key={reloadKey}
        title="Customers"
        avatarKey="name"
        empty={{ icon: <PeopleIcon />, title: "No customers yet", message: "Add regulars here to sell to them on account." }}
        columns={columns}
        fetchRows={async () => (await api.customer.fetchAll()).data}
        searchRows={async (q: string) => (await api.customer.searchByIdAndGetByPages(q)).data}
        onAdd={() => navigate("/customers/new")}
        onEdit={(row) => navigate(`/customers/edit/${row.id}`)}
        // Removing a customer is the owner's call; shopkeepers add and edit them.
        onDelete={
          isOwner
            ? async (row) => {
                await api.customer.delete(row.id);
              }
            : undefined
        }
      />
      <TakePaymentDialog
        party={paying && { id: paying.id, name: paying.name, owed: paying.outstanding_balance }}
        title={(name) => `Payment from ${name}`}
        pay={async (id, amount) => (await api.customer.receivePayment(id, amount)).data.balance}
        done={(name, left) => `Payment taken. ${name} now owes ${left}`}
        confirmLabel="Take payment"
        onClose={() => setPaying(null)}
        onSaved={() => {
          setPaying(null);
          setReloadKey((key) => key + 1);
        }}
      />
    </>
  );
}
