import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support large image payloads from camera scans
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Clean base64 image data
function cleanBase64(dataUriOrBase64: string): { data: string; mimeType: string } {
  if (dataUriOrBase64.startsWith('data:')) {
    const matches = dataUriOrBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return { mimeType: matches[1], data: matches[2] };
    }
  }
  // Default fallback
  return { mimeType: 'image/jpeg', data: dataUriOrBase64.replace(/^data:image\/[a-z]+;base64,/, '') };
}

// -------------------------------------------------------------
// Endpoint 1: Scan Answer Key from image (photo of key sheet)
// -------------------------------------------------------------
app.post('/api/scan-answer-key', async (req, res) => {
  try {
    const { imageBase64, expectedItems } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const ai = getAiClient();
    const { data, mimeType } = cleanBase64(imageBase64);

    const prompt = `You are a high-precision OCR and document grading assistant.
Analyze this photo of an Exam/Quiz Answer Key sheet.
The user wants to extract all correct answers for every question or item.
${expectedItems ? `Hint: The user expects around ${expectedItems} items, but verify carefully.` : ''}

Tasks:
1. Detect any exam title, subject, or heading (e.g. "Science 10 Quiz 1", "General Knowledge Test", or default to "Exam Answer Key").
2. Detect total number of questions/items.
3. For each item number (1, 2, 3 ... N), identify the correct answer:
   - For multiple choice, record the uppercase letter (e.g. "A", "B", "C", "D", "E").
   - For True/False, record "T" or "F" (or "TRUE"/"FALSE").
   - For short answers/numbers, record the concise text/number.
4. If an item has multiple marks or is ambiguous, note the most evident one.

Return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "totalItems": number,
  "items": [
    {
      "itemNumber": 1,
      "correctAnswer": "A"
    }
  ],
  "confidenceNotes": "optional notes on scan clarity"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data,
              mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Clean potential markdown blocks
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    }

    // Ensure items are sorted by itemNumber
    if (Array.isArray(parsed.items)) {
      parsed.items.sort((a: any, b: any) => a.itemNumber - b.itemNumber);
      parsed.totalItems = parsed.items.length;
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error scanning answer key:', error);
    res.status(500).json({
      error: error.message || 'Failed to scan answer key',
    });
  }
});

// -------------------------------------------------------------
// Endpoint 2: Scan & Grade Student Answer Sheet
// -------------------------------------------------------------
app.post('/api/grade-student-sheet', async (req, res) => {
  try {
    const { imageBase64, answerKey, expectedStudentName } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Student sheet image is required' });
    }
    if (!answerKey || !Array.isArray(answerKey.items) || answerKey.items.length === 0) {
      return res.status(400).json({ error: 'Valid answer key with items is required before grading' });
    }

    const ai = getAiClient();
    const { data, mimeType } = cleanBase64(imageBase64);

    const totalKeyItems = answerKey.items.length;
    const keyItemsSummary = answerKey.items
      .map((k: any) => `#${k.itemNumber}: ${k.correctAnswer}`)
      .join(', ');

    const prompt = `You are an automated OCR answer sheet grading engine.
Analyze this photo/scan of a student's answer sheet.

Exam Details:
- Total Items: ${totalKeyItems}
- Answer Key reference for items: ${keyItemsSummary}

Your tasks:
1. Locate and transcribe the Student Name (handwritten or printed). If not found or illegible, state "Student".
2. Locate and transcribe the Student ID or Roll number if present (otherwise empty string "").
3. Read the student's selected answer for EVERY question number from 1 to ${totalKeyItems}.
   - Multiple choice: "A", "B", "C", "D", "E" (detect filled bubble, circled letter, or written letter in box/line).
   - If left blank or unshaded, mark answer as "" (empty string).
   - If crossed out/erased with another chosen, identify the final marked answer.
4. Any notes or remarks (e.g. "Clean sheet", "Item 4 has faint mark").

Return valid JSON with this structure:
{
  "studentName": "string",
  "studentId": "string",
  "studentAnswers": [
    {
      "itemNumber": 1,
      "studentAnswer": "A",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "sheetNotes": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data,
              mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    }

    // Map student answers into dictionary for fast lookup
    const studentAnswerMap: Record<number, string> = {};
    if (Array.isArray(parsed.studentAnswers)) {
      parsed.studentAnswers.forEach((ans: any) => {
        studentAnswerMap[ans.itemNumber] = (ans.studentAnswer || '').toString().trim().toUpperCase();
      });
    }

    // Now compute item-by-item 1 or 0 matching against answerKey
    // 1 if correct, 0 if incorrect or blank
    const itemScores: Record<number, number> = {};
    const itemDetails: Array<{
      itemNumber: number;
      studentAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      score: number;
    }> = [];

    let totalScore = 0;

    for (const keyItem of answerKey.items) {
      const num = keyItem.itemNumber;
      const expected = (keyItem.correctAnswer || '').toString().trim().toUpperCase();
      const actual = studentAnswerMap[num] || '';

      // Check equality: normalize casing and spacing
      const isCorrect = actual !== '' && actual === expected;
      const score = isCorrect ? 1 : 0;

      itemScores[num] = score;
      if (isCorrect) totalScore += 1;

      itemDetails.push({
        itemNumber: num,
        studentAnswer: actual,
        correctAnswer: expected,
        isCorrect,
        score,
      });
    }

    const percentage = totalKeyItems > 0 ? Number(((totalScore / totalKeyItems) * 100).toFixed(1)) : 0;

    const result = {
      studentName: (parsed.studentName && parsed.studentName.trim()) || expectedStudentName || 'Student',
      studentId: (parsed.studentId && parsed.studentId.trim()) || '',
      itemScores,
      itemDetails,
      totalScore,
      totalItems: totalKeyItems,
      percentage,
      sheetNotes: parsed.sheetNotes || '',
    };

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error grading student sheet:', error);
    res.status(500).json({
      error: error.message || 'Failed to grade student sheet',
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScanGrade server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
