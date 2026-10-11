import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import HelpIcon from "@mui/icons-material/HelpOutlineRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopyRounded";
import { toast } from "../../toast/useToast";
import schema from "../../../supabase/schema.sql?raw";

const STEPS = [
  "Create a free account and a project at supabase.com.",
  "In the project open SQL Editor, paste the setup script (the button below copies it) and press Run.",
  "Open Project Settings, then API. Copy the Project URL and the anon public key.",
  "On the shop phone sign in as the owner, open Sync, enter both and tap Turn on sync. It shows a pairing code.",
  "Send that code to the owner's phone (WhatsApp works). Install this app there, open Sync, paste the code and tap View the shop.",
];

/** The "?" on the Sync screen: how to set sync up, start to finish. */
export default function SyncHelp() {
  const [open, setOpen] = useState(false);

  const copyScript = async () => {
    try {
      if (navigator.share) await navigator.share({ text: schema });
      else await navigator.clipboard.writeText(schema);
      toast.success("Setup script ready to paste");
    } catch {
      toast.error("Could not copy. The script is also in the project as supabase/schema.sql");
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
      <Typography variant="body2" color="text.secondary">
        The shop phone sends, the owner's phone views.
      </Typography>
      <IconButton aria-label="How to set up sync" onClick={() => setOpen(true)} sx={{ width: 48, height: 48 }} data-testid="sync-help">
        <HelpIcon />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>How to set up sync</DialogTitle>
        <DialogContent>
          <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1.5 }}>
            {STEPS.map((step) => (
              <Typography component="li" variant="body2" key={step}>
                {step}
              </Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The owner's phone signs in with the same usernames and passwords as the shop phone. Keep the pairing code
            private: anyone holding it can see the shop's records.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button startIcon={<ContentCopyIcon />} onClick={copyScript} sx={{ minHeight: 48 }}>
            Copy setup script
          </Button>
          <Button variant="contained" onClick={() => setOpen(false)} sx={{ minHeight: 48 }}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
