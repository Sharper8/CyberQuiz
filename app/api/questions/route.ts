import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/questions - Get all questions (filtered by status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const validated = searchParams.get('validated'); // Legacy support
    
    let where: any = {
      isRejected: false, // Exclude rejected questions by default
    };
    
    // New status-based filtering
    if (status) {
      where.status = status;
    } 
    // Legacy validated parameter support
    else if (validated !== null) {
      where.status = validated === 'true' ? 'accepted' : 'to_review';
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
    
    const questionRecord = await prisma.question.create({
      data: {
        questionText: text,
        options: JSON.stringify(['True', 'False']),
        correctAnswer: typeof answerValue === 'boolean' 
          ? (answerValue ? 'True' : 'False')
          : answerValue,
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
