import { ReactNode } from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import ChevronRightIcon from "@mui/icons-material/ChevronRightRounded";
import AnimatedNumber from "../motion/AnimatedNumber";
import { stagger } from "../../theme/motion";

export interface StatCardProps {
  label: string;
  value: number;
  format?: (value: number) => string;
  icon: ReactNode;
  color: string;
  /** A short line under the figure, e.g. "3 need reordering". */
  hint?: string;
  /** Makes the tile a shortcut to where the figure can be acted on. */
  onClick?: () => void;
  index?: number;
}

export default function StatCard({ label, value, format, icon, color, hint, onClick, index = 0 }: StatCardProps) {
  // Phones stack the icon above the figure so a long amount keeps the full
  // width of the tile; wider screens put them side by side.
  const body = (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 1, sm: 1.5 },
        p: { xs: 1.75, sm: 2 },
        position: "relative",
        height: "100%",
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 44,
          height: 44,
          borderRadius: "14px",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          bgcolor: alpha(color, 0.14),
          color,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1, alignSelf: "stretch" }}>
        <Typography variant="caption" color="text.secondary" component="div" noWrap sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="h5" component="div" noWrap>
          <AnimatedNumber value={value} format={format} />
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary" component="div" noWrap>
            {hint}
          </Typography>
        )}
      </Box>
      {onClick && (
        <ChevronRightIcon
          aria-hidden
          sx={{
            color: "text.secondary",
            position: { xs: "absolute", sm: "static" },
            top: 12,
            right: 8,
            transition: "transform 180ms",
            ".MuiCardActionArea-root:hover &": { transform: "translateX(3px)" },
          }}
        />
      )}
    </Box>
  );

  return (
    <Card
      className="pos-enter"
      sx={{
        height: "100%",
        animationDelay: stagger(index, 50),
        position: "relative",
        overflow: "hidden",
        // A thin coloured edge ties each tile to its colour.
        "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: color },
      }}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: "100%" }} aria-label={`${label}: open`}>
          {body}
        </CardActionArea>
      ) : (
        body
      )}
    </Card>
  );
}
