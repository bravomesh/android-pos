import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

import { ListPageProps } from "./types";
import ConfirmDialog from "./ConfirmDialog";
import { toast } from "../../toast/useToast";

const SKELETON_ROWS = 5;

export default function ListPage<Row extends { id: number | string }>({
  title,
  columns,
  fetchRows,
  searchRows,
  onAdd,
  onEdit,
  onDelete,
  addLabel,
}: ListPageProps<Row>) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const load = useCallback(
    async (q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = q && searchRows ? await searchRows(q) : await fetchRows();
        setRows(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load records";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [fetchRows, searchRows]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    load(value || undefined);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await onDelete(target);
      toast.success("Deleted successfully");
      load(query || undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const cellValue = (row: Row, col: (typeof columns)[number]) =>
    col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "");

  const primaryCol = columns.find((c) => c.primary);
  const secondaryCol = columns.find((c) => c.secondary);
  const restCols = columns.filter((c) => !c.primary && !c.secondary);

  const renderSkeletonTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.key}>{c.label}</TableCell>
            ))}
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <TableRow key={i}>
              {columns.map((c) => (
                <TableCell key={c.key}>
                  <Skeleton />
                </TableCell>
              ))}
              <TableCell align="right">
                <Skeleton />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderSkeletonCards = () => (
    <Stack spacing={1.5}>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <Card key={i}>
          <CardContent>
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const renderTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.key}>{c.label}</TableCell>
            ))}
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {columns.map((c) => (
                <TableCell key={c.key}>{cellValue(row, c)}</TableCell>
              ))}
              <TableCell align="right">
                <IconButton aria-label="edit" onClick={() => onEdit(row)} sx={{ minWidth: 48, minHeight: 48 }}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  onClick={() => setDeleteTarget(row)}
                  sx={{ minWidth: 48, minHeight: 48 }}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCards = () => (
    <Stack spacing={1.5}>
      {rows.map((row) => (
        <Card key={row.id}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                {primaryCol && (
                  <Typography variant="subtitle1" noWrap>
                    {cellValue(row, primaryCol)}
                  </Typography>
                )}
                {secondaryCol && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {cellValue(row, secondaryCol)}
                  </Typography>
                )}
                {restCols.map((c) => (
                  <Typography key={c.key} variant="caption" color="text.secondary" component="div">
                    {c.label}: {cellValue(row, c)}
                  </Typography>
                ))}
              </Box>
              <Box sx={{ display: "flex", flexShrink: 0 }}>
                <IconButton aria-label="edit" onClick={() => onEdit(row)} sx={{ minWidth: 48, minHeight: 48 }}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  onClick={() => setDeleteTarget(row)}
                  sx={{ minWidth: 48, minHeight: 48 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography variant="h5">{title}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ minHeight: 48 }}>
          {addLabel ?? "Add new"}
        </Button>
      </Box>

      {searchRows && (
        <TextField
          placeholder="Search"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="small"
          fullWidth
        />
      )}

      {loading ? (
        isDesktop ? (
          renderSkeletonTable()
        ) : (
          renderSkeletonCards()
        )
      ) : error ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography color="error">{error}</Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => load(query || undefined)}
            sx={{ minHeight: 48 }}
          >
            Retry
          </Button>
        </Box>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">No records found</Typography>
      ) : isDesktop ? (
        renderTable()
      ) : (
        renderCards()
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message="Delete this record? This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
