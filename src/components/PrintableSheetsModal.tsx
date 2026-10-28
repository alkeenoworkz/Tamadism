import React, { useState } from 'react';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';
import { AnswerKey } from '../types';

interface PrintableSheetsModalProps {
  answerKey: AnswerKey;
  onClose: () => void;
}

export const PrintableSheetsModal: React.FC<PrintableSheetsModalProps> = ({
  answerKey,
  onClose,
}) => {
  const [itemCount, setItemCount] = useState<number>(answerKey.totalItems || 20);
  const [examTitle, setExamTitle] = useState<string>(answerKey.title || 'Standardized Assessment');
  const [schoolName, setSchoolName] = useState<string>('ACADEMIC TESTING DIVISION');

  const handlePrint = () => {
    window.print();
  };

  const options = ['A', 'B', 'C', 'D'];
  const itemsArray = Array.from({ length: itemCount }, (_, i) => i + 1);

  // Divide into 2 or 3 columns for print layout
  const columnsCount = itemCount > 25 ? 3 : 2;
  const itemsPerCol = Math.ceil(itemCount / columnsCount);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto print:bg-white print:text-black print:border-none print:shadow-none print:max-w-none print:max-h-none print:m-0 print:p-0">
        {/* Screen-only Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Printable Answer Sheet Generator</h2>
              <p className="text-xs text-slate-400">
                Generate and print standardized bubble sheets optimized for ScanGrade camera OCR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/20"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Screen Configuration Controls */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center gap-4 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Exam Title:</span>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">School / Department:</span>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Items:</span>
            {[10, 15, 20, 25, 30, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setItemCount(num)}
                className={`px-2 py-1 rounded text-xs font-semibold border transition ${
                  itemCount === num
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Paper Preview Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 flex justify-center print:bg-white print:p-0 print:overflow-visible">
          <div className="w-full max-w-[760px] bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:rounded-none">
            {/* Corner Alignment Markers for AI OCR */}
            <div className="relative border-2 border-slate-900 p-5">
              <div className="absolute top-1 left-1 w-5 h-5 bg-slate-900" />
              <div className="absolute top-1 right-1 w-5 h-5 bg-slate-900" />
              <div className="absolute bottom-1 left-1 w-5 h-5 bg-slate-900" />
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-slate-900" />

              {/* Title Section */}
              <div className="text-center mb-4 border-b border-slate-300 pb-3">
                <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                  {schoolName}
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                  {examTitle}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Official Multiple-Choice Answer Sheet &bull; {itemCount} Items
                </p>
              </div>

              {/* Student Identification Grid */}
              <div className="grid grid-cols-2 gap-4 border border-slate-400 p-3 rounded mb-5 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block mb-1">STUDENT FULL NAME:</span>
                  <div className="border-b border-dotted border-slate-500 h-6"></div>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block mb-1">STUDENT ID NUMBER:</span>
                  <div className="border-b border-dotted border-slate-500 h-6"></div>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block mb-1">DATE:</span>
                  <div className="border-b border-dotted border-slate-500 h-6"></div>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block mb-1">SECTION / PERIOD:</span>
                  <div className="border-b border-dotted border-slate-500 h-6"></div>
                </div>
              </div>

              {/* Instructions Bar */}
              <div className="bg-slate-100 p-2 text-center text-[11px] font-semibold text-slate-700 mb-5 rounded border border-slate-300">
                INSTRUCTIONS: Completely shade each bubble with dark ink or pencil. Example: <span className="inline-block w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] leading-4 text-center mx-1 font-bold">A</span> Do not use checkmarks or crosses.
              </div>

              {/* Items Grid */}
              <div className={`grid grid-cols-${columnsCount} gap-6`}>
                {Array.from({ length: columnsCount }).map((_, colIdx) => {
                  const colItems = itemsArray.slice(colIdx * itemsPerCol, (colIdx + 1) * itemsPerCol);
                  return (
                    <div key={colIdx} className="space-y-2.5">
                      {colItems.map((num) => (
                        <div key={num} className="flex items-center justify-between text-xs py-0.5">
                          <span className="font-bold font-mono text-slate-800 w-7 text-right pr-2">
                            {num}.
                          </span>
                          <div className="flex items-center gap-2">
                            {options.map((opt) => (
                              <div
                                key={opt}
                                className="w-6 h-6 rounded-full border-1.5 border-slate-600 flex items-center justify-center font-bold text-xs text-slate-700"
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-3 border-t border-slate-300 text-center text-[10px] text-slate-400 font-mono">
                ScanGrade OCR Optical Mark Recognition Sheet &bull; Automated Grading Engine
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
