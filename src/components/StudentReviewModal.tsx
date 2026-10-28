import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  Trash2,
  User,
  Hash,
  Award,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { StudentSheetRecord, AnswerKey } from '../types';

interface StudentReviewModalProps {
  record: StudentSheetRecord;
  answerKey: AnswerKey;
  onUpdateRecord: (updated: StudentSheetRecord) => void;
  onDeleteRecord: (id: number) => void;
  onClose: () => void;
}

export const StudentReviewModal: React.FC<StudentReviewModalProps> = ({
  record,
  answerKey,
  onUpdateRecord,
  onDeleteRecord,
  onClose,
}) => {
  const [studentName, setStudentName] = useState(record.studentName);
  const [studentId, setStudentId] = useState(record.studentId);
  const [notes, setNotes] = useState(record.sheetNotes || '');
  const [itemScores, setItemScores] = useState<Record<number, number>>({ ...record.itemScores });
  const [itemDetails, setItemDetails] = useState([...record.itemDetails]);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Toggle item score between 1 and 0
  const handleToggleItemScore = (itemNum: number) => {
    const currentScore = itemScores[itemNum] === 1 ? 0 : 1;
    const newScores = { ...itemScores, [itemNum]: currentScore };
    setItemScores(newScores);

    // Update details
    const updatedDetails = itemDetails.map((det) => {
      if (det.itemNumber === itemNum) {
        return {
          ...det,
          isCorrect: currentScore === 1,
          score: currentScore,
        };
      }
      return det;
    });
    setItemDetails(updatedDetails);
  };

  // Recalculate total
  const computedTotal = Object.values(itemScores).reduce((acc, curr) => acc + (curr === 1 ? 1 : 0), 0);
  const totalItems = answerKey.totalItems;
  const computedPercentage = totalItems > 0 ? Number(((computedTotal / totalItems) * 100).toFixed(1)) : 0;

  const handleSave = () => {
    const updated: StudentSheetRecord = {
      ...record,
      studentName: studentName.trim() || 'Student',
      studentId: studentId.trim(),
      sheetNotes: notes,
      itemScores,
      itemDetails,
      totalScore: computedTotal,
      percentage: computedPercentage,
    };
    onUpdateRecord(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
              #{record.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{studentName}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {studentId || 'No ID'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Scanned on {record.scannedAt}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Score Pill */}
            <div className="text-right">
              <div className="text-lg font-extrabold text-white flex items-center gap-1">
                <span>{computedTotal}</span>
                <span className="text-slate-400 text-sm font-normal">/ {totalItems}</span>
              </div>
              <div className={`text-xs font-semibold ${computedPercentage >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {computedPercentage}% &bull; {computedPercentage >= 60 ? 'PASSED' : 'NEEDS WORK'}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Student metadata editor */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-1">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Student ID #</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Teacher Notes / Remark</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remark..."
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Captured Sheet Photo if available */}
          {record.sheetImageThumbnail && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Scanned Sheet Snapshot:</span>
              <div className="max-h-56 overflow-hidden rounded-xl border border-slate-800 bg-black flex items-center justify-center">
                <img
                  src={record.sheetImageThumbnail}
                  alt="Scanned answer sheet"
                  className="max-h-56 object-contain"
                />
              </div>
            </div>
          )}

          {/* Item by Item Grading Verification Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Item-by-Item OCR Results &amp; Marks
              </span>
              <span className="text-xs text-slate-400">
                Click any score tag to override (<strong className="text-emerald-400">1</strong> or <strong className="text-rose-400">0</strong>)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {answerKey.items.map((keyItem) => {
                const num = keyItem.itemNumber;
                const score = itemScores[num] ?? 0;
                const detail = itemDetails.find((d) => d.itemNumber === num);
                const studentAns = detail?.studentAnswer || '(none)';
                const correctAns = keyItem.correctAnswer;
                const isOne = score === 1;

                return (
                  <div
                    key={num}
                    onClick={() => handleToggleItemScore(num)}
                    className={`p-2.5 rounded-xl border cursor-pointer select-none transition flex flex-col justify-between ${
                      isOne
                        ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                        : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-300">Item #{num}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-xs font-black ${
                          isOne ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {isOne ? '1' : '0'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Student: <strong className="text-white">{studentAns}</strong>
                      </span>
                      <span>
                        Key: <strong className="text-amber-300">{correctAns}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete student record #${record.id} (${record.studentName})?`)) {
                onDeleteRecord(record.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete Record
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
