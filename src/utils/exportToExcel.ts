import * as XLSX from 'xlsx';
import { StudentSheetRecord, AnswerKey } from '../types';

export function exportRecordsToExcel(
  records: StudentSheetRecord[],
  answerKey: AnswerKey,
  passingThreshold: number = 60
) {
  if (records.length === 0) {
    throw new Error('No graded student records to export.');
  }

  const totalItems = answerKey.totalItems;
  const sortedItems = [...answerKey.items].sort((a, b) => a.itemNumber - b.itemNumber);

  // 1. Build Header Row dynamically based on the number of items
  const headers = ['ID', 'Student Name', 'Student ID'];
  for (let i = 1; i <= totalItems; i++) {
    headers.push(`Item ${i}`);
  }
  headers.push('Total Score', 'Max Score', 'Percentage', 'Status', 'Scanned Timestamp');

  // 2. Build Optional Answer Key reference row as Row 2
  const keyRow = ['KEY', 'Correct Answers Reference', ''];
  for (const item of sortedItems) {
    keyRow.push(item.correctAnswer);
  }
  keyRow.push(totalItems.toString(), totalItems.toString(), '100%', 'ANSWER KEY', answerKey.createdAt || '');

  // 3. Build data rows for each student (auto-increment ID, 1s and 0s per item)
  const rows: (string | number)[][] = [headers, keyRow];

  // Track sum of correct answers per item for the summary footer
  const itemCorrectSums: Record<number, number> = {};
  for (let i = 1; i <= totalItems; i++) {
    itemCorrectSums[i] = 0;
  }

  let totalClassScoreSum = 0;

  records.forEach((rec, index) => {
    // Ensure 1-based auto-increment ID
    const rowId = rec.id || index + 1;
    const row: (string | number)[] = [
      rowId,
      rec.studentName || `Student ${rowId}`,
      rec.studentId || '-',
    ];

    // Dynamic item columns with strictly "1" or "0"
    for (let i = 1; i <= totalItems; i++) {
      const score = rec.itemScores[i] === 1 ? 1 : 0;
      row.push(score);
      if (score === 1) {
        itemCorrectSums[i] += 1;
      }
    }

    totalClassScoreSum += rec.totalScore;
    const isPassed = rec.percentage >= passingThreshold;

    row.push(
      rec.totalScore,
      rec.totalItems,
      `${rec.percentage}%`,
      isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT',
      rec.scannedAt || new Date().toLocaleString()
    );

    rows.push(row);
  });

  // 4. Build Statistics Summary Rows at bottom
  const studentCount = records.length;
  const totalCorrectRow: (string | number)[] = ['STATISTICS', 'Total Correct Students', ''];
  for (let i = 1; i <= totalItems; i++) {
    totalCorrectRow.push(itemCorrectSums[i]);
  }
  totalCorrectRow.push(
    Number((totalClassScoreSum / studentCount).toFixed(2)),
    totalItems,
    `${((totalClassScoreSum / (studentCount * totalItems)) * 100).toFixed(1)}%`,
    'CLASS AVERAGE',
    ''
  );
  rows.push(totalCorrectRow);

  const accuracyRateRow: (string | number)[] = ['', 'Item Success Rate (%)', ''];
  for (let i = 1; i <= totalItems; i++) {
    const rate = studentCount > 0 ? ((itemCorrectSums[i] / studentCount) * 100).toFixed(1) : '0';
    accuracyRateRow.push(`${rate}%`);
  }
  accuracyRateRow.push('', '', '', '', '');
  rows.push(accuracyRateRow);

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set nice column widths
  const colWidths = [
    { wch: 8 },  // ID
    { wch: 22 }, // Student Name
    { wch: 14 }, // Student ID
  ];
  for (let i = 1; i <= totalItems; i++) {
    colWidths.push({ wch: 8 }); // Item 1..N
  }
  colWidths.push({ wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 22 });
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const safeSheetName = (answerKey.title || 'Grading Results').slice(0, 30).replace(/[\\/?*[\]]/g, '_');
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  // Generate filename
  const cleanTitle = (answerKey.title || 'Answer_Sheet_Scores').replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${cleanTitle}_Results_${dateStr}.xlsx`;

  // Write file to download
  XLSX.writeFile(workbook, fileName);
  return fileName;
}

export function exportRecordsToCSV(
  records: StudentSheetRecord[],
  answerKey: AnswerKey,
  passingThreshold: number = 60
) {
  if (records.length === 0) {
    throw new Error('No records to export');
  }

  const totalItems = answerKey.totalItems;
  const headers = ['ID', 'Student Name', 'Student ID'];
  for (let i = 1; i <= totalItems; i++) {
    headers.push(`Item ${i}`);
  }
  headers.push('Total Score', 'Max Score', 'Percentage', 'Status', 'Date');

  const csvRows: string[] = [headers.join(',')];

  records.forEach((rec, idx) => {
    const rowId = rec.id || idx + 1;
    const row: (string | number)[] = [
      rowId,
      `"${(rec.studentName || '').replace(/"/g, '""')}"`,
      `"${(rec.studentId || '').replace(/"/g, '""')}"`,
    ];
    for (let i = 1; i <= totalItems; i++) {
      row.push(rec.itemScores[i] === 1 ? 1 : 0);
    }
    row.push(
      rec.totalScore,
      rec.totalItems,
      `"${rec.percentage}%"`,
      rec.percentage >= passingThreshold ? 'PASSED' : 'NEEDS IMPROVEMENT',
      `"${rec.scannedAt || ''}"`
    );
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanTitle = (answerKey.title || 'Answer_Sheet_Scores').replace(/\s+/g, '_');
  link.setAttribute('download', `${cleanTitle}_Scores_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
