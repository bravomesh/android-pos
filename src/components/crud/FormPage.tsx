import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import { FormPageProps } from "./types";
import EntitySelect from "./EntitySelect";
import { toast } from "../../toast/useToast";

const REQUIRED_MESSAGE = "Required field";

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

export default function FormPage({ title, fields, initial, onSubmit, submitLabel }: FormPageProps) {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      toast.success("Saved successfully");
      navigate(-1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {fields.map((field) => {
            const value = (values[field.name] as string | number | undefined) ?? "";
            const errorText = errors[field.name];

            if (field.type === "select") {
              return (
                <EntitySelect
                  key={field.name}
                  name={field.name}
                  label={field.label}
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
                  key={field.name}
                  id={field.name}
                  name={field.name}
                  label={field.label}
                  type="number"
                  slotProps={{ htmlInput: { inputMode: "decimal" } }}
                  value={value}
                  onChange={(e) => setField(field.name, e.target.value)}
                  error={!!errorText}
                  helperText={errorText ?? field.helperText}
                  fullWidth
                />
              );
            }

            if (field.type === "date") {
              return (
                <TextField
                  key={field.name}
                  id={field.name}
                  name={field.name}
                  label={field.label}
                  type="date"
                  value={value}
                  onChange={(e) => setField(field.name, e.target.value)}
                  error={!!errorText}
                  helperText={errorText ?? field.helperText}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
              );
            }

            return (
              <TextField
                key={field.name}
                id={field.name}
                name={field.name}
                label={field.label}
                type="text"
                value={value}
                onChange={(e) => setField(field.name, e.target.value)}
                error={!!errorText}
                helperText={errorText ?? field.helperText}
                fullWidth
              />
            );
          })}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting}
            sx={{ minHeight: 48 }}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {submitLabel ?? "Save"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
