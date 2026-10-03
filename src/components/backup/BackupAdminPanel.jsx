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
import BackupService from '../../services/backup/BackupService';
import DatabaseService from '../../services/database/DatabaseService';
import ConfirmDialog from '../crud/ConfirmDialog';
import store from '../../store';
import { logout } from '../../actions/auth';
import BackupScheduler from '../../services/backup/BackupScheduler';
import { todayLocalISO, yesterdayLocalISO } from '../../services/backup/dateUtils';
import { toast } from '../../toast/useToast';

class BackupAdminPanel extends Component {
  state = {
    date: yesterdayLocalISO(new Date()),
    busy: false,
    rows: [],
    lastResult: null,
    restoreFile: null,
    restoring: false
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

  handleRestoreFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dump = JSON.parse(await file.text());
      if (dump.format !== 'mobile-pos-backup') {
        throw new Error('This is not a Mobile POS backup file');
      }
      this.setState({ restoreFile: { name: file.name, dump } });
    } catch (err) {
      toast.error(err instanceof SyntaxError ? 'That file is damaged or not a backup' : err.message);
    }
  };

  handleRestore = async () => {
    const { dump } = this.state.restoreFile;
    this.setState({ restoreFile: null, restoring: true });
    try {
      await BackupService.saveSafetyCopy();
      await DatabaseService.restoreAllTables(dump);
      toast.success('Backup restored. Sign in again.');
      // The users came from the backup too, so whoever is signed in may
      // no longer exist.
      store.dispatch(logout());
    } catch (err) {
      toast.error(`Restore failed, nothing was changed — ${err.message}`);
      this.setState({ restoring: false });
    }
  };

  render() {
    const { date, busy, rows, lastResult, restoreFile, restoring } = this.state;
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

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Restore from a backup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use this to move the shop onto a new tablet: choose a
              <code> …-pos-backup.json </code> file. Everything on this tablet is
              replaced by what is in the file. A copy of the current data is
              saved first.
            </Typography>
            <Button variant="outlined" component="label" disabled={restoring} data-testid="restore-btn">
              {restoring ? 'Restoring…' : 'Choose backup file'}
              <input
                hidden
                type="file"
                accept="application/json,.json"
                onChange={this.handleRestoreFile}
                data-testid="restore-input"
              />
            </Button>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={!!restoreFile}
          message={
            restoreFile
              ? `Replace everything on this tablet with ${restoreFile.name}` +
                (restoreFile.dump.exportedAt ? `, taken ${new Date(restoreFile.dump.exportedAt).toLocaleString()}` : '') +
                '? Sales, stock, customers and users will all be replaced.'
              : ''
          }
          onConfirm={this.handleRestore}
          onCancel={() => this.setState({ restoreFile: null })}
        />

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
