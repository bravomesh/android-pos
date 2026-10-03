import { App } from '@capacitor/app';
import BackupService from './BackupService';
import exportRepository from './exportRepository';
import {
  yesterdayLocalISO,
  msUntilNext0030
} from './dateUtils';

let timerId = null;
let initialised = false;

function nextIsoDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const next = new Date(y, m - 1, d + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

/**
 * Export every day since the last one that succeeded, up to yesterday.
 *
 * Counting from the last success, not the last attempt, means a day whose
 * export failed is tried again, and the days after a failure are not
 * skipped (starting from yesterday whenever the latest row was an error
 * used to leave every day in between without a backup).
 */
async function catchUp() {
  const target = yesterdayLocalISO(new Date());
  const lastGood = await exportRepository.getLatestSuccess();
  const startFrom = lastGood ? nextIsoDay(lastGood.date) : target;

  let cursor = startFrom;
  while (cursor && cursor <= target) {
    // eslint-disable-next-line no-await-in-loop
    await BackupService.generateExport(cursor);
    cursor = nextIsoDay(cursor);
  }
}

function scheduleNextMidnight() {
  if (timerId) {
    clearTimeout(timerId);
  }
  const ms = msUntilNext0030(new Date());
  timerId = setTimeout(async () => {
    const targetDate = yesterdayLocalISO(new Date());
    await BackupService.generateExport(targetDate);
    scheduleNextMidnight();
  }, ms);
}

const BackupScheduler = {
  async init() {
    if (initialised) return;
    initialised = true;
    try {
      await catchUp();
    } catch (e) {
      console.error('[backup] catch-up failed:', e);
    }
    scheduleNextMidnight();

    try {
      App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          try {
            await catchUp();
          } catch (e) {
            console.error('[backup] catch-up on resume failed:', e);
          }
          scheduleNextMidnight();
        }
      });
    } catch (e) {
      console.warn('[backup] App listener unavailable:', e?.message);
    }
  },

  async runManual(date) {
    return BackupService.generateExport(date);
  },

  catchUp
};

export default BackupScheduler;
