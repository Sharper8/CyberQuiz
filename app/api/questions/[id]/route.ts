import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/questions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}

// PATCH /api/questions/[id] - Update a question
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { validated } = body;
    
    const result = await pool.query(
      'UPDATE questions SET validated = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [validated, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}
