import React, { Component } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import exportRepository from '../../services/backup/exportRepository';
import BackupScheduler from '../../services/backup/BackupScheduler';
import { todayLocalISO, yesterdayLocalISO } from '../../services/backup/dateUtils';
import { toast } from '../../toast/useToast';

class BackupAdminPanel extends Component {
  state = {
    date: yesterdayLocalISO(new Date()),
    busy: false,
    rows: [],
    lastResult: null
  };

  componentDidMount() {
    this.refresh();
  }

  refresh = async () => {
    const latest = await exportRepository.getLatest();
    this.setState({ rows: latest ? [latest] : [] });
  };

  handleDate = (e) => this.setState({ date: e.target.value });

  handleRun = async () => {
    this.setState({ busy: true, lastResult: null });
    const result = await BackupScheduler.runManual(this.state.date);
    this.setState({ busy: false, lastResult: result });
    if (result.ok) {
      toast.success(`Backup succeeded — wrote ${result.pdfUri}`);
    } else {
      toast.error(`Backup failed — ${result.error}`);
    }
    await this.refresh();
  };

  render() {
    const { date, busy, rows, lastResult } = this.state;
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Backup Admin
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Today: {todayLocalISO(new Date())} — yesterday:{' '}
          {yesterdayLocalISO(new Date())}
        </Typography>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              <TextField
                type="date"
                label="Backup date"
                size="small"
                value={date}
                onChange={this.handleDate}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button
                variant="contained"
                onClick={this.handleRun}
                disabled={busy}
              >
                {busy ? 'Running…' : 'Re-run backup for this date'}
              </Button>
            </Stack>
            {lastResult && (
              <Alert
                severity={lastResult.ok ? 'success' : 'error'}
                sx={{ mt: 2 }}
              >
                {lastResult.ok
                  ? `Success — wrote ${lastResult.pdfUri}`
                  : `Failed — ${lastResult.error}`}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Exported At</TableCell>
                <TableCell>PDF</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.date}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.status}
                      color={r.status === 'success' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{r.exported_at}</TableCell>
                  <TableCell>{r.pdf_path}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>
    );
  }
}

export default BackupAdminPanel;
