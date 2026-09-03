import { ReactNode } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

export interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  color: string;
}

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            bgcolor: alpha(color, 0.14),
            color,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" component="div" noWrap>
            {label}
          </Typography>
          <Typography variant="h5" component="div" noWrap>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
