import { ReactNode, useEffect } from "react";
import { SnackbarProvider, useSnackbar } from "notistack";
import { toast } from "./useToast";

function ToastBridge() {
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    toast.success = (msg) => enqueueSnackbar(msg, { variant: "success" });
    toast.error = (msg) => enqueueSnackbar(msg, { variant: "error" });
    toast.info = (msg) => enqueueSnackbar(msg, { variant: "info" });
  }, [enqueueSnackbar]);
  return null;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={3500}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <ToastBridge />
      {children}
    </SnackbarProvider>
  );
}
