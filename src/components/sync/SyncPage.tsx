import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import StorefrontIcon from "@mui/icons-material/StorefrontRounded";
import VisibilityIcon from "@mui/icons-material/VisibilityRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopyRounded";
import SyncIcon from "@mui/icons-material/SyncRounded";
import ConfirmDialog from "../crud/ConfirmDialog";
import SyncHelp from "./SyncHelp";
import { toast } from "../../toast/useToast";
import SyncService from "../../services/sync/SyncService";
import { useSync } from "../../services/sync/useSync";

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "never";

const message = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

/** Where the owner links the shop phone to the cloud, and their own phone to the shop. */
export default function SyncPage() {
  const sync = useSync();
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [pairing, setPairing] = useState("");
  const [working, setWorking] = useState(false);
  const [confirm, setConfirm] = useState<"view" | "stop" | null>(null);

  const run = async (work: () => Promise<void>, done: string) => {
    setWorking(true);
    try {
      await work();
      toast.success(done);
    } catch (err) {
      toast.error(message(err));
    } finally {
      setWorking(false);
    }
  };

  const copyPairing = async () => {
    const code = SyncService.pairingCode();
    try {
      if (navigator.share) await navigator.share({ text: code });
      else await navigator.clipboard.writeText(code);
      toast.success("Pairing code ready to send");
    } catch {
      // Sharing was cancelled, or the clipboard is blocked: the code is on screen to copy by hand.
    }
  };

  const spinner = working ? <CircularProgress size={18} color="inherit" /> : undefined;

  if (sync.mode !== "off") {
    const till = sync.mode === "till";
    return (
      <Box sx={{ display: "grid", gap: 2, maxWidth: 720, mx: "auto" }}>
        <SyncHelp />
        <Card sx={{ p: { xs: 2, sm: 3 }, display: "grid", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {till ? <StorefrontIcon color="primary" /> : <VisibilityIcon color="primary" />}
            <Typography variant="h6" component="h2">
              {till ? "This is the shop phone" : "This phone views the shop"}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {till
              ? "Every sale and change is sent to the cloud when there is internet. With no internet the till works as usual and catches up later."
              : "It shows what the shop phone has sent. Nothing can be changed here."}
          </Typography>
          <Typography variant="body2" data-testid="sync-status">
            {till ? "Last sent" : "Last checked"}: <strong>{when(sync.syncedAt)}</strong>
            {till && sync.dirty ? " (changes waiting to go)" : ""}
          </Typography>
          {sync.error && <Alert severity="warning">{sync.error}</Alert>}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={sync.busy ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
              disabled={sync.busy}
              onClick={() => SyncService.syncNow()}
              sx={{ minHeight: 48 }}
            >
              {till ? "Send now" : "Check now"}
            </Button>
            <Button color="error" onClick={() => setConfirm("stop")} sx={{ minHeight: 48 }}>
              Turn off sync
            </Button>
          </Box>
        </Card>

        {till && (
          <Card sx={{ p: { xs: 2, sm: 3 }, display: "grid", gap: 1.5 }}>
            <Typography variant="h6" component="h2">
              Pairing code for the owner's phone
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Send this to the owner's phone and paste it there under Sync. Anyone holding it can see the shop's records, so
              share it only with the owner.
            </Typography>
            <TextField
              value={SyncService.pairingCode()}
              multiline
              maxRows={4}
              fullWidth
              slotProps={{ htmlInput: { readOnly: true, "aria-label": "Pairing code", "data-testid": "pairing-code" } }}
            />
            <Box>
              <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyPairing} sx={{ minHeight: 48 }}>
                Send or copy
              </Button>
            </Box>
          </Card>
        )}

        <ConfirmDialog
          open={confirm === "stop"}
          message={
            till
              ? "Turn off sync? The owner's phone stops getting updates. Turning it on again makes a new pairing code."
              : "Turn off sync? This phone keeps the records it has and stops updating."
          }
          onConfirm={() => {
            setConfirm(null);
            SyncService.stop();
          }}
          onCancel={() => setConfirm(null)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 720, mx: "auto" }}>
        <SyncHelp />
      <Card sx={{ p: { xs: 2, sm: 3 }, display: "grid", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StorefrontIcon color="primary" />
          <Typography variant="h6" component="h2">
            This is the shop phone
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Sales are rung up here. Enter your Supabase project's address and its public key (Project Settings, API) to send
          a copy to the cloud for the owner's phone.
        </Typography>
        <TextField
          label="Project address"
          placeholder="https://xxxx.supabase.co"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          fullWidth
          slotProps={{ htmlInput: { inputMode: "url", autoCapitalize: "none", "data-testid": "sync-url" } }}
        />
        <TextField
          label="Public (anon) key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          fullWidth
          slotProps={{ htmlInput: { autoCapitalize: "none", "data-testid": "sync-key" } }}
        />
        <Box>
          <Button
            variant="contained"
            disabled={working || !url || !key}
            startIcon={spinner}
            onClick={() => run(() => SyncService.startAsTill({ url, key }), "Sync is on. The shop has been sent to the cloud")}
            sx={{ minHeight: 48 }}
            data-testid="sync-start-till"
          >
            Turn on sync
          </Button>
        </Box>
      </Card>

      <Card sx={{ p: { xs: 2, sm: 3 }, display: "grid", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <VisibilityIcon color="secondary" />
          <Typography variant="h6" component="h2">
            This is the owner's phone
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Paste the pairing code from the shop phone to follow the shop from here. Everything on this phone is replaced by
          the shop's records, and you sign in with the same usernames and passwords as on the shop phone.
        </Typography>
        <TextField
          label="Pairing code"
          value={pairing}
          onChange={(e) => setPairing(e.target.value)}
          multiline
          maxRows={4}
          fullWidth
          slotProps={{ htmlInput: { autoCapitalize: "none", "data-testid": "sync-pairing" } }}
        />
        <Box>
          <Button
            variant="contained"
            color="secondary"
            disabled={working || !pairing.trim()}
            startIcon={spinner}
            onClick={() => setConfirm("view")}
            sx={{ minHeight: 48 }}
            data-testid="sync-start-viewer"
          >
            View the shop
          </Button>
        </Box>
      </Card>

      <ConfirmDialog
        open={confirm === "view"}
        message="Replace everything on this phone with the shop's records? Sales, products and users now on this phone are removed."
        onConfirm={() => {
          setConfirm(null);
          run(() => SyncService.startAsViewer(pairing), "This phone now follows the shop");
        }}
        onCancel={() => setConfirm(null)}
      />
    </Box>
  );
}
