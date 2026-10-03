import { useNavigate } from "react-router-dom";
import LocalShippingIcon from "@mui/icons-material/LocalShippingRounded";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import api from "../../api";

interface VendorRow {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  mobile: string | null;
  email: string | null;
}

const columns: ColumnDef<VendorRow>[] = [
  { key: "id", label: "Id" },
  { key: "name", label: "Name", primary: true },
  { key: "description", label: "Description" },
  { key: "address", label: "Address" },
  { key: "mobile", label: "Mobile", secondary: true },
  { key: "email", label: "Email" },
];

export default function VendorsPage() {
  const navigate = useNavigate();

  return (
    <ListPage<VendorRow>
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
  );
}
