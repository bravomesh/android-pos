import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LocalShippingIcon from "@mui/icons-material/LocalShippingRounded";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import TakePaymentDialog from "../customers/TakePaymentDialog";
import api from "../../api";
import { money } from "../../money";

interface VendorRow {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  mobile: string | null;
  email: string | null;
  owed: number;
}

export default function VendorsPage() {
  const navigate = useNavigate();
  const [paying, setPaying] = useState<VendorRow | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const columns: ColumnDef<VendorRow>[] = [
    { key: "name", label: "Name", primary: true },
    { key: "mobile", label: "Mobile", secondary: true },
    { key: "description", label: "Supplies" },
    {
      key: "owed",
      label: "We owe",
      // Deliveries bought on credit, until the supplier is paid.
      render: (row) =>
        row.owed > 0 ? (
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
            {money(row.owed)}
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setPaying(row);
              }}
              data-testid={`pay-vendor-${row.id}`}
            >
              Pay
            </Button>
          </Box>
        ) : (
          "Nothing"
        ),
    },
  ];

  return (
    <>
      <ListPage<VendorRow>
        key={reloadKey}
        title="Vendors"
        avatarKey="name"
        empty={{ icon: <LocalShippingIcon />, title: "No vendors yet", message: "Add the suppliers you buy stock from." }}
        columns={columns}
        fetchRows={async () => (await api.vendor.fetchAll()).data}
        searchRows={async (q: string) => (await api.vendor.searchByIdAndGetByPages(q)).data}
        onAdd={() => navigate("/vendors/new")}
        onEdit={(row) => navigate(`/vendors/edit/${row.id}`)}
        onDelete={async (row) => {
          await api.vendor.delete(row.id);
        }}
      />
      <TakePaymentDialog
        party={paying && { id: paying.id, name: paying.name, owed: paying.owed }}
        title={(name) => `Pay ${name}`}
        pay={async (id, amount) => (await api.vendor.payVendor(id, amount)).data.owed}
        done={(name, left) => `Payment recorded. You now owe ${name} ${left}`}
        confirmLabel="Record payment"
        onClose={() => setPaying(null)}
        onSaved={() => {
          setPaying(null);
          setReloadKey((key) => key + 1);
        }}
      />
    </>
  );
}
