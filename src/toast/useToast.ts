import { useSnackbar } from "notistack";

type ToastFn = (msg: string) => void;
export interface Toast { success: ToastFn; error: ToastFn; info: ToastFn }

// Module-level escape hatch for class components / non-hook code.
// ToastProvider assigns the real implementation on mount.
export const toast: Toast = {
  success: () => {},
  error: () => {},
  info: () => {},
};

export const useToast = (): Toast => {
  const { enqueueSnackbar } = useSnackbar();
  return {
    success: (msg) => enqueueSnackbar(msg, { variant: "success" }),
    error: (msg) => enqueueSnackbar(msg, { variant: "error" }),
    info: (msg) => enqueueSnackbar(msg, { variant: "info" }),
  };
};
