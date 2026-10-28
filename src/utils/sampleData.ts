import { AnswerKey, StudentSheetRecord } from '../types';

export const DEFAULT_SAMPLE_KEY: AnswerKey = {
  id: 'key-sample-1',
  title: 'Biology & Earth Science Quiz 1',
  totalItems: 15,
  items: [
    { itemNumber: 1, correctAnswer: 'B' },
    { itemNumber: 2, correctAnswer: 'A' },
    { itemNumber: 3, correctAnswer: 'C' },
    { itemNumber: 4, correctAnswer: 'D' },
    { itemNumber: 5, correctAnswer: 'A' },
    { itemNumber: 6, correctAnswer: 'C' },
    { itemNumber: 7, correctAnswer: 'B' },
    { itemNumber: 8, correctAnswer: 'D' },
    { itemNumber: 9, correctAnswer: 'A' },
    { itemNumber: 10, correctAnswer: 'B' },
    { itemNumber: 11, correctAnswer: 'C' },
    { itemNumber: 12, correctAnswer: 'A' },
    { itemNumber: 13, correctAnswer: 'D' },
    { itemNumber: 14, correctAnswer: 'C' },
    { itemNumber: 15, correctAnswer: 'B' },
  ],
  createdAt: new Date().toLocaleDateString(),
};

