import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Eye,
  Trash2,
  TrendingUp,
  Award,
  Users,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { StudentSheetRecord, AnswerKey } from '../types';
import { exportRecordsToExcel, exportRecordsToCSV } from '../utils/exportToExcel';

interface ResultsSpreadsheetProps {
  records: StudentSheetRecord[];
  answerKey: AnswerKey;
  onSelectRecord: (record: StudentSheetRecord) => void;
  onDeleteRecord: (id: number) => void;
  onClearAll: () => void;
  onLoadDemoData: () => void;
}

export const ResultsSpreadsheet: React.FC<ResultsSpreadsheetProps> = ({
  records,
  answerKey,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
  onLoadDemoData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [passingThreshold, setPassingThreshold] = useState(60);
  const [sortField, setSortField] = useState<'id' | 'name' | 'score' | 'percentage'>('id');
  const [sortAsc, setSortAsc] = useState(true);

  const totalItems = answerKey.totalItems;

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        const matchesQuery =
          rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.id.toString().includes(searchQuery);

        const isPassed = rec.percentage >= passingThreshold;
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'passed' && isPassed) ||
          (statusFilter === 'failed' && !isPassed);

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        let valA: any = a[sortField === 'name' ? 'studentName' : sortField === 'score' ? 'totalScore' : sortField];
        let valB: any = b[sortField === 'name' ? 'studentName' : sortField === 'score' ? 'totalScore' : sortField];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [records, searchQuery, statusFilter, passingThreshold, sortField, sortAsc]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        count: 0,
        averageScore: 0,
        averagePercent: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        toughestItem: null as { itemNumber: number; accuracy: number } | null,
        itemAccuracies: {} as Record<number, number>,
      };
    }

    const count = records.length;
    let totalScoreSum = 0;
    let highest = -1;
    let lowest = 999999;
    let passedCount = 0;

    // Per-item accuracy
    const itemCorrectCounts: Record<number, number> = {};
    for (let i = 1; i <= totalItems; i++) {
      itemCorrectCounts[i] = 0;
    }

    records.forEach((rec) => {
      totalScoreSum += rec.totalScore;
      if (rec.totalScore > highest) highest = rec.totalScore;
      if (rec.totalScore < lowest) lowest = rec.totalScore;
      if (rec.percentage >= passingThreshold) passedCount++;

      for (let i = 1; i <= totalItems; i++) {
        if (rec.itemScores[i] === 1) {
          itemCorrectCounts[i] += 1;
        }
      }
    });

    const itemAccuracies: Record<number, number> = {};
    let lowestAcc = 101;
    let toughestItemNum = 1;

    for (let i = 1; i <= totalItems; i++) {
      const acc = Number(((itemCorrectCounts[i] / count) * 100).toFixed(1));
      itemAccuracies[i] = acc;
      if (acc < lowestAcc) {
        lowestAcc = acc;
        toughestItemNum = i;
      }
    }

    return {
      count,
      averageScore: Number((totalScoreSum / count).toFixed(1)),
      averagePercent: Number(((totalScoreSum / (count * totalItems)) * 100).toFixed(1)),
      highestScore: highest === -1 ? 0 : highest,
      lowestScore: lowest === 999999 ? 0 : lowest,
      passRate: Number(((passedCount / count) * 100).toFixed(1)),
      toughestItem: lowestAcc <= 100 ? { itemNumber: toughestItemNum, accuracy: lowestAcc } : null,
      itemAccuracies,
      itemCorrectCounts,
    };
  }, [records, totalItems, passingThreshold]);

  const handleExportExcel = () => {
    try {
      const fileName = exportRecordsToExcel(records, answerKey, passingThreshold);
      // feedback
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    try {
      exportRecordsToCSV(records, answerKey, passingThreshold);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleSort = (field: 'id' | 'name' | 'score' | 'percentage') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Statistical Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Graded */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Sheets Graded</span>
            <div className="text-2xl font-black text-white">{stats.count}</div>
          </div>
        </div>

        {/* Class Average */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Class Average</span>
            <div className="text-2xl font-black text-white">
              {stats.averageScore} <span className="text-xs text-slate-400 font-normal">/ {totalItems}</span>
              <span className="text-xs font-semibold text-emerald-400 ml-2">({stats.averagePercent}%)</span>
            </div>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Pass Rate (&ge;{passingThreshold}%)</span>
            <div className="text-2xl font-black text-white">
              {stats.passRate}%
              <span className="text-xs text-slate-400 font-normal ml-2">
                High: {stats.highestScore}/{totalItems}
              </span>
            </div>
          </div>
        </div>

        {/* Toughest Question Alert */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Toughest Question</span>
            {stats.toughestItem ? (
              <div className="text-base font-bold text-white">
                Item #{stats.toughestItem.itemNumber}
                <span className="text-xs font-medium text-rose-400 ml-1.5">
                  ({stats.toughestItem.accuracy}% correct)
                </span>
              </div>
            ) : (
              <div className="text-sm font-medium text-slate-400">No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Spreadsheet Control Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student name or ID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'passed', 'failed'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  statusFilter === filter
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter === 'all' ? `All (${records.length})` : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Export Actions */}
        <div className="flex items-center gap-2.5">
          {records.length === 0 && (
            <button
              type="button"
              onClick={onLoadDemoData}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Load Sample Class Results
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Main Dynamic Item Matrix Spreadsheet Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 select-none">
                {/* ID Column */}
                <th
                  onClick={() => handleSort('id')}
                  className="px-3 py-3 font-semibold text-center w-12 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>

                {/* Student Name */}
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 font-semibold min-w-[170px] cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>

                {/* Student ID */}
                <th className="px-3 py-3 font-semibold min-w-[90px]">Student ID</th>

                {/* Dynamic Item Columns based on total quiz items */}
                {Array.from({ length: totalItems }, (_, idx) => idx + 1).map((itemNum) => {
                  const correctKey = answerKey.items.find((k) => k.itemNumber === itemNum)?.correctAnswer || '';
                  const itemAcc = stats.itemAccuracies ? stats.itemAccuracies[itemNum] : null;

                  return (
                    <th
                      key={itemNum}
                      className="px-2 py-3 text-center min-w-[52px] border-l border-slate-800/60"
                      title={`Item #${itemNum} (Key Answer: ${correctKey})${itemAcc !== null ? ` - ${itemAcc}% Class Accuracy` : ''}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-slate-300 font-bold">Q{itemNum}</span>
                        <span className="text-[10px] text-amber-400 font-medium">({correctKey})</span>
                      </div>
                    </th>
                  );
                })}

                {/* Total Score Column */}
                <th
                  onClick={() => handleSort('score')}
                  className="px-3 py-3 font-semibold text-center min-w-[70px] cursor-pointer hover:text-white border-l border-slate-800"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>

                {/* Percentage */}
                <th
                  onClick={() => handleSort('percentage')}
                  className="px-3 py-3 font-semibold text-center min-w-[65px] cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>%</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>

                {/* Status */}
                <th className="px-3 py-3 font-semibold text-center min-w-[80px]">Status</th>

                {/* Actions */}
                <th className="px-3 py-3 font-semibold text-center w-16">Inspect</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalItems + 6}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <div className="max-w-md mx-auto space-y-3">
                      <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-sm font-semibold text-slate-300">
                        No Graded Answer Sheets Yet
                      </p>
                      <p className="text-xs text-slate-500">
                        Tap "Scan Student Sheet" above with your camera or click "Load Sample Class Results" to preview the live spreadsheet matrix.
                      </p>
                      <button
                        type="button"
                        onClick={onLoadDemoData}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition"
                      >
                        Load 4 Graded Sample Sheets
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isPassed = rec.percentage >= passingThreshold;
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Auto-increment ID */}
                      <td className="px-3 py-2.5 font-mono text-center font-bold text-slate-400">
                        #{rec.id}
                      </td>

                      {/* Student Name */}
                      <td className="px-4 py-2.5 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectRecord(rec)}
                            className="text-left hover:text-indigo-400 transition"
                          >
                            {rec.studentName}
                          </button>
                          {rec.sheetNotes && (
                            <span
                              title={rec.sheetNotes}
                              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                            />
                          )}
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px]">
                        {rec.studentId || '-'}
                      </td>

                      {/* Dynamic 1s and 0s per item column */}
                      {Array.from({ length: totalItems }, (_, idx) => idx + 1).map((itemNum) => {
                        const score = rec.itemScores[itemNum] === 1 ? 1 : 0;
                        const isCorrect = score === 1;
                        const detail = rec.itemDetails?.find((d) => d.itemNumber === itemNum);
                        const studentAns = detail?.studentAnswer || '-';
                        const keyAns = answerKey.items.find((k) => k.itemNumber === itemNum)?.correctAnswer || '';

                        return (
                          <td
                            key={itemNum}
                            className="px-2 py-2 text-center border-l border-slate-800/50"
                            title={`Q${itemNum} | Student: "${studentAns}" vs Key: "${keyAns}" (${isCorrect ? 'Correct +1' : 'Incorrect 0'})`}
                          >
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-mono font-bold text-xs select-none transition ${
                                isCorrect
                                  ? 'bg-emerald-500/20 text-emerald-300 font-extrabold'
                                  : 'bg-rose-500/10 text-rose-400 font-normal'
                              }`}
                            >
                              {score}
                            </span>
                          </td>
                        );
                      })}

                      {/* Total Score */}
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-white border-l border-slate-800">
                        {rec.totalScore}
                        <span className="text-slate-500 text-[10px] ml-0.5">/{totalItems}</span>
                      </td>

                      {/* Percentage */}
                      <td
                        className={`px-3 py-2.5 text-center font-mono font-semibold ${
                          isPassed ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {rec.percentage}%
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPassed
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPassed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectRecord(rec)}
                            title="Inspect &amp; Edit Student Sheet"
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete student record #${rec.id}?`)) {
                                onDeleteRecord(rec.id);
                              }
                            }}
                            title="Delete"
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Summary Statistics Footer Row */}
            {records.length > 0 && (
              <tfoot className="bg-slate-950/95 font-semibold text-slate-300 border-t-2 border-slate-700">
                {/* Total correct count row */}
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-right font-bold text-slate-200">
                    Total Correct (Sum of 1s):
                  </td>
                  {Array.from({ length: totalItems }, (_, idx) => idx + 1).map((itemNum) => {
                    const count = (stats.itemCorrectCounts && stats.itemCorrectCounts[itemNum]) || 0;
                    return (
                      <td
                        key={itemNum}
                        className="px-2 py-2.5 text-center font-mono font-bold text-amber-300 border-l border-slate-800"
                      >
                        {count}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center font-mono font-bold text-white border-l border-slate-800">
                    {stats.averageScore}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-400">
                    {stats.averagePercent}%
                  </td>
                  <td colSpan={2} className="px-3 py-2.5 text-center text-[10px] text-slate-400">
                    AVG
                  </td>
                </tr>

                {/* Item accuracy percentage row */}
                <tr className="text-[11px] text-slate-400 bg-slate-950">
                  <td colSpan={3} className="px-4 py-1.5 text-right font-medium">
                    Item Success Rate:
                  </td>
                  {Array.from({ length: totalItems }, (_, idx) => idx + 1).map((itemNum) => {
                    const acc = (stats.itemAccuracies && stats.itemAccuracies[itemNum]) ?? 0;
                    const isLow = acc < 50;
                    return (
                      <td
                        key={itemNum}
                        className={`px-1 py-1.5 text-center font-mono text-[10px] border-l border-slate-800/80 ${
                          isLow ? 'text-rose-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {acc}%
                      </td>
                    );
                  })}
                  <td colSpan={4} className="px-2 py-1.5 text-center text-[10px] text-slate-500">
                    Scale: 1 = Correct &bull; 0 = Incorrect
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table Bottom bar with Clear & Count */}
        {records.length > 0 && (
          <div className="px-4 py-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {filteredRecords.length} of {records.length} graded student sheets ({totalItems} dynamic columns)
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all graded student sheets?')) {
                    onClearAll();
                  }
                }}
                className="text-slate-500 hover:text-rose-400 transition"
              >
                Clear All Records
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
