import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import ListPage from "../crud/ListPage";
import { ColumnDef } from "../crud/types";
import ChangePasswordDialog from "./ChangePasswordDialog";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { useSelector } from "react-redux";
import { selectUser } from "../../reducers/auth";

interface UserRow {
  id: number;
  name: string;
  role: string;
}

const columns: ColumnDef<UserRow>[] = [
  { key: "name", label: "Username", primary: true },
  { key: "role", label: "Role", secondary: true },
];

export default function UsersPage() {
  const navigate = useNavigate();
  // api.auth.login returns { authToken, refreshToken, user }, and the whole
  // payload is what the auth slice stores.
  const signedIn = useSelector(selectUser);
  const signedInAs = signedIn?.name;
  const [changingPasswordFor, setChangingPasswordFor] = useState<UserRow | null>(null);
  const [defaultPasswordInUse, setDefaultPasswordInUse] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // A till left on the shipped admin/admin is the single most likely way a
  // shop gets robbed by someone who picked up the tablet, so say so plainly.
  const checkDefaultPassword = useCallback(async () => {
    try {
      await api.auth.login({ username: "admin", password: "admin" });
      setDefaultPasswordInUse(true);
    } catch {
      setDefaultPasswordInUse(false);
    }
  }, []);

  useEffect(() => {
    checkDefaultPassword();
  }, [checkDefaultPassword, reloadKey]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {defaultPasswordInUse && (
        <Alert severity="warning">
          The admin account still uses the password it shipped with. Change it before the
          shop opens.
        </Alert>
      )}

      <ListPage<UserRow>
        key={reloadKey}
        title="Users"
        columns={columns}
        fetchRows={async () => (await api.user.getAll()).data}
        onAdd={() => navigate("/users/new")}
        onEdit={(row) => setChangingPasswordFor(row)}
        onDelete={async (row) => {
          await api.user.delete(row.id);
        }}
        addLabel="Add user"
      />

      <Typography variant="caption" color="text.secondary">
        Signed in as {signedInAs || "unknown"}. Tap a user to change their password.
      </Typography>

      <Box>
        <Button onClick={() => navigate("/dashboard")} sx={{ minHeight: 48 }}>
          Back to dashboard
        </Button>
      </Box>

      <ChangePasswordDialog
        user={changingPasswordFor}
        isSelf={changingPasswordFor?.id === signedIn?.id}
        onClose={() => setChangingPasswordFor(null)}
        onSaved={() => {
          setChangingPasswordFor(null);
          setReloadKey((key) => key + 1);
        }}
      />
    </Box>
  );
}
