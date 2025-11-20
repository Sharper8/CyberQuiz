import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/scores - Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const result = await pool.query(
      `SELECT * FROM scores 
       ORDER BY score DESC, created_at DESC 
       LIMIT $1`,
      [limit]
    );
    
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

// POST /api/scores - Save a new score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pseudo, score, total_questions, mode } = body;
    
    if (!pseudo || score === undefined || !total_questions || !mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const result = await pool.query(
      `INSERT INTO scores (pseudo, score, total_questions, mode) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [pseudo, score, total_questions, mode]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
