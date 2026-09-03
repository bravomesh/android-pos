import { ReactNode } from "react";

export interface ColumnDef<Row> {
  key: string;                    // row property
  label: string;                  // header/caption
  render?: (row: Row) => ReactNode; // optional cell formatter
  primary?: boolean;              // phone card: title line
  secondary?: boolean;            // phone card: subtitle line
}

export interface ListPageProps<Row extends { id: number | string }> {
  title: string;
  columns: ColumnDef<Row>[];
  fetchRows: () => Promise<Row[]>;          // page adapts api.<entity>.fetchAll/fetchByPages
  searchRows?: (q: string) => Promise<Row[]>; // optional search
  onAdd: () => void;                         // navigate to /<entity>/new
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => Promise<void>;     // page calls api delete; ListPage reloads + toasts
  addLabel?: string;                         // default "Add new"
}

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "money" | "select" | "date";
  required?: boolean;
  options?: { value: string | number; label: string }[]; // for select
  helperText?: string;
}

export interface FormPageProps {
  title: string;
  fields: FieldDef[];
  initial: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>; // create or update; throws on failure
  submitLabel?: string; // default "Save"
}