export const INITIAL_DEMO_RECORDS: StudentSheetRecord[] = [
  {
    id: 1,
    studentName: 'Alexander Chen',
    studentId: 'STU-1021',
    totalScore: 14,
    totalItems: 15,
    percentage: 93.3,
    scannedAt: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sheetNotes: 'Excellent work. Clear bubble marks.',
    itemScores: {
      1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
      6: 1, 7: 1, 8: 1, 9: 1, 10: 1,
      11: 1, 12: 0, 13: 1, 14: 1, 15: 1,
    },
    itemDetails: [
      { itemNumber: 1, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 2, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 3, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 4, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 5, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 6, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 7, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 8, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 9, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 10, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 11, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 12, studentAnswer: 'B', correctAnswer: 'A', isCorrect: false, score: 0 },
      { itemNumber: 13, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 14, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 15, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
    ],
  },
  {
    id: 2,
    studentName: 'Sophia Rodriguez',
    studentId: 'STU-1022',
    totalScore: 12,
    totalItems: 15,
    percentage: 80.0,
    scannedAt: new Date(Date.now() - 3600000 * 1.5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sheetNotes: 'Good effort, missed questions 3, 7, and 14.',
    itemScores: {
      1: 1, 2: 1, 3: 0, 4: 1, 5: 1,
      6: 1, 7: 0, 8: 1, 9: 1, 10: 1,
      11: 1, 12: 1, 13: 1, 14: 0, 15: 1,
    },
    itemDetails: [
      { itemNumber: 1, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 2, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 3, studentAnswer: 'A', correctAnswer: 'C', isCorrect: false, score: 0 },
      { itemNumber: 4, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 5, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 6, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 7, studentAnswer: 'C', correctAnswer: 'B', isCorrect: false, score: 0 },
      { itemNumber: 8, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 9, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 10, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 11, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 12, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 13, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 14, studentAnswer: 'B', correctAnswer: 'C', isCorrect: false, score: 0 },
      { itemNumber: 15, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
    ],
  },
  {
    id: 3,
    studentName: 'Marcus Vance',
    studentId: 'STU-1023',
    totalScore: 9,
    totalItems: 15,
    percentage: 60.0,
    scannedAt: new Date(Date.now() - 3600000 * 1).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sheetNotes: 'Passing score. Review item 6, 8, 10, 11, 13.',
    itemScores: {
      1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
      6: 0, 7: 1, 8: 0, 9: 1, 10: 0,
      11: 0, 12: 1, 13: 0, 14: 1, 15: 0,
    },
    itemDetails: [
      { itemNumber: 1, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 2, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 3, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 4, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 5, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 6, studentAnswer: 'B', correctAnswer: 'C', isCorrect: false, score: 0 },
      { itemNumber: 7, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 8, studentAnswer: 'A', correctAnswer: 'D', isCorrect: false, score: 0 },
      { itemNumber: 9, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 10, studentAnswer: 'C', correctAnswer: 'B', isCorrect: false, score: 0 },
      { itemNumber: 11, studentAnswer: 'D', correctAnswer: 'C', isCorrect: false, score: 0 },
      { itemNumber: 12, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 13, studentAnswer: 'C', correctAnswer: 'D', isCorrect: false, score: 0 },
      { itemNumber: 14, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 15, studentAnswer: 'A', correctAnswer: 'B', isCorrect: false, score: 0 },
    ],
  },
  {
    id: 4,
    studentName: 'Emily Watson',
    studentId: 'STU-1024',
    totalScore: 15,
    totalItems: 15,
    percentage: 100.0,
    scannedAt: new Date(Date.now() - 3600000 * 0.5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sheetNotes: 'Perfect Score 100%! All bubbles filled accurately.',
    itemScores: {
      1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
      6: 1, 7: 1, 8: 1, 9: 1, 10: 1,
      11: 1, 12: 1, 13: 1, 14: 1, 15: 1,
    },
    itemDetails: [
      { itemNumber: 1, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 2, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 3, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 4, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 5, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 6, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 7, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 8, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 9, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 10, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
      { itemNumber: 11, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 12, studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 1 },
      { itemNumber: 13, studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 1 },
      { itemNumber: 14, studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 1 },
      { itemNumber: 15, studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 1 },
    ],
  },
];

/**
 * Creates a clean canvas-rendered sample answer sheet PNG image data URL.
 * Can be used by the user to test the real OCR server without needing an actual paper sheet!
 */
export function generateSampleSheetImage(
  title: string,
  studentName: string,
  studentId: string,
  items: { itemNumber: number; answer: string }[],
  isAnswerKey: boolean = false
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1050;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - white paper with subtle texture
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border & Corner alignment marks for OCR
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // Alignment solid squares at 4 corners
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(40, 40, 24, 24);
  ctx.fillRect(canvas.width - 64, 40, 24, 24);
  ctx.fillRect(40, canvas.height - 64, 24, 24);
  ctx.fillRect(canvas.width - 64, canvas.height - 64, 24, 24);

  // Title Banner
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(title.toUpperCase(), canvas.width / 2, 75);

  ctx.font = '600 15px sans-serif';
  ctx.fillStyle = isAnswerKey ? '#b91c1c' : '#334155';
  ctx.fillText(
    isAnswerKey ? 'MASTER ANSWER KEY (OFFICIAL REFERENCE)' : 'STANDARDIZED MULTIPLE CHOICE ANSWER SHEET',
    canvas.width / 2,
    100
  );

  // Student Info Header Box
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(50, 120, canvas.width - 100, 70);

  ctx.textAlign = 'left';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('NAME:', 65, 145);
  ctx.fillText('STUDENT ID:', 460, 145);
  ctx.fillText('DATE:', 65, 175);
  ctx.fillText('SECTION:', 460, 175);

  // Filled text values
  ctx.font = 'bold 17px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(studentName, 120, 145);
  ctx.fillText(studentId, 560, 145);
  ctx.font = '14px sans-serif';
  ctx.fillText(new Date().toLocaleDateString(), 120, 175);
  ctx.fillText('Section A-1', 540, 175);

  // Divider
  ctx.beginPath();
  ctx.moveTo(50, 205);
  ctx.lineTo(canvas.width - 50, 205);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Column layout for 15-20 items
  const options = ['A', 'B', 'C', 'D'];
  const totalItems = items.length;
  const itemsPerCol = Math.ceil(totalItems / 2);

  // Columns: Col 1 at x=60, Col 2 at x=430
  items.forEach((item, index) => {
    const isCol2 = index >= itemsPerCol;
    const colX = isCol2 ? 430 : 70;
    const itemInColIndex = isCol2 ? index - itemsPerCol : index;
    const rowY = 245 + itemInColIndex * 44;

    // Item Number
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.itemNumber}.`, colX + 35, rowY + 12);

    // Option Bubbles A, B, C, D
    options.forEach((opt, optIndex) => {
      const bubbleX = colX + 65 + optIndex * 58;
      const bubbleY = rowY + 7;
      const radius = 13;
      const isSelected = item.answer.toUpperCase() === opt;

      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, radius, 0, Math.PI * 2);

      if (isSelected) {
        // Filled in bubble (pencil/pen shade)
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(opt, bubbleX, bubbleY + 5);
      } else {
        // Empty bubble
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.fillText(opt, bubbleX, bubbleY + 5);
      }
    });
  });

  // Footer instructions
  ctx.font = 'italic 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    'INSTRUCTIONS: Fill bubbles completely using a dark pen or No. 2 pencil. Erase cleanly.',
    canvas.width / 2,
    canvas.height - 40
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}
