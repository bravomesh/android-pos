/**
 * Database Gate
 *
 * Initializes the SQLite database before rendering the rest of the app.
 * Shows a branded loading screen during init, and an error + retry screen
 * if init fails. Renders children once the database is ready.
 */

import { ReactNode, useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import StorefrontIcon from "@mui/icons-material/Storefront";
import DatabaseService from "../services/database/DatabaseService";
import BackupScheduler from "../services/backup/BackupScheduler";

type GateState = "initializing" | "ready" | "error";

interface DatabaseGateProps {
  children: ReactNode;
}

const BrandMark = () => (
  <Box
    sx={{
      width: 64,
      height: 64,
      borderRadius: 2,
      bgcolor: "primary.main",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mb: 2,
    }}
  >
    <StorefrontIcon sx={{ color: "primary.contrastText", fontSize: 32 }} />
  </Box>
);

export default function DatabaseGate({ children }: DatabaseGateProps) {
  const [state, setState] = useState<GateState>("initializing");
  const [error, setError] = useState<string | null>(null);

  const initializeDatabase = useCallback(async () => {
    setState("initializing");
    setError(null);

    try {
      await DatabaseService.initialize();
      setState("ready");
      BackupScheduler.init().catch((err: unknown) =>
        console.error("BackupScheduler init failed:", err)
      );
    } catch (err) {
      console.error("Database initialization failed:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize database");
      setState("error");
    }
  }, []);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  if (state === "initializing") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <BrandMark />
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.primary">
          Preparing your store…
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Setting up database
        </Typography>
      </Box>
    );
  }

  if (state === "error") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          px: 2,
        }}
      >
        <Card sx={{ width: "100%", maxWidth: 400, p: 4, textAlign: "center" }}>
          <BrandMark />
          <Typography variant="h6" color="text.primary" gutterBottom>
            Initialization Error
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant="contained" fullWidth onClick={initializeDatabase}>
            Retry
          </Button>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
}
