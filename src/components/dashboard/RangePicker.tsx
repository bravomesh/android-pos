import { useState } from "react";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextField from "@mui/material/TextField";

export interface DateRange {
  start: string;
  end: string;
}

export type RangePreset = "today" | "7d" | "30d" | "custom";

const toIso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Local-time YYYY-MM-DD range for a preset; "custom" falls back to today. */
export const computeRange = (preset: RangePreset): DateRange => {
  const end = new Date();
  const start = new Date();
  if (preset === "7d") start.setDate(end.getDate() - 6);
  if (preset === "30d") start.setDate(end.getDate() - 29);
  return { start: toIso(start), end: toIso(end) };
};

export interface RangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function RangePicker({ value, onChange }: RangePickerProps) {
  const [preset, setPreset] = useState<RangePreset>("7d");
  const [customStart, setCustomStart] = useState(value.start);
  const [customEnd, setCustomEnd] = useState(value.end);

  const handlePreset = (_event: unknown, next: RangePreset | null) => {
    if (!next) return;
    setPreset(next);
    if (next === "custom") {
      onChange({ start: customStart, end: customEnd });
    } else {
      onChange(computeRange(next));
    }
  };

  const handleCustomStart = (next: string) => {
    setCustomStart(next);
    onChange({ start: next, end: customEnd });
  };

  const handleCustomEnd = (next: string) => {
    setCustomEnd(next);
    onChange({ start: customStart, end: next });
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
      <ToggleButtonGroup exclusive size="small" value={preset} onChange={handlePreset} aria-label="Date range">
        <ToggleButton value="today">Today</ToggleButton>
        <ToggleButton value="7d">7 days</ToggleButton>
        <ToggleButton value="30d">30 days</ToggleButton>
        <ToggleButton value="custom">Custom</ToggleButton>
      </ToggleButtonGroup>
      {preset === "custom" && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            type="date"
            size="small"
            label="Start"
            value={customStart}
            onChange={(e) => handleCustomStart(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            size="small"
            label="End"
            value={customEnd}
            onChange={(e) => handleCustomEnd(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      )}
    </Box>
  );
}
