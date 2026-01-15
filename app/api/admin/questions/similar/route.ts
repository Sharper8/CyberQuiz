import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAdminToken } from '@/lib/auth/admin-auth';

/**
 * GET /api/admin/questions/similar?id=123
 * Get similar questions for comparison
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminToken(request);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const questionId = parseInt(searchParams.get('id') || '0');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Missing question ID' },
        { status: 400 }
      );
    }

    // Get the question with its potential duplicates
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Parse potential duplicates
    const duplicates = question.potentialDuplicates 
      ? (typeof question.potentialDuplicates === 'string' 
        ? JSON.parse(question.potentialDuplicates as string) 
        : question.potentialDuplicates)
      : [];

    if (!Array.isArray(duplicates) || duplicates.length === 0) {
      return NextResponse.json(
        { 
          question: {
            id: question.id,
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: Number(question.difficulty),
            category: question.category,
            status: question.status,
            aiProvider: question.aiProvider,
            createdAt: question.createdAt,
          },
          similarQuestions: []
        },
        { status: 200 }
      );
    }

    // Fetch the similar questions from database
    const similarIds = duplicates.map((d: any) => d.id).filter((id): id is number => typeof id === 'number');
    
    if (similarIds.length === 0) {
      return NextResponse.json(
        { 
          question: {
            id: question.id,
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: Number(question.difficulty),
            category: question.category,
            status: question.status,
            aiProvider: question.aiProvider,
            createdAt: question.createdAt,
          },
          similarQuestions: []
        },
        { status: 200 }
      );
    }

    const similarQuestions = await prisma.question.findMany({
      where: {
        id: { in: similarIds }
      },
      select: {
        id: true,
        questionText: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        difficulty: true,
        category: true,
        status: true,
        aiProvider: true,
        createdAt: true,
      }
    });

    // Merge with similarity scores
    const similarWithScores = similarQuestions.map(sq => {
      const scoreData = duplicates.find((d: any) => d.id === sq.id);
      return {
        ...sq,
        difficulty: Number(sq.difficulty),
        similarity: scoreData?.similarity || 0,
      };
    }).sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json(
      { 
        question: {
          id: question.id,
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          difficulty: Number(question.difficulty),
          category: question.category,
          status: question.status,
          aiProvider: question.aiProvider,
          createdAt: question.createdAt,
        },
        similarQuestions: similarWithScores
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API/admin/similar] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar questions' },
      { status: 500 }
    );
  }
}
