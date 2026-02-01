/**
 * Question Review Queue - Industrial Grade
 * 
 * Live buffer display with inline review actions.
 * No chatbot paradigm - pure content production line.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Edit2, AlertTriangle } from 'lucide-react';
import CyberButton from './CyberButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Question {
  id: number;
  questionText: string;
  correctAnswer: string;
  explanation: string;
  category: string;
  aiProvider: string;
  adminDifficulty?: string | null;
  difficulty?: number;
  generationDomain?: string;
  generationSkillType?: string;
  generationGranularity?: string;
  generationDifficulty?: string;
  potentialDuplicates?: Array<{ id: number; similarity: number }>;
  tags?: string[];
  rssSourceId?: number | null;
  rssArticleId?: number | null;
  rssSource?: { title: string; url: string } | null;
  rssArticle?: { title: string; link: string } | null;
}

interface BufferStatus {
  currentSize: number;
  targetSize: number;
  isGenerating: boolean;
  autoRefillEnabled: boolean;
}

export function QuestionReviewQueue() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [bufferStatus, setBufferStatus] = useState<BufferStatus | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Partial<Question>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBufferAndQuestions();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchBufferAndQuestions, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBufferAndQuestions = async () => {
    try {
      const [statusRes, questionsRes] = await Promise.all([
        fetch('/api/admin/buffer/status'),
        fetch('/api/admin/questions/review?limit=50'),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setBufferStatus(statusData.buffer);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.questions || []);
      }
    } catch (error) {
      console.error('[ReviewQueue] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (questionId: number) => {
    try {
      const res = await fetch('/api/admin/questions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', questionId }),
      });

      if (!res.ok) throw new Error('Failed to accept');

      setQuestions(prev => prev.filter(q => q.id !== questionId));
      toast.success('Question accepted - Buffer refilling automatically');
      
      // Immediate refresh to show new question
      setTimeout(fetchBufferAndQuestions, 1000);
    } catch (error) {
      toast.error('Failed to accept question');
    }
  };

  const handleReject = async (questionId: number) => {
    try {
      const res = await fetch('/api/admin/questions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject', 
          questionId,
          reason: 'Admin rejected during review' 
        }),
      });

      if (!res.ok) throw new Error('Failed to reject');

      setQuestions(prev => prev.filter(q => q.id !== questionId));
      toast.success('Question rejected - Buffer refilling automatically');
      
      // Immediate refresh
      setTimeout(fetchBufferAndQuestions, 1000);
    } catch (error) {
      toast.error('Failed to reject question');
    }
  };

  const startEditing = (question: Question) => {
    setEditingId(question.id);
    setEditedQuestion({
      questionText: question.questionText,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      adminDifficulty: question.adminDifficulty || undefined,
    });
  };

  const saveEdit = async (questionId: number) => {
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedQuestion),
      });

      if (!res.ok) throw new Error('Failed to update');

      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, ...editedQuestion } : q
      ));
      setEditingId(null);
      setEditedQuestion({});
      toast.success('Question updated');
    } catch (error) {
      toast.error('Failed to update question');
    }
  };

  const updateDifficulty = async (questionId: number, newDifficulty: string) => {
    try {
      const res = await fetch(`/api/admin/questions/${questionId}/difficulty`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminDifficulty: newDifficulty }),
      });

      if (!res.ok) throw new Error('Failed to update difficulty');

      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, adminDifficulty: newDifficulty } : q
      ));
      toast.success(`Difficulty updated to ${newDifficulty}`);
    } catch (error) {
      toast.error('Failed to update difficulty');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Buffer Status Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Review Buffer</h3>
            <p className="text-sm text-muted-foreground">
              {bufferStatus?.currentSize || 0} / {bufferStatus?.targetSize || 10} questions ready
            </p>
          </div>
          <div className="flex items-center gap-4">
            {bufferStatus?.isGenerating && (
              <Badge variant="outline" className="gap-2">
                <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                Generating
              </Badge>
            )}
            <Badge variant={bufferStatus?.autoRefillEnabled ? 'default' : 'secondary'}>
              Auto-refill: {bufferStatus?.autoRefillEnabled ? 'ON' : 'OFF'}
            </Badge>
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, ((bufferStatus?.currentSize || 0) / (bufferStatus?.targetSize || 1)) * 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Cards */}
      <div className="grid gap-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Buffer is empty. {bufferStatus?.isGenerating ? 'Generating questions...' : 'Enable auto-refill to start generating.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {editingId === question.id ? (
                      <Textarea
                        value={editedQuestion.questionText}
                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                        className="min-h-[60px]"
                      />
                    ) : (
                      <p className="text-lg font-medium">{question.questionText}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline">{question.category}</Badge>
                      
                      {/* Admin Difficulty Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Difficulty:</span>
                        <Select
                          value={question.adminDifficulty || 'Intermediate'}
                          onValueChange={(value) => updateDifficulty(question.id, value)}
                        >
                          <SelectTrigger className="w-[140px] h-7 text-xs border-cyber-blue/30 hover:border-cyber-blue">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {question.generationDomain && (
                        <Badge variant="secondary">{question.generationDomain}</Badge>
                      )}
                      {question.generationSkillType && (
                        <Badge variant="secondary">{question.generationSkillType}</Badge>
                      )}
                      {question.generationGranularity && (
                        <Badge variant="secondary">{question.generationGranularity}</Badge>
                      )}
                      <Badge className="gap-1">
                        <span className="text-xs">AI: {question.aiProvider}</span>
                      </Badge>
                      {(question.tags?.includes('rss') || question.rssSourceId) && (
                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                          <span className="text-xs">RSS: {question.rssSource?.title || question.tags?.find(t => t !== 'rss' && question.tags?.includes('rss')) || 'News'}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingId === question.id ? (
                      <>
                        <CyberButton variant="correct" size="sm" onClick={() => saveEdit(question.id)}>
                          Save
                        </CyberButton>
                        <CyberButton variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          Cancel
                        </CyberButton>
                      </>
                    ) : (
                      <>
                        <CyberButton variant="outline" size="sm" onClick={() => startEditing(question)}>
                          <Edit2 className="h-4 w-4" />
                        </CyberButton>
                        <CyberButton variant="correct" size="sm" onClick={() => handleAccept(question.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Accept
                        </CyberButton>
                        <CyberButton variant="incorrect" size="sm" onClick={() => handleReject(question.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </CyberButton>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {editingId === question.id ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Correct Answer</label>
                      <Input
                        value={editedQuestion.correctAnswer}
                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Explanation</label>
                      <Textarea
                        value={editedQuestion.explanation}
                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-sm font-semibold">Answer: </span>
                      <span className="text-sm">{question.correctAnswer}</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold">Explanation: </span>
                      <span className="text-sm text-muted-foreground">{question.explanation}</span>
                    </div>
                  </>
                )}

                {(() => {
                  const significantDuplicates = (question.potentialDuplicates || []).filter(d => d.similarity >= 0.80);
                  if (significantDuplicates.length === 0) return null;
                  return (
                    <div className="mt-3 p-3 bg-cyber-orange/10 border border-cyber-orange/30 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-cyber-orange" />
                        <span className="text-sm font-semibold text-cyber-orange">
                          {significantDuplicates.length} similar question(s) detected (≥80%)
                        </span>
                      </div>
                      {significantDuplicates.slice(0, 2).map((dup, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground font-semibold">
                          → ID {dup.id}: <span className="text-cyber-orange">{(dup.similarity * 100).toFixed(0)}%</span> similar
                        </div>
                      ))}
                      {significantDuplicates.length > 2 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          +{significantDuplicates.length - 2} more
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
