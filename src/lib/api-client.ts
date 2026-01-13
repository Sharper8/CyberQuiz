// Client-side API wrapper to replace Supabase
"use client";

export interface Question {
  id: number;
  questionText: string;
  options: string | string[]; // JSON string or parsed array
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  qualityScore?: number;
  category: string;
  questionType: string;
  status: 'to_review' | 'accepted' | 'rejected';
  isRejected: boolean;
  aiProvider: string;
  mitreTechniques?: string | string[];
  tags?: string | string[];
  potentialDuplicates?: Array<{id: number, similarity: number}>;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  
  // Legacy fields for backward compatibility
  question?: string;
  answer?: boolean;
  ai_generated?: boolean;
  validated?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Score {
  id: number;
  rank: number;
  username: string;
  score: number;
  totalQuestions: number;
  accuracyPercentage: number;
  topic: string | null;
  completedAt: Date;
}

export interface User {
  email: string;
  role: string;
}

class ApiClient {
  private baseUrl = '/api';

  // Questions
  async getQuestions(validated?: boolean): Promise<Question[]> {
    const url = validated !== undefined 
      ? `${this.baseUrl}/questions?validated=${validated}`
      : `${this.baseUrl}/questions`;
      
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch questions');
    return res.json();
  }

  async createQuestion(data: {
    question: string;
    answer: boolean;
    category: string;
    ai_generated?: boolean;
    validated?: boolean;
  }): Promise<Question> {
    const res = await fetch(`${this.baseUrl}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create question');
    return res.json();
  }

  async deleteQuestion(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/questions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete question');
  }

  async updateQuestion(
    id: string, 
    data: { validated?: boolean; status?: 'to_review' | 'accepted' | 'rejected' }
  ): Promise<Question> {
    const res = await fetch(`${this.baseUrl}/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update question');
    return res.json();
  }

  async generateQuestions(data: { 
    topic: string; 
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
  }): Promise<{ topic: string; difficulty: string; cacheSize: number; message: string }> {
    const res = await fetch(`${this.baseUrl}/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to generate questions');
    }
    return res.json();
  }

  // Admin - Get similar questions
  async getSimilarQuestions(questionId: number): Promise<{
    question: Question;
    similarQuestions: Array<Question & {similarity: number}>;
  }> {
    const res = await fetch(`${this.baseUrl}/admin/questions/similar?id=${questionId}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch similar questions');
    return res.json();
  }

  // Scores
  async getScores(limit = 10): Promise<Score[]> {
    const res = await fetch(`${this.baseUrl}/scores?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch scores');
    const data = await res.json();
    // API returns { leaderboard: [...], count: N, limit: N }
    return data.leaderboard || [];
  }

  // Auth
  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    return res.json();
  }

  async logout(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Logout failed');
  }

  async getCurrentUser(): Promise<{ authenticated: boolean; user?: User }> {
    const res = await fetch(`${this.baseUrl}/auth/me`);
    if (!res.ok) return { authenticated: false };
    return res.json();
  }
}

export const api = new ApiClient();
