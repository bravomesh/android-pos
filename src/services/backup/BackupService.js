import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import db from '../database/DatabaseService';
import reportsService from '../database/ReportsService';
import exportRepository from './exportRepository';
import { buildDailyReportPdf } from './reportPdf';

const BACKUP_DIR = 'POS/Daily';

const u8ToBase64 = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
};

const ensureDir = async () => {
  try {
    await Filesystem.mkdir({
      path: BACKUP_DIR,
      directory: Directory.ExternalStorage,
      recursive: true
    });
  } catch (e) {
    if (!String(e?.message || '').toLowerCase().includes('exist')) {
      throw e;
    }
  }
};

const writeBinary = async (filename, bytes) => {
  const result = await Filesystem.writeFile({
    path: `${BACKUP_DIR}/${filename}`,
    data: u8ToBase64(bytes),
    directory: Directory.ExternalStorage,
    recursive: true
  });
  return result.uri;
};

const copyDbFile = async (filename) => {
  const sourcePath = db.getDatabaseFilePath();
  if (!sourcePath || Capacitor.getPlatform() === 'web') {
    return writeBinary(filename, new Uint8Array([0]));
  }
  const read = await Filesystem.readFile({ path: sourcePath });
  const result = await Filesystem.writeFile({
    path: `${BACKUP_DIR}/${filename}`,
    data: read.data,
    directory: Directory.ExternalStorage,
    recursive: true
  });
  return result.uri;
};

const BackupService = {
  async generateExport(date) {
    const exportedAt = new Date().toISOString();
    try {
      await ensureDir();

      const data = await reportsService.getDailyExportData(date);
      const pdfBytes = buildDailyReportPdf(date, data);

      const pdfUri = await writeBinary(`${date}-sales-report.pdf`, pdfBytes);
      const dbUri = await copyDbFile(`${date}-pos-backup.db`);

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
