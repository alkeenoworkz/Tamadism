import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  FileSpreadsheet,
  KeyRound,
  Printer,
  Sparkles,
  Download,
  PlusCircle,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Layers,
  Info,
  Database,
  CloudCheck
} from 'lucide-react';
import { AnswerKey, StudentSheetRecord, GradeSheetResponse } from './types';
import { DEFAULT_SAMPLE_KEY, INITIAL_DEMO_RECORDS } from './utils/sampleData';
import { exportRecordsToExcel } from './utils/exportToExcel';
import {
  compressThumbnail,
  saveRecordsToLocalStorage,
  loadRecordsFromLocalStorage,
  saveAnswerKeyToLocalStorage,
  loadAnswerKeyFromLocalStorage,
  fetchServerStorage,
  syncRecordsToServer,
  syncAnswerKeyToServer,
  clearRecordsOnServer
} from './utils/storage';
import { CameraScanner } from './components/CameraScanner';
import { AnswerKeyModal } from './components/AnswerKeyModal';
import { StudentReviewModal } from './components/StudentReviewModal';
import { PrintableSheetsModal } from './components/PrintableSheetsModal';
import { ResultsSpreadsheet } from './components/ResultsSpreadsheet';

export default function App() {
  // Load cached data initially for zero-delay display
  const initialLocalRecords = loadRecordsFromLocalStorage();
  const initialLocalKey = loadAnswerKeyFromLocalStorage();

  const [answerKey, setAnswerKey] = useState<AnswerKey>(() => {
    return initialLocalKey || DEFAULT_SAMPLE_KEY;
  });

  const [records, setRecords] = useState<StudentSheetRecord[]>(() => {
    if (initialLocalRecords.records !== null) {
      return initialLocalRecords.records;
    }
    // If never initialized before, show demo records on first ever visit
    return initialLocalRecords.isInitialized ? [] : INITIAL_DEMO_RECORDS;
  });

  const [isStorageSynced, setIsStorageSynced] = useState<boolean>(true);
  const isInitialMount = useRef(true);

  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'student-sheet' | 'answer-key'>('student-sheet');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isPrintableModalOpen, setIsPrintableModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StudentSheetRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch persistent server storage on app launch
  useEffect(() => {
    let isMounted = true;
    async function loadStorage() {
      const serverData = await fetchServerStorage();
      if (!isMounted) return;

      if (serverData.exists) {
        if (Array.isArray(serverData.records)) {
          setRecords(serverData.records);
          saveRecordsToLocalStorage(serverData.records);
        }
        if (serverData.answerKey) {
          setAnswerKey(serverData.answerKey);
          saveAnswerKeyToLocalStorage(serverData.answerKey);
        }
      } else {
        // If server file doesn't exist yet, seed it with current records/key
        const currentRecs = initialLocalRecords.records !== null
          ? initialLocalRecords.records
          : (initialLocalRecords.isInitialized ? [] : INITIAL_DEMO_RECORDS);

        syncRecordsToServer(currentRecs);
        syncAnswerKeyToServer(initialLocalKey || DEFAULT_SAMPLE_KEY);
      }
    }

    loadStorage();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save and synchronize records whenever records change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsStorageSynced(false);
    saveRecordsToLocalStorage(records);

    const timer = setTimeout(async () => {
      await syncRecordsToServer(records);
      setIsStorageSynced(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [records]);

  // Save and synchronize answer key
  useEffect(() => {
    saveAnswerKeyToLocalStorage(answerKey);
    syncAnswerKeyToServer(answerKey);
  }, [answerKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle a new student sheet graded from camera OCR
  const handleGradedSheet = async (result: GradeSheetResponse, imageSnapshot: string) => {
    // Compress thumbnail so it never exceeds browser storage limits
    const thumbnail = await compressThumbnail(imageSnapshot, 280);

    // Generate next auto-increment ID
    const nextId = records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1;

    const newRecord: StudentSheetRecord = {
      id: nextId,
      studentName: result.studentName || `Student ${nextId}`,
      studentId: result.studentId || '',
      itemScores: result.itemScores,
      itemDetails: result.itemDetails,
      totalScore: result.totalScore,
      totalItems: result.totalItems,
      percentage: result.percentage,
      scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sheetImageThumbnail: thumbnail || undefined,
      sheetNotes: result.sheetNotes,
    };

    setRecords((prev) => {
      const updated = [newRecord, ...prev];
      // Immediately write to local storage
      saveRecordsToLocalStorage(updated);
      syncRecordsToServer(updated);
      return updated;
    });

    showToast(`Graded & Saved #${newRecord.id} ${newRecord.studentName} (${newRecord.totalScore}/${newRecord.totalItems})`);
  };

  // Handle scanned answer key
  const handleScannedKey = (data: any) => {
    if (Array.isArray(data.items) && data.items.length > 0) {
      const updatedKey: AnswerKey = {
        id: `key-${Date.now()}`,
        title: data.title || answerKey.title || 'Scanned Master Key',
        totalItems: data.items.length,
        items: data.items,
        createdAt: new Date().toLocaleDateString(),
      };
      setAnswerKey(updatedKey);
      saveAnswerKeyToLocalStorage(updatedKey);
      syncAnswerKeyToServer(updatedKey);
      setIsScannerOpen(false);
      showToast(`Master Answer Key saved! (${updatedKey.totalItems} items)`);
    }
  };

  // Save modified answer key
  const handleSaveKey = (newKey: AnswerKey) => {
    setAnswerKey(newKey);
    saveAnswerKeyToLocalStorage(newKey);
    syncAnswerKeyToServer(newKey);
    showToast(`Answer key saved: ${newKey.title} (${newKey.totalItems} items)`);
  };

  // Update existing record
  const handleUpdateRecord = (updated: StudentSheetRecord) => {
    setRecords((prev) => {
      const newRecords = prev.map((r) => (r.id === updated.id ? updated : r));
      saveRecordsToLocalStorage(newRecords);
      syncRecordsToServer(newRecords);
      return newRecords;
    });
    showToast(`Record #${updated.id} updated and saved`);
  };

  // Delete record
  const handleDeleteRecord = (id: number) => {
    setRecords((prev) => {
      const newRecords = prev.filter((r) => r.id !== id);
      saveRecordsToLocalStorage(newRecords);
      syncRecordsToServer(newRecords);
      return newRecords;
    });
    showToast(`Record #${id} deleted`);
  };

  // Clear all records permanently
  const handleClearAll = async () => {
    setRecords([]);
    saveRecordsToLocalStorage([]);
    await clearRecordsOnServer();
    showToast('All records cleared and removed from storage');
  };

  // Load demo data explicitly if requested
  const handleLoadDemoData = () => {
    setRecords(INITIAL_DEMO_RECORDS);
    setAnswerKey(DEFAULT_SAMPLE_KEY);
    saveRecordsToLocalStorage(INITIAL_DEMO_RECORDS);
    syncRecordsToServer(INITIAL_DEMO_RECORDS);
    saveAnswerKeyToLocalStorage(DEFAULT_SAMPLE_KEY);
    syncAnswerKeyToServer(DEFAULT_SAMPLE_KEY);
    showToast('Sample Biology Quiz key and 4 student sheets loaded and saved!');
  };

  const handleExportExcel = () => {
    try {
      const fileName = exportRecordsToExcel(records, answerKey, 60);
      showToast(`Excel spreadsheet exported: ${fileName}`);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 border border-indigo-400 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-600/30 text-white">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">ScanGrade AI</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OCR Engine
                </span>
                {/* Persistent Storage Status Badge */}
                <span
                  title={isStorageSynced ? 'All changes saved permanently' : 'Saving changes...'}
                  className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80"
                >
                  <Database className={`w-3 h-3 ${isStorageSynced ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                  <span>{isStorageSynced ? 'Auto-Saved' : 'Saving...'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Camera-Based Answer Sheet Scanner &amp; Dynamic Spreadsheet Auto-Grader
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Answer Key Config Trigger */}
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Key:</span>
              <span className="font-mono text-amber-300">{answerKey.totalItems} Items</span>
            </button>

            {/* Printable Blank Sheet Generator */}
            <button
              type="button"
              onClick={() => setIsPrintableModalOpen(true)}
              title="Print blank student answer sheets"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium rounded-xl transition hidden sm:flex"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Print Blank Sheets</span>
            </button>

            {/* Download APK Link */}
            <a
              href="/build-outputs/app-debug.apk"
              download="app-debug.apk"
              title="Download Android APK (app-debug.apk)"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Download APK</span>
              <span className="lg:hidden">APK</span>
            </a>

            {/* Main Primary Scan Button */}
            <button
              type="button"
              onClick={() => {
                setScannerMode('student-sheet');
                setIsScannerOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/25 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Student Sheet</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Workflow Overview Banner for Teachers */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Active Assessment
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-xs font-semibold text-white">{answerKey.title}</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {records.length} {records.length === 1 ? 'Sheet' : 'Sheets'} Persisted
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Camera Answer Sheet Scanner &amp; Matrix Auto-Grader
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl">
                Point your camera at any student answer sheet to instantly recognize bubbles via OCR.
                All scanned results are permanently saved to database storage and remain available every time you open the app.
              </p>
            </div>

            {/* Steps & Quick Triggers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setScannerMode('answer-key');
                  setIsScannerOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition"
              >
                <Camera className="w-3.5 h-3.5" />
                Photo Answer Key
              </button>

              <button
                type="button"
                onClick={() => {
                  setScannerMode('student-sheet');
                  setIsScannerOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                Scan Student Sheets
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={records.length === 0}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export to Excel
              </button>
            </div>
          </div>

          {/* Quick Flow Indicator Pills */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <span className="font-semibold text-slate-200 block">Set Answer Key</span>
                <span className="text-[11px] text-slate-400">Photo master sheet or pick {answerKey.totalItems} items</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <span className="font-semibold text-slate-200 block">Capture Student Sheets</span>
                <span className="text-[11px] text-slate-400">Instant AI OCR marks 1s &amp; 0s automatically</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <span className="font-semibold text-slate-200 block">Export Dynamic Excel</span>
                <span className="text-[11px] text-slate-400">Auto-increment ID, Q1..Q{answerKey.totalItems} &amp; class stats</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Spreadsheet Matrix & Class Results Table */}
        <ResultsSpreadsheet
          records={records}
          answerKey={answerKey}
          onSelectRecord={(rec) => setSelectedRecord(rec)}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAll}
          onLoadDemoData={handleLoadDemoData}
        />
      </main>

      {/* Camera Scanner Viewfinder Modal */}
      {isScannerOpen && (
        <CameraScanner
          mode={scannerMode}
          answerKey={answerKey}
          onGradedSheet={handleGradedSheet}
          onScannedKey={handleScannedKey}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* Answer Key Config Modal */}
      {isKeyModalOpen && (
        <AnswerKeyModal
          currentKey={answerKey}
          onSaveKey={handleSaveKey}
          onOpenScanner={() => {
            setScannerMode('answer-key');
            setIsScannerOpen(true);
          }}
          onClose={() => setIsKeyModalOpen(false)}
        />
      )}

      {/* Student Sheet Inspector Modal */}
      {selectedRecord && (
        <StudentReviewModal
          record={selectedRecord}
          answerKey={answerKey}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Printable Sheet Generator Modal */}
      {isPrintableModalOpen && (
        <PrintableSheetsModal
          answerKey={answerKey}
          onClose={() => setIsPrintableModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ScanGrade AI Answer Sheet Scanner &bull; Dynamic Excel Auto-Increment Scoring</span>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsPrintableModalOpen(true)}
              className="hover:text-white transition"
            >
              Printable Answer Sheets
            </button>
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="hover:text-white transition"
            >
              Answer Key Config
            </button>
            <button
              onClick={handleExportExcel}
              className="hover:text-emerald-400 transition"
            >
              Export .xlsx
            </button>
            <a
              href="/build-outputs/app-debug.apk"
              download="app-debug.apk"
              className="hover:text-emerald-400 text-emerald-400/90 font-medium transition"
            >
              Download app-debug.apk
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
