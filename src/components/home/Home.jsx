import React from "react";
import Alert from "@mui/material/Alert";
import Shell from "./Shell";
import Routes from "./Routes";
import BackupBanner from "../backup/BackupBanner";
import { useSync } from "../../services/sync/useSync";

const Home = () => {
  const sync = useSync();
  return (
    <Shell>
      <BackupBanner />
      {sync.mode === "viewer" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Viewing the shop. Changes are made on the shop phone.
        </Alert>
      )}
      {/* New records from the shop arrive under the screens, so they are opened afresh to show them. */}
      <Routes key={sync.version} />
    </Shell>
  );
};

export default Home;
