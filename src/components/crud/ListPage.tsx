import { useCallback, useEffect, useRef, useState, MouseEvent } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import InputAdornment from "@mui/material/InputAdornment";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/AddRounded";
import EditIcon from "@mui/icons-material/EditRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshIcon from "@mui/icons-material/RefreshRounded";
import SearchIcon from "@mui/icons-material/SearchRounded";
import SearchOffIcon from "@mui/icons-material/SearchOffRounded";
import InboxIcon from "@mui/icons-material/InboxRounded";

import { ColumnDef, ListPageProps } from "./types";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "../motion/EmptyState";
import { toast } from "../../toast/useToast";
import { stagger } from "../../theme/motion";
import { initials, tileGradient } from "../sale/productLook";

const SKELETON_ROWS = 6;

function Avatar({ text }: { text: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 40,
        height: 40,
        borderRadius: "12px",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        background: tileGradient(text),
      }}
    >
      {initials(text || "?")}
    </Box>
  );
}

export default function ListPage<Row extends { id: number | string }>({
  title,
  columns,
  fetchRows,
  searchRows,
  onAdd,
  onEdit,
  onDelete,
  addLabel,
  avatarKey,
  toolbar,
  empty,
}: ListPageProps<Row>) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const latest = useRef(0);

  const load = useCallback(
    async (q?: string) => {
      // Typing fast fires several searches; only the newest may land.
      const ticket = ++latest.current;
      setLoading(true);
      setError(null);
      try {
        const data = q && searchRows ? await searchRows(q) : await fetchRows();
        if (ticket === latest.current) setRows(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load records";
        setError(message);
        toast.error(message);
      } finally {
        if (ticket === latest.current) setLoading(false);
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
      toast.success("Deleted");
      load(query || undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const askDelete = (row: Row) => (e: MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(row);
  };

  const cellValue = (row: Row, col: ColumnDef<Row>) =>
    col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "");

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];
  const secondaryCol = columns.find((c) => c.secondary);
  const restCols = columns.filter((c) => c !== primaryCol && c !== secondaryCol);
  const avatarText = (row: Row) => (avatarKey ? String((row as Record<string, unknown>)[avatarKey] ?? "") : "");

  const actions = (row: Row) => (
    <Box sx={{ display: "flex", flexShrink: 0 }}>
      <Tooltip title="Edit">
        <IconButton
          aria-label="edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
          sx={{ width: 44, height: 44 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton aria-label="delete" onClick={askDelete(row)} sx={{ width: 44, height: 44, "&:hover": { color: "error.main" } }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const renderTable = () => (
    <Card sx={{ overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key}>{c.label}</TableCell>
              ))}
              <TableCell align="right" sx={{ width: 110 }}>
                <span className="sr-only">Actions</span>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        <Skeleton />
                      </TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                ))
              : rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => onEdit(row)}
                    className="pos-enter"
                    sx={{
                      cursor: "pointer",
                      animationDelay: stagger(index, 20, 15),
                      "&:last-child td": { borderBottom: 0 },
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    }}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        {c === primaryCol && avatarKey ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar text={avatarText(row)} />
                            <Typography sx={{ fontWeight: 700 }}>{cellValue(row, c)}</Typography>
                          </Box>
                        ) : c === primaryCol ? (
                          <Typography sx={{ fontWeight: 700 }}>{cellValue(row, c)}</Typography>
                        ) : (
                          cellValue(row, c)
                        )}
                      </TableCell>
                    ))}
                    <TableCell align="right">{actions(row)}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );

  const renderCards = () => (
    <Box sx={{ display: "grid", gap: 1.25 }}>
      {loading
        ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <Card key={i} sx={{ p: 2 }}>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </Card>
          ))
        : rows.map((row, index) => (
            <Card key={row.id} className="pos-enter" sx={{ animationDelay: stagger(index, 25, 12) }}>
              <CardActionArea onClick={() => onEdit(row)} component="div" sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5 }}>
                {avatarKey && <Avatar text={avatarText(row)} />}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle1" noWrap>
                    {cellValue(row, primaryCol)}
                  </Typography>
                  {secondaryCol && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {cellValue(row, secondaryCol)}
                    </Typography>
                  )}
                  {restCols.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
                      {restCols.map((c) => {
                        const value = cellValue(row, c);
                        if (value === "" || value === null) return null;
                        return typeof value === "string" ? (
                          <Chip key={c.key} size="small" variant="outlined" label={`${c.label}: ${value}`} />
                        ) : (
                          <Box key={c.key} sx={{ fontSize: 13 }}>
                            {value}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
                {actions(row)}
              </CardActionArea>
            </Card>
          ))}
    </Box>
  );

  const showEmpty = !loading && !error && rows.length === 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 160 }}>
          <Typography variant="h5" component="h2">
            {title}
          </Typography>
          {!loading && (
            <Chip
              key={rows.length}
              className="pos-bump"
              label={rows.length}
              size="small"
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}
            />
          )}
        </Box>
        {toolbar}
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ minHeight: 48 }}>
          {addLabel ?? "Add new"}
        </Button>
      </Box>

      {searchRows && (
        <TextField
          placeholder={`Search ${title.toLowerCase()}`}
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          fullWidth
          slotProps={{
            htmlInput: { "aria-label": `Search ${title.toLowerCase()}` },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      {error ? (
        <Card sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography color="error" sx={{ flex: 1 }}>
            {error}
          </Typography>
          <Button startIcon={<RefreshIcon />} onClick={() => load(query || undefined)} sx={{ minHeight: 48 }}>
            Retry
          </Button>
        </Card>
      ) : showEmpty ? (
        <Card>
          {query ? (
            <EmptyState icon={<SearchOffIcon />} title="No matches" message={`Nothing in ${title.toLowerCase()} matches "${query}".`} />
          ) : (
            <EmptyState
              icon={empty?.icon ?? <InboxIcon />}
              title={empty?.title ?? `No ${title.toLowerCase()} yet`}
              message={empty?.message}
              action={
                <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
                  {addLabel ?? "Add new"}
                </Button>
              }
            />
          )}
        </Card>
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
