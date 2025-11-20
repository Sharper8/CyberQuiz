import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/questions - Get all validated questions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validated = searchParams.get('validated');
    
    let query = 'SELECT * FROM questions';
    const params: any[] = [];
    
    if (validated !== null) {
      query += ' WHERE validated = $1';
      params.push(validated === 'true');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST /api/questions - Create a new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, category, ai_generated = false, validated = true } = body;
    
    if (!question || answer === undefined || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const result = await pool.query(
      `INSERT INTO questions (question, answer, category, ai_generated, validated) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [question, answer, category, ai_generated, validated]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
