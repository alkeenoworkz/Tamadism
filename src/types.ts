export interface AnswerKeyItem {
  itemNumber: number;
  correctAnswer: string;
}

export interface AnswerKey {
  id: string;
  title: string;
  totalItems: number;
  items: AnswerKeyItem[];
  createdAt: string;
}

export interface ItemDetail {
  itemNumber: number;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number; // 1 or 0
}

export interface StudentSheetRecord {
  id: number; // Auto-increment ID (1, 2, 3...)
  studentName: string;
  studentId: string;
  itemScores: Record<number, number>; // itemNumber -> 1 or 0
  itemDetails: ItemDetail[];
  totalScore: number;
  totalItems: number;
  percentage: number;
  scannedAt: string;
  sheetImageThumbnail?: string;
  sheetNotes?: string;
}

export interface ScanKeyResponse {
  title?: string;
  totalItems?: number;
  items: AnswerKeyItem[];
  confidenceNotes?: string;
}

export interface GradeSheetResponse {
  studentName: string;
  studentId: string;
  itemScores: Record<number, number>;
  itemDetails: ItemDetail[];
  totalScore: number;
  totalItems: number;
  percentage: number;
  sheetNotes?: string;
}
