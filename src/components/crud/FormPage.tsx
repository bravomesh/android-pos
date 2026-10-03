import { FormEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBackRounded";

import { FieldDef, FormPageProps } from "./types";
import EntitySelect from "./EntitySelect";
import { toast } from "../../toast/useToast";
import { CURRENCY } from "../../money";
import { stagger } from "../../theme/motion";

const REQUIRED_MESSAGE = "Required field";

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

export default function FormPage({ title, subtitle, fields, initial, onSubmit, submitLabel }: FormPageProps) {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const setField = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && isEmpty(values[field.name])) {
        next[field.name] = REQUIRED_MESSAGE;
      }
    }
    return next;
  };

  const shake = () => {
    const el = formRef.current;
    if (!el) return;
    el.classList.remove("pos-shake");
    void el.offsetWidth;
    el.classList.add("pos-shake");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      shake();
      // Take the cashier to the first field that needs attention.
      const first = fields.find((f) => validationErrors[f.name]);
      if (first) document.getElementById(first.name)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      toast.success("Saved");
      navigate(-1);
    } catch (err) {
      shake();
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FieldDef) => {
    const value = (values[field.name] as string | number | undefined) ?? "";
    const errorText = errors[field.name];
    const label = field.required ? `${field.label} *` : field.label;
    const common = {
      id: field.name,
      name: field.name,
      label,
      value,
      error: !!errorText,
      helperText: errorText ?? field.helperText,
      fullWidth: true,
    };

    if (field.type === "select") {
      return (
        <EntitySelect
          name={field.name}
          label={label}
          value={value}
          options={field.options ?? []}
          onChange={(v) => setField(field.name, v)}
          error={!!errorText}
          helperText={errorText ?? field.helperText}
        />
      );
    }

    if (field.type === "number" || field.type === "money") {
      return (
        <TextField
          {...common}
          type="number"
          onChange={(e) => setField(field.name, e.target.value)}
          slotProps={{
            htmlInput: { inputMode: "decimal" },
            input:
              field.type === "money"
                ? { startAdornment: <InputAdornment position="start">{CURRENCY}</InputAdornment> }
                : undefined,
          }}
        />
      );
    }

    if (field.type === "date") {
      return (
        <TextField
          {...common}
          type="date"
          onChange={(e) => setField(field.name, e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      );
    }

    return <TextField {...common} type="text" onChange={(e) => setField(field.name, e.target.value)} />;
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton aria-label="Back" onClick={() => navigate(-1)} sx={{ width: 48, height: 48 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" component="h2">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <Card>
        <Box
          ref={formRef}
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: "grid",
            gap: 2.5,
            p: { xs: 2, sm: 3 },
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          {fields.map((field, index) => (
            <Box
              key={field.name}
              className="pos-enter"
              sx={{
                gridColumn: field.wide ? "1 / -1" : "auto",
                animationDelay: stagger(index, 30),
              }}
            >
              {renderField(field)}
            </Box>
          ))}

          <Box
            sx={(theme) => ({
              gridColumn: "1 / -1",
              display: "flex",
              gap: 1.5,
              justifyContent: "flex-end",
              position: "sticky",
              bottom: 0,
              mx: { xs: -2, sm: -3 },
              mb: { xs: -2, sm: -3 },
              px: { xs: 2, sm: 3 },
              py: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.paper, 0.92),
              backdropFilter: "blur(8px)",
            })}
          >
            <Button color="inherit" onClick={() => navigate(-1)} disabled={submitting} sx={{ color: "text.secondary", minHeight: 48 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ minHeight: 48, minWidth: 140 }}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {submitLabel ?? "Save"}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
