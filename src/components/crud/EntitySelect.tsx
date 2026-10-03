import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";

export interface EntitySelectOption {
  value: string | number;
  label: string;
}

export interface EntitySelectProps {
  name: string;
  label: string;
  value: string | number;
  options: EntitySelectOption[];
  onChange: (value: string | number) => void;
  error?: boolean;
  helperText?: string;
}

export default function EntitySelect({
  name,
  label,
  value,
  options,
  onChange,
  error,
  helperText,
}: EntitySelectProps) {
  const handleChange = (event: SelectChangeEvent<string | number>) => {
    onChange(event.target.value);
  };

  const labelId = `${name}-label`;

  return (
    <FormControl fullWidth error={error}>
      <InputLabel id={labelId}>{label}</InputLabel>
      {/* MUI Select renders a hidden input carrying `name`, used by forms/tests. */}
      <Select
        labelId={labelId}
        id={name}
        name={name}
        label={label}
        value={value ?? ""}
        onChange={handleChange}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
