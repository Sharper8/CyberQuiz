import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAdminToken } from '@/lib/auth/admin-auth';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';

/**
 * POST /api/admin/questions/import
 * Import questions from CSV file
 * Body: FormData with file field
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have header row and at least one data row' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);
    const requiredHeaders = ['Question', 'Option 1', 'Option 2', 'Correct Answer', 'Explanation'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required columns',
          missing: missingHeaders,
        },
        { status: 400 }
      );
    }

    // Parse and import rows
    const imported: any[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const row = parseRow(headers, values);

        if (!row.questionText || !row.correctAnswer) {
          errors.push({
            row: i + 1,
            error: 'Missing question text or correct answer',
          });
          continue;
        }

        // Generate hash for duplicate detection
        const questionHash = generateQuestionHash(row.questionText);

        // Check if already exists
        const existing = await prisma.question.findFirst({
          where: { questionHash },
        });

        if (existing) {
          errors.push({
            row: i + 1,
            error: 'Question already exists (duplicate detected)',
          });
          continue;
        }

        // Create question
        const created = await prisma.question.create({
          data: {
            questionText: row.questionText,
            options: row.options,
            correctAnswer: row.correctAnswer,
            explanation: row.explanation,
            difficulty: new Decimal(row.difficulty),
            qualityScore: new Decimal(row.qualityScore),
            category: row.category,
            questionType: 'true-false',
            status: row.status,
            aiProvider: 'manual-import',
            questionHash,
            mitreTechniques: row.mitreTechniques || [],
            tags: row.tags || [],
            metadata: {
              create: {
                embeddingId: `imported_${Date.now()}_${i}`,
              },
            },
          },
        });

        imported.push(created.id);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(
      {
        imported: imported.length,
        importedIds: imported,
        errors,
        total: lines.length - 1,
        message: `Successfully imported ${imported.length} questions${
          errors.length > 0 ? ` (${errors.length} errors)` : ''
        }`,
      },
      { status: imported.length > 0 ? 200 : 400 }
    );
  } catch (error) {
    console.error('[API/admin/questions/import] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to import questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Normalize answer values: convert True/False (English) to Vrai/Faux (French)
 */
function normalizeAnswer(value: string): string {
  if (!value) return value;
  const normalized = value.trim();
  if (normalized === 'True') return 'Vrai';
  if (normalized === 'False') return 'Faux';
  return normalized;
}

function parseRow(headers: string[], values: string[]): any {
  const row: any = {};

  headers.forEach((header, index) => {
    const value = values[index] || '';
    row[header] = value;
  });

  // Get options and normalize them
  const option1 = normalizeAnswer(row['Option 1'] || 'Vrai');
  const option2 = normalizeAnswer(row['Option 2'] || 'Faux');
  const correctAnswer = normalizeAnswer(row['Correct Answer'] || '');

  return {
    questionText: row['Question'] || '',
    options: [option1, option2],
    correctAnswer: correctAnswer,
    explanation: row['Explanation'] || '',
    category: row['Category'] || 'Sécurité',
    difficulty: parseFloat(row['Difficulty'] || '0.5'),
    qualityScore: parseFloat(row['Quality Score'] || '0.7'),
    status: row['Status'] || 'to_review',
    mitreTechniques: row['MITRE Techniques']
      ? row['MITRE Techniques'].split(';').map((t: string) => t.trim())
      : [],
    tags: row['Tags']
      ? row['Tags'].split(';').map((t: string) => t.trim())
      : [],
  };
}

function generateQuestionHash(questionText: string): string {
  const normalized = questionText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
