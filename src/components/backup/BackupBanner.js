import React, { Component } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import exportRepository from '../../services/backup/exportRepository';
import BackupScheduler from '../../services/backup/BackupScheduler';
import { toast } from '../../toast/useToast';

class BackupBanner extends Component {
  state = { errorRow: null, busy: false };

  componentDidMount() {
    this.refresh();
  }

  refresh = async () => {
    try {
      const latest = await exportRepository.getLatest();
      if (latest && latest.status === 'error') {
        this.setState({ errorRow: latest });
      } else {
        this.setState({ errorRow: null });
      }
    } catch (e) {
      console.error('BackupBanner refresh failed:', e);
    }
  };

  handleRetry = async () => {
    const { errorRow } = this.state;
    if (!errorRow) return;
    this.setState({ busy: true });
    const result = await BackupScheduler.runManual(errorRow.date);
    await this.refresh();
    this.setState({ busy: false });
    if (result && result.ok) {
      toast.success('Backup retried successfully');
    } else if (result) {
      toast.error(`Retry failed — ${result.error}`);
    }
  };

  render() {
    const { errorRow, busy } = this.state;
    if (!errorRow) return null;
    const isPermission = (errorRow.error_message || '')
      .toLowerCase()
      .includes('permission');
    return (
      <Alert
        severity="error"
        variant="filled"
        sx={{ borderRadius: 0 }}
        action={
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            onClick={this.handleRetry}
            disabled={busy}
            sx={{ borderColor: 'currentColor' }}
          >
            {busy ? 'Retrying…' : isPermission ? 'Grant permission' : 'Retry now'}
          </Button>
        }
      >
        Backup for {errorRow.date} failed
        {errorRow.error_message ? `: ${errorRow.error_message}` : '.'}
      </Alert>
    );
  }
}

export default BackupBanner;
