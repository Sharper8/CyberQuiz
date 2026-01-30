"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Sparkles, Plus, ChevronDown } from "lucide-react";
import CyberButton from "@/components/CyberButton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ExportImportPanel } from "@/components/ExportImportPanel";
import { useAdmin } from "@/hooks/useAdmin";
import { api, Question } from "@/lib/api-client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'accepted' | 'to_review' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    answer: true,
    category: "Sécurité",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState({
    questionText: "",
    correctAnswer: "True",
    explanation: "",
    category: "",
    tags: "",
    generationDomain: "",
    generationSkillType: "",
    generationDifficulty: "",
    generationGranularity: "",
  });
  const [expandedMetadata, setExpandedMetadata] = useState<Set<number>>(new Set());

  const toggleMetadata = (questionId: number) => {
    setExpandedMetadata(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const fetchQuestions = async () => {
    try {
      const data = await api.getQuestions({ includeRejected: true });
      setQuestions(data);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des questions");
    } finally {
      setLoading(false);
    }
  };



  const handleAccept = async (id: number) => {
    try {
      await api.updateQuestion(id.toString(), { status: 'accepted' });
      setQuestions(questions.map(q => 
        q.id === id ? { ...q, status: 'accepted' as const, isRejected: false } : q
      ));
      toast.success("Question acceptée et ajoutée au pool");
    } catch (error: any) {
      toast.error("Erreur lors de l'acceptation");
    }
  };

  const handleReject = async (id: number) => {
    try {
      // Mark as rejected (soft delete - moves to rejected pool)
      await api.updateQuestion(id.toString(), { status: 'rejected' });
      setQuestions(questions.map(q => 
        q.id === id ? { ...q, status: 'rejected' as const, isRejected: true } : q
      ));
      toast.success("Question rejetée");
    } catch (error: any) {
      toast.error("Erreur lors du rejet");
    }
  };

  const handleAddQuestion = async () => {
    try {
      const data = await api.createQuestion({
        ...newQuestion,
      });

      setQuestions([data, ...questions]);
      setAddDialogOpen(false);
      setNewQuestion({ question: "", answer: true, category: "Sécurité" });
      toast.success("Question ajoutée");
    } catch (error: any) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const openEditDialog = (question: Question) => {
    const tags = Array.isArray(question.tags)
      ? question.tags.join(", ")
      : typeof question.tags === "string"
        ? question.tags
        : "";
    setEditQuestion(question);
    setEditForm({
      questionText: question.questionText || question.question || "",
      correctAnswer: question.correctAnswer || (question.answer ? "True" : "False") || "True",
      explanation: question.explanation || "",
      category: question.category || "",
      tags,
      generationDomain: question.generationDomain || "",
      generationSkillType: question.generationSkillType || "",
      generationDifficulty: question.generationDifficulty || "",
      generationGranularity: question.generationGranularity || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editQuestion) return;
    try {
      const payload = {
        questionText: editForm.questionText,
        correctAnswer: editForm.correctAnswer,
        explanation: editForm.explanation,
        category: editForm.category,
        tags: editForm.tags,
        generationDomain: editForm.generationDomain || null,
        generationSkillType: editForm.generationSkillType || null,
        generationDifficulty: editForm.generationDifficulty || null,
        generationGranularity: editForm.generationGranularity || null,
      };
      const updated = await api.updateQuestion(editQuestion.id.toString(), payload);
      setQuestions((prev) => prev.map((q) => (q.id === updated.id ? { ...q, ...updated } : q)));
      setEditDialogOpen(false);
      setEditQuestion(null);
      toast.success("Question mise à jour");
    } catch (error: any) {
      toast.error("Échec de la mise à jour");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Filter questions based on selected filter
  const filteredQuestions = filter === 'all' 
    ? questions 
    : questions.filter(q => q.status === filter);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

  const stats = {
    total: questions.length,
    accepted: questions.filter(q => q.status === 'accepted').length,
    pending: questions.filter(q => q.status === 'to_review').length,
    rejected: questions.filter(q => q.status === 'rejected' || q.isRejected).length,
    aiGenerated: questions.filter(q => q.aiProvider !== 'manual' && q.aiProvider !== 'seed').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">Interface Admin</h1>
        <p className="text-muted-foreground">Gestion de la banque de questions</p>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">Total</p>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">Acceptées</p>
            <p className="text-3xl font-bold text-secondary">{stats.accepted}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">En attente</p>
            <p className="text-3xl font-bold text-cyber-red">{stats.pending}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-1">Générées IA</p>
            <p className="text-3xl font-bold text-cyber-blue">{stats.aiGenerated}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <CyberButton variant="primary" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Ajouter une question
              </CyberButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle question</DialogTitle>
                <DialogDescription>
                  Ajoutez manuellement une question au quiz
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    placeholder="Ex: Le HTTPS garantit la confidentialité des données"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Input
                    id="category"
                    placeholder="Ex: Sécurité, Phishing, Mots de passe..."
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Réponse correcte</Label>
                  <Select
                    value={newQuestion.answer.toString()}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, answer: value === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Vrai</SelectItem>
                      <SelectItem value="false">Faux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CyberButton
                  variant="primary"
                  onClick={handleAddQuestion}
                  className="w-full"
                >
                  Ajouter
                </CyberButton>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export/Import Panel */}
          <ExportImportPanel onImportSuccess={fetchQuestions} />
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Banque de questions ({filteredQuestions.length})</h2>
              <p className="text-sm text-muted-foreground">Affichage {filteredQuestions.length === 0 ? 0 : startIndex + 1}-{Math.min(filteredQuestions.length, startIndex + pageSize)} sur {filteredQuestions.length}</p>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <CyberButton
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="default"
                onClick={() => setFilter('all')}
              >
                Toutes ({questions.length})
              </CyberButton>
              <CyberButton
                variant={filter === 'to_review' ? 'primary' : 'outline'}
                size="default"
                onClick={() => setFilter('to_review')}
              >
                En attente ({stats.pending})
              </CyberButton>
              <CyberButton
                variant={filter === 'accepted' ? 'primary' : 'outline'}
                size="default"
                onClick={() => setFilter('accepted')}
              >
                Pool actif ({stats.accepted})
              </CyberButton>
              <CyberButton
                variant={filter === 'rejected' ? 'primary' : 'outline'}
                size="default"
                onClick={() => setFilter('rejected')}
              >
                Rejetées ({stats.rejected})
              </CyberButton>
            </div>
          </div>
          
          {filteredQuestions.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-xl text-muted-foreground">
                Aucune question {filter !== 'all' ? `dans la catégorie "${filter}"` : ''}
              </p>
            </div>
          ) : (
            paginatedQuestions.map((question) => {
              // Parse JSON fields if they're strings
              const questionText = question.questionText || question.question || '';
              const correctAnswer = question.correctAnswer || (question.answer ? 'True' : 'False');
              const rawAnswer = correctAnswer;
              // Normalize answer to handle all possible formats (True/False, Vrai/Faux, true/false)
              const isCorrectTrue = 
                String(rawAnswer).toLowerCase() === 'true' ||
                String(rawAnswer).toLowerCase() === 'vrai' ||
                String(rawAnswer) === '1' ||
                String(rawAnswer).toLowerCase() === 'yes';
              const tags = (() => {
                if (!question.tags) return [] as string[];
                if (Array.isArray(question.tags)) return question.tags as string[];
                const raw = String(question.tags).trim();
                if (!raw) return [] as string[];
                try {
                  const parsed = JSON.parse(raw);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return raw.split(',').map(t => t.trim()).filter(Boolean);
                }
              })();
              const rssLabel = tags.includes('rss') ? (tags.find(t => t !== 'rss') || 'RSS') : null;
              const potentialDuplicates = (() => {
                if (!question.potentialDuplicates) return [];
                if (Array.isArray(question.potentialDuplicates)) return question.potentialDuplicates;
                try {
                  const parsed = JSON.parse(String(question.potentialDuplicates));
                  return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                  return [];
                }
              })();
              
              return (
                <div
                  key={question.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Status, AI provider, and one-line metadata */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap text-sm">
                        {/* Status and Model - Primary emphasis */}
                        {question.status === 'accepted' ? (
                          <Badge className="bg-secondary text-secondary-foreground gap-1 font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Dans le pool
                          </Badge>
                        ) : question.status === 'rejected' ? (
                          <Badge variant="destructive" className="gap-1 font-semibold">
                            <XCircle className="h-3 w-3" />
                            Rejetée
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-cyber-red text-cyber-red font-semibold">
                            <XCircle className="h-3 w-3" />
                            En attente
                          </Badge>
                        )}
                        
                        {/* AI Provider/Model - Always show */}
                        <Badge variant="secondary" className="gap-1 font-semibold">
                          <Sparkles className="h-3 w-3" />
                          {question.aiModel || question.aiProvider || 'unknown'}
                        </Badge>

                        {rssLabel && (
                          <Badge className="gap-1 bg-blue-600 text-white hover:bg-blue-700">
                            RSS: {rssLabel}
                          </Badge>
                        )}

                        {/* Metadata trigger on the same line */}
                        {(question.generationDomain || question.generationSkillType || question.generationDifficulty || question.generationGranularity) && (
                          <Badge
                            variant="outline"
                            className="gap-1 cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => toggleMetadata(question.id)}
                          >
                            Options
                            <ChevronDown
                              className="h-3 w-3 transition-transform duration-200"
                              style={{ transform: expandedMetadata.has(question.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                          </Badge>
                        )}

                      </div>

                      {/* Metadata content near top when open */}
                      {expandedMetadata.has(question.id) && (
                        <div className="mb-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            {question.generationDomain && (
                              <div className="bg-muted/40 rounded p-2">
                                <span className="block text-muted-foreground font-semibold mb-1">Domaine</span>
                                <span className="text-foreground">{question.generationDomain}</span>
                              </div>
                            )}
                            {question.generationSkillType && (
                              <div className="bg-muted/40 rounded p-2">
                                <span className="block text-muted-foreground font-semibold mb-1">Compétence</span>
                                <span className="text-foreground">{question.generationSkillType}</span>
                              </div>
                            )}
                            {question.generationDifficulty && (
                              <div className="bg-muted/40 rounded p-2">
                                <span className="block text-muted-foreground font-semibold mb-1">Difficulté</span>
                                <span className="text-foreground">{question.generationDifficulty}</span>
                              </div>
                            )}
                            {question.generationGranularity && (
                              <div className="bg-muted/40 rounded p-2">
                                <span className="block text-muted-foreground font-semibold mb-1">Granularité</span>
                                <span className="text-foreground">{question.generationGranularity}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Question text */}
                      <p className="text-lg font-medium mb-3">{questionText}</p>
                      
                      {question.explanation && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-semibold">Explication:</span> {question.explanation}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Réponse correcte : <span className="font-semibold text-foreground">
                          {isCorrectTrue ? "Vrai" : "Faux"}
                        </span>
                      </p>
                      
                      {/* Similarity section - displayed directly */}
                      {potentialDuplicates.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm font-semibold text-cyber-orange mb-2">
                            ⚠️ Questions similaires détectées ({potentialDuplicates.length})
                          </p>
                          <div className="space-y-2 text-xs">
                            {potentialDuplicates.slice(0, 3).map((dup, idx) => {
                              const similarQuestion = questions.find(q => q.id === dup.id);
                              return (
                                <div key={idx} className="bg-muted/50 rounded p-2 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-cyber-orange">→</span>
                                    <span className="font-semibold">ID: {dup.id}</span>
                                    <span className="text-primary font-semibold">({(dup.similarity * 100).toFixed(0)}% similaire)</span>
                                  </div>
                                  {similarQuestion && (
                                    <p className="text-muted-foreground pl-4 italic">
                                      "{similarQuestion.questionText.substring(0, 150)}{similarQuestion.questionText.length > 150 ? '...' : ''}"
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                            {potentialDuplicates.length > 3 && (
                              <p className="pl-2 text-muted-foreground">+{potentialDuplicates.length - 3} autres</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <CyberButton
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(question)}
                      >
                        Modifier
                      </CyberButton>
                      {question.status === 'to_review' && (
                        <>
                          <CyberButton
                            variant="correct"
                            onClick={() => handleAccept(question.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Accepter
                          </CyberButton>
                          <CyberButton
                            variant="incorrect"
                            onClick={() => handleReject(question.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </CyberButton>
                        </>
                      )}
                      {question.status === 'accepted' && (
                        <CyberButton
                          variant="incorrect"
                          onClick={() => handleReject(question.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Déplacer vers rejetées
                        </CyberButton>
                      )}
                      {question.status === 'rejected' && (
                        <CyberButton
                          variant="correct"
                          onClick={() => handleAccept(question.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Déplacer vers acceptées
                        </CyberButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {filteredQuestions.length > 0 && (
            <div className="flex flex-col items-center gap-2 pt-4 border-t border-border text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>Page {currentPage} / {totalPages}</span>
                <div className="flex gap-2">
                  <CyberButton
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Précédent
                  </CyberButton>
                  <CyberButton
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Suivant
                  </CyberButton>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Question Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la question</DialogTitle>
              <DialogDescription>Mettre à jour le texte, la réponse et les métadonnées.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-question">Question</Label>
                <Textarea
                  id="edit-question"
                  value={editForm.questionText}
                  onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-explanation">Explication</Label>
                <Textarea
                  id="edit-explanation"
                  value={editForm.explanation}
                  onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Catégorie</Label>
                  <Input
                    id="edit-category"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-answer">Réponse correcte</Label>
                  <Select
                    value={editForm.correctAnswer}
                    onValueChange={(value) => setEditForm({ ...editForm, correctAnswer: value })}
                  >
                    <SelectTrigger id="edit-answer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">Vrai</SelectItem>
                      <SelectItem value="False">Faux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Metadata fields - READ ONLY for AI-generated questions */}
              {editQuestion?.aiProvider && (
                <div className="p-3 bg-muted/50 rounded-lg border border-muted-foreground/20">
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Métadonnées (Lecture seule)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {editForm.generationDomain && (
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Domaine</span>
                        <span className="text-foreground">{editForm.generationDomain}</span>
                      </div>
                    )}
                    {editForm.generationSkillType && (
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Compétence</span>
                        <span className="text-foreground">{editForm.generationSkillType}</span>
                      </div>
                    )}
                    {editForm.generationDifficulty && (
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Difficulté</span>
                        <span className="text-foreground">{editForm.generationDifficulty}</span>
                      </div>
                    )}
                    {editForm.generationGranularity && (
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Granularité</span>
                        <span className="text-foreground">{editForm.generationGranularity}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <CyberButton variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Annuler
                </CyberButton>
                <CyberButton variant="primary" onClick={handleSaveEdit}>
                  Enregistrer
                </CyberButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
