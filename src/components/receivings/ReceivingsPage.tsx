import { useNavigate } from "react-router-dom";
import MoveToInboxIcon from "@mui/icons-material/MoveToInboxRounded";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import api from "../../api";
import { money } from "../../money";

interface ReceivingRow {
  id: number;
  product_name: string | null;
  vendor_name: string | null;
  qty: number;
  price: number;
}

const columns: ColumnDef<ReceivingRow>[] = [
  { key: "id", label: "Order Id" },
  { key: "product_name", label: "Product", primary: true },
  { key: "vendor_name", label: "Vendor", secondary: true },
  { key: "qty", label: "Qty" },
  { key: "price", label: "Price", render: (row) => money(row.price) },
];

export default function ReceivingsPage() {
  const navigate = useNavigate();

  return (
    <ListPage<ReceivingRow>
      title="Receivings"
        avatarKey="product_name"
        empty={{ icon: <MoveToInboxIcon />, title: "No stock received yet", message: "Each delivery you book in here adds to stock." }}
      columns={columns}
      fetchRows={async () => (await api.receiving.fetchAll()).data}
      searchRows={async (q: string) => (await api.receiving.searchByIdAndGetByPages(q)).data}
      onAdd={() => navigate("/receivings/new")}
      onEdit={(row) => navigate(`/receivings/edit/${row.id}`)}
      onDelete={async (row) => {
        await api.receiving.delete(row.id);
      }}
    />
  );
}
