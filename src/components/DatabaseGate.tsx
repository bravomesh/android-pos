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
import Button from "@mui/material/Button";
import DatabaseService from "../services/database/DatabaseService";
import { BrandMark } from "./home/Shell";
import BackupScheduler from "../services/backup/BackupScheduler";
import { loadSampleShop } from "../services/demo/sampleShop";

type GateState = "initializing" | "ready" | "error";

interface DatabaseGateProps {
  children: ReactNode;
}

/** The shop's mark with a soft ring pulsing out while the database opens. */
const PulsingMark = () => (
  <Box sx={{ position: "relative", width: 72, height: 72, mb: 3 }}>
    {[0, 600].map((delay) => (
      <Box
        key={delay}
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "24px",
          bgcolor: "primary.main",
          animation: `pos-ring 1.6s cubic-bezier(0.2, 0, 0, 1) ${delay}ms infinite`,
        }}
      />
    ))}
    <Box sx={{ position: "relative" }}>
      <BrandMark size={72} />
    </Box>
  </Box>
);

export default function DatabaseGate({ children }: DatabaseGateProps) {
  const [state, setState] = useState<GateState>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState("Setting up database");

  const initializeDatabase = useCallback(async () => {
    setState("initializing");
    setError(null);

    try {
      await DatabaseService.initialize();
      // A brand-new install opens on the sample baby shop, so there is
      // something to explore straight away. The owner clears it from the
      // Backup screen when the real shop starts.
      if (DatabaseService.createdFresh) {
        DatabaseService.createdFresh = false;
        setStep("Setting up the sample shop");
        try {
          await loadSampleShop(1);
        } catch (err) {
          console.error("Sample shop could not be loaded:", err);
        }
      }
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
        <PulsingMark />
        <Typography variant="h6" color="text.primary" className="pos-enter">
          Preparing your store…
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {step}
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
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <BrandMark size={56} />
          </Box>
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
