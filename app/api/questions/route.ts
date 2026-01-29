export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/questions - Get all questions (filtered by status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const validated = searchParams.get('validated'); // Legacy support
    const includeRejected = searchParams.get('includeRejected') === 'true' || status === 'rejected';
    const randomize = searchParams.get('randomize') === 'true';
    
    let where: any = {};
    if (!includeRejected) {
      where.isRejected = false; // Exclude rejected questions by default
    }
    
    // New status-based filtering
    if (status) {
      where.status = status;
    } 
    // Legacy validated parameter support
    else if (validated !== null) {
      where.status = validated === 'true' ? 'accepted' : 'to_review';
    }
    
    // Use raw SQL for random ordering to ensure true randomness
    if (randomize) {
      const whereConditions = [];
      
      if (!includeRejected) {
        whereConditions.push('"isRejected" = false');
      }
      if (status) {
        whereConditions.push(`status = '${status}'`);
      } else if (validated !== null) {
        const targetStatus = validated === 'true' ? 'accepted' : 'to_review';
        whereConditions.push(`status = '${targetStatus}'`);
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      
      const query = `
        SELECT * FROM "Question"
        ${whereClause}
        ORDER BY RANDOM()
      `;
      
      const questions = await prisma.$queryRawUnsafe(query);
      
      return NextResponse.json(questions);
    }
    
    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        metadata: true,
      },
    });
    
    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST /api/questions - Create a new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      questionText, 
      question, // legacy support
      correctAnswer, 
      answer, // legacy support
      category, 
      explanation, 
      difficulty = 0.5 
    } = body;
    
    // Support both new and legacy field names
    const text = questionText || question;
    const answerValue = correctAnswer !== undefined ? correctAnswer : answer;
    
    if (!text || answerValue === undefined || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normalize answer to Vrai/Faux
    const normalizeAnswer = (value: any): string => {
      const str = String(value).trim();
      if (str.toLowerCase() === 'true') return 'Vrai';
      if (str.toLowerCase() === 'false') return 'Faux';
      if (str === '1' || str.toLowerCase() === 'yes') return 'Vrai';
      if (str === '0' || str.toLowerCase() === 'no') return 'Faux';
      return str;
    };
    
    const questionRecord = await prisma.question.create({
      data: {
        questionText: text,
        options: ['Vrai', 'Faux'],
        correctAnswer: typeof answerValue === 'boolean' 
          ? (answerValue ? 'Vrai' : 'Faux')
          : normalizeAnswer(answerValue),
        explanation: explanation || '',
        difficulty,
        category,
        questionType: 'true-false',
        status: 'accepted', // Manually created questions are auto-accepted
        isRejected: false,
        aiProvider: 'manual',
      },
    });
    
    return NextResponse.json(questionRecord, { status: 201 });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
