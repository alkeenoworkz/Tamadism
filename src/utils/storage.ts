import { StudentSheetRecord, AnswerKey } from '../types';

const KEY_RECORDS = 'scangrade_records_v2';
const KEY_ANSWER_KEY = 'scangrade_key_v2';
const KEY_INITIALIZED = 'scangrade_initialized_v2';

/**
 * Compresses an image data URL down to a lightweight thumbnail (~15-25KB)
 * so storing multiple sheets never exceeds the browser's 5MB localStorage quota.
 */
export async function compressThumbnail(dataUrl: string, maxDim: number = 320): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return '';
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        } else {
          resolve('');
        }
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = dataUrl;
  });
}

/**
 * Safely saves records to localStorage, stripping or truncating large thumbnails
 * if storage quota is approached.
 */
export function saveRecordsToLocalStorage(records: StudentSheetRecord[]): boolean {
  try {
    localStorage.setItem(KEY_RECORDS, JSON.stringify(records));
    localStorage.setItem(KEY_INITIALIZED, 'true');
    return true;
  } catch (err: any) {
    console.warn('LocalStorage quota warning, saving without thumbnails:', err);
    try {
      // Strip thumbnails to ensure score data and item marks are 100% saved
      const lightweight = records.map((r) => ({
        ...r,
        sheetImageThumbnail: undefined,
      }));
      localStorage.setItem(KEY_RECORDS, JSON.stringify(lightweight));
      localStorage.setItem(KEY_INITIALIZED, 'true');
      return true;
    } catch (criticalErr) {
      console.error('Critical localStorage save failure:', criticalErr);
      return false;
    }
  }
}

export function loadRecordsFromLocalStorage(): { records: StudentSheetRecord[] | null; isInitialized: boolean } {
  try {
    const isInit = localStorage.getItem(KEY_INITIALIZED) === 'true';
    const raw = localStorage.getItem(KEY_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { records: parsed, isInitialized: true };
      }
    }
    return { records: null, isInitialized: isInit };
  } catch {
    return { records: null, isInitialized: false };
  }
}

export function saveAnswerKeyToLocalStorage(key: AnswerKey) {
  try {
    localStorage.setItem(KEY_ANSWER_KEY, JSON.stringify(key));
  } catch (e) {
    console.warn('Failed to save answer key to localStorage', e);
  }
}

export function loadAnswerKeyFromLocalStorage(): AnswerKey | null {
  try {
    const raw = localStorage.getItem(KEY_ANSWER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

// -------------------------------------------------------------
// Server Storage API Sync (Permanent disk-backed persistence)
// -------------------------------------------------------------

export async function fetchServerStorage(): Promise<{
  exists: boolean;
  records: StudentSheetRecord[] | null;
  answerKey: AnswerKey | null;
}> {
  try {
    const res = await fetch('/api/storage', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch from server storage, using local cache', e);
  }
  return { exists: false, records: null, answerKey: null };
}

export async function syncRecordsToServer(records: StudentSheetRecord[]): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Server sync error for records:', e);
    return false;
  }
}

export async function syncAnswerKeyToServer(answerKey: AnswerKey): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/answer-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerKey }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Server sync error for answer key:', e);
    return false;
  }
}

export async function clearRecordsOnServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/records', {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.warn('Server clear error:', e);
    return false;
  }
}
