import { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

/** What to show instead of a blank area: what is missing, and what to do about it. */
export default function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <Box
      className="pos-enter"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1,
        py: 6,
        px: 2,
      }}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          width: 72,
          height: 72,
          borderRadius: "24px",
          display: "grid",
          placeItems: "center",
          mb: 1,
          color: theme.palette.primary.main,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(
            theme.palette.secondary.main,
            0.12
          )})`,
          "& svg": { fontSize: 34 },
        })}
      >
        {icon}
      </Box>
      <Typography variant="h6">{title}</Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {message}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
    </Box>
  );
}
