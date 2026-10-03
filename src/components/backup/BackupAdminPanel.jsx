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
import CloudDoneIcon from '@mui/icons-material/CloudDoneRounded';
import CloudOffIcon from '@mui/icons-material/CloudOffRounded';
import CloudQueueIcon from '@mui/icons-material/CloudQueueRounded';
import CloudUploadIcon from '@mui/icons-material/CloudUploadRounded';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestoreRounded';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweepRounded';
import { emptyCart } from '../../actions/cart';

class BackupAdminPanel extends Component {
  state = {
    date: yesterdayLocalISO(new Date()),
    busy: false,
    rows: [],
    lastResult: null,
    restoreFile: null,
    restoring: false,
    confirmClear: false,
    clearing: false
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
      toast.success(`Backup saved to ${result.pdfUri}`);
    } else {
      toast.error(`Backup failed: ${result.error}`);
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
        throw new Error('This is not a backup file from this app');
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
      toast.error(`Restore failed, nothing was changed: ${err.message}`);
      this.setState({ restoring: false });
    }
  };

  handleClear = async () => {
    this.setState({ confirmClear: false, clearing: true });
    try {
      await BackupService.saveSafetyCopy();
      await DatabaseService.clearShopData();
      // The cart may still hold products that no longer exist.
      store.dispatch(emptyCart());
      toast.success('The shop is empty and ready for your own products.');
    } catch (err) {
      toast.error(`Could not clear the shop, nothing was changed: ${err.message}`);
    } finally {
      this.setState({ clearing: false });
    }
  };

  render() {
    const { date, busy, rows, lastResult, restoreFile, restoring, confirmClear, clearing } = this.state;
    const latest = rows[0];
    const healthy = latest && latest.status === 'success';

    return (
      <Box sx={{ display: 'grid', gap: 2.5, maxWidth: 960, mx: 'auto' }}>
        {/* Status first: is the shop's data safe right now? */}
        <Box
          className="pos-enter"
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 3,
            borderRadius: '22px',
            color: '#fff',
            background: healthy
              ? 'linear-gradient(125deg, #065F46, #047857 55%, #0F766E)'
              : latest
                ? `linear-gradient(125deg, #991B1B, ${theme.palette.error.main})`
                : 'linear-gradient(125deg, #334155, #475569)',
          })}
        >
          <Box sx={{ width: 56, height: 56, borderRadius: '18px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,.16)', flexShrink: 0 }}>
            {healthy ? <CloudDoneIcon fontSize="large" /> : latest ? <CloudOffIcon fontSize="large" /> : <CloudQueueIcon fontSize="large" />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ color: '#fff' }}>
              {healthy ? 'Backed up' : latest ? 'The last backup failed' : 'No backup yet'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {latest
                ? `Last run for ${latest.date}${latest.error_message ? `: ${latest.error_message}` : ''}`
                : 'The first one runs tonight at 00:30, or start one below.'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              Files go to Documents/POS/Daily. Copy them off the tablet regularly.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Card className="pos-enter" sx={{ animationDelay: '60ms' }}>
            <CardContent sx={{ display: 'grid', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CloudUploadIcon color="primary" />
                <Typography variant="h6">Back up a day</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Writes that day's sales report (PDF) and a full copy of the data. Yesterday is{' '}
                {yesterdayLocalISO(new Date())}; today is {todayLocalISO(new Date())}.
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}>
                <TextField
                  type="date"
                  label="Day"
                  size="small"
                  value={date}
                  onChange={this.handleDate}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Button variant="contained" onClick={this.handleRun} disabled={busy} sx={{ minHeight: 48 }}>
                  {busy ? 'Backing up…' : 'Back up now'}
                </Button>
              </Stack>
              {lastResult && (
                <Alert severity={lastResult.ok ? 'success' : 'error'} className="pos-enter">
                  {lastResult.ok ? `Saved ${lastResult.pdfUri}` : `Failed: ${lastResult.error}`}
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="pos-enter" sx={{ animationDelay: '120ms' }}>
            <CardContent sx={{ display: 'grid', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SettingsBackupRestoreIcon color="secondary" />
                <Typography variant="h6">Restore from a backup</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Moving the shop onto a new tablet? Choose a <code>…-pos-backup.json</code> file. Everything here is
                replaced by what is in the file, and a copy of the current data is saved first.
              </Typography>
              <Box>
                <Button variant="outlined" color="secondary" component="label" disabled={restoring} data-testid="restore-btn" sx={{ minHeight: 48 }}>
                  {restoring ? 'Restoring…' : 'Choose backup file'}
                  <input hidden type="file" accept="application/json,.json" onChange={this.handleRestoreFile} data-testid="restore-input" />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Card className="pos-enter" sx={{ animationDelay: '150ms', borderColor: 'error.main' }}>
          <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <DeleteSweepIcon color="error" />
            <Box sx={{ flex: '1 1 260px' }}>
              <Typography variant="h6">Start afresh</Typography>
              <Typography variant="body2" color="text.secondary">
                Clears every product, sale, customer, supplier and expense, such as the sample shop
                the app starts with. User accounts stay, and a copy of the data is saved first.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={() => this.setState({ confirmClear: true })}
              disabled={clearing}
              sx={{ minHeight: 48 }}
              data-testid="start-afresh"
            >
              {clearing ? 'Clearing…' : 'Clear everything'}
            </Button>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={confirmClear}
          message="Clear every product, sale, customer, supplier and expense from this tablet? User accounts stay. A copy of the current data is saved to the backup folder first."
          onConfirm={this.handleClear}
          onCancel={() => this.setState({ confirmClear: false })}
        />

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

        {rows.length > 0 && (
          <Card className="pos-enter" sx={{ animationDelay: '180ms', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ran at</TableCell>
                  <TableCell>Report</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.date}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>
                      <Chip label={r.status === 'success' ? 'Saved' : 'Failed'} color={r.status === 'success' ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell>{new Date(r.exported_at).toLocaleString()}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{r.pdf_path}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </Box>
    );
  }
}

export default BackupAdminPanel;
