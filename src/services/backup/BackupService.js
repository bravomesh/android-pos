import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import db from '../database/DatabaseService';
import reportsService from '../database/ReportsService';
import exportRepository from './exportRepository';
import { buildDailyReportPdf } from './reportPdf';

const BACKUP_DIR = 'POS/Daily';

/**
 * Where daily exports are written.
 *
 * Directory.External is the app's own folder on shared storage
 * (Android/data/<package>/files). Every Android version grants it without a
 * runtime permission and without the "All files access" special grant, so the
 * app works the same on any handset or tablet regardless of vendor. Writing
 * to the root of shared storage, as this used to, needs MANAGE_EXTERNAL_STORAGE
 * on Android 11+ — a permission Play restricts, and one that several vendor
 * skins bury behind their own settings screens.
 *
 * A second copy is attempted in the shared Documents folder purely for
 * convenience, since that is easier for a shopkeeper to find over USB. It is
 * best-effort: if the platform refuses, the backup has already succeeded.
 */
const PRIMARY_DIRECTORY = Directory.External;
const CONVENIENCE_DIRECTORY = Directory.Documents;

const u8ToBase64 = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
};

const ensureDir = async (directory) => {
  try {
    await Filesystem.mkdir({ path: BACKUP_DIR, directory, recursive: true });
  } catch (e) {
    if (!String(e?.message || '').toLowerCase().includes('exist')) {
      throw e;
    }
  }
};

const writeBase64 = async (filename, base64) => {
  const result = await Filesystem.writeFile({
    path: `${BACKUP_DIR}/${filename}`,
    data: base64,
    directory: PRIMARY_DIRECTORY,
    recursive: true
  });

  // Best-effort second copy somewhere the shopkeeper can reach over USB.
  if (Capacitor.getPlatform() !== 'web') {
    try {
      await ensureDir(CONVENIENCE_DIRECTORY);
      await Filesystem.writeFile({
        path: `${BACKUP_DIR}/${filename}`,
        data: base64,
        directory: CONVENIENCE_DIRECTORY,
        recursive: true
      });
    } catch (e) {
      console.warn('[backup] shared-storage copy skipped:', e?.message);
    }
  }

  return result.uri;
};

const writeBinary = (filename, bytes) => writeBase64(filename, u8ToBase64(bytes));

const writeText = (filename, text) =>
  writeBase64(filename, btoa(unescape(encodeURIComponent(text))));

/**
 * Export the data itself, rather than copying the SQLite file from a
 * hardcoded path. See DatabaseService.exportAllTables().
 */
const writeDataBackup = async (filename) => {
  const dump = await db.exportAllTables();
  return writeText(filename, JSON.stringify(dump));
};

const BackupService = {
  /**
   * Copy today's data aside before a restore replaces it, so restoring the
   * wrong file is not the end of the shop's records.
   */
  async saveSafetyCopy() {
    await ensureDir(PRIMARY_DIRECTORY);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return writeDataBackup(`before-restore-${stamp}.json`);
  },

  async generateExport(date) {
    const exportedAt = new Date().toISOString();
    try {
      await ensureDir(PRIMARY_DIRECTORY);

      const data = await reportsService.getDailyExportData(date);
      const pdfBytes = buildDailyReportPdf(date, data);

      const pdfUri = await writeBinary(`${date}-sales-report.pdf`, pdfBytes);
      const dbUri = await writeDataBackup(`${date}-pos-backup.json`);

      await exportRepository.upsertSuccess({
        date,
        exportedAt,
        pdfPath: pdfUri,
        dbPath: dbUri
      });
      console.log(`[backup] export OK for ${date}`);
      return { ok: true, pdfUri, dbUri };
    } catch (e) {
      const message = e?.message || String(e);
      console.error(`[backup] export FAILED for ${date}:`, message);
      try {
        await exportRepository.upsertError({ date, exportedAt, message });
      } catch (innerErr) {
        console.error('[backup] also failed to record error row:', innerErr);
      }
      return { ok: false, error: message };
    }
  }
};

export default BackupService;
