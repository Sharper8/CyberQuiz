import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAdminToken } from '@/lib/auth/admin-auth';

/**
 * GET /api/admin/questions/export
 * Export questions as CSV or Excel
 * Query params:
 *   - format: 'csv' | 'xlsx' (default: 'csv')
 *   - status: 'all' | 'accepted' | 'to_review' | 'rejected' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const status = searchParams.get('status') || 'all';

    // Validate format
    if (!['csv', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "csv" or "xlsx"' },
        { status: 400 }
      );
    }

    // Build filter based on status parameter
    const where: any = {};

    // Handle status filter
    if (status === 'all') {
      // Export all questions regardless of status or rejection
      // (no filter applied, returns all)
    } else if (status === 'rejected') {
      // Show only rejected questions
      where.status = 'rejected';
    } else if (['accepted', 'to_review'].includes(status)) {
      // Show accepted or to_review, but exclude isRejected ones
      where.status = status;
      where.isRejected = false;
    }

    // Fetch questions from database
    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      return exportAsCSV(questions);
    } else {
      return exportAsExcel(questions);
    }
  } catch (error) {
    console.error('[API/questions/export] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to export questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function exportAsCSV(questions: any[]) {
  // CSV header
  const headers = [
    'ID',
    'Question',
    'Option 1',
    'Option 2',
    'Correct Answer',
    'Explanation',
    'Category',
    'Difficulty',
    'Quality Score',
    'Status',
    'MITRE Techniques',
    'Tags',
    'Created At',
  ];

  // CSV rows
  const rows = questions.map((q) => [
    q.id,
    `"${(q.questionText || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
    `"${(q.options?.[0] || '').replace(/"/g, '""')}"`,
    `"${(q.options?.[1] || '').replace(/"/g, '""')}"`,
    q.correctAnswer,
    `"${(q.explanation || '').replace(/"/g, '""')}"`,
    q.category,
    q.difficulty,
    q.qualityScore,
    q.status,
    Array.isArray(q.mitreTechniques) ? q.mitreTechniques.join(';') : '',
    Array.isArray(q.tags) ? q.tags.join(';') : '',
    q.createdAt?.toISOString() || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="questions-${Date.now()}.csv"`,
    },
  });
}

async function exportAsExcel(questions: any[]) {
  // Dynamically import xlsx
  const XLSX = await import('xlsx');

  // Prepare data for Excel
  const data = questions.map((q) => ({
    ID: q.id,
    Question: q.questionText,
    'Option 1': q.options?.[0] || '',
    'Option 2': q.options?.[1] || '',
    'Correct Answer': q.correctAnswer,
    Explanation: q.explanation,
    Category: q.category,
    Difficulty: q.difficulty,
    'Quality Score': q.qualityScore,
    Status: q.status,
    'MITRE Techniques': Array.isArray(q.mitreTechniques) ? q.mitreTechniques.join('; ') : '',
    Tags: Array.isArray(q.tags) ? q.tags.join('; ') : '',
    'Created At': q.createdAt?.toISOString() || '',
  }));

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');

  // Write to buffer
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const uint8Array = new Uint8Array(buffer as ArrayLike<number>);

  return new NextResponse(uint8Array, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="questions-${Date.now()}.xlsx"`,
    },
  });
}
