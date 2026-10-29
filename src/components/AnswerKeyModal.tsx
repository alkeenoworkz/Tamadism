import React, { useState } from 'react';
import {
  KeyRound,
  Camera,
  Upload,
  Check,
  Plus,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Sparkles,
  HelpCircle,
  Info
} from 'lucide-react';
import { AnswerKey, AnswerKeyItem } from '../types';
import { generateSampleSheetImage } from '../utils/sampleData';

interface AnswerKeyModalProps {
  currentKey: AnswerKey;
  onSaveKey: (key: AnswerKey) => void;
  onOpenScanner: () => void;
  onClose: () => void;
}

export const AnswerKeyModal: React.FC<AnswerKeyModalProps> = ({
  currentKey,
  onSaveKey,
  onOpenScanner,
  onClose,
}) => {
  const [title, setTitle] = useState(currentKey.title || 'General Quiz');
  const [items, setItems] = useState<AnswerKeyItem[]>([...currentKey.items]);
  const [quickPasteText, setQuickPasteText] = useState('');
  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [isScanningSampleKey, setIsScanningSampleKey] = useState(false);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Common multiple-choice options
  const defaultOptions = ['A', 'B', 'C', 'D'];

  // Update single item answer
  const handleItemAnswerChange = (itemNum: number, answer: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.itemNumber === itemNum ? { ...item, correctAnswer: answer.toUpperCase() } : item
      )
    );
  };

  // Add more items
  const handleAddItem = () => {
    const nextNum = items.length + 1;
    setItems([...items, { itemNumber: nextNum, correctAnswer: 'A' }]);
  };

  // Set total items dynamically
  const handleSetTotalItems = (count: number) => {
    if (count < 1) return;
    if (count <= items.length) {
      setItems(items.slice(0, count));
    } else {
      const newItems = [...items];
      for (let i = items.length + 1; i <= count; i++) {
        newItems.push({ itemNumber: i, correctAnswer: 'A' });
      }
      setItems(newItems);
    }
  };

  // Quick paste parser (e.g. "A, B, C, D, A, C" or "1. A\n2. B\n3. C")
  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) return;

    const tokens = quickPasteText
      .replace(/[\n,;\t]/g, ' ')
      .split(/\s+/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);

    const parsedAnswers: string[] = [];
    tokens.forEach((token) => {
      const clean = token.replace(/^[0-9]+[.:)]/g, '').replace(/[^A-Z0-9]/g, '');
      if (clean) {
        parsedAnswers.push(clean);
      }
    });

    if (parsedAnswers.length > 0) {
      const newItems: AnswerKeyItem[] = parsedAnswers.map((ans, idx) => ({
        itemNumber: idx + 1,
        correctAnswer: ans,
      }));
      setItems(newItems);
      setShowQuickPaste(false);
      setQuickPasteText('');
    }
  };

  // Load sample master key instantly (preserves Gemini free tier quota)
  const handleTestMasterKeyScan = () => {
    setIsScanningSampleKey(true);
    setTimeout(() => {
      const sampleItems: AnswerKeyItem[] = [
        { itemNumber: 1, correctAnswer: 'A' },
        { itemNumber: 2, correctAnswer: 'C' },
        { itemNumber: 3, correctAnswer: 'B' },
        { itemNumber: 4, correctAnswer: 'D' },
        { itemNumber: 5, correctAnswer: 'A' },
        { itemNumber: 6, correctAnswer: 'B' },
        { itemNumber: 7, correctAnswer: 'D' },
        { itemNumber: 8, correctAnswer: 'C' },
        { itemNumber: 9, correctAnswer: 'A' },
        { itemNumber: 10, correctAnswer: 'B' },
      ];

      setTitle('10-Item Master Science Key');
      setItems(sampleItems);
      setIsScanningSampleKey(false);
      setQuotaNotice('Sample Master Key loaded successfully! You can customize any answer below.');
    }, 300);
  };

  const handleSave = () => {
    if (items.length === 0) {
      alert('Answer key must contain at least 1 question item.');
      return;
    }

    const updatedKey: AnswerKey = {
      id: currentKey.id || `key-${Date.now()}`,
      title: title.trim() || 'Untitled Quiz',
      totalItems: items.length,
      items: items.sort((a, b) => a.itemNumber - b.itemNumber),
      createdAt: currentKey.createdAt || new Date().toLocaleDateString(),
    };

    onSaveKey(updatedKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Answer Key Configuration</h2>
              <p className="text-xs text-slate-400">
                Set correct answers by taking a photo of your key or using the interactive builder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota / Status Notice Banner if present */}
        {quotaNotice && (
          <div className="px-6 py-2.5 bg-indigo-950/60 border-b border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{quotaNotice}</span>
            </div>
            <button
              onClick={() => setQuotaNotice(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              &times;
            </button>
          </div>
        )}

        {/* Action Options Banner */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition shadow-sm"
            >
              <Camera className="w-4 h-4" />
              Take Photo of Answer Key
            </button>

            <button
              type="button"
              onClick={handleTestMasterKeyScan}
              disabled={isScanningSampleKey}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs rounded-xl transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isScanningSampleKey ? 'Loading...' : 'Load Sample 10-Item Key'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickPaste(!showQuickPaste)}
              className="text-xs text-slate-300 hover:text-white underline decoration-slate-600 transition"
            >
              {showQuickPaste ? 'Hide Batch Paste' : 'Batch Paste Answers (e.g. A, B, C...)'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Paste Drawer */}
          {showQuickPaste && (
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-200">
                  Paste Multiple Answers (Comma, space, or newline separated):
                </label>
                <span className="text-[11px] text-slate-400">Example: A, B, C, D, A, B, C</span>
              </div>
              <textarea
                value={quickPasteText}
                onChange={(e) => setQuickPasteText(e.target.value)}
                placeholder="A B C D A C B D A B C D"
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-amber-400 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleApplyQuickPaste}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition"
                >
                  Apply Parsed Answers
                </button>
              </div>
            </div>
          )}

          {/* Quiz Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Quiz / Subject Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science 10 Midterm Examination"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Total Items</label>
              <div className="flex items-center gap-1.5">
                {[10, 15, 20, 25, 50].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSetTotalItems(count)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      items.length === count
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Question Key Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Question Items &amp; Correct Answers ({items.length} total)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item #{items.length + 1}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.itemNumber}
                  className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2"
                >
                  <span className="font-mono text-xs font-bold text-slate-300 w-8">
                    #{item.itemNumber}
                  </span>

                  {/* Option Choice Buttons */}
                  <div className="flex items-center gap-1">
                    {defaultOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleItemAnswerChange(item.itemNumber, opt)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                          item.correctAnswer === opt
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}

                    {/* Custom text or T/F input if not A-D */}
                    {!defaultOptions.includes(item.correctAnswer) && (
                      <input
                        type="text"
                        value={item.correctAnswer}
                        onChange={(e) => handleItemAnswerChange(item.itemNumber, e.target.value)}
                        className="w-10 h-7 text-center uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            System will dynamically create <strong className="text-amber-400">{items.length} item columns</strong> in Excel report.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/20"
            >
              <Check className="w-4 h-4" />
              Save &amp; Set Answer Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
