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
  /** Column whose text becomes the coloured initials tile beside each row. */
  avatarKey?: string;
  /** Extra buttons beside Add, e.g. a link to product types. */
  toolbar?: ReactNode;
  /** Icon and wording for the screen before anything has been added. */
  empty?: { icon: ReactNode; title: string; message?: string };
}

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "money" | "select" | "date";
  required?: boolean;
  options?: { value: string | number; label: string }[]; // for select
  helperText?: string;
  /** Takes the full width of the form instead of one of two columns. */
  wide?: boolean;
}

export interface FormPageProps {
  title: string;
  fields: FieldDef[];
  initial: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>; // create or update; throws on failure
  submitLabel?: string; // default "Save"
  /** One line under the title saying what the form is for. */
  subtitle?: string;
}
