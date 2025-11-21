// Client-side API wrapper to replace Supabase
"use client";

export interface Question {
  id: string;
  question: string;
  answer: boolean;
  category: string;
  ai_generated: boolean;
  validated: boolean;
  created_at: string;
  updated_at: string;
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

  async updateQuestion(id: string, data: { validated: boolean }): Promise<Question> {
    const res = await fetch(`${this.baseUrl}/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update question');
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
